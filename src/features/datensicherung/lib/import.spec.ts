import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { strToU8, zipSync } from 'fflate'
import { oeffneDatenbank, _resetFuerTests as resetDb } from '../../../persistence/db'
import { ersetzeBestand, ladeVollstaendigenBestand } from '../../../persistence/bestand-repository'
import { SCHEMA_VERSION } from '../../../persistence/schema'
import { packeBestand } from './container'
import { fuehreImportAus } from './import'
import v1Bestand from '../../../persistence/migrations/__fixtures__/v1-bestand.json'
import v2Bestand from '../../../persistence/migrations/__fixtures__/v2-bestand.json'
import v3Bestand from '../../../persistence/migrations/__fixtures__/v3-bestand.json'
import v4Bestand from '../../../persistence/migrations/__fixtures__/v4-bestand.json'

async function raeumeStoresAuf(): Promise<void> {
  resetDb()
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
  await geoeffnet.db.clear('meta')
  await geoeffnet.db.clear('orte')
  await geoeffnet.db.clear('einstellungen')
  await geoeffnet.db.clear('bilder')
}

/** Behelf nur für diesen Test: baut aus einem historischen Fixture (wie es
 * `persistence/migrations/__fixtures__/` für den Gerätespeicher bereithält)
 * einen Container, wie ihn eine damalige Exportdatei gehabt hätte —
 * `formatKennung` ergänzt, sonst unverändert. Kein `bilder`-Eintrag, wenn
 * das Fixture keinen hat (v1-v3). */
function containerAusFixture(fixture: unknown): Blob {
  const bestandJson = { formatKennung: 'bewertung-app-bestand', ...(fixture as Record<string, unknown>) }
  const gepackt = zipSync({ 'bestand.json': strToU8(JSON.stringify(bestandJson)) })
  return new Blob([gepackt as BlobPart])
}

/** Wie oben, aber für v4: dekodiert die Base64-Platzhalter-Bilder aus dem
 * Fixture (nur ein Testbehelf, ADR-0016 Punkt 5) in echte ZIP-Bildeinträge
 * und entfernt `blob` aus den Metadaten in `bestand.json`. */
function containerAusV4Fixture(fixture: typeof v4Bestand): Blob {
  const dateien: Record<string, Uint8Array> = {}
  const bilderMetadaten = fixture.bilder.map((bild) => {
    const { blob, ...metadaten } = bild
    const binaer = atob(blob)
    const bytes = new Uint8Array(binaer.length)
    for (let i = 0; i < binaer.length; i++) bytes[i] = binaer.charCodeAt(i)
    dateien[`bilder/${bild.id}`] = bytes
    return metadaten
  })

  const bestandJson = {
    formatKennung: 'bewertung-app-bestand',
    schemaVersion: fixture.schemaVersion,
    orte: fixture.orte,
    bilder: bilderMetadaten,
  }
  dateien['bestand.json'] = strToU8(JSON.stringify(bestandJson))

  const gepackt = zipSync(dateien)
  return new Blob([gepackt as BlobPart])
}

describe('fuehreImportAus', () => {
  beforeEach(async () => {
    await raeumeStoresAuf()
  })

  afterEach(async () => {
    await raeumeStoresAuf()
  })

  it('Rundlauf: Export aus einem befüllten Bestand → Import in einen leeren Bestand → identischer Bestand inklusive Bilder', async () => {
    const quellBild = new Uint8Array([9, 8, 7, 6, 5])
    await ersetzeBestand({
      schemaVersion: SCHEMA_VERSION,
      orte: [
        {
          id: 'ort-a',
          bezeichnung: 'Café Sonnenschein',
          adresse: 'Musterstraße 1',
          breite: 52.52,
          laenge: 13.405,
          geaendertAm: '2026-09-08T10:00:00.000Z',
          bewertungen: {
            ambiente: { wert: 8, kommentar: 'Gemütlich' },
            zeit: { wert: null, kommentar: null },
            geschmack: { wert: 0, kommentar: null },
            preisLeistung: { wert: 6, kommentar: null },
          },
          tags: ['Frühstück'],
        },
      ],
      bilder: [
        {
          id: 'bild-a1',
          ortId: 'ort-a',
          hinzugefuegtAm: '2026-09-10T08:00:00.000Z',
          mimeTyp: 'image/webp',
          breite: 4,
          hoehe: 4,
          blob: new Blob([quellBild], { type: 'image/webp' }),
        },
      ],
    })

    const gelesen = await ladeVollstaendigenBestand()
    expect(gelesen.status).toBe('geladen')
    if (gelesen.status !== 'geladen') return
    const exportBlob = await packeBestand(gelesen.bestand)

    // Zurück auf einen leeren Bestand — der Import muss ihn vollständig
    // wiederherstellen, ohne dass die Kette einen Dateinamen/Pfad sieht.
    await raeumeStoresAuf()

    const importErgebnis = await fuehreImportAus(exportBlob, 'ersetzen')
    expect(importErgebnis).toEqual({ status: 'importiert', uebernommeneOrteAnzahl: 1 })

    const nachher = await ladeVollstaendigenBestand()
    expect(nachher.status).toBe('geladen')
    if (nachher.status !== 'geladen') return
    expect(nachher.bestand.orte).toEqual(gelesen.bestand.orte)
    expect(nachher.bestand.bilder).toHaveLength(1)
    expect(nachher.bestand.bilder[0]?.id).toBe('bild-a1')
    const bytesNachher = new Uint8Array(await nachher.bestand.bilder[0]!.blob.arrayBuffer())
    expect(Array.from(bytesNachher)).toEqual(Array.from(quellBild))
  })

  it('importiert einen v1-Container (vor jeder Bewertungs-/Tag-/Bilder-Erweiterung) vollständig; neue Felder bleiben leer, nicht 0', async () => {
    const container = containerAusFixture(v1Bestand)

    const ergebnis = await fuehreImportAus(container, 'ersetzen')

    expect(ergebnis).toEqual({ status: 'importiert', uebernommeneOrteAnzahl: v1Bestand.orte.length })

    const gelesen = await ladeVollstaendigenBestand()
    expect(gelesen.status).toBe('geladen')
    if (gelesen.status !== 'geladen') return
    expect(gelesen.bestand.orte).toHaveLength(v1Bestand.orte.length)
    for (const ort of gelesen.bestand.orte) {
      expect(ort.bewertungen.ambiente).toEqual({ wert: null, kommentar: null })
      expect(ort.bewertungen.zeit).toEqual({ wert: null, kommentar: null })
      expect(ort.bewertungen.geschmack).toEqual({ wert: null, kommentar: null })
      expect(ort.bewertungen.preisLeistung).toEqual({ wert: null, kommentar: null })
      expect(ort.tags).toEqual([])
    }
    expect(gelesen.bestand.bilder).toEqual([])
  })

  it('importiert einen v2-Container und ergänzt tags: []', async () => {
    const container = containerAusFixture(v2Bestand)

    const ergebnis = await fuehreImportAus(container, 'ersetzen')

    expect(ergebnis).toEqual({ status: 'importiert', uebernommeneOrteAnzahl: v2Bestand.orte.length })
    const gelesen = await ladeVollstaendigenBestand()
    expect(gelesen.status).toBe('geladen')
    if (gelesen.status !== 'geladen') return
    for (const ort of gelesen.bestand.orte) {
      expect(ort.tags).toEqual([])
    }
  })

  it('importiert einen v3-Container und ergänzt bilder: []', async () => {
    const container = containerAusFixture(v3Bestand)

    const ergebnis = await fuehreImportAus(container, 'ersetzen')

    expect(ergebnis).toEqual({ status: 'importiert', uebernommeneOrteAnzahl: v3Bestand.orte.length })
    const gelesen = await ladeVollstaendigenBestand()
    expect(gelesen.status).toBe('geladen')
    if (gelesen.status !== 'geladen') return
    expect(gelesen.bestand.bilder).toEqual([])
  })

  it('importiert einen v4-Container samt Bild', async () => {
    const container = containerAusV4Fixture(v4Bestand)

    const ergebnis = await fuehreImportAus(container, 'ersetzen')

    expect(ergebnis).toEqual({ status: 'importiert', uebernommeneOrteAnzahl: v4Bestand.orte.length })
    const gelesen = await ladeVollstaendigenBestand()
    expect(gelesen.status).toBe('geladen')
    if (gelesen.status !== 'geladen') return
    expect(gelesen.bestand.bilder).toHaveLength(1)
    expect(gelesen.bestand.bilder[0]?.id).toBe(v4Bestand.bilder[0]?.id)
  })

  it('lehnt einen Container mit zu neuer schemaVersion ab, ohne den Bestand zu verändern — eigener Ausgang neben "beschaedigt"', async () => {
    await ersetzeBestand({
      schemaVersion: SCHEMA_VERSION,
      orte: [
        {
          id: 'bleibt',
          bezeichnung: 'Bleibt unangetastet',
          adresse: null,
          breite: null,
          laenge: null,
          geaendertAm: '2026-09-08T10:00:00.000Z',
          bewertungen: {
            ambiente: { wert: null, kommentar: null },
            zeit: { wert: null, kommentar: null },
            geschmack: { wert: null, kommentar: null },
            preisLeistung: { wert: null, kommentar: null },
          },
          tags: [],
        },
      ],
      bilder: [],
    })

    const gepackt = zipSync({
      'bestand.json': strToU8(
        JSON.stringify({ formatKennung: 'bewertung-app-bestand', schemaVersion: SCHEMA_VERSION + 1, orte: [] }),
      ),
    })
    const zuNeuerContainer = new Blob([gepackt as BlobPart])

    const ergebnis = await fuehreImportAus(zuNeuerContainer, 'ersetzen')

    expect(ergebnis).toEqual({ status: 'zu_neu' })
    const gelesen = await ladeVollstaendigenBestand()
    expect(gelesen.status).toBe('geladen')
    if (gelesen.status !== 'geladen') return
    expect(gelesen.bestand.orte.map((o) => o.id)).toEqual(['bleibt'])
  })

  it('bricht bei einer beschädigten Datei ohne jeden Schreibvorgang ab', async () => {
    await ersetzeBestand({
      schemaVersion: SCHEMA_VERSION,
      orte: [
        {
          id: 'bleibt',
          bezeichnung: 'Bleibt unangetastet',
          adresse: null,
          breite: null,
          laenge: null,
          geaendertAm: '2026-09-08T10:00:00.000Z',
          bewertungen: {
            ambiente: { wert: null, kommentar: null },
            zeit: { wert: null, kommentar: null },
            geschmack: { wert: null, kommentar: null },
            preisLeistung: { wert: null, kommentar: null },
          },
          tags: [],
        },
      ],
      bilder: [],
    })

    const kaputt = new Blob([new Uint8Array([1, 2, 3, 4, 5])])

    const ergebnis = await fuehreImportAus(kaputt, 'ersetzen')

    expect(ergebnis).toEqual({ status: 'beschaedigt' })
    const gelesen = await ladeVollstaendigenBestand()
    expect(gelesen.status).toBe('geladen')
    if (gelesen.status !== 'geladen') return
    expect(gelesen.bestand.orte.map((o) => o.id)).toEqual(['bleibt'])
  })
})

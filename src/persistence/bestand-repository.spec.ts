import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { oeffneDatenbank, _resetFuerTests as resetDb } from './db'
import {
  ergaenzeBestand,
  ersetzeBestand,
  ladeVollstaendigenBestand,
  type VollstaendigerBestand,
} from './bestand-repository'
import type { BildDatensatz, OrtDatensatz } from './schema'

function beispielOrt(teil: Partial<OrtDatensatz> = {}): OrtDatensatz {
  return {
    id: 'ort-1',
    bezeichnung: 'Café Sonnenschein',
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
    ...teil,
  }
}

function beispielBild(teil: Partial<BildDatensatz> = {}): BildDatensatz {
  return {
    id: 'bild-1',
    ortId: 'ort-1',
    hinzugefuegtAm: '2026-09-10T08:00:00.000Z',
    mimeTyp: 'image/webp',
    breite: 4,
    hoehe: 4,
    blob: new Blob(['x'], { type: 'image/webp' }),
    ...teil,
  }
}

async function raeumeStoresAuf(): Promise<void> {
  resetDb()
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
  await geoeffnet.db.clear('meta')
  await geoeffnet.db.clear('orte')
  await geoeffnet.db.clear('einstellungen')
  await geoeffnet.db.clear('bilder')
}

describe('bestand-repository', () => {
  beforeEach(async () => {
    await raeumeStoresAuf()
  })

  afterEach(async () => {
    await raeumeStoresAuf()
  })

  it('liefert einen leeren Bestand mit der aktuellen SCHEMA_VERSION', async () => {
    const ergebnis = await ladeVollstaendigenBestand()
    expect(ergebnis.status).toBe('geladen')
    if (ergebnis.status !== 'geladen') return
    expect(ergebnis.bestand.orte).toEqual([])
    expect(ergebnis.bestand.bilder).toEqual([])
  })

  it('"Ersetzen" leert den bestehenden Bestand und schreibt den neuen samt Bildern', async () => {
    await ersetzeBestand({
      schemaVersion: 4,
      orte: [beispielOrt({ id: 'alt' })],
      bilder: [],
    })

    const neuerBestand: VollstaendigerBestand = {
      schemaVersion: 4,
      orte: [beispielOrt({ id: 'neu', bezeichnung: 'Neuer Ort' })],
      bilder: [beispielBild({ id: 'bild-neu', ortId: 'neu' })],
    }
    const ergebnis = await ersetzeBestand(neuerBestand)
    expect(ergebnis).toEqual({ status: 'geschrieben' })

    const gelesen = await ladeVollstaendigenBestand()
    expect(gelesen.status).toBe('geladen')
    if (gelesen.status !== 'geladen') return
    expect(gelesen.bestand.orte.map((o) => o.id)).toEqual(['neu'])
    expect(gelesen.bestand.bilder.map((b) => b.id)).toEqual(['bild-neu'])
  })

  it('"Ersetzen" lässt den Store `einstellungen` unangetastet', async () => {
    const geoeffnet = await oeffneDatenbank()
    if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
    await geoeffnet.db.put('einstellungen', { kriterium: 'bezeichnung', richtung: 'aufsteigend' }, 'orte.sortierung')

    await ersetzeBestand({ schemaVersion: 4, orte: [], bilder: [] })

    const wert = await geoeffnet.db.get('einstellungen', 'orte.sortierung')
    expect(wert).toEqual({ kriterium: 'bezeichnung', richtung: 'aufsteigend' })
  })

  it('"Ergänzen" übernimmt einen neuen Ort vollständig samt Bild', async () => {
    const ergebnis = await ergaenzeBestand({
      schemaVersion: 4,
      orte: [beispielOrt({ id: 'neu' })],
      bilder: [beispielBild({ id: 'bild-neu', ortId: 'neu' })],
    })

    expect(ergebnis).toEqual({ status: 'geschrieben', uebernommeneOrteAnzahl: 1 })

    const gelesen = await ladeVollstaendigenBestand()
    expect(gelesen.status).toBe('geladen')
    if (gelesen.status !== 'geladen') return
    expect(gelesen.bestand.orte.map((o) => o.id)).toEqual(['neu'])
    expect(gelesen.bestand.bilder.map((b) => b.id)).toEqual(['bild-neu'])
  })

  it('"Ergänzen" bei kollidierender Ort-ID: bestehender Ort bleibt unverändert, Datei-Ort samt Bild wird übersprungen, Anzahl zählt nur Übernommenes (Nutzerentscheidung 2026-09-10)', async () => {
    await ersetzeBestand({
      schemaVersion: 4,
      orte: [beispielOrt({ id: 'kollidiert', bezeichnung: 'Bestehender Name' })],
      bilder: [beispielBild({ id: 'bild-bestehend', ortId: 'kollidiert' })],
    })

    const ergebnis = await ergaenzeBestand({
      schemaVersion: 4,
      orte: [
        beispielOrt({ id: 'kollidiert', bezeichnung: 'Name aus der Datei' }),
        beispielOrt({ id: 'frisch', bezeichnung: 'Frischer Ort' }),
      ],
      bilder: [
        beispielBild({ id: 'bild-aus-datei', ortId: 'kollidiert' }),
        beispielBild({ id: 'bild-frisch', ortId: 'frisch' }),
      ],
    })

    // Nur der frische Ort wurde übernommen — der kollidierende wurde
    // übersprungen, zählt also nicht mit.
    expect(ergebnis).toEqual({ status: 'geschrieben', uebernommeneOrteAnzahl: 1 })

    const gelesen = await ladeVollstaendigenBestand()
    expect(gelesen.status).toBe('geladen')
    if (gelesen.status !== 'geladen') return

    const kollidierterOrt = gelesen.bestand.orte.find((o) => o.id === 'kollidiert')
    expect(kollidierterOrt?.bezeichnung).toBe('Bestehender Name')
    expect(gelesen.bestand.orte.map((o) => o.id).sort()).toEqual(['frisch', 'kollidiert'])

    // Kein Bild ohne Ort: nur das bestehende Bild des kollidierenden Ortes
    // und das Bild des frischen Ortes sind vorhanden — das Bild aus der
    // Datei für den übersprungenen Ort fehlt.
    expect(gelesen.bestand.bilder.map((b) => b.id).sort()).toEqual(['bild-bestehend', 'bild-frisch'])
  })

  it('meldet "speicher_nicht_verfuegbar", wenn die Datenbank nicht geöffnet werden kann', async () => {
    const echtesIndexedDB = globalThis.indexedDB
    resetDb()
    // @ts-expect-error -- bewusst kaputtmachen, um den Sperrzustand auszulösen
    globalThis.indexedDB = undefined

    try {
      const ergebnis = await ladeVollstaendigenBestand()
      expect(ergebnis).toEqual({ status: 'speicher_nicht_verfuegbar' })
    } finally {
      globalThis.indexedDB = echtesIndexedDB
      resetDb()
    }
  })
})

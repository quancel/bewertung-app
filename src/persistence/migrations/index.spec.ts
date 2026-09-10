import { describe, expect, it } from 'vitest'
import { wendeMigrationsketteAn, type RohBestand } from './index'
import { SCHEMA_VERSION } from '../schema'
import { berechneGesamtnote } from '../../shared/lib/gesamtnote'
import v1Bestand from './__fixtures__/v1-bestand.json'
import v2Bestand from './__fixtures__/v2-bestand.json'
import v3Bestand from './__fixtures__/v3-bestand.json'
import v4Bestand from './__fixtures__/v4-bestand.json'

/** Behelf nur für diesen Test: dekodiert den Base64-Platzhalter aus dem
 * Fixture in einen echten `Blob`, BEVOR der Bestand durch die Kette läuft
 * (ADR-0016 Punkt 5) — Base64 ist nie eine Speicher- oder Exportform. */
function base64ZuBlob(base64: string, mimeTyp: string): Blob {
  const binaer = atob(base64)
  const bytes = new Uint8Array(binaer.length)
  for (let i = 0; i < binaer.length; i++) bytes[i] = binaer.charCodeAt(i)
  return new Blob([bytes], { type: mimeTyp })
}

interface OrtV2 {
  bewertungen: {
    ambiente: { wert: number | null; kommentar: string | null }
    zeit: { wert: number | null; kommentar: string | null }
    geschmack: { wert: number | null; kommentar: string | null }
    preisLeistung: { wert: number | null; kommentar: string | null }
  }
}

describe('wendeMigrationsketteAn', () => {
  it('liefert den Bestand unverändert (Identität) bei gleicher Version', () => {
    const rohBestand: RohBestand = v4Bestand as RohBestand

    const ergebnis = wendeMigrationsketteAn(rohBestand)

    expect(ergebnis).toEqual({ status: 'ok', bestand: rohBestand })
  })

  it('lässt einen Bild-Blob beim Kettenlauf unverändert — Identität rührt auch den Binärinhalt nicht an (ADR-0016 Punkt 5)', () => {
    const bilderMitEchtemBlob = (v4Bestand.bilder as Array<Record<string, unknown>>).map((bild) => ({
      ...bild,
      blob: base64ZuBlob(bild.blob as string, bild.mimeTyp as string),
    }))
    const rohBestand: RohBestand = { ...v4Bestand, bilder: bilderMitEchtemBlob } as unknown as RohBestand

    const ergebnis = wendeMigrationsketteAn(rohBestand)

    expect(ergebnis.status).toBe('ok')
    if (ergebnis.status !== 'ok') return
    const bilder = ergebnis.bestand.bilder as Array<{ blob: Blob }>
    // Dieselbe Blob-Referenz, nicht dekodiert/umkodiert/neu erzeugt.
    expect(bilder[0]?.blob).toBe(bilderMitEchtemBlob[0]?.blob)
  })

  it('migriert einen v2-Bestand (PO-2026-09-07-002) auf die aktuelle Version und ergänzt tags: [] bei jedem Ort', () => {
    const rohBestand: RohBestand = v2Bestand as RohBestand

    const ergebnis = wendeMigrationsketteAn(rohBestand)

    expect(ergebnis.status).toBe('ok')
    if (ergebnis.status !== 'ok') return
    expect(ergebnis.bestand.schemaVersion).toBe(SCHEMA_VERSION)
    const orte = ergebnis.bestand.orte as Array<{ tags: string[] }>
    for (const ort of orte) {
      expect(ort.tags).toEqual([])
    }
  })

  it('migriert einen v3-Bestand (PO-2026-09-07-004) auf die aktuelle Version und ergänzt bilder: []', () => {
    const rohBestand: RohBestand = v3Bestand as RohBestand

    const ergebnis = wendeMigrationsketteAn(rohBestand)

    expect(ergebnis.status).toBe('ok')
    if (ergebnis.status !== 'ok') return
    expect(ergebnis.bestand.schemaVersion).toBe(SCHEMA_VERSION)
    expect(ergebnis.bestand.bilder).toEqual([])
  })

  it('lehnt eine unbekannte, neuere Version ab und lässt den Bestand unangetastet', () => {
    const zuNeu: RohBestand = { schemaVersion: SCHEMA_VERSION + 1, orte: [] }

    const ergebnis = wendeMigrationsketteAn(zuNeu)

    expect(ergebnis).toEqual({ status: 'version_zu_neu' })
  })

  it('migriert einen v1-Bestand (PO-2026-09-07-001) auf die aktuelle Version', () => {
    const rohBestand: RohBestand = v1Bestand as RohBestand

    const ergebnis = wendeMigrationsketteAn(rohBestand)

    expect(ergebnis.status).toBe('ok')
    if (ergebnis.status !== 'ok') return
    expect(ergebnis.bestand.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('trägt an allen vier Achsen „nicht bewertet" und erzeugt keine Gesamtnote', () => {
    const ergebnis = wendeMigrationsketteAn(v1Bestand as RohBestand)
    expect(ergebnis.status).toBe('ok')
    if (ergebnis.status !== 'ok') return

    const orte = ergebnis.bestand.orte as OrtV2[]
    expect(orte).toHaveLength(2)

    for (const ort of orte) {
      expect(ort.bewertungen.ambiente).toEqual({ wert: null, kommentar: null })
      expect(ort.bewertungen.zeit).toEqual({ wert: null, kommentar: null })
      expect(ort.bewertungen.geschmack).toEqual({ wert: null, kommentar: null })
      expect(ort.bewertungen.preisLeistung).toEqual({ wert: null, kommentar: null })
      // Kein Ersatzwert 0 und keine Gesamtnote 0,0 (ADR-0007): die
      // Ableitung liefert für einen frisch migrierten Ort ausdrücklich null.
      expect(berechneGesamtnote(ort.bewertungen)).toBeNull()
    }
  })

  it('das v1-Fixture bleibt bei Version 1 — Historie, nicht die aktuelle Version', () => {
    expect((v1Bestand as RohBestand).schemaVersion).toBe(1)
  })

  it('das v2-Fixture bleibt bei Version 2 — Historie, nicht die aktuelle Version', () => {
    expect((v2Bestand as RohBestand).schemaVersion).toBe(2)
  })

  it('das v3-Fixture bleibt bei Version 3 — Historie, nicht die aktuelle Version', () => {
    expect((v3Bestand as RohBestand).schemaVersion).toBe(3)
  })

  it('das v4-Fixture trägt die aktuelle SCHEMA_VERSION', () => {
    expect((v4Bestand as RohBestand).schemaVersion).toBe(4)
    expect(SCHEMA_VERSION).toBe(4)
  })
})

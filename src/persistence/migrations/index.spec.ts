import { describe, expect, it } from 'vitest'
import { wendeMigrationsketteAn, type RohBestand } from './index'
import { SCHEMA_VERSION } from '../schema'
import { berechneGesamtnote } from '../../shared/lib/gesamtnote'
import v1Bestand from './__fixtures__/v1-bestand.json'
import v2Bestand from './__fixtures__/v2-bestand.json'
import v3Bestand from './__fixtures__/v3-bestand.json'

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
    const rohBestand: RohBestand = v3Bestand as RohBestand

    const ergebnis = wendeMigrationsketteAn(rohBestand)

    expect(ergebnis).toEqual({ status: 'ok', bestand: rohBestand })
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

  it('das v3-Fixture trägt die aktuelle SCHEMA_VERSION', () => {
    expect((v3Bestand as RohBestand).schemaVersion).toBe(3)
    expect(SCHEMA_VERSION).toBe(3)
  })
})

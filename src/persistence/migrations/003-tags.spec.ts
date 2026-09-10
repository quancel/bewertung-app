import { describe, expect, it } from 'vitest'
import { schritt003Tags } from './003-tags'
import v2Bestand from './__fixtures__/v2-bestand.json'

describe('schritt003Tags', () => {
  it('zielt auf Version 3', () => {
    expect(schritt003Tags.zielVersion).toBe(3)
  })

  it('schreibt jedem Ort das Tag-Feld aktiv als leeres Array', () => {
    const bestand = {
      schemaVersion: 2,
      orte: [{ id: 'a', bezeichnung: 'Ausgangsname' }],
    }

    const ergebnis = schritt003Tags.migriere(bestand)

    expect(ergebnis.orte).toEqual([
      { id: 'a', bezeichnung: 'Ausgangsname', tags: [] },
    ])
  })

  it('lässt bereits vorhandene Felder eines Ortes unangetastet', () => {
    const bestand = {
      schemaVersion: 2,
      orte: [{ id: 'a', bezeichnung: 'X', adresse: null, breite: 1, laenge: 2 }],
    }

    const ergebnis = schritt003Tags.migriere(bestand)

    expect(ergebnis.orte[0]).toMatchObject({ id: 'a', bezeichnung: 'X', adresse: null, breite: 1, laenge: 2 })
  })

  it('gibt zwei unterschiedliche Tag-Arrays je Ort zurück, kein geteiltes Array', () => {
    const bestand = {
      schemaVersion: 2,
      orte: [{ id: 'a' }, { id: 'b' }],
    }

    const ergebnis = schritt003Tags.migriere(bestand) as { orte: Array<{ tags: string[] }> }

    expect(ergebnis.orte[0]!.tags).not.toBe(ergebnis.orte[1]!.tags)
  })

  it('Pflicht-Fixture-Test (ADR-0003 Punkt 5): migriert das v2-Fixture aus PO-2026-09-07-002 fehlerfrei und ergänzt tags: [] bei jedem Ort', () => {
    const bestand = v2Bestand as { schemaVersion: number; orte: unknown[] }

    const ergebnis = schritt003Tags.migriere(bestand) as { orte: Array<Record<string, unknown>> }

    expect(ergebnis.orte).toHaveLength(2)
    for (const ort of ergebnis.orte) {
      expect(ort.tags).toEqual([])
    }
    // Bestehende Felder (u. a. bewertungen aus -002) bleiben unangetastet.
    expect(ergebnis.orte[0]).toMatchObject({ bezeichnung: 'Café Sonnenschein' })
    expect(ergebnis.orte[1]).toMatchObject({ bezeichnung: 'Nur ein Name' })
  })
})

import { describe, expect, it } from 'vitest'
import { schritt004Bilder } from './004-bilder'
import v3Bestand from './__fixtures__/v3-bestand.json'

describe('schritt004Bilder', () => {
  it('zielt auf Version 4', () => {
    expect(schritt004Bilder.zielVersion).toBe(4)
  })

  it('setzt das Bilder-Feld aktiv als leeres Array', () => {
    const bestand = {
      schemaVersion: 3,
      orte: [{ id: 'a', bezeichnung: 'Ausgangsname', tags: [] }],
    }

    const ergebnis = schritt004Bilder.migriere(bestand)

    expect(ergebnis.bilder).toEqual([])
  })

  it('lässt vorhandene Orte unangetastet', () => {
    const bestand = {
      schemaVersion: 3,
      orte: [{ id: 'a', bezeichnung: 'X', adresse: null, breite: 1, laenge: 2, tags: ['Café'] }],
    }

    const ergebnis = schritt004Bilder.migriere(bestand)

    expect(ergebnis.orte).toEqual([
      { id: 'a', bezeichnung: 'X', adresse: null, breite: 1, laenge: 2, tags: ['Café'] },
    ])
  })

  it('Pflicht-Fixture-Test (ADR-0003 Punkt 5): migriert das v3-Fixture aus PO-2026-09-07-004 fehlerfrei und ergänzt bilder: []', () => {
    const bestand = v3Bestand as { schemaVersion: number; orte: unknown[] }

    const ergebnis = schritt004Bilder.migriere(bestand)

    expect(ergebnis.bilder).toEqual([])
    expect(ergebnis.orte).toHaveLength(2)
    // Bestehende Felder (u. a. tags aus -004) bleiben unangetastet.
    expect(ergebnis.orte[0]).toMatchObject({ bezeichnung: 'Café Sonnenschein', tags: ['Frühstück', 'Gemütlich'] })
    expect(ergebnis.orte[1]).toMatchObject({ bezeichnung: 'Nur ein Name', tags: [] })
  })
})

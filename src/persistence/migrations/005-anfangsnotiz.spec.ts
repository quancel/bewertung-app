import { describe, expect, it } from 'vitest'
import { schritt005Anfangsnotiz } from './005-anfangsnotiz'
import v4Bestand from './__fixtures__/v4-bestand.json'

describe('schritt005Anfangsnotiz', () => {
  it('zielt auf Version 5', () => {
    expect(schritt005Anfangsnotiz.zielVersion).toBe(5)
  })

  it('schreibt jedem Ort das Anfangsnotiz-Feld aktiv als null', () => {
    const bestand = {
      schemaVersion: 4,
      orte: [{ id: 'a', bezeichnung: 'Ausgangsname' }],
    }

    const ergebnis = schritt005Anfangsnotiz.migriere(bestand)

    expect(ergebnis.orte).toEqual([
      { id: 'a', bezeichnung: 'Ausgangsname', anfangsnotiz: null },
    ])
  })

  it('lässt bereits vorhandene Felder eines Ortes unangetastet', () => {
    const bestand = {
      schemaVersion: 4,
      orte: [{ id: 'a', bezeichnung: 'X', adresse: null, breite: 1, laenge: 2, tags: ['Café'] }],
    }

    const ergebnis = schritt005Anfangsnotiz.migriere(bestand)

    expect(ergebnis.orte[0]).toMatchObject({
      id: 'a',
      bezeichnung: 'X',
      adresse: null,
      breite: 1,
      laenge: 2,
      tags: ['Café'],
    })
  })

  it('reicht ein bereits vorhandenes Anfangsnotiz-Feld unverändert durch, statt es zu verwerfen (ADR-0003: kein Migrationsschritt verwirft Daten, die er nicht kennt — der Fall ist heute unerreichbar, da ein v4-Bestand dieses Feld nie trägt, aber die Funktion darf sich nicht darauf verlassen)', () => {
    const bestand = {
      schemaVersion: 4,
      orte: [{ id: 'a', anfangsnotiz: 'Bereits vorhanden' }],
    }

    const ergebnis = schritt005Anfangsnotiz.migriere(bestand) as { orte: Array<{ anfangsnotiz: unknown }> }

    expect(ergebnis.orte[0]!.anfangsnotiz).toBe('Bereits vorhanden')
  })

  it('Pflicht-Fixture-Test (ADR-0003 Punkt 5): migriert das v4-Fixture aus PO-2026-09-07-005 fehlerfrei und ergänzt anfangsnotiz: null bei jedem Ort', () => {
    const bestand = v4Bestand as { schemaVersion: number; orte: unknown[] }

    const ergebnis = schritt005Anfangsnotiz.migriere(bestand) as { orte: Array<Record<string, unknown>> }

    expect(ergebnis.orte).toHaveLength(2)
    for (const ort of ergebnis.orte) {
      expect(ort.anfangsnotiz).toBeNull()
    }
    // Bestehende Felder (u. a. tags/bewertungen aus früheren Schritten)
    // bleiben unangetastet.
    expect(ergebnis.orte[0]).toMatchObject({ bezeichnung: 'Café Sonnenschein', tags: ['Frühstück', 'Gemütlich'] })
    expect(ergebnis.orte[1]).toMatchObject({ bezeichnung: 'Nur ein Name', tags: [] })
  })
})

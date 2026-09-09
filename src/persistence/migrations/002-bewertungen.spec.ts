import { describe, expect, it } from 'vitest'
import { schritt002Bewertungen } from './002-bewertungen'

describe('schritt002Bewertungen', () => {
  it('zielt auf Version 2', () => {
    expect(schritt002Bewertungen.zielVersion).toBe(2)
  })

  it('schreibt jedem Ort die vier Achsen aktiv als „nicht bewertet"', () => {
    const bestand = {
      schemaVersion: 1,
      orte: [{ id: 'a', bezeichnung: 'Ausgangsname' }],
    }

    const ergebnis = schritt002Bewertungen.migriere(bestand)

    expect(ergebnis.orte).toEqual([
      {
        id: 'a',
        bezeichnung: 'Ausgangsname',
        bewertungen: {
          ambiente: { wert: null, kommentar: null },
          zeit: { wert: null, kommentar: null },
          geschmack: { wert: null, kommentar: null },
          preisLeistung: { wert: null, kommentar: null },
        },
      },
    ])
  })

  it('lässt bereits vorhandene Felder eines Ortes unangetastet', () => {
    const bestand = {
      schemaVersion: 1,
      orte: [{ id: 'a', bezeichnung: 'X', adresse: null, breite: 1, laenge: 2 }],
    }

    const ergebnis = schritt002Bewertungen.migriere(bestand)

    expect(ergebnis.orte[0]).toMatchObject({ id: 'a', bezeichnung: 'X', adresse: null, breite: 1, laenge: 2 })
  })

  it('gibt zwei unterschiedliche Achsenobjekte je Ort zurück, kein geteiltes Objekt', () => {
    const bestand = {
      schemaVersion: 1,
      orte: [{ id: 'a' }, { id: 'b' }],
    }

    const ergebnis = schritt002Bewertungen.migriere(bestand) as {
      orte: Array<{ bewertungen: { ambiente: { wert: number | null } } }>
    }

    expect(ergebnis.orte[0]!.bewertungen).not.toBe(ergebnis.orte[1]!.bewertungen)
  })
})

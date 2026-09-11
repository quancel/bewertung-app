import { describe, expect, it } from 'vitest'
import { berechneKartenausschnitt } from './kartenausschnitt'
import type { KartenOrt } from '../model/karte.types'

function ort(id: string, breite: number, laenge: number): KartenOrt {
  return { id, bezeichnung: id, breite, laenge }
}

describe('berechneKartenausschnitt', () => {
  it('liefert "leer" ohne Marker', () => {
    expect(berechneKartenausschnitt([])).toEqual({ art: 'leer' })
  })

  it('liefert "einzel" mit dem Mittelpunkt des einen Markers', () => {
    expect(berechneKartenausschnitt([ort('1', 48.1, 11.5)])).toEqual({
      art: 'einzel',
      mittelpunkt: { breite: 48.1, laenge: 11.5 },
    })
  })

  it('liefert "einzel" auch bei Koordinate 0/0 — kein Falsy-Test', () => {
    expect(berechneKartenausschnitt([ort('1', 0, 0)])).toEqual({
      art: 'einzel',
      mittelpunkt: { breite: 0, laenge: 0 },
    })
  })

  it('liefert die Bounding Box über mehrere Marker', () => {
    const ergebnis = berechneKartenausschnitt([
      ort('1', 48.1, 11.5),
      ort('2', 52.5, 13.4),
      ort('3', 50.9, 6.9),
    ])
    expect(ergebnis).toEqual({
      art: 'bounds',
      suedwesten: { breite: 48.1, laenge: 6.9 },
      nordosten: { breite: 52.5, laenge: 13.4 },
    })
  })

  it('bezieht negative Koordinaten korrekt in min/max ein', () => {
    const ergebnis = berechneKartenausschnitt([ort('1', -10, -20), ort('2', 10, 20)])
    expect(ergebnis).toEqual({
      art: 'bounds',
      suedwesten: { breite: -10, laenge: -20 },
      nordosten: { breite: 10, laenge: 20 },
    })
  })

  it('bildet bei identischen Koordinaten eine entartete (punktförmige) Box', () => {
    const ergebnis = berechneKartenausschnitt([ort('1', 48.1, 11.5), ort('2', 48.1, 11.5)])
    expect(ergebnis).toEqual({
      art: 'bounds',
      suedwesten: { breite: 48.1, laenge: 11.5 },
      nordosten: { breite: 48.1, laenge: 11.5 },
    })
  })
})

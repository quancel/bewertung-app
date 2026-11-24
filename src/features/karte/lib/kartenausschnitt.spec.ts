import { describe, expect, it } from 'vitest'
import { berechneKartenausschnitt, bildeMengenKennung, liegtMarkerImAusschnitt } from './kartenausschnitt'
import type { KartenOrtBasis } from '../model/karte.types'

function ort(id: string, breite: number, laenge: number): KartenOrtBasis {
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

describe('liegtMarkerImAusschnitt', () => {
  const grenzen = { suedwesten: { breite: 48, laenge: 11 }, nordosten: { breite: 49, laenge: 12 } }

  it('ist wahr, wenn ein Marker innerhalb liegt', () => {
    expect(liegtMarkerImAusschnitt([ort('1', 52, 13), ort('2', 48.5, 11.5)], grenzen)).toBe(true)
  })

  it('ist falsch, wenn alle Marker außerhalb liegen', () => {
    expect(liegtMarkerImAusschnitt([ort('1', 52, 13), ort('2', 47.9, 11.5)], grenzen)).toBe(false)
  })

  it('zählt den Rand als innerhalb', () => {
    expect(liegtMarkerImAusschnitt([ort('1', 49, 12)], grenzen)).toBe(true)
  })

  it('ist falsch ohne Marker', () => {
    expect(liegtMarkerImAusschnitt([], grenzen)).toBe(false)
  })

  it('behandelt Koordinate 0/0 nicht als fehlend', () => {
    const um0 = { suedwesten: { breite: -1, laenge: -1 }, nordosten: { breite: 1, laenge: 1 } }
    expect(liegtMarkerImAusschnitt([ort('1', 0, 0)], um0)).toBe(true)
  })
})

describe('bildeMengenKennung', () => {
  it('ist unabhängig von Reihenfolge und Array-Identität', () => {
    expect(bildeMengenKennung([ort('a', 1, 1), ort('b', 2, 2)])).toBe(bildeMengenKennung([ort('b', 2, 2), ort('a', 1, 1)]))
  })

  it('ändert sich bei anderer ID-Menge', () => {
    expect(bildeMengenKennung([ort('a', 1, 1)])).not.toBe(bildeMengenKennung([ort('a', 1, 1), ort('b', 2, 2)]))
  })

  it('ändert sich nicht bei geändertem Inhalt gleicher IDs', () => {
    expect(bildeMengenKennung([ort('a', 1, 1)])).toBe(bildeMengenKennung([{ ...ort('a', 5, 5), bezeichnung: 'neu' }]))
  })

  it('trennt IDs eindeutig (kein Zusammenwachsen)', () => {
    expect(bildeMengenKennung([ort('ab', 1, 1), ort('c', 1, 1)])).not.toBe(bildeMengenKennung([ort('a', 1, 1), ort('bc', 1, 1)]))
  })
})

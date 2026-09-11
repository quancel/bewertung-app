import { describe, expect, it } from 'vitest'
import { filtereOrteMitKoordinaten } from './koordinatenFilter'

describe('filtereOrteMitKoordinaten', () => {
  it('liefert eine leere Liste für einen leeren Bestand', () => {
    expect(filtereOrteMitKoordinaten([])).toEqual([])
  })

  it('lässt einen Ort ohne jede Koordinate weg', () => {
    const ergebnis = filtereOrteMitKoordinaten([
      { id: '1', bezeichnung: 'Ohne Koordinaten', breite: null, laenge: null },
    ])
    expect(ergebnis).toEqual([])
  })

  it('lässt einen Ort mit nur EINER gesetzten Koordinate weg', () => {
    const nurBreite = filtereOrteMitKoordinaten([
      { id: '1', bezeichnung: 'Nur Breite', breite: 48.1, laenge: null },
    ])
    const nurLaenge = filtereOrteMitKoordinaten([
      { id: '2', bezeichnung: 'Nur Länge', breite: null, laenge: 11.5 },
    ])
    expect(nurBreite).toEqual([])
    expect(nurLaenge).toEqual([])
  })

  it('übernimmt einen Ort mit beiden Koordinaten unverändert (id/bezeichnung/breite/laenge)', () => {
    const ergebnis = filtereOrteMitKoordinaten([
      { id: '1', bezeichnung: 'München', breite: 48.1367436, laenge: 11.5769575 },
    ])
    expect(ergebnis).toEqual([{ id: '1', bezeichnung: 'München', breite: 48.1367436, laenge: 11.5769575 }])
  })

  it('behält einen Ort mit Koordinate 0/0 (Äquator/Nullmeridian) — kein Falsy-Test', () => {
    const ergebnis = filtereOrteMitKoordinaten([{ id: '1', bezeichnung: 'Nullpunkt', breite: 0, laenge: 0 }])
    expect(ergebnis).toEqual([{ id: '1', bezeichnung: 'Nullpunkt', breite: 0, laenge: 0 }])
  })

  it('behält einen Ort mit nur EINER Koordinate 0, wenn die andere ebenfalls gesetzt ist', () => {
    const ergebnis = filtereOrteMitKoordinaten([{ id: '1', bezeichnung: 'Äquator', breite: 0, laenge: 11.5 }])
    expect(ergebnis).toEqual([{ id: '1', bezeichnung: 'Äquator', breite: 0, laenge: 11.5 }])
  })

  it('filtert innerhalb eines gemischten Bestands korrekt', () => {
    const ergebnis = filtereOrteMitKoordinaten([
      { id: '1', bezeichnung: 'Mit Koordinaten', breite: 48.1, laenge: 11.5 },
      { id: '2', bezeichnung: 'Ohne', breite: null, laenge: null },
      { id: '3', bezeichnung: 'Nullpunkt', breite: 0, laenge: 0 },
    ])
    expect(ergebnis.map((ort) => ort.id)).toEqual(['1', '3'])
  })
})

import { describe, expect, it } from 'vitest'
import { ACHSEN_KRITERIEN, type Gewichte } from '../model/ansicht'
import { anteilInProzent, einzigeZaehlendeAchse, klemmeGewicht, setzeGewicht } from './gewichtung'

const EINS: Gewichte = { ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 1 }

describe('klemmeGewicht', () => {
  it('rundet auf ganze Zahlen und klemmt auf 0–10', () => {
    expect(klemmeGewicht(3.4)).toBe(3)
    expect(klemmeGewicht(3.5)).toBe(4)
    expect(klemmeGewicht(-4)).toBe(0)
    expect(klemmeGewicht(99)).toBe(10)
  })
})

describe('setzeGewicht (Gate)', () => {
  it('setzt ein Gewicht ganzzahlig und lässt die übrigen unberührt', () => {
    const ergebnis = setzeGewicht(EINS, 'geschmack', 7)
    expect(ergebnis.gewichte).toEqual({ ambiente: 1, zeit: 1, geschmack: 7, preisLeistung: 1 })
    expect(ergebnis.mussZaehlen).toBe(false)
  })

  it('klemmt Werte außerhalb 0–10 und rundet Kommazahlen', () => {
    expect(setzeGewicht(EINS, 'zeit', 99).gewichte.zeit).toBe(10)
    expect(setzeGewicht(EINS, 'zeit', -3).gewichte.zeit).toBe(0)
    expect(setzeGewicht(EINS, 'zeit', 2.6).gewichte.zeit).toBe(3)
  })

  it('erlaubt 0, solange noch eine andere Achse zählt', () => {
    const ergebnis = setzeGewicht(EINS, 'ambiente', 0)
    expect(ergebnis.gewichte.ambiente).toBe(0)
    expect(ergebnis.mussZaehlen).toBe(false)
  })

  it('die letzte Achse über 0 bleibt auf 1 und liefert das Signal für die Statuszeile', () => {
    const nurGeschmack: Gewichte = { ambiente: 0, zeit: 0, geschmack: 5, preisLeistung: 0 }
    const ergebnis = setzeGewicht(nurGeschmack, 'geschmack', 0)
    expect(ergebnis.gewichte).toEqual({ ambiente: 0, zeit: 0, geschmack: 1, preisLeistung: 0 })
    expect(ergebnis.mussZaehlen).toBe(true)
  })

  it('die letzte Achse über 0 kann auf andere Werte ≥ 1 gesetzt werden, ohne Signal', () => {
    const nurGeschmack: Gewichte = { ambiente: 0, zeit: 0, geschmack: 5, preisLeistung: 0 }
    const ergebnis = setzeGewicht(nurGeschmack, 'geschmack', 3)
    expect(ergebnis.gewichte.geschmack).toBe(3)
    expect(ergebnis.mussZaehlen).toBe(false)
  })

  it('auch ein Wert, der erst durch Klemmen/Runden 0 wird, läuft durch das Gate', () => {
    const nurZeit: Gewichte = { ambiente: 0, zeit: 2, geschmack: 0, preisLeistung: 0 }
    expect(setzeGewicht(nurZeit, 'zeit', -5).gewichte.zeit).toBe(1)
    expect(setzeGewicht(nurZeit, 'zeit', 0.4).gewichte.zeit).toBe(1)
    expect(setzeGewicht(nurZeit, 'zeit', 0.4).mussZaehlen).toBe(true)
  })

  it('eine andere Achse auf 0 zu setzen ist erlaubt, wenn eine zweite zählt', () => {
    const zwei: Gewichte = { ambiente: 0, zeit: 3, geschmack: 2, preisLeistung: 0 }
    expect(setzeGewicht(zwei, 'zeit', 0).gewichte).toEqual({ ambiente: 0, zeit: 0, geschmack: 2, preisLeistung: 0 })
  })

  it('keine endliche Zahl ändert nichts', () => {
    expect(setzeGewicht(EINS, 'zeit', Number.NaN)).toEqual({ gewichte: EINS, mussZaehlen: false })
    expect(setzeGewicht(EINS, 'zeit', Number.POSITIVE_INFINITY)).toEqual({ gewichte: EINS, mussZaehlen: false })
  })

  it('mutiert die übergebenen Gewichte nicht', () => {
    const vorher = { ...EINS }
    setzeGewicht(EINS, 'zeit', 9)
    expect(EINS).toEqual(vorher)
  })

  it('erschöpfend: nach jedem Gate-Aufruf zählt mindestens eine Achse', () => {
    // Jede Ausgangslage mit mindestens einer Achse > 0 (0, 1 oder 10 je Achse),
    // jede Achse, jede Eingabe -2..12 — das Ergebnis hat nie Summe 0.
    const stufen = [0, 1, 10]
    for (const a of stufen) for (const z of stufen) for (const g of stufen) for (const p of stufen) {
      const start: Gewichte = { ambiente: a, zeit: z, geschmack: g, preisLeistung: p }
      if (a + z + g + p === 0) continue
      for (const achse of ACHSEN_KRITERIEN) {
        for (let roh = -2; roh <= 12; roh += 1) {
          const { gewichte } = setzeGewicht(start, achse, roh)
          expect(ACHSEN_KRITERIEN.some((name) => gewichte[name] > 0)).toBe(true)
          expect(ACHSEN_KRITERIEN.every((name) => gewichte[name] >= 0 && gewichte[name] <= 10)).toBe(true)
        }
      }
    }
  })
})

describe('einzigeZaehlendeAchse', () => {
  it('liefert die Achse, wenn genau eine > 0 ist, sonst null', () => {
    expect(einzigeZaehlendeAchse({ ambiente: 0, zeit: 4, geschmack: 0, preisLeistung: 0 })).toBe('zeit')
    expect(einzigeZaehlendeAchse(EINS)).toBeNull()
    expect(einzigeZaehlendeAchse({ ambiente: 0, zeit: 0, geschmack: 0, preisLeistung: 0 })).toBeNull()
  })
})

describe('anteilInProzent', () => {
  it('rechnet den Anteil in ganzen Prozent', () => {
    expect(anteilInProzent({ ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 0 }, 'ambiente')).toBe(33)
    expect(anteilInProzent(EINS, 'zeit')).toBe(25)
    expect(anteilInProzent({ ambiente: 0, zeit: 4, geschmack: 0, preisLeistung: 0 }, 'zeit')).toBe(100)
  })

  it('liefert bei Gewicht 0 den Anteil 0', () => {
    expect(anteilInProzent({ ambiente: 0, zeit: 4, geschmack: 1, preisLeistung: 0 }, 'ambiente')).toBe(0)
  })
})

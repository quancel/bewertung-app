import { describe, expect, it } from 'vitest'
import { berechneGesamtnote, formatiereGesamtnote, zaehleAusgefuellteAchsen } from './gesamtnote'
import type { Bewertungen } from './gesamtnote'

function achse(wert: number | null): { wert: number | null; kommentar: string | null } {
  return { wert, kommentar: null }
}

function bewertungen(
  ambiente: number | null,
  zeit: number | null,
  geschmack: number | null,
  preisLeistung: number | null,
): Bewertungen {
  return {
    ambiente: achse(ambiente),
    zeit: achse(zeit),
    geschmack: achse(geschmack),
    preisLeistung: achse(preisLeistung),
  }
}

describe('berechneGesamtnote', () => {
  it('liefert null, wenn keine Achse ausgefüllt ist', () => {
    expect(berechneGesamtnote(bewertungen(null, null, null, null))).toBeNull()
  })

  it('rechnet den ungewichteten Mittelwert nur über die ausgefüllten Achsen', () => {
    expect(berechneGesamtnote(bewertungen(8, null, 6, null))).toBe(7)
  })

  it('bezieht eine gesetzte 0 in die Berechnung ein und senkt damit den Mittelwert', () => {
    expect(berechneGesamtnote(bewertungen(0, 10, null, null))).toBe(5)
  })

  it('liefert bei vier ausgefüllten Achsen den ungerundeten Mittelwert', () => {
    expect(berechneGesamtnote(bewertungen(8, 7, 6, 6))).toBeCloseTo(6.75, 10)
  })

  it('ein Ort mit einer einzigen ausgefüllten Achse kann höher stehen als einer mit vier niedrigeren', () => {
    const einzelneHoheAchse = berechneGesamtnote(bewertungen(9, null, null, null))
    const vierNiedrigereAchsen = berechneGesamtnote(bewertungen(3, 3, 3, 3))
    expect(einzelneHoheAchse).not.toBeNull()
    expect(vierNiedrigereAchsen).not.toBeNull()
    expect(einzelneHoheAchse! > vierNiedrigereAchsen!).toBe(true)
  })
})

describe('zaehleAusgefuellteAchsen', () => {
  it('zählt 0 mit, nicht bewertete Achsen nicht', () => {
    expect(zaehleAusgefuellteAchsen(bewertungen(0, null, 5, null))).toBe(2)
  })

  it('liefert 4, wenn alle Achsen ausgefüllt sind', () => {
    expect(zaehleAusgefuellteAchsen(bewertungen(1, 2, 3, 4))).toBe(4)
  })

  it('liefert 0, wenn keine Achse ausgefüllt ist', () => {
    expect(zaehleAusgefuellteAchsen(bewertungen(null, null, null, null))).toBe(0)
  })
})

describe('formatiereGesamtnote', () => {
  it('formatiert einen glatten Wert mit einer Nachkommastelle und Komma', () => {
    expect(formatiereGesamtnote(8)).toBe('8,0')
  })

  it('formatiert einen Wert mit mehreren Nachkommastellen gerundet auf eine', () => {
    expect(formatiereGesamtnote(6.75)).toBe('6,8')
  })

  it('formatiert 0 wie jeden anderen gesetzten Wert', () => {
    expect(formatiereGesamtnote(0)).toBe('0,0')
  })
})

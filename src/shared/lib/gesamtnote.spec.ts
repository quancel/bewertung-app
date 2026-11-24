import { describe, expect, it } from 'vitest'
import { berechneGesamtnote, formatiereGesamtnote, zaehleAusgefuellteAchsen } from './gesamtnote'
import type { AchsenGewichte, Bewertungen, GesamtnoteErgebnis } from './gesamtnote'

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

const AUSGEWOGEN: AchsenGewichte = { ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 1 }
const FOKUS_GESCHMACK: AchsenGewichte = { ambiente: 1, zeit: 1, geschmack: 2, preisLeistung: 1 }

/** Roh-Wert eines `wert`-Ergebnisses; schlägt fehl, wenn keiner da ist. */
function roh(ergebnis: GesamtnoteErgebnis): number {
  if (ergebnis.art !== 'wert') throw new Error('Kein Wert erwartet: ' + ergebnis.art)
  return ergebnis.roh
}

function zehntel(ergebnis: GesamtnoteErgebnis): number {
  if (ergebnis.art !== 'wert') throw new Error('Kein Wert erwartet: ' + ergebnis.art)
  return ergebnis.zehntel
}

describe('berechneGesamtnote', () => {
  it('liefert „unbewertet", wenn keine Achse ausgefüllt ist', () => {
    expect(berechneGesamtnote(bewertungen(null, null, null, null), AUSGEWOGEN)).toEqual({ art: 'unbewertet' })
  })

  it('rechnet bei Ausgewogen den ungewichteten Mittelwert nur über die ausgefüllten Achsen', () => {
    expect(roh(berechneGesamtnote(bewertungen(8, null, 6, null), AUSGEWOGEN))).toBe(7)
  })

  it('bezieht eine gesetzte 0 in die Berechnung ein und senkt damit den Mittelwert', () => {
    expect(roh(berechneGesamtnote(bewertungen(0, 10, null, null), AUSGEWOGEN))).toBe(5)
  })

  it('liefert bei vier ausgefüllten Achsen den ungerundeten Mittelwert und dessen Zehntel', () => {
    const ergebnis = berechneGesamtnote(bewertungen(8, 7, 6, 6), AUSGEWOGEN)
    expect(roh(ergebnis)).toBeCloseTo(6.75, 10)
    expect(zehntel(ergebnis)).toBe(68)
  })

  it('ein Ort mit einer einzigen ausgefüllten Achse kann höher stehen als einer mit vier niedrigeren', () => {
    const einzelneHoheAchse = roh(berechneGesamtnote(bewertungen(9, null, null, null), AUSGEWOGEN))
    const vierNiedrigereAchsen = roh(berechneGesamtnote(bewertungen(3, 3, 3, 3), AUSGEWOGEN))
    expect(einzelneHoheAchse > vierNiedrigereAchsen).toBe(true)
  })

  // Prüfbeispiel aus PO-2026-11-24-001: nicht bewertete Achsen fallen samt
  // Gewicht heraus, (2 x 10 + 1 x 6) / (2 + 1) = 8,67 -> „8,7".
  it('Prüfbeispiel: Fokus Geschmack, Geschmack 10, Ambiente 6, Rest nicht bewertet -> 8,7', () => {
    const ergebnis = berechneGesamtnote(bewertungen(6, null, 10, null), FOKUS_GESCHMACK)
    expect(zehntel(ergebnis)).toBe(87)
    expect(formatiereGesamtnote(zehntel(ergebnis))).toBe('8,7')
  })

  it('ein Gewicht wirkt nur auf eine Achse mit Wert (null fällt samt Gewicht heraus)', () => {
    expect(roh(berechneGesamtnote(bewertungen(null, null, 4, null), FOKUS_GESCHMACK))).toBe(4)
  })

  // ADR-0037 Kontext: 159/20 = 7,95 wird als „8,0" angezeigt, liegt aber
  // unter der Zonengrenze — die Zone muss deshalb am gerundeten `zehntel`
  // hängen, nicht am Rohwert.
  it('Grenzfall 159/20 = 7,95: roh unter 8, zehntel 80, Anzeige „8,0"', () => {
    const gewichte: AchsenGewichte = { ambiente: 9, zeit: 1, geschmack: 10, preisLeistung: 0 }
    const ergebnis = berechneGesamtnote(bewertungen(8, 7, 8, null), gewichte)
    expect(roh(ergebnis)).toBeCloseTo(7.95, 10)
    expect(roh(ergebnis) < 8).toBe(true)
    expect(zehntel(ergebnis)).toBe(80)
    expect(formatiereGesamtnote(zehntel(ergebnis))).toBe('8,0')
  })
})

describe('Ausgewogen = bisherige Ausgabe (ADR-0037 Punkt 6, erschöpfend über 12^4)', () => {
  // Die bisherige Anzeige: ungewichteter Mittelwert, formatiert mit Intl.
  const bisherigerFormatierer = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const WERTE: ReadonlyArray<number | null> = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('zeigt für jede Achsenkombination Zeichen für Zeichen dieselbe Zahl wie vor dem Paket', () => {
    let geprueft = 0
    for (const a of WERTE) {
      for (const b of WERTE) {
        for (const c of WERTE) {
          for (const d of WERTE) {
            const gesetzt = [a, b, c, d].filter((wert): wert is number => wert !== null)
            const ergebnis = berechneGesamtnote(bewertungen(a, b, c, d), AUSGEWOGEN)
            if (gesetzt.length === 0) {
              expect(ergebnis).toEqual({ art: 'unbewertet' })
              continue
            }
            const bisherigerMittelwert = gesetzt.reduce((summe, wert) => summe + wert, 0) / gesetzt.length
            expect(ergebnis.art).toBe('wert')
            expect(roh(ergebnis)).toBe(bisherigerMittelwert)
            expect(formatiereGesamtnote(zehntel(ergebnis))).toBe(bisherigerFormatierer.format(bisherigerMittelwert))
            geprueft += 1
          }
        }
      }
    }
    expect(geprueft).toBe(12 ** 4 - 1)
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
    expect(formatiereGesamtnote(80)).toBe('8,0')
  })

  it('formatiert ein Zehntel mit Komma', () => {
    expect(formatiereGesamtnote(68)).toBe('6,8')
  })

  it('formatiert 0 und 10 wie jeden anderen gesetzten Wert', () => {
    expect(formatiereGesamtnote(0)).toBe('0,0')
    expect(formatiereGesamtnote(100)).toBe('10,0')
  })
})

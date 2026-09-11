import { describe, expect, it } from 'vitest'
import { formatiereKartenTrefferzahl, formatiereListenTrefferzahl } from './trefferzahlFormat'

describe('formatiereListenTrefferzahl', () => {
  it('zeigt bei Gleichstand nur eine Zahl (Plural)', () => {
    expect(formatiereListenTrefferzahl(12, 12)).toEqual({ lang: '12 Orte', kurz: '12 Orte', kartenKurzform: false })
  })

  it('zeigt bei Gleichstand den Singular für genau einen Ort', () => {
    expect(formatiereListenTrefferzahl(1, 1)).toEqual({ lang: '1 Ort', kurz: '1 Ort', kartenKurzform: false })
  })

  it('zeigt bei Ungleichstand die "M von N"-Form, Plural nach der zweiten Zahl', () => {
    expect(formatiereListenTrefferzahl(4, 12)).toEqual({
      lang: '4 von 12 Orten',
      kurz: '4/12',
      kartenKurzform: false,
    })
  })

  it('zeigt bei Ungleichstand mit gesamt=1 den Singular nach der zweiten Zahl', () => {
    expect(formatiereListenTrefferzahl(0, 1)).toEqual({ lang: '0 von 1 Ort', kurz: '0/1', kartenKurzform: false })
  })

  it('behält den Gleichstand-Kurzwortlaut unverändert (kein Schrägstrich)', () => {
    const ergebnis = formatiereListenTrefferzahl(12, 12)
    expect(ergebnis.kurz).toBe(ergebnis.lang)
  })
})

describe('formatiereKartenTrefferzahl', () => {
  it('nennt bei Gleichstand nur eine Zahl mit "mit Koordinaten" (Plural)', () => {
    expect(formatiereKartenTrefferzahl(8, 8, 11)).toEqual({
      lang: '8 Orte mit Koordinaten',
      kurz: '8',
      kartenKurzform: true,
    })
  })

  it('nennt bei Gleichstand den Singular für genau einen sichtbaren Ort', () => {
    expect(formatiereKartenTrefferzahl(1, 1, 5)).toEqual({
      lang: '1 Ort mit Koordinaten',
      kurz: '1',
      kartenKurzform: true,
    })
  })

  it('nennt bei Ungleichstand beide Zahlen, Plural nach der ZWEITEN (gefiltert)', () => {
    expect(formatiereKartenTrefferzahl(8, 11, 11)).toEqual({
      lang: '8 von 11 Orten mit Koordinaten',
      kurz: '8/11',
      kartenKurzform: true,
    })
  })

  // gefiltert=1 kann in der "von"-Form der Kartenansicht nicht mit
  // Ungleichstand auftreten: sichtbar < gefiltert=1 heißt zwingend
  // sichtbar=0 — und landet damit im Rückfall-Zweig unten, nicht in der
  // Zwei-Zahlen-Form. Dieser Fall prüft genau diesen Rückfall mit gefiltert=1
  // (Singular nach der zweiten Zahl greift dort über
  // `formatiereListenTrefferzahl`, siehe deren eigene Tests oben).
  it('fällt bei sichtbar=0 UND gefiltert=1 auf den Listen-Singular zurück', () => {
    expect(formatiereKartenTrefferzahl(0, 1, 5)).toEqual({ lang: '1 von 5 Orten', kurz: '1/5', kartenKurzform: false })
  })

  it('fällt bei sichtbar=0 auf das gewöhnliche Listen-Format zurück (ohne "mit Koordinaten")', () => {
    // gefiltert=5, Gesamtbestand=11 — NICHT "0 von 5 Orten mit Koordinaten"
    expect(formatiereKartenTrefferzahl(0, 5, 11)).toEqual({
      lang: '5 von 11 Orten',
      kurz: '5/11',
      kartenKurzform: false,
    })
  })

  it('fällt bei sichtbar=0 UND gefiltert===gesamtbestand auf den Listen-Gleichstand zurück', () => {
    expect(formatiereKartenTrefferzahl(0, 5, 5)).toEqual({ lang: '5 Orte', kurz: '5 Orte', kartenKurzform: false })
  })
})

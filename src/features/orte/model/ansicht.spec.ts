import { describe, expect, it } from 'vitest'
import {
  findeGewichtungsSzenario,
  GEWICHTUNG_SZENARIEN,
  istGueltigeOrteGewichtung,
  istGueltigeOrteSortierung,
  istGueltigeTagfilterEinstellung,
} from './ansicht'

describe('istGueltigeOrteSortierung', () => {
  it('akzeptiert jedes gültige Allgemein-Kriterium mit beiden Richtungen', () => {
    for (const kriterium of ['bezeichnung', 'geaendertAm', 'gesamtnote']) {
      for (const richtung of ['aufsteigend', 'absteigend']) {
        expect(istGueltigeOrteSortierung({ kriterium, richtung })).toBe(true)
      }
    }
  })

  it('akzeptiert jede der vier Einzelachsen mit beiden Richtungen', () => {
    for (const kriterium of ['ambiente', 'zeit', 'geschmack', 'preisLeistung']) {
      for (const richtung of ['aufsteigend', 'absteigend']) {
        expect(istGueltigeOrteSortierung({ kriterium, richtung })).toBe(true)
      }
    }
  })

  it('lehnt einen fehlenden Wert ab (undefined)', () => {
    expect(istGueltigeOrteSortierung(undefined)).toBe(false)
  })

  it('lehnt null ab', () => {
    expect(istGueltigeOrteSortierung(null)).toBe(false)
  })

  it('lehnt ein unbekanntes Kriterium ab', () => {
    expect(istGueltigeOrteSortierung({ kriterium: 'entfernung', richtung: 'aufsteigend' })).toBe(false)
  })

  it('lehnt eine unbekannte Richtung ab', () => {
    expect(istGueltigeOrteSortierung({ kriterium: 'bezeichnung', richtung: 'zufaellig' })).toBe(false)
  })

  it('lehnt eine kaputte Wertform ab — Zahl statt Objekt', () => {
    expect(istGueltigeOrteSortierung(42)).toBe(false)
  })

  it('lehnt eine kaputte Wertform ab — Zeichenkette statt Objekt', () => {
    expect(istGueltigeOrteSortierung('bezeichnung')).toBe(false)
  })

  it('lehnt eine kaputte Wertform ab — Array statt Objekt', () => {
    expect(istGueltigeOrteSortierung(['bezeichnung', 'aufsteigend'])).toBe(false)
  })

  it('lehnt ein Objekt ohne die erwarteten Felder ab', () => {
    expect(istGueltigeOrteSortierung({})).toBe(false)
  })

  it('lehnt ein Objekt mit nur einem der beiden Felder ab', () => {
    expect(istGueltigeOrteSortierung({ kriterium: 'bezeichnung' })).toBe(false)
    expect(istGueltigeOrteSortierung({ richtung: 'aufsteigend' })).toBe(false)
  })
})

describe('istGueltigeTagfilterEinstellung', () => {
  it('akzeptiert UND', () => {
    expect(istGueltigeTagfilterEinstellung({ verknuepfung: 'und' })).toBe(true)
  })

  it('akzeptiert ODER', () => {
    expect(istGueltigeTagfilterEinstellung({ verknuepfung: 'oder' })).toBe(true)
  })

  it('lehnt einen fehlenden Wert ab (undefined)', () => {
    expect(istGueltigeTagfilterEinstellung(undefined)).toBe(false)
  })

  it('lehnt null ab', () => {
    expect(istGueltigeTagfilterEinstellung(null)).toBe(false)
  })

  it('lehnt eine unbekannte Verknüpfung ab', () => {
    expect(istGueltigeTagfilterEinstellung({ verknuepfung: 'xor' })).toBe(false)
  })

  it('lehnt ein Objekt ohne das erwartete Feld ab', () => {
    expect(istGueltigeTagfilterEinstellung({})).toBe(false)
  })

  it('lehnt eine kaputte Wertform ab — Zeichenkette statt Objekt', () => {
    expect(istGueltigeTagfilterEinstellung('und')).toBe(false)
  })
})

describe('Gewichtung der Gesamtnote (PO-2026-11-24-001)', () => {
  it('kennt genau fünf feste Szenarien mit 1:1:1:1 bzw. 2:1:1:1 zugunsten der Fokus-Achse', () => {
    expect(GEWICHTUNG_SZENARIEN.map((eintrag) => eintrag.schluessel)).toEqual([
      'ausgewogen',
      'fokus-geschmack',
      'fokus-ambiente',
      'fokus-preis-leistung',
      'fokus-zeit',
    ])
    expect(findeGewichtungsSzenario('ausgewogen').gewichte).toEqual({ ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 1 })
    expect(findeGewichtungsSzenario('fokus-geschmack').gewichte).toEqual({ ambiente: 1, zeit: 1, geschmack: 2, preisLeistung: 1 })
    expect(findeGewichtungsSzenario('fokus-ambiente').gewichte).toEqual({ ambiente: 2, zeit: 1, geschmack: 1, preisLeistung: 1 })
    expect(findeGewichtungsSzenario('fokus-preis-leistung').gewichte).toEqual({ ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 2 })
    expect(findeGewichtungsSzenario('fokus-zeit').gewichte).toEqual({ ambiente: 1, zeit: 2, geschmack: 1, preisLeistung: 1 })
  })

  it('akzeptiert jedes feste Szenario als Objekt { szenario }', () => {
    for (const eintrag of GEWICHTUNG_SZENARIEN) {
      expect(istGueltigeOrteGewichtung({ szenario: eintrag.schluessel })).toBe(true)
    }
  })

  it('lehnt fehlende, unbekannte und falsch geformte Werte ab (Rückfall auf Ausgewogen)', () => {
    expect(istGueltigeOrteGewichtung(undefined)).toBe(false)
    expect(istGueltigeOrteGewichtung(null)).toBe(false)
    expect(istGueltigeOrteGewichtung('ausgewogen')).toBe(false)
    expect(istGueltigeOrteGewichtung({})).toBe(false)
    expect(istGueltigeOrteGewichtung({ szenario: 'gibt-es-nicht' })).toBe(false)
    expect(istGueltigeOrteGewichtung({ szenario: 5 })).toBe(false)
  })
})

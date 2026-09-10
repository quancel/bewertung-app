import { describe, expect, it } from 'vitest'
import { istGueltigeOrteSortierung, istGueltigeTagfilterEinstellung } from './ansicht'

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

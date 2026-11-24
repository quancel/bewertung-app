import { describe, expect, it } from 'vitest'
import {
  findeGewichtungsSzenario,
  GEWICHTUNG_SZENARIEN,
  istGueltigeEigeneGewichte,
  istGueltigeOrteGewichtung,
  istGueltigeOrteSortierung,
  liesOrteGewichtung,
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
  it('kennt fünf feste Szenarien mit 1:1:1:1 bzw. 2:1:1:1 zugunsten der Fokus-Achse, danach „Eigene" (-002)', () => {
    expect(GEWICHTUNG_SZENARIEN.map((eintrag) => eintrag.schluessel)).toEqual([
      'ausgewogen',
      'fokus-geschmack',
      'fokus-ambiente',
      'fokus-preis-leistung',
      'fokus-zeit',
      'eigene',
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

describe('eigene Gewichte (PO-2026-11-24-002, ADR-0037 Punkt 2)', () => {
  it('„eigene" ist ein gültiges Szenario, auch ohne eigeneGewichte (Stand aus -001)', () => {
    expect(istGueltigeOrteGewichtung({ szenario: 'eigene' })).toBe(true)
  })

  it('istGueltigeEigeneGewichte: vier ganze Zahlen 0–10, mindestens eine > 0', () => {
    expect(istGueltigeEigeneGewichte({ ambiente: 0, zeit: 0, geschmack: 10, preisLeistung: 0 })).toBe(true)
    expect(istGueltigeEigeneGewichte({ ambiente: 0, zeit: 0, geschmack: 0, preisLeistung: 0 })).toBe(false)
    expect(istGueltigeEigeneGewichte({ ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 11 })).toBe(false)
    expect(istGueltigeEigeneGewichte({ ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: -1 })).toBe(false)
    expect(istGueltigeEigeneGewichte({ ambiente: 1, zeit: 1.5, geschmack: 1, preisLeistung: 1 })).toBe(false)
    expect(istGueltigeEigeneGewichte({ ambiente: 1, zeit: '1', geschmack: 1, preisLeistung: 1 })).toBe(false)
    expect(istGueltigeEigeneGewichte({ ambiente: 1, zeit: 1, geschmack: 1 })).toBe(false)
    expect(istGueltigeEigeneGewichte(null)).toBe(false)
  })

  it('liesOrteGewichtung nimmt den Stand aus -001 unverändert', () => {
    expect(liesOrteGewichtung({ szenario: 'fokus-zeit' })).toEqual({ szenario: 'fokus-zeit' })
  })

  it('liesOrteGewichtung übernimmt gültige eigene Gewichte, auch bei einem festen Szenario', () => {
    const eigene = { ambiente: 0, zeit: 3, geschmack: 10, preisLeistung: 1 }
    expect(liesOrteGewichtung({ szenario: 'ausgewogen', eigeneGewichte: eigene })).toEqual({
      szenario: 'ausgewogen',
      eigeneGewichte: eigene,
    })
  })

  it('liesOrteGewichtung lässt ungültige eigene Gewichte weg (es gilt 1:1:1:1)', () => {
    expect(liesOrteGewichtung({ szenario: 'eigene', eigeneGewichte: { ambiente: 0, zeit: 0, geschmack: 0, preisLeistung: 0 } })).toEqual({
      szenario: 'eigene',
    })
    expect(liesOrteGewichtung({ szenario: 'eigene', eigeneGewichte: 'kaputt' })).toEqual({ szenario: 'eigene' })
  })

  it('liesOrteGewichtung fällt bei einem ungültigen Szenario still auf Ausgewogen zurück', () => {
    expect(liesOrteGewichtung({ szenario: 'gibt-es-nicht', eigeneGewichte: { ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 1 } })).toEqual({
      szenario: 'ausgewogen',
    })
    expect(liesOrteGewichtung(undefined)).toEqual({ szenario: 'ausgewogen' })
  })

  it('die Szenariotabelle führt „Eigene" als sechste Zeile mit der Erstbelegung 1:1:1:1', () => {
    const eigene = GEWICHTUNG_SZENARIEN[5]!
    expect(GEWICHTUNG_SZENARIEN).toHaveLength(6)
    expect(eigene.schluessel).toBe('eigene')
    expect(eigene.name).toBe('Eigene')
    expect(eigene.sekundaerzeile).toBe('Du legst die Gewichte selbst fest')
    expect(eigene.gewichte).toEqual({ ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 1 })
  })
})

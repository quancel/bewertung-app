import { describe, expect, it } from 'vitest'
import {
  bereinigeTagEingabe,
  ermittleKanonischeSchreibweise,
  leiteTagVokabularAb,
  normalisiereTagSchluessel,
  ortErfuelltTagfilter,
} from './tagfilter'

describe('normalisiereTagSchluessel', () => {
  it('trimmt und senkt die Groß-/Kleinschreibung', () => {
    expect(normalisiereTagSchluessel('  Pizza  ')).toBe('pizza')
    expect(normalisiereTagSchluessel('PIZZA')).toBe('pizza')
  })
})

describe('bereinigeTagEingabe', () => {
  it('liefert die getrimmte Eingabe', () => {
    expect(bereinigeTagEingabe('  Café  ')).toBe('Café')
  })

  it('liefert null bei Leereingabe', () => {
    expect(bereinigeTagEingabe('')).toBeNull()
  })

  it('liefert null bei reinen Leerzeichen', () => {
    expect(bereinigeTagEingabe('   ')).toBeNull()
  })

  it('erhält innenliegende Leerzeichen', () => {
    expect(bereinigeTagEingabe('  gute Küche  ')).toBe('gute Küche')
  })
})

describe('ermittleKanonischeSchreibweise', () => {
  it('liefert die getrimmte Eingabe, wenn der Tag im Bestand neu ist', () => {
    expect(ermittleKanonischeSchreibweise([], '  Pizza  ')).toBe('Pizza')
  })

  it('liefert null bei Leereingabe', () => {
    expect(ermittleKanonischeSchreibweise([{ tags: ['Pizza'] }], '   ')).toBeNull()
  })

  it('übernimmt die im Bestand zuerst vergebene Schreibweise bei abweichender Groß-/Kleinschreibung', () => {
    const orte = [{ tags: ['Pizza'] }, { tags: [] }]
    expect(ermittleKanonischeSchreibweise(orte, 'pizza')).toBe('Pizza')
    expect(ermittleKanonischeSchreibweise(orte, 'PIZZA')).toBe('Pizza')
  })
})

describe('leiteTagVokabularAb', () => {
  it('liefert ein leeres Vokabular für einen Bestand ohne Tags', () => {
    expect(leiteTagVokabularAb([{ tags: [] }, { tags: [] }])).toEqual([])
  })

  it('dedupliziert case-insensitiv und behält die zuerst vergebene Schreibweise', () => {
    const orte = [{ tags: ['Pizza'] }, { tags: ['pizza', 'Pasta'] }]
    expect(leiteTagVokabularAb(orte)).toEqual(['Pasta', 'Pizza'])
  })

  it('sortiert alphabetisch über Intl.Collator(\'de\')', () => {
    const orte = [{ tags: ['Öl', 'Apfel', 'Zebra'] }]
    expect(leiteTagVokabularAb(orte)).toEqual(['Apfel', 'Öl', 'Zebra'])
  })
})

describe('ortErfuelltTagfilter', () => {
  it('liefert true bei leerer Auswahl, in beiden Modi', () => {
    expect(ortErfuelltTagfilter(['Pizza'], [], 'und')).toBe(true)
    expect(ortErfuelltTagfilter([], [], 'oder')).toBe(true)
  })

  it('UND: liefert nur true, wenn alle aktiven Tags vorhanden sind', () => {
    expect(ortErfuelltTagfilter(['Pizza', 'Pasta'], ['Pizza', 'Pasta'], 'und')).toBe(true)
    expect(ortErfuelltTagfilter(['Pizza'], ['Pizza', 'Pasta'], 'und')).toBe(false)
  })

  it('ODER: liefert true, wenn mindestens ein aktiver Tag vorhanden ist', () => {
    expect(ortErfuelltTagfilter(['Pizza'], ['Pizza', 'Pasta'], 'oder')).toBe(true)
    expect(ortErfuelltTagfilter(['Sushi'], ['Pizza', 'Pasta'], 'oder')).toBe(false)
  })

  it('bei genau einem aktiven Tag liefern beide Modi dasselbe Ergebnis', () => {
    expect(ortErfuelltTagfilter(['Pizza'], ['Pizza'], 'und')).toBe(
      ortErfuelltTagfilter(['Pizza'], ['Pizza'], 'oder'),
    )
    expect(ortErfuelltTagfilter(['Sushi'], ['Pizza'], 'und')).toBe(
      ortErfuelltTagfilter(['Sushi'], ['Pizza'], 'oder'),
    )
  })

  it('ist case-insensitiv über die Tag-Identität', () => {
    expect(ortErfuelltTagfilter(['pizza'], ['Pizza'], 'und')).toBe(true)
  })

  it('Monotonie UND: ein weiterer aktiver Tag verkleinert das Ergebnis nie — es wird nie aus false true', () => {
    const tagsDesOrts = ['Pizza']
    expect(ortErfuelltTagfilter(tagsDesOrts, ['Pizza'], 'und')).toBe(true)
    expect(ortErfuelltTagfilter(tagsDesOrts, ['Pizza', 'Pasta'], 'und')).toBe(false)
  })

  it('Monotonie ODER: ein weiterer aktiver Tag verkleinert das Ergebnis nie — aus true wird nie false', () => {
    const tagsDesOrts = ['Pizza']
    expect(ortErfuelltTagfilter(tagsDesOrts, ['Pizza'], 'oder')).toBe(true)
    expect(ortErfuelltTagfilter(tagsDesOrts, ['Pizza', 'Pasta'], 'oder')).toBe(true)
  })
})

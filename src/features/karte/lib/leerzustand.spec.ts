import { describe, expect, it } from 'vitest'
import { bestimmeKartenLeerzustand } from './leerzustand'

describe('bestimmeKartenLeerzustand', () => {
  it('liefert "ohne_koordinaten", wenn gefilterte Orte existieren, aber keiner sichtbar ist', () => {
    expect(bestimmeKartenLeerzustand(5, 0)).toBe('ohne_koordinaten')
  })

  it('liefert "keiner", wenn mindestens ein Ort sichtbar ist', () => {
    expect(bestimmeKartenLeerzustand(5, 1)).toBe('keiner')
    expect(bestimmeKartenLeerzustand(5, 5)).toBe('keiner')
  })

  it('liefert "keiner", wenn schon der Filter null Treffer liefert (eigener, vorgelagerter Zustand)', () => {
    expect(bestimmeKartenLeerzustand(0, 0)).toBe('keiner')
  })
})

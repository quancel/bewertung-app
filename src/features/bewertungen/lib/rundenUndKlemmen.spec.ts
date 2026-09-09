import { describe, expect, it } from 'vitest'
import { rundenUndKlemmen } from './rundenUndKlemmen'

describe('rundenUndKlemmen', () => {
  it('rundet auf die nächstliegende ganze Zahl (7,5 → 8)', () => {
    expect(rundenUndKlemmen(7.5)).toBe(8)
  })

  it('rundet 7,4 auf 7 ab', () => {
    expect(rundenUndKlemmen(7.4)).toBe(7)
  })

  it('klemmt einen Wert oberhalb von 10 auf 10', () => {
    expect(rundenUndKlemmen(15)).toBe(10)
  })

  it('klemmt einen negativen Wert auf 0', () => {
    expect(rundenUndKlemmen(-3)).toBe(0)
  })

  it('rundet zuerst und klemmt danach (10,6 → 11 → 10)', () => {
    expect(rundenUndKlemmen(10.6)).toBe(10)
  })

  it('lässt gültige Ganzzahlen unverändert', () => {
    expect(rundenUndKlemmen(0)).toBe(0)
    expect(rundenUndKlemmen(10)).toBe(10)
    expect(rundenUndKlemmen(5)).toBe(5)
  })
})

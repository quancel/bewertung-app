import { describe, expect, it } from 'vitest'
import { berechnePanVersatz, liegtUnterVerdeckung } from './verdeckung'

const volleBreite = { hoehe: 280, links: 0, rechts: 400 } // Karte 480 hoch: Oberkante bei y = 200
const schmal = { hoehe: 280, links: 16, rechts: 496 }

describe('liegtUnterVerdeckung', () => {
  it('ohne Überlagerung nie', () => {
    expect(liegtUnterVerdeckung({ x: 10, y: 470 }, 480, null)).toBe(false)
    expect(liegtUnterVerdeckung({ x: 10, y: 470 }, 480, { hoehe: 0, links: 0, rechts: 400 })).toBe(false)
  })

  it('unter der Oberkante ja, darüber nein (Oberkante zählt dazu)', () => {
    expect(liegtUnterVerdeckung({ x: 100, y: 200 }, 480, volleBreite)).toBe(true)
    expect(liegtUnterVerdeckung({ x: 100, y: 199.9 }, 480, volleBreite)).toBe(false)
    expect(liegtUnterVerdeckung({ x: 100, y: 479 }, 480, volleBreite)).toBe(true)
  })

  it('neben der Überlagerung (ab md schmaler als die Karte) nicht verdeckt', () => {
    expect(liegtUnterVerdeckung({ x: 600, y: 400 }, 800, { hoehe: 280, links: 16, rechts: 496 })).toBe(false)
    expect(liegtUnterVerdeckung({ x: 5, y: 700 }, 800, schmal)).toBe(false)
    expect(liegtUnterVerdeckung({ x: 300, y: 700 }, 800, schmal)).toBe(true)
  })
})

describe('berechnePanVersatz', () => {
  it('0 ohne Überlagerung und neben ihr', () => {
    expect(berechnePanVersatz({ x: 100, y: 450 }, 480, null)).toBe(0)
    expect(berechnePanVersatz({ x: 700, y: 450 }, 800, { hoehe: 280, links: 16, rechts: 496 })).toBe(0)
  })

  it('0, wenn der Marker bereits 24px über der Scheibenkante liegt', () => {
    // Oberkante 200, Ziel = 200 - 24 - 24 = 152
    expect(berechnePanVersatz({ x: 100, y: 152 }, 480, volleBreite)).toBe(0)
    expect(berechnePanVersatz({ x: 100, y: 100 }, 480, volleBreite)).toBe(0)
  })

  it('verschiebt minimal, bis der Marker auf dem Ziel liegt', () => {
    expect(berechnePanVersatz({ x: 100, y: 300 }, 480, volleBreite)).toBe(148)
    expect(berechnePanVersatz({ x: 100, y: 160 }, 480, volleBreite)).toBe(8)
  })

  it('bei „voll" (Streifen von 56px) landet der Marker nicht über dem oberen Rand', () => {
    const voll = { hoehe: 424, links: 0, rechts: 400 } // Oberkante 56, Ziel nach Formel 8 -> geklemmt auf 28
    expect(berechnePanVersatz({ x: 100, y: 300 }, 480, voll)).toBe(272)
  })
})

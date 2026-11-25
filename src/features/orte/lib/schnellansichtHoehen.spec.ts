import { describe, expect, it } from 'vitest'
import {
  begrenzeHoehe,
  bestimmeHoehen,
  FLICK_MIN_WEG_PX,
  rasteEin,
  zustandGroesser,
  zustandKleiner,
  zustandNachGriffAktivierung,
} from './schnellansichtHoehen'

describe('bestimmeHoehen', () => {
  it('eingeklappt 80, halb = 50 % (min 280), voll = Bereich - 56', () => {
    expect(bestimmeHoehen(800)).toEqual({ eingeklappt: 80, halb: 400, voll: 744 })
  })

  it('halb nimmt bei kleinem Bereich das Minimum von 280', () => {
    expect(bestimmeHoehen(480)).toEqual({ eingeklappt: 80, halb: 280, voll: 424 })
  })

  it('bleibt auch bei sehr kleinem Bereich geordnet (eingeklappt <= halb <= voll)', () => {
    const h = bestimmeHoehen(200)
    expect(h.eingeklappt).toBeLessThanOrEqual(h.halb)
    expect(h.halb).toBeLessThanOrEqual(h.voll)
  })
})

describe('rasteEin', () => {
  const hoehen = bestimmeHoehen(480) // 80 / 280 / 424

  it('langsam: der nächstgelegene Zustand', () => {
    expect(rasteEin(100, hoehen, 0)).toBe('eingeklappt')
    expect(rasteEin(190, hoehen, 0.1)).toBe('halb')
    expect(rasteEin(360, hoehen, -0.2)).toBe('voll')
    expect(rasteEin(300, hoehen, 0)).toBe('halb')
  })

  it('schnell nach oben: der nächste größere Zustand, auch wenn der kleinere näher läge', () => {
    expect(rasteEin(100, hoehen, 0.9)).toBe('halb')
    expect(rasteEin(290, hoehen, 0.9)).toBe('voll')
    expect(rasteEin(420, hoehen, 0.9)).toBe('voll')
  })

  it('schnell nach unten: der nächste kleinere Zustand', () => {
    expect(rasteEin(400, hoehen, -0.9)).toBe('halb')
    expect(rasteEin(270, hoehen, -0.9)).toBe('eingeklappt')
    expect(rasteEin(90, hoehen, -0.9)).toBe('eingeklappt')
  })

  it('unter dem Flick-Mindestweg zählt das Tempo nicht: 5px in 8ms rasten nicht in Wischrichtung ein', () => {
    // 5px / 8ms = 0,625 px/ms (> Schwelle), aber nur 5px Weg: nächstgelegener Zustand.
    expect(rasteEin(285, hoehen, 5 / 8, 5)).toBe('halb')
    expect(rasteEin(285, hoehen, 5 / 8)).toBe('voll')
    expect(rasteEin(275, hoehen, -5 / 8, 5)).toBe('halb')
    expect(rasteEin(285, hoehen, 5 / 8, FLICK_MIN_WEG_PX)).toBe('voll')
  })

  it('genau auf der Schwelle gilt noch „langsam"', () => {
    expect(rasteEin(100, hoehen, 0.5)).toBe('eingeklappt')
  })
})

describe('Griff und Pfeile', () => {
  it('Griff: größer, aus „voll" zurück auf „halb"', () => {
    expect(zustandNachGriffAktivierung('eingeklappt')).toBe('halb')
    expect(zustandNachGriffAktivierung('halb')).toBe('voll')
    expect(zustandNachGriffAktivierung('voll')).toBe('halb')
  })

  it('Pfeile ändern um genau einen Zustand und bleiben am Ende stehen', () => {
    expect(zustandGroesser('eingeklappt')).toBe('halb')
    expect(zustandGroesser('halb')).toBe('voll')
    expect(zustandGroesser('voll')).toBe('voll')
    expect(zustandKleiner('voll')).toBe('halb')
    expect(zustandKleiner('halb')).toBe('eingeklappt')
    expect(zustandKleiner('eingeklappt')).toBe('eingeklappt')
  })
})

describe('begrenzeHoehe', () => {
  it('klemmt auf [eingeklappt, voll]', () => {
    const hoehen = bestimmeHoehen(480)
    expect(begrenzeHoehe(10, hoehen)).toBe(80)
    expect(begrenzeHoehe(300, hoehen)).toBe(300)
    expect(begrenzeHoehe(900, hoehen)).toBe(424)
  })
})

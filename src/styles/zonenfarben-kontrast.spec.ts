/**
 * Kontrastnachweis der fünf Zonenfarben (ADR-0034, design-conventions.md
 * „Ortsliste: Zonenfarben und Hervorhebungs-Schatten") gegen die drei
 * möglichen Zeilenhintergründe (normal/Hover/ausgewählt). Seit
 * PO-2026-11-24-007 tragen die Zonenfarben eine PLAKETTE (Fläche in
 * Zonenfarbe, Zahl in `--color-neutral-0`) und eine flache Balkenfüllung:
 * Zahl auf Fläche >= 4,5:1, Fläche gegen Hintergrund >= 3:1 (WCAG 1.4.11),
 * Graustufen (L*) streng monoton mit Mindestschritt. Außerdem die
 * Hervorhebungs-Schatten (Hairline + Schattenlayer, schwächer als der
 * Sheet-Schatten). Liest `tokens.css`
 * als Text — kein Browser, keine Komponente nötig (billigste Ebene, ADR-0027).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const TOKENS_PFAD = fileURLToPath(new URL('./tokens.css', import.meta.url))
const TOKENS_CSS = readFileSync(TOKENS_PFAD, 'utf-8')

function leseHexToken(name: string): string {
  const treffer = TOKENS_CSS.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!treffer) throw new Error(`Token ${name} nicht in tokens.css gefunden`)
  return treffer[1]
}

function hexZuRgb(hex: string): [number, number, number] {
  const zahl = Number.parseInt(hex.slice(1), 16)
  return [(zahl >> 16) & 255, (zahl >> 8) & 255, zahl & 255]
}

/** WCAG-Formel für relative Luminanz (sRGB). */
function relativeLuminanz([r, g, b]: readonly [number, number, number]): number {
  const kanal = (wert: number) => {
    const anteil = wert / 255
    return anteil <= 0.03928 ? anteil / 12.92 : ((anteil + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b)
}

function kontrastverhaeltnis(hexA: string, hexB: string): number {
  const luminanzA = relativeLuminanz(hexZuRgb(hexA))
  const luminanzB = relativeLuminanz(hexZuRgb(hexB))
  const heller = Math.max(luminanzA, luminanzB)
  const dunkler = Math.min(luminanzA, luminanzB)
  return (heller + 0.05) / (dunkler + 0.05)
}

const ZONEN_TOKENS = ['--color-zone-8', '--color-zone-8-5', '--color-zone-9', '--color-zone-9-5', '--color-zone-10']
/** Die drei möglichen Zeilenhintergründe: normal, Hover, ausgewählt. */
const HINTERGRUND_TOKENS = ['--color-neutral-0', '--color-neutral-50', '--color-primary-50']

describe('Zonenfarben-Kontrast (ADR-0034)', () => {
  const kombinationen = ZONEN_TOKENS.flatMap((zone) => HINTERGRUND_TOKENS.map((hintergrund) => [zone, hintergrund] as const))

  it.each(kombinationen)('%s gegen %s erreicht mindestens 4,5:1', (zonenToken, hintergrundToken) => {
    const ratio = kontrastverhaeltnis(leseHexToken(zonenToken), leseHexToken(hintergrundToken))
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  const ZAHL_TOKEN = '--color-neutral-0'

  it.each(ZONEN_TOKENS)('Plakette %s: Zahl (neutral-0) auf der Zonenfläche erreicht mindestens 4,5:1', (zonenToken) => {
    const ratio = kontrastverhaeltnis(leseHexToken(ZAHL_TOKEN), leseHexToken(zonenToken))
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it.each(kombinationen)('Fläche %s gegen %s erreicht mindestens 3:1', (zonenToken, hintergrundToken) => {
    const ratio = kontrastverhaeltnis(leseHexToken(zonenToken), leseHexToken(hintergrundToken))
    expect(ratio).toBeGreaterThanOrEqual(3)
  })

  it('L* sinkt von Zone 8 nach Zone 10 streng monoton, Schritt mindestens 7 (Graustufen)', () => {
    const lStern = ZONEN_TOKENS.map((token) => {
      const y = relativeLuminanz(hexZuRgb(leseHexToken(token)))
      return y > 216 / 24389 ? 116 * y ** (1 / 3) - 16 : (24389 / 27) * y
    })
    for (let i = 1; i < lStern.length; i += 1) {
      expect(lStern[i - 1] - lStern[i]).toBeGreaterThanOrEqual(7)
    }
  })

  it('Helligkeit sinkt von Zone 8 nach Zone 10 streng monoton', () => {
    const luminanzen = ZONEN_TOKENS.map((token) => relativeLuminanz(hexZuRgb(leseHexToken(token))))
    for (let i = 1; i < luminanzen.length; i += 1) {
      expect(luminanzen[i]).toBeLessThan(luminanzen[i - 1])
    }
  })
})

describe('Hervorhebungs-Schatten (PO-2026-11-24-007)', () => {
  function leseSchattenToken(name: string): string[] {
    const treffer = TOKENS_CSS.match(new RegExp(`${name}:\\s*([^;]+);`))
    if (!treffer) throw new Error(`Token ${name} nicht in tokens.css gefunden`)
    // An Kommas auf oberster Ebene trennen (`rgb(26 31 29 / 10%)` hat keine).
    return treffer[1].split(/,\s*(?=\d)/).map((layer) => layer.trim())
  }

  it.each(['--shadow-hervorhebung-schwach', '--shadow-hervorhebung-stark'])(
    '%s: erster Layer ist ein 1px-Hairline (Spread, kein Versatz), zweiter ein Schattenlayer',
    (token) => {
      const layer = leseSchattenToken(token)
      expect(layer).toHaveLength(2)
      expect(layer[0]).toMatch(/^0 0 0 1px rgb\(26 31 29 \/ \d+%\)$/)
      expect(layer[1]).toMatch(/^0 [1-9]\d*px \d+px \d+(?:px)? rgb\(26 31 29 \/ \d+%\)$/)
    },
  )

  it('stark ist deutlicher als schwach und beide bleiben schwächer als der Sheet-Schatten (Blur x Deckkraft)', () => {
    function staerke(token: string): number {
      const schatten = leseSchattenToken(token)[1]
      const [, , blur] = schatten.split(' ')
      const deckkraft = Number(schatten.match(/\/ (\d+)%/)![1]) / 100
      return Number.parseInt(blur, 10) * deckkraft
    }
    const sheet = 24 * 0.12
    expect(staerke('--shadow-hervorhebung-stark')).toBeGreaterThan(staerke('--shadow-hervorhebung-schwach'))
    expect(staerke('--shadow-hervorhebung-stark')).toBeLessThan(sheet)
  })
})

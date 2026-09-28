/**
 * Kontrastnachweis der fünf Zonenfarben (ADR-0034, design-conventions.md
 * „Ortsliste: Zonenfarben und Hervorhebungs-Schatten") gegen die drei
 * möglichen Zeilenhintergründe (normal/Hover/ausgewählt). Liest `tokens.css`
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

  it('Helligkeit sinkt von Zone 8 nach Zone 10 streng monoton', () => {
    const luminanzen = ZONEN_TOKENS.map((token) => relativeLuminanz(hexZuRgb(leseHexToken(token))))
    for (let i = 1; i < luminanzen.length; i += 1) {
      expect(luminanzen[i]).toBeLessThan(luminanzen[i - 1])
    }
  })
})

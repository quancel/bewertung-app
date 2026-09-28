import { describe, expect, it } from 'vitest'
import { berechneGesamtnote, formatiereGesamtnote } from '../../../shared/lib/gesamtnote'
import type { Achse } from '../../bewertungen/model/bewertungen.types'
import { GESCHMACK_NAME, PREIS_LEISTUNG_NAME, ZONEN, bestimmeHervorhebung, bestimmeZone } from './zonen'

function achse(wert: number | null): Achse {
  return { wert, kommentar: null }
}

function bewertungen(ambiente: number | null, zeit: number | null, geschmack: number | null, preisLeistung: number | null) {
  return {
    ambiente: achse(ambiente),
    zeit: achse(zeit),
    geschmack: achse(geschmack),
    preisLeistung: achse(preisLeistung),
  }
}

describe('bestimmeZone', () => {
  it('liefert null für null', () => {
    expect(bestimmeZone(null)).toBeNull()
  })

  it.each([
    [7.99, null],
    [8, '8'],
    [8.49, '8'],
    [8.5, '8-5'],
    [9, '9'],
    [9.5, '9-5'],
    [9.99, '9-5'],
    [10, '10'],
  ] as const)('Wert %s -> Zone %s', (wert, erwarteterSchluessel) => {
    expect(bestimmeZone(wert)?.schluessel ?? null).toBe(erwarteterSchluessel)
  })
})

describe('Zone des Rohwerts = Zone des angezeigten Werts (ADR-0034 Punkt 3)', () => {
  // 12 Werte je Achse: 0-10 (elf ganze Zahlen, ADR-0007 Punkt 7) plus `null`.
  const ACHSENWERTE: ReadonlyArray<number | null> = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('stimmt für alle 12^4 Achsenkombinationen überein', () => {
    let geprueft = 0
    for (const a of ACHSENWERTE) {
      for (const b of ACHSENWERTE) {
        for (const c of ACHSENWERTE) {
          for (const d of ACHSENWERTE) {
            const rohwert = berechneGesamtnote(bewertungen(a, b, c, d))
            if (rohwert === null) continue
            // Zurücklesen des formatierten Strings ist NUR in diesem Test
            // erlaubt (ADR-0034 Punkt 3), nie im Produktionscode.
            const angezeigterWert = Number(formatiereGesamtnote(rohwert).replace(',', '.'))
            expect(bestimmeZone(angezeigterWert)).toEqual(bestimmeZone(rohwert))
            geprueft += 1
          }
        }
      }
    }
    // Sicherstellen, dass die Schleife tatsächlich (fast) alle 12^4
    // Kombinationen durchlaufen hat (nur alle-null wird übersprungen).
    expect(geprueft).toBe(12 ** 4 - 1)
  })
})

describe('bestimmeHervorhebung', () => {
  it('liefert null und keinen Text ohne Achse >= 9', () => {
    const ergebnis = bestimmeHervorhebung(bewertungen(null, null, null, null))
    expect(ergebnis.hervorhebung).toBeNull()
    expect(ergebnis.screenreaderText).toBeNull()
  })

  it('ein Wert knapp unter 9 löst nicht aus', () => {
    const ergebnis = bestimmeHervorhebung(bewertungen(null, null, 8, 8))
    expect(ergebnis.hervorhebung).toBeNull()
    expect(ergebnis.screenreaderText).toBeNull()
  })

  it('Geschmack 9 -> schwach', () => {
    const ergebnis = bestimmeHervorhebung(bewertungen(null, null, 9, null))
    expect(ergebnis.hervorhebung).toBe('schwach')
    expect(ergebnis.screenreaderText).toBe(`${GESCHMACK_NAME} 9,0`)
  })

  it('Geschmack 10 -> schwach', () => {
    const ergebnis = bestimmeHervorhebung(bewertungen(null, null, 10, null))
    expect(ergebnis.hervorhebung).toBe('schwach')
    expect(ergebnis.screenreaderText).toBe(`${GESCHMACK_NAME} 10,0`)
  })

  it('Preis-Leistung 9 -> stark', () => {
    const ergebnis = bestimmeHervorhebung(bewertungen(null, null, null, 9))
    expect(ergebnis.hervorhebung).toBe('stark')
    expect(ergebnis.screenreaderText).toBe(`${PREIS_LEISTUNG_NAME} 9,0`)
  })

  it('Preis-Leistung 10 -> stark', () => {
    const ergebnis = bestimmeHervorhebung(bewertungen(null, null, null, 10))
    expect(ergebnis.hervorhebung).toBe('stark')
    expect(ergebnis.screenreaderText).toBe(`${PREIS_LEISTUNG_NAME} 10,0`)
  })

  it('beide >= 9 -> beide, Geschmack zuerst im Text', () => {
    const ergebnis = bestimmeHervorhebung(bewertungen(null, null, 10, 9))
    expect(ergebnis.hervorhebung).toBe('beide')
    expect(ergebnis.screenreaderText).toBe(`${GESCHMACK_NAME} 10,0, ${PREIS_LEISTUNG_NAME} 9,0`)
  })

  it('gilt unabhängig von den beiden anderen Achsen (Ambiente/Zeit)', () => {
    const ergebnis = bestimmeHervorhebung(bewertungen(10, 10, 9, null))
    expect(ergebnis.hervorhebung).toBe('schwach')
  })
})

describe('ZONEN', () => {
  it('hat genau fünf Einträge, aufsteigend sortiert, mit wörtlichem Tokennamen', () => {
    expect(ZONEN).toHaveLength(5)
    const untergrenzen = ZONEN.map((zone) => zone.untergrenze)
    expect(untergrenzen).toEqual([...untergrenzen].sort((a, b) => a - b))
    for (const zone of ZONEN) {
      expect(zone.tokenName.startsWith('--color-zone-')).toBe(true)
    }
  })
})

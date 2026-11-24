import { describe, expect, it } from 'vitest'
import { berechneGesamtnote, formatiereGesamtnote } from '../../../shared/lib/gesamtnote'
import type { Achse } from '../../bewertungen/model/bewertungen.types'
import { GEWICHTUNG_SZENARIEN } from '../model/ansicht'
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
    [79, null],
    [80, '8'],
    [84, '8'],
    [85, '8-5'],
    [90, '9'],
    [95, '9-5'],
    [99, '9-5'],
    [100, '10'],
  ] as const)('%s Zehntel -> Zone %s', (zehntel, erwarteterSchluessel) => {
    expect(bestimmeZone(zehntel)?.schluessel ?? null).toBe(erwarteterSchluessel)
  })
})

describe('Zone nach dem angezeigten Wert (ADR-0037 Punkt 5, löst ADR-0034 Punkt 3 ab)', () => {
  // 12 Werte je Achse: 0-10 (elf ganze Zahlen, ADR-0007 Punkt 7) plus `null`.
  const ACHSENWERTE: ReadonlyArray<number | null> = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  // Zurücklesen des formatierten Strings ist NUR in diesen Tests erlaubt
  // (ADR-0037 Punkt 5), nie im Produktionscode.
  function angezeigterWertInZehnteln(zehntel: number): number {
    return Math.round(Number(formatiereGesamtnote(zehntel).replace(',', '.')) * 10)
  }

  it.each(GEWICHTUNG_SZENARIEN.map((eintrag) => [eintrag.name, eintrag.gewichte] as const))(
    'Szenario %s: Zone(angezeigter Wert) = Zone(zehntel) für alle 12^4 Achsenkombinationen',
    (_name, gewichte) => {
      let geprueft = 0
      for (const a of ACHSENWERTE) {
        for (const b of ACHSENWERTE) {
          for (const c of ACHSENWERTE) {
            for (const d of ACHSENWERTE) {
              const ergebnis = berechneGesamtnote(bewertungen(a, b, c, d), gewichte)
              if (ergebnis.art !== 'wert') continue
              expect(bestimmeZone(angezeigterWertInZehnteln(ergebnis.zehntel))).toEqual(bestimmeZone(ergebnis.zehntel))
              // Nie ein angezeigter Wert >= 8,0 ohne Zone und nie eine Zone ohne angezeigte 8,0.
              expect(angezeigterWertInZehnteln(ergebnis.zehntel) >= 80).toBe(bestimmeZone(ergebnis.zehntel) !== null)
              geprueft += 1
            }
          }
        }
      }
      expect(geprueft).toBe(12 ** 4 - 1)
    },
  )

  // Eigene Gewichte (PO-2026-11-24-002): die Nenner reichen bis 40. 11^4 Gewichte
  // x 12^4 Werte sind nicht erschöpfend rechenbar (ADR-0037 „Alternativen"); hier
  // ein dichtes Raster beider Seiten, ohne `expect` in der Schleife.
  it('Eigene Gewichte: nie ein angezeigter Wert >= 8,0 ohne Zone, nie eine Zone ohne angezeigte 8,0', () => {
    const gewichtsstufen = [0, 1, 2, 3, 5, 7, 9, 10]
    const werte: ReadonlyArray<number | null> = [null, 6, 7, 8, 9, 10]
    let verstoesse = 0
    let geprueft = 0
    for (const ga of gewichtsstufen) for (const gz of gewichtsstufen) for (const gg of gewichtsstufen) for (const gp of gewichtsstufen) {
      if (ga + gz + gg + gp === 0) continue
      const gewichte = { ambiente: ga, zeit: gz, geschmack: gg, preisLeistung: gp }
      for (const a of werte) for (const b of werte) for (const c of werte) for (const d of werte) {
        const ergebnis = berechneGesamtnote(bewertungen(a, b, c, d), gewichte)
        if (ergebnis.art !== 'wert') continue
        geprueft += 1
        const angezeigt = angezeigterWertInZehnteln(ergebnis.zehntel)
        if (angezeigt >= 80 !== (bestimmeZone(ergebnis.zehntel) !== null)) verstoesse += 1
      }
    }
    expect(geprueft).toBeGreaterThan(1_000_000)
    expect(verstoesse).toBe(0)
  })

  it('Grenzfall 159/20 = 7,95 zeigt „8,0" UND bekommt Zone 8 (nicht „8,0" ohne Zone)', () => {
    const gewichte = { ambiente: 9, zeit: 1, geschmack: 10, preisLeistung: 0 }
    const ergebnis = berechneGesamtnote(bewertungen(8, 7, 8, null), gewichte)
    expect(ergebnis.art).toBe('wert')
    if (ergebnis.art !== 'wert') return
    expect(ergebnis.roh < 8).toBe(true)
    expect(formatiereGesamtnote(ergebnis.zehntel)).toBe('8,0')
    expect(bestimmeZone(ergebnis.zehntel)?.schluessel).toBe('8')
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
    const untergrenzen = ZONEN.map((zone) => zone.untergrenzeZehntel)
    expect(untergrenzen).toEqual([...untergrenzen].sort((a, b) => a - b))
    for (const zone of ZONEN) {
      expect(zone.tokenName.startsWith('--color-zone-')).toBe(true)
    }
  })
})

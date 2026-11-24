import { describe, expect, it } from 'vitest'
import {
  bestimmeSichtbareEtiketten,
  ETIKETT_RAND_PX,
  vergleicheVorrang,
  type EtikettKandidat,
  type Rechteck,
} from './etikettKollision'

function rechteck(links: number, oben: number, breite: number, hoehe: number): Rechteck {
  return { links, oben, rechts: links + breite, unten: oben + hoehe }
}

/** Etikett 100x20 über einem Körper 40x40 an Position x (Körper-Mitte x+20). */
function kandidat(id: string, x: number, extra: Partial<EtikettKandidat> = {}): EtikettKandidat {
  return {
    id,
    bezeichnung: id,
    rohwert: 5,
    hatVorrang: false,
    etikett: rechteck(x - 30, 0, 100, 20),
    koerper: rechteck(x, 30, 40, 40),
    ...extra,
  }
}

describe('bestimmeSichtbareEtiketten', () => {
  it('zeigt alle Etiketten, wenn nichts überlappt', () => {
    const sichtbar = bestimmeSichtbareEtiketten([kandidat('a', 0), kandidat('b', 400)])
    expect([...sichtbar].sort()).toEqual(['a', 'b'])
  })

  it('blendet von zwei überlappenden Etiketten das mit dem niedrigeren Rohwert aus', () => {
    const sichtbar = bestimmeSichtbareEtiketten([
      kandidat('niedrig', 0, { rohwert: 6.1 }),
      kandidat('hoch', 60, { rohwert: 8.7 }),
    ])
    expect([...sichtbar]).toEqual(['hoch'])
  })

  it('blendet ein Etikett aus, das die Scheibe eines anderen Markers überlappt', () => {
    const a = kandidat('a', 0, { rohwert: 9 })
    // b: Etikett weit weg, aber Körper liegt unter dem Etikett von a
    const b = kandidat('b', 400, { rohwert: 1, koerper: rechteck(10, 5, 40, 40) })
    const sichtbar = bestimmeSichtbareEtiketten([a, b])
    expect(sichtbar.has('a')).toBe(false)
    expect(sichtbar.has('b')).toBe(true)
  })

  it('rechnet den Rand von 4px mit: knapper Abstand kollidiert, genug Abstand nicht', () => {
    const a = kandidat('a', 0, { rohwert: 9 })
    const knapp = kandidat('b', 0, { rohwert: 1, etikett: rechteck(70 + ETIKETT_RAND_PX - 1, 0, 100, 20), koerper: rechteck(500, 500, 10, 10) })
    const genug = kandidat('c', 0, { rohwert: 1, etikett: rechteck(70 + ETIKETT_RAND_PX, 0, 100, 20), koerper: rechteck(600, 600, 10, 10) })
    expect(bestimmeSichtbareEtiketten([a, knapp]).has('b')).toBe(false)
    expect(bestimmeSichtbareEtiketten([a, genug]).has('c')).toBe(true)
  })

  it('lässt ausgewählte oder fokussierte Etiketten immer sichtbar und verdrängt das andere', () => {
    const sichtbar = bestimmeSichtbareEtiketten([
      kandidat('hoch', 0, { rohwert: 9.9 }),
      kandidat('gewaehlt', 60, { rohwert: 1, hatVorrang: true }),
    ])
    expect([...sichtbar]).toEqual(['gewaehlt'])
  })

  it('stellt einen Ort ohne Note hinter jeden mit Note, auch hinter eine 0', () => {
    const sichtbar = bestimmeSichtbareEtiketten([
      kandidat('ohne', 0, { rohwert: null }),
      kandidat('null', 60, { rohwert: 0 }),
    ])
    expect([...sichtbar]).toEqual(['null'])
  })

  it('entscheidet Gleichstand nach Bezeichnung, dann nach Id', () => {
    const nachName = bestimmeSichtbareEtiketten([
      kandidat('2', 60, { bezeichnung: 'Zeta' }),
      kandidat('1', 0, { bezeichnung: 'alpha' }),
    ])
    expect([...nachName]).toEqual(['1'])
    const nachId = bestimmeSichtbareEtiketten([
      kandidat('b', 60, { bezeichnung: 'Gleich' }),
      kandidat('a', 0, { bezeichnung: 'gleich' }),
    ])
    expect([...nachId]).toEqual(['a'])
  })

  it('ist unabhängig von der Eingabereihenfolge', () => {
    const liste = [kandidat('a', 0, { rohwert: 7 }), kandidat('b', 50, { rohwert: 8 }), kandidat('c', 100, { rohwert: 9 })]
    const vorwaerts = [...bestimmeSichtbareEtiketten(liste)].sort()
    const rueckwaerts = [...bestimmeSichtbareEtiketten([...liste].reverse())].sort()
    expect(rueckwaerts).toEqual(vorwaerts)
  })
})

describe('vergleicheVorrang', () => {
  it('sortiert Groß/Klein nicht', () => {
    expect(vergleicheVorrang(kandidat('x', 0, { bezeichnung: 'bar' }), kandidat('y', 0, { bezeichnung: 'Foo' }))).toBeLessThan(0)
  })
})

/**
 * Kollisionsausblendung der Namensetiketten (PO-2026-11-24-004,
 * design-conventions.md „Karte: Marker, Namen, Ausschnitt"): reine Funktion
 * ohne Leaflet und ohne DOM. `useLeafletKarte.ts` misst die gerenderten
 * Rechtecke und übergibt sie; zurück kommt die Menge der Ort-IDs, deren
 * Etikett sichtbar bleibt.
 *
 * Regel: Das Etikett (plus `ETIKETT_RAND_PX` Rand) entfällt, wenn es ein
 * bereits sichtbares Etikett oder die Scheibe/den Punkt eines ANDEREN Markers
 * überlappt. Greedy in Vorrang-Reihenfolge: ausgewählt oder fokussiert, dann
 * höherer Rohwert der Gesamtnote, ohne Note zuletzt, bei Gleichstand
 * Bezeichnung (`de`, ohne Groß/Klein), dann Id. Ausgewählte/fokussierte
 * Etiketten sind immer sichtbar (design-conventions.md: „immer sichtbar").
 */

/** Rand um das Etikett für die Überlappungsprüfung (design-conventions.md: +4px). */
export const ETIKETT_RAND_PX = 4

export interface Rechteck {
  links: number
  oben: number
  rechts: number
  unten: number
}

export interface EtikettKandidat {
  id: string
  bezeichnung: string
  /** Ungerundete Gesamtnote; `null` ohne Note (sortiert zuletzt). */
  rohwert: number | null
  /** Ausgewählt oder fokussiert: Etikett bleibt in jedem Fall sichtbar. */
  hatVorrang: boolean
  /** Gemessenes Rechteck des Etiketts, OHNE Rand. */
  etikett: Rechteck
  /** Gemessenes Rechteck der Scheibe bzw. des Punkts. */
  koerper: Rechteck
}

export function ueberlappen(a: Rechteck, b: Rechteck): boolean {
  return a.links < b.rechts && b.links < a.rechts && a.oben < b.unten && b.oben < a.unten
}

function vergroessere(r: Rechteck, rand: number): Rechteck {
  return { links: r.links - rand, oben: r.oben - rand, rechts: r.rechts + rand, unten: r.unten + rand }
}

const kollator = new Intl.Collator('de', { sensitivity: 'base' })

export function vergleicheVorrang(a: EtikettKandidat, b: EtikettKandidat): number {
  if (a.hatVorrang !== b.hatVorrang) return a.hatVorrang ? -1 : 1
  if (a.rohwert !== b.rohwert) {
    if (a.rohwert === null) return 1
    if (b.rohwert === null) return -1
    return b.rohwert - a.rohwert
  }
  const name = kollator.compare(a.bezeichnung, b.bezeichnung)
  if (name !== 0) return name
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

export function bestimmeSichtbareEtiketten(kandidaten: readonly EtikettKandidat[]): Set<string> {
  const sortiert = [...kandidaten].sort(vergleicheVorrang)
  const sichtbar: EtikettKandidat[] = []
  for (const kandidat of sortiert) {
    if (kandidat.hatVorrang) {
      sichtbar.push(kandidat)
      continue
    }
    const mitRand = vergroessere(kandidat.etikett, ETIKETT_RAND_PX)
    const trifftEtikett = sichtbar.some((s) => ueberlappen(mitRand, s.etikett))
    const trifftKoerper = kandidaten.some((k) => k.id !== kandidat.id && ueberlappen(mitRand, k.koerper))
    if (!trifftEtikett && !trifftKoerper) sichtbar.push(kandidat)
  }
  return new Set(sichtbar.map((k) => k.id))
}

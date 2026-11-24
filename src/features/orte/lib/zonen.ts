/**
 * Zonen und Hervorhebungen der Ortsliste (ADR-0034, design-concept.md
 * „Ausnahme Ortsliste: Zonenfarben und Hervorhebungs-Schatten"): reine
 * Funktionen, EINZIGER Nutzer ist die Ortsliste (`Ortszeile.vue`,
 * `ZonenLegende.vue`) — deshalb hier in `features/orte/lib/`, nicht in
 * `shared/lib/` (ADR-0008 Punkt 6 gilt für Ableitungen mit mindestens zwei
 * Nutzern von Anfang an; ADR-0034 Punkt 1). Kein Store, kein DOM, kein
 * Router. Importiert ausschließlich Typen aus `persistence/schema.ts` und
 * `formatiereGesamtnote` aus `shared/lib/gesamtnote.ts` (Constraint LOGIK).
 *
 * Eine Tabelle, eine Stelle (ADR-0034 Punkt 2): `ZONEN` ist die EINZIGE
 * Quelle für Schlüssel, Untergrenze, Beschriftung und Tokenname — Zeile UND
 * Legende lesen beide von hier. Keine Komponente baut einen Tokennamen aus
 * einem Schlüssel zusammen, sonst findet ein Grep nach dem Tokennamen die
 * Verwendung nicht.
 *
 * Die Zone wird am GANZZAHLIGEN `zehntel` bestimmt (ADR-0037 Punkt 5, löst
 * ADR-0034 Punkt 3 ab) — demselben Wert, den die Anzeige formatiert, nie am
 * formatierten String. Damit stimmt „Zone nach dem angezeigten Wert" für
 * jeden Nenner. Ein Einzelachsenwert geht als `wert x 10` hinein. Belegt
 * durch die erschöpfenden Vitests in `zonen.spec.ts`.
 */
import type { OrtDatensatz } from '../../../persistence/schema'
import { formatiereGesamtnote } from '../../../shared/lib/gesamtnote'

type Bewertungen = OrtDatensatz['bewertungen']

export type ZonenSchluessel = '8' | '8-5' | '9' | '9-5' | '10'

export interface Zone {
  schluessel: ZonenSchluessel
  /** Untergrenze in Zehnteln (80 = 8,0), inklusive — gehört zur jeweiligen Zone. */
  untergrenzeZehntel: number
  beschriftung: string
  /** Wörtlicher CSS-Custom-Property-Name (tokens.css), nie aus `schluessel`
   * zusammengesetzt (ADR-0034 Punkt 2). */
  tokenName: string
}

/** Aufsteigend sortiert nach `untergrenzeZehntel` — `bestimmeZone` verlässt sich
 * darauf (Suche von hinten). */
export const ZONEN: readonly Zone[] = [
  { schluessel: '8', untergrenzeZehntel: 80, beschriftung: '8,0 bis unter 8,5', tokenName: '--color-zone-8' },
  { schluessel: '8-5', untergrenzeZehntel: 85, beschriftung: '8,5 bis unter 9,0', tokenName: '--color-zone-8-5' },
  { schluessel: '9', untergrenzeZehntel: 90, beschriftung: '9,0 bis unter 9,5', tokenName: '--color-zone-9' },
  { schluessel: '9-5', untergrenzeZehntel: 95, beschriftung: '9,5 bis unter 10', tokenName: '--color-zone-9-5' },
  { schluessel: '10', untergrenzeZehntel: 100, beschriftung: 'genau 10', tokenName: '--color-zone-10' },
]

/**
 * Zone eines Werts in Zehnteln — `null` bei `null` oder einem Wert unter der
 * untersten Zonengrenze. Die Untergrenze selbst gehört zur Zone (`>=`,
 * nicht `>`); der Vergleich ist rein ganzzahlig.
 */
export function bestimmeZone(zehntel: number | null): Zone | null {
  if (zehntel === null) return null
  for (let i = ZONEN.length - 1; i >= 0; i -= 1) {
    if (zehntel >= ZONEN[i].untergrenzeZehntel) return ZONEN[i]
  }
  return null
}

export type Hervorhebung = 'schwach' | 'stark' | 'beide' | null

export interface HervorhebungsErgebnis {
  hervorhebung: Hervorhebung
  /** `null`, wenn keine Achse auslöst — sonst je auslösender Achse ein
   * Eintrag, Geschmack zuerst (ADR-0034 Punkt 5). */
  screenreaderText: string | null
}

/**
 * Wörtliche Achsennamen für Screenreader-Text und Legende (Nutzerentscheidung
 * 2026-09-27 zu PO-2026-09-27-003): „Preis-Leistung" MIT Bindestrich —
 * bewusst NICHT dasselbe wie `SORTIER_KRITERIUM_LABEL.preisLeistung`
 * („Preis/Leistung"), gilt ausschließlich hier, keine App-weite
 * Vereinheitlichung.
 */
export const GESCHMACK_NAME = 'Geschmack'
export const PREIS_LEISTUNG_NAME = 'Preis-Leistung'

const HERVORHEBUNGS_SCHWELLE = 9

/**
 * Hervorhebung + Screenreader-Text (ADR-0034 Punkt 5): liest die
 * gespeicherten Achsenwerte DIREKT, unabhängig von Zone, Sortierkriterium
 * und Gruppe (gilt auch in der Gruppe „ohne Wert"). `null` löst nie aus.
 * Reihenfolge fest: Geschmack vor Preis-Leistung.
 */
export function bestimmeHervorhebung(bewertungen: Bewertungen): HervorhebungsErgebnis {
  const geschmack = bewertungen.geschmack.wert
  const preisLeistung = bewertungen.preisLeistung.wert
  const geschmackAktiv = geschmack !== null && geschmack >= HERVORHEBUNGS_SCHWELLE
  const preisLeistungAktiv = preisLeistung !== null && preisLeistung >= HERVORHEBUNGS_SCHWELLE

  let hervorhebung: Hervorhebung = null
  if (geschmackAktiv && preisLeistungAktiv) hervorhebung = 'beide'
  else if (preisLeistungAktiv) hervorhebung = 'stark'
  else if (geschmackAktiv) hervorhebung = 'schwach'

  const teile: string[] = []
  if (geschmackAktiv) teile.push(`${GESCHMACK_NAME} ${formatiereGesamtnote((geschmack as number) * 10)}`)
  if (preisLeistungAktiv) teile.push(`${PREIS_LEISTUNG_NAME} ${formatiereGesamtnote((preisLeistung as number) * 10)}`)

  return { hervorhebung, screenreaderText: teile.length > 0 ? teile.join(', ') : null }
}

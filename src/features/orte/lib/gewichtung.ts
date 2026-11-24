/**
 * Eigene Gewichte (PO-2026-11-24-002, ADR-0037 Punkt 2, design-conventions.md
 * „Gewichtung der Gesamtnote" -> „Eigene"): reine Funktionen, EINZIGER
 * Nutzer ist die Gewichtung der Ortsliste (`useOrteStore`,
 * `GewichtungSheet.vue`) — deshalb hier in `features/orte/lib/`, nicht in
 * `shared/lib/`. Kein Store, kein DOM, kein Router.
 *
 * `setzeGewicht` ist das GATE (Struktur statt Konvention, analog
 * `rundenUndKlemmen`, ADR-0007 Punkt 7): JEDER Eingabepfad (Regler und
 * Zahlenfeld) ändert ein Gewicht nur über den Store-Setter, und der ruft
 * ausschließlich diese Funktion auf. Ein zweiter Pfad ohne dieses Gate
 * kompiliert nicht, weil `eigeneGewichte` im Store nicht anders beschreibbar
 * ist.
 */
import { ACHSEN_KRITERIEN, type AchsenKriterium, type Gewichte } from '../model/ansicht'

export const GEWICHT_MIN = 0
export const GEWICHT_MAX = 10

/** Ergebnis des Gates: die neuen Gewichte und das Signal für die Statuszeile
 * „Mindestens eine Achse muss zählen." */
export interface GewichtErgebnis {
  gewichte: Gewichte
  /** `true`, wenn der Versuch, die letzte Achse über 0 auf 0 zu setzen,
   * abgefangen wurde (das Gewicht bleibt dann auf 1). */
  mussZaehlen: boolean
}

/** Rundet auf eine ganze Zahl und klemmt auf 0–10. */
export function klemmeGewicht(zahl: number): number {
  return Math.min(GEWICHT_MAX, Math.max(GEWICHT_MIN, Math.round(zahl)))
}

/** Die einzige Achse mit Gewicht > 0 — `null`, wenn es keine oder mehrere sind. */
export function einzigeZaehlendeAchse(gewichte: Gewichte): AchsenKriterium | null {
  const zaehlende = ACHSEN_KRITERIEN.filter((achse) => gewichte[achse] > 0)
  return zaehlende.length === 1 ? zaehlende[0]! : null
}

/**
 * Setzt das Gewicht EINER Achse: ganzzahlig, geklemmt auf 0–10; die letzte
 * Achse über 0 bleibt auf mindestens 1 und liefert `mussZaehlen`. Eine keine
 * Zahl (NaN, Infinity) ändert nichts — ein Gewicht ist nie „nicht gesetzt".
 */
export function setzeGewicht(gewichte: Gewichte, achse: AchsenKriterium, roh: number): GewichtErgebnis {
  if (!Number.isFinite(roh)) return { gewichte, mussZaehlen: false }
  let neu = klemmeGewicht(roh)
  let mussZaehlen = false
  if (neu === 0 && einzigeZaehlendeAchse(gewichte) === achse) {
    neu = 1
    mussZaehlen = true
  }
  return { gewichte: { ...gewichte, [achse]: neu }, mussZaehlen }
}

/**
 * Anteil einer Achse in ganzen Prozent (Summe der Gewichte = 100 %). Bei
 * Gewicht 0 entsprechend 0; die gerundeten Anteile müssen sich nicht zu 100
 * summieren. Summe 0 ist nicht erreichbar (das Gate lässt mindestens eine
 * Achse über 0), liefert hier aber 0 statt NaN.
 */
export function anteilInProzent(gewichte: Gewichte, achse: AchsenKriterium): number {
  const summe = ACHSEN_KRITERIEN.reduce((s, name) => s + gewichte[name], 0)
  if (summe <= 0) return 0
  return Math.round((100 * gewichte[achse]) / summe)
}

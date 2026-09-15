/**
 * Gültigkeit wird beim Eingeben hergestellt, nie beim Lesen (ADR-0007 Punkt
 * 7): erst runden (`Math.round`, 7,5 → 8), dann auf 0–10 klemmen. Reine
 * Funktion, damit sie unabhängig von `Bewertungsachse.vue` testbar ist.
 *
 * **Eine Gültigkeitsregel, eine Stelle** (PO-2026-09-13-001, Entscheidung
 * Architekt): Läuft für JEDEN Eingabepfad eines Achsenwertes, auch den
 * nativen `<input type="range">` — dessen Zusage „ganze Zahl 0–10" ist
 * Browserverhalten über einen String (`Number(el.value)`), keine
 * Eigenschaft des Datenmodells. Ein zweiter Pfad ohne dieses Gate machte die
 * Zusicherung zur Konvention statt zur Struktur.
 *
 * Ein geleertes Feld ruft diese Funktion nicht auf — das Leeren führt direkt
 * zu `null` und wird nicht geklemmt (design-conventions.md, „Formulare").
 */
export function rundenUndKlemmen(zahl: number): number {
  return Math.min(10, Math.max(0, Math.round(zahl)))
}

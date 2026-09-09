/**
 * Gültigkeit wird beim Eingeben hergestellt, nie beim Lesen (ADR-0007 Punkt
 * 7): erst runden (`Math.round`, 7,5 → 8), dann auf 0–10 klemmen. Reine
 * Funktion, damit sie unabhängig von `Bewertungsachse.vue` testbar ist, ohne
 * eine Component-Test-Infrastruktur zu benötigen (siehe CLAUDE.md: „das
 * erste Paket mit Testbedarf für Komponentenverhalten richtet das ein" —
 * dieses Paket kommt ohne aus, indem es die eigentliche Regel hier auslagert).
 *
 * Ein geleertes Feld ruft diese Funktion nicht auf — das Leeren führt direkt
 * zu `null` und wird nicht geklemmt (design-conventions.md, „Formulare").
 */
export function rundenUndKlemmen(zahl: number): number {
  return Math.min(10, Math.max(0, Math.round(zahl)))
}

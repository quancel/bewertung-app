/**
 * Ableitung „Ansicht aus der Adresse" (ADR-0019 Punkt 2/7, Constraint TESTS):
 * reine Funktion, kein Router-/Store-Zugriff — `Ortebereich.vue` bleibt die
 * EINZIGE Stelle, die daraus einen Zustand macht, es entsteht kein zweiter
 * Ansichtszustand (kein Flag im Store, keine Anzeigeeinstellung).
 *
 * Der Parameter `ansicht` und sein einziger gültiger Wert `'karte'` sind ab
 * Auslieferung eingefroren wie ein Pfad. Fehlender oder unbekannter Wert
 * ergibt die Listenansicht — OHNE die Adresse zu korrigieren; diese Funktion
 * selbst navigiert nicht, sie liest nur.
 *
 * Auf der Detailadresse (`route.name === 'ort-detail'`) hat der Parameter
 * keine Bedeutung (ADR-0019 Punkt 2) — die Kartenansicht existiert nur ohne
 * offene Detailansicht (ADR-0019 Punkt 6). Deshalb prüft diese Funktion den
 * Routennamen zuerst: nur `'orte'` wertet den Query-Parameter überhaupt aus,
 * jeder andere Routenname (inkl. `'ort-detail'`) liefert immer `'liste'`.
 */
export type OrteAnsicht = 'liste' | 'karte'

export function leiteAnsichtAusAdresse(routenname: unknown, ansichtQuery: unknown): OrteAnsicht {
  if (routenname !== 'orte') return 'liste'
  return ansichtQuery === 'karte' ? 'karte' : 'liste'
}

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

/**
 * Offener Ort der Schnellansicht aus der Adresse (PO-2026-11-24-005,
 * ADR-0039 Punkt 1): der Parameter `ort` hat NUR zusammen mit `ansicht=karte`
 * auf `/orte` eine Bedeutung. Auf der Liste und auf `/orte/:ortId` wird er
 * ignoriert, ohne die Adresse zu korrigieren. Ein leerer oder mehrfach
 * gesetzter Wert (Array) liefert `null`, wie ein unbekannter `ansicht`-Wert.
 * Ob die ID existiert und sichtbar ist, entscheidet nicht diese Funktion
 * (das kann erst nach dem Laden des Stores beurteilt werden).
 */
export function leiteOrtIdAusAdresse(routenname: unknown, ansichtQuery: unknown, ortQuery: unknown): string | null {
  if (leiteAnsichtAusAdresse(routenname, ansichtQuery) !== 'karte') return null
  return typeof ortQuery === 'string' && ortQuery !== '' ? ortQuery : null
}

/**
 * Trägt die Adresse einen `ort`-Parameter, der Bedeutung HÄTTE (Route `orte`
 * mit `ansicht=karte`)? Nur dann darf `Ortebereich.vue` ihn nach dem Laden
 * per `replace` entfernen, wenn er sich nicht auflöst (ADR-0039 Punkt 2).
 */
export function tragtOrtParameterMitBedeutung(routenname: unknown, ansichtQuery: unknown, ortQuery: unknown): boolean {
  return leiteAnsichtAusAdresse(routenname, ansichtQuery) === 'karte' && ortQuery !== undefined
}

/**
 * Reine Ableitungen auf Ort-Feldern (ADR-0008 Punkt 6): Gesamtnote und
 * „N von 4 Achsen". Zustandslos, kein Store- und kein Speicherzugriff.
 * Zwei Nutzer von Anfang an: die Detailansicht des Contexts `bewertungen`
 * und die Ortsliste (Context `orte`) — deshalb hier in `shared/lib/` statt
 * in einem der beiden Feature-Ordner.
 *
 * Typ fließt über `persistence/schema.ts`, nie über einen
 * Feature-zu-Feature-Import (ADR-0008 Punkt 5): `orte` bezieht die Form der
 * Bewertungsfelder aus dem dort zusammengesetzten `OrtDatensatz`, nicht aus
 * `features/bewertungen/model/`.
 */
import type { OrtDatensatz } from '../../persistence/schema'

export type Bewertungen = OrtDatensatz['bewertungen']

const ACHSEN_SCHLUESSEL = ['ambiente', 'zeit', 'geschmack', 'preisLeistung'] as const

/**
 * Gewicht je Achse (ADR-0037 Punkt 3). Der Typ steht hier, damit nichts aus
 * `features/` importiert wird; `features/orte/model/ansicht.ts` bleibt
 * importfrei und liefert eine strukturell kompatible Form.
 */
export interface AchsenGewichte {
  ambiente: number
  zeit: number
  geschmack: number
  preisLeistung: number
}

/**
 * Ergebnis der Gesamtnote (ADR-0037 Punkt 4/5). `zehntel` ist der EINE
 * Rundungsschritt, den Anzeige UND Zone lesen; `roh` ist der ungerundete
 * Wert für Sortierung, Gleichstand und Marker-Vorrang (ADR-0007 Punkt 6).
 * `unbewertet` (keine Achse hat einen Wert) und `ohne-gewicht` (es gibt
 * Werte, aber alle Achsen mit Wert haben Gewicht 0, PO-2026-11-24-002) sind
 * fachlich verschiedene Zustände ohne Note (design-conventions.md
 * „Gewichtung der Gesamtnote") und dürfen nicht zu einem `null` zusammenfallen.
 */
export type GesamtnoteErgebnis =
  | { art: 'wert'; roh: number; zehntel: number }
  | { art: 'unbewertet' }
  | { art: 'ohne-gewicht' }

/**
 * Gewichtete Gesamtnote: Summe(Gewicht x Wert) / Summe(Gewicht) über die
 * Achsen mit Wert. `null` fällt samt Gewicht heraus, 0 ist ein Wert. Die
 * Gewichte sind ein PFLICHTPARAMETER ohne Default (ADR-0037 Punkt 3): Ein
 * Aufrufer ohne Gewichte kompiliert nicht. Gerundet wird genau einmal,
 * ganzzahlig: `zehntel = round(10 x Zähler / Nenner)`, halbe Zehntel auf.
 */
export function berechneGesamtnote(bewertungen: Bewertungen, gewichte: AchsenGewichte): GesamtnoteErgebnis {
  let zaehler = 0
  let nenner = 0
  let achsenMitWert = 0
  for (const achse of ACHSEN_SCHLUESSEL) {
    const wert = bewertungen[achse].wert
    if (wert === null) continue
    achsenMitWert += 1
    zaehler += gewichte[achse] * wert
    nenner += gewichte[achse]
  }

  if (achsenMitWert === 0) return { art: 'unbewertet' }
  if (nenner <= 0) return { art: 'ohne-gewicht' }

  // Ganzzahliges Aufrunden halber Zehntel: floor((20 x Z + N) / (2 x N)).
  const zehntel = Math.floor((20 * zaehler + nenner) / (2 * nenner))
  return { art: 'wert', roh: zaehler / nenner, zehntel }
}

/** Anzahl der Achsen mit gesetztem Wert (0 zählt, `null` nicht). */
export function zaehleAusgefuellteAchsen(bewertungen: Bewertungen): number {
  return ACHSEN_SCHLUESSEL.filter((achse) => bewertungen[achse].wert !== null).length
}

/**
 * Formatiert `zehntel` (ganzzahlig, ADR-0037 Punkt 5) auf genau eine
 * Nachkommastelle mit Komma — auch bei einem glatten Wert („8,0", nicht
 * „8"). Ein Einzelachsenwert geht als `wert x 10` hinein. Rein ganzzahlig
 * gebaut, kein Rückweg von einem String.
 */
export function formatiereGesamtnote(zehntel: number): string {
  return `${Math.floor(zehntel / 10)},${zehntel % 10}`
}

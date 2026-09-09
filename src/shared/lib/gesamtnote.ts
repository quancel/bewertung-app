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
 * Ungewichteter Mittelwert der ausgefüllten Achsen — `null`, wenn keine
 * Achse ausgefüllt ist. Kein stiller Ersatzwert 0 (ADR-0007 Punkt 5/6):
 * gerechnet wird ungerundet, gerundet wird ausschließlich zur Anzeige in
 * `formatiereGesamtnote`.
 */
export function berechneGesamtnote(bewertungen: Bewertungen): number | null {
  const gesetzteWerte = ACHSEN_SCHLUESSEL.map((achse) => bewertungen[achse].wert).filter(
    (wert): wert is number => wert !== null,
  )

  if (gesetzteWerte.length === 0) return null

  const summe = gesetzteWerte.reduce((akkumulator, wert) => akkumulator + wert, 0)
  return summe / gesetzteWerte.length
}

/** Anzahl der Achsen mit gesetztem Wert (0 zählt, `null` nicht). */
export function zaehleAusgefuellteAchsen(bewertungen: Bewertungen): number {
  return ACHSEN_SCHLUESSEL.filter((achse) => bewertungen[achse].wert !== null).length
}

const gesamtnoteFormatierer = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Formatiert eine bereits berechnete, ungerundete Gesamtnote auf genau eine
 * Nachkommastelle mit Komma — auch bei einem glatten Wert („8,0", nicht
 * „8"). Getrennt von `berechneGesamtnote`: Ein gerundeter Wert wird nie
 * zurückgelesen oder verglichen (ADR-0007 Punkt 6).
 */
export function formatiereGesamtnote(gesamtnote: number): string {
  return gesamtnoteFormatierer.format(gesamtnote)
}

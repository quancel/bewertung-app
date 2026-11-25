/**
 * Reines Typmodul (ADR-0019 Punkt 8, code-conventions.md „model/*.types.ts
 * importiert nichts"): der Kartenzweig ist ein rein präsentationaler
 * Context ohne Store und ohne Zugriff auf `persistence/` — dieser Typ
 * importiert deshalb bewusst NICHT `OrtDatensatz` aus
 * `src/persistence/schema.ts`. Eine spätere Formatänderung am Ort-Datensatz
 * berührt `karte` dadurch nicht; `Ortebereich.vue` (Context `orte`) baut die
 * Werte strukturell kompatibel zusammen, ohne dass `karte` den Quelltyp
 * kennen muss.
 *
 * Die Felder, die diese Fläche tatsächlich braucht: eine Kennung
 * zum Navigieren, eine Bezeichnung zum Beschriften, und die beiden
 * Koordinaten — hier bewusst NICHT nullable, weil ein `KartenOrt` per
 * Definition bereits die Ausgabe der Koordinaten-Filterung ist
 * (`lib/koordinatenFilter.ts`).
 */
export interface KartenOrtBasis {
  id: string
  bezeichnung: string
  breite: number
  laenge: number
}

/**
 * Warum ein Marker keine Gesamtnote zeigt (PO-2026-11-24-004, ADR-0037):
 * `unbewertet` = keine Achse hat einen Wert, `ohne-gewicht` = es gibt Werte,
 * aber bei der gewählten Gewichtung zählt keiner davon. Nur Beschriftung —
 * der Punkt sieht in beiden Fällen gleich aus.
 */
export type KartenOrtOhneNoteGrund = 'unbewertet' | 'ohne-gewicht'

/**
 * Nur primitive Felder zur Note: `karte` rechnet und formatiert nichts
 * (ADR-0037 Punkt 7) — `Ortebereich.vue` liefert denselben Wert wie die
 * Ortszeile fertig formatiert.
 */
export interface KartenOrtNote {
  /** Fertig formatierter Notentext („8,7"), `null` ohne Gesamtnote. */
  notentext: string | null
  /** Ungerundeter Wert nur für den Vorrang bei Etikett-Kollisionen. */
  rohwert: number | null
  /** Grund ohne Note; `null`, wenn eine Note vorliegt. */
  ohneNoteGrund: KartenOrtOhneNoteGrund | null
}

export interface KartenOrt extends KartenOrtBasis, KartenOrtNote {}

/**
 * Von unten verdeckter Bereich der Kartenfläche (PO-2026-11-24-005, ADR-0039
 * Punkt 5): eine nicht modale Überlagerung (die Schnellansicht), die `karte`
 * nicht kennt. Nur Maße in px relativ zum Kartencontainer, unten bündig: die
 * Höhe, und der horizontale Bereich (`links`/`rechts`), den die Überlagerung
 * belegt — ab `md` ist sie schmaler als die Karte, ein Marker daneben ist nicht
 * verdeckt. `null` = nichts verdeckt.
 */
export interface KartenVerdeckung {
  hoehe: number
  links: number
  rechts: number
}

/**
 * Auftrag, die Karte minimal zu verschieben, damit ein Marker über einer
 * Überlagerung liegt. Ein NEUES Objekt je Nutzeraktion (Öffnen, Wechsel) — die
 * Karte reagiert auf den Wechsel des Objekts, nie auf den Zustand der Adresse
 * (Rückkehr über den Verlauf verschiebt nicht, ADR-0039 Punkt 5).
 */
export interface KartenPanAuftrag {
  ortId: string
}

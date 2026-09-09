/**
 * Reines Typmodul (code-conventions.md: `model/*.types.ts` importiert
 * nichts) — nur der Anteil des Contexts `bewertungen` am Ort-Datensatz.
 * `src/persistence/schema.ts` setzt daraus zusammen mit `OrtStammdaten` den
 * kanonischen `OrtDatensatz`; Stores und Views arbeiten mit jenem Typ, nicht
 * direkt mit diesem hier (ADR-0008).
 */

/**
 * Eine einzelne Bewertungsachse. `wert: null` ist der ausdrücklich
 * gespeicherte Zustand „nicht bewertet" (ADR-0007) — fachlich etwas anderes
 * als der gültige Wert `0`. Wert und Kommentar sind Geschwister, nicht
 * verschachtelt: Zurücksetzen ändert ausschließlich `wert` und lässt
 * `kommentar` unberührt. Ein geleerter Kommentar wird `null`, nie `""`.
 */
export interface Achse {
  wert: number | null
  kommentar: string | null
}

/**
 * Vier feste, benannte Achsen als Objekt, nicht als Liste (ADR-0007 Punkt
 * 3) — eine künftige fünfte Achse wäre ein additives Feld mit eigenem
 * Migrationsschritt, keine Positionsverschiebung.
 */
export interface Bewertungen {
  ambiente: Achse
  zeit: Achse
  geschmack: Achse
  preisLeistung: Achse
}

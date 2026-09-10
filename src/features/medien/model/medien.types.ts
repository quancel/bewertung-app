/**
 * Reines Typmodul (code-conventions.md: `model/*.types.ts` importiert
 * nichts). Anders als `orte`/`bewertungen`/`tags` ist `Bild` kein Anteil des
 * Ort-Datensatzes, sondern der vollständige Datensatz des eigenen Object
 * Stores `bilder` (ADR-0016 Punkt 1/2): kein Rückverweis vom Ort, die
 * Zuordnung steht ausschließlich als `ortId` hier.
 *
 * `src/persistence/schema.ts` übernimmt diesen Typ unter dem Namen
 * `BildDatensatz` (gleiches Muster wie `OrtDatensatz`), ohne ihn mit
 * anderen Contexts zusammenzusetzen — `medien` hat keine Geschwister-Anteile
 * an diesem Datensatz.
 */

/**
 * `hinzugefuegtAm` (ISO-8601) bestimmt die Reihenfolge im Raster, nicht die
 * Einfügereihenfolge des Stores (ADR-0016 Punkt 2). `breite`/`hoehe` sind die
 * Maße NACH der Verkleinerung, beim Verkleinern ohnehin ermittelt — erspart
 * dem Raster, jedes Bild vor der Darstellung zu dekodieren. `blob` liegt
 * nativ vor, nie als Base64 (ADR-0004 Punkt 6).
 */
export interface Bild {
  id: string
  ortId: string
  hinzugefuegtAm: string
  mimeTyp: string
  breite: number
  hoehe: number
  blob: Blob
}

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
 * Nur die drei Felder, die diese Fläche tatsächlich braucht: eine Kennung
 * zum Navigieren, eine Bezeichnung zum Beschriften, und die beiden
 * Koordinaten — hier bewusst NICHT nullable, weil ein `KartenOrt` per
 * Definition bereits die Ausgabe der Koordinaten-Filterung ist
 * (`lib/koordinatenFilter.ts`).
 */
export interface KartenOrt {
  id: string
  bezeichnung: string
  breite: number
  laenge: number
}

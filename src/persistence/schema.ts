/**
 * Formatversion und kanonischer Bestandstyp (ADR-0003, ADR-0004).
 *
 * `SCHEMA_VERSION` beschreibt den **Inhalt** des Bestands (Gerätespeicher
 * und Exportdatei) — nicht die IndexedDB-Datenbankversion aus `db.ts`, die
 * ausschließlich die Struktur (Object Stores/Indizes) beschreibt. Beide
 * Zahlen dürfen nie vermischt werden.
 */
import type { OrtStammdaten } from '../features/orte/model/orte.types'

export const SCHEMA_VERSION = 1

/**
 * Der kanonische, zusammengesetzte Ort-Datensatz. In v1 deckungsgleich mit
 * `OrtStammdaten`; künftige Pakete (-002 Bewertungen, -004 Tags) erweitern
 * diese Zusammensetzung um ihren Anteil, ohne dass `orte` aus deren
 * Feature-Ordnern importieren muss (ADR-0008).
 */
export type OrtDatensatz = OrtStammdaten

/** Einziger Datensatz im Object Store `meta`, Schlüssel `bestand`. */
export interface BestandMeta {
  id: 'bestand'
  schemaVersion: number
}

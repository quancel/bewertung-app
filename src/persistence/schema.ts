/**
 * Formatversion und kanonischer Bestandstyp (ADR-0003, ADR-0004).
 *
 * `SCHEMA_VERSION` beschreibt den **Inhalt** des Bestands (Gerätespeicher
 * und Exportdatei) — nicht die IndexedDB-Datenbankversion aus `db.ts`, die
 * ausschließlich die Struktur (Object Stores/Indizes) beschreibt. Beide
 * Zahlen dürfen nie vermischt werden.
 */
import type { OrtStammdaten } from '../features/orte/model/orte.types'
import type { Bewertungen } from '../features/bewertungen/model/bewertungen.types'
import type { Tags } from '../features/tags/model/tags.types'

export const SCHEMA_VERSION = 3

/**
 * Der kanonische, zusammengesetzte Ort-Datensatz. Ab v2 (PO-2026-09-07-002,
 * ADR-0007/ADR-0008) um `bewertungen` erweitert, ab v3 (PO-2026-09-07-004,
 * ADR-0014) um `tags`; künftige Pakete (-005 Bilder) erweitern diese
 * Zusammensetzung weiter um ihren Anteil, ohne dass `orte` aus deren
 * Feature-Ordnern importieren muss.
 */
export type OrtDatensatz = OrtStammdaten & {
  bewertungen: Bewertungen
  tags: Tags
}

/** Einziger Datensatz im Object Store `meta`, Schlüssel `bestand`. */
export interface BestandMeta {
  id: 'bestand'
  schemaVersion: number
}

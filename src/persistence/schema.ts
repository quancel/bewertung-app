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
import type { Bild } from '../features/medien/model/medien.types'

export const SCHEMA_VERSION = 4

/**
 * Der kanonische, zusammengesetzte Ort-Datensatz. Ab v2 (PO-2026-09-07-002,
 * ADR-0007/ADR-0008) um `bewertungen` erweitert, ab v3 (PO-2026-09-07-004,
 * ADR-0014) um `tags`. **Kein Bildfeld** (ADR-0016 Punkt 1): Bilder liegen
 * im eigenen Object Store `bilder`, zugeordnet über `ortId` im Bild-
 * Datensatz, nicht über eine Liste hier.
 */
export type OrtDatensatz = OrtStammdaten & {
  bewertungen: Bewertungen
  tags: Tags
}

/**
 * Der kanonische Bild-Datensatz (ab v4, PO-2026-09-07-005, ADR-0016). Anders
 * als `OrtDatensatz` keine Zusammensetzung aus mehreren Contexts — `medien`
 * ist der einzige Besitzer.
 */
export type BildDatensatz = Bild

/** Einziger Datensatz im Object Store `meta`, Schlüssel `bestand`. */
export interface BestandMeta {
  id: 'bestand'
  schemaVersion: number
}

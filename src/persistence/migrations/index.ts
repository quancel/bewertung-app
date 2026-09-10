/**
 * Migrationskette (ADR-0003). Ab hier existiert die Kette, auch wenn sie in
 * v1 noch keinen Schritt enthält — nachträglich eingeführt hilft sie
 * bereits erzeugten Beständen nicht mehr.
 *
 * Ein Migrationsschritt ist eine reine Funktion `(bestand) => bestand`,
 * kennt keine Stores, kein UI, keinen Speicher, und importiert nichts aus
 * `../schema` — er deklariert seine Ein-/Ausgangsform lokal (code-
 * conventions.md), damit eine spätere Schema-Änderung die Bedeutung eines
 * bereits veröffentlichten Schrittes nicht rückwirkend verändert.
 *
 * `RohBestand` ist die Form, in der sowohl der Gerätespeicher (zusammengesetzt
 * aus `meta` + allen Datensätzen aus `orte`) als auch eine Exportdatei
 * (-009) durch dieselbe Kette laufen — es gibt keinen zweiten Migrationspfad.
 */
import { SCHEMA_VERSION } from '../schema'
import { schritt002Bewertungen } from './002-bewertungen'
import { schritt003Tags } from './003-tags'

export interface RohBestand {
  schemaVersion: number
  orte: unknown[]
}

export interface Migrationsschritt {
  /** Dateinummer = Zielversion (code-conventions.md), z. B. 2 für 002-*.ts. */
  zielVersion: number
  migriere: (bestand: RohBestand) => RohBestand
}

/**
 * Geordnete Schrittliste. v1 hatte keine Vorgängerversion — der erste
 * Schritt (v1 → v2, PO-2026-09-07-002, Bewertungsachsen) steht hier vorne,
 * gefolgt von v2 → v3 (PO-2026-09-07-004, Tags). Künftige Schritte werden
 * hinten angehängt.
 */
export const migrationsschritte: Migrationsschritt[] = [schritt002Bewertungen, schritt003Tags]

export type Migrationsergebnis =
  | { status: 'ok'; bestand: RohBestand }
  | { status: 'version_zu_neu' }

/**
 * Wendet die Kette auf einen `RohBestand` an.
 * - `schemaVersion === SCHEMA_VERSION` → Identität, kein Schritt läuft.
 * - `schemaVersion > SCHEMA_VERSION` → ablehnen, nichts verändern.
 * - `schemaVersion < SCHEMA_VERSION` → Schritte vN → vN+1 → … anwenden.
 */
export function wendeMigrationsketteAn(
  rohBestand: RohBestand,
): Migrationsergebnis {
  if (rohBestand.schemaVersion > SCHEMA_VERSION) {
    return { status: 'version_zu_neu' }
  }

  let aktuellerBestand = rohBestand

  for (const schritt of migrationsschritte) {
    if (schritt.zielVersion <= aktuellerBestand.schemaVersion) continue
    aktuellerBestand = {
      ...schritt.migriere(aktuellerBestand),
      schemaVersion: schritt.zielVersion,
    }
  }

  return { status: 'ok', bestand: aktuellerBestand }
}

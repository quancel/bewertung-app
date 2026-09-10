/**
 * v2 → v3 (PO-2026-09-07-004, ADR-0014 Punkt 6): fügt jedem vorhandenen Ort
 * das Tag-Feld **aktiv** hinzu — `tags: []`, nicht bloß weggelassen. Nur so
 * ist „keine Tags" nach der Migration im Bestand vorhanden statt bloß
 * abwesend (kein `?? []` beim Lesen, ADR-0005).
 *
 * Reine Funktion ohne Zugriff auf Stores, UI, Netz oder Speicher (ADR-0003
 * Punkt 3). Importiert nichts aus `../schema` und deklariert Ein-/
 * Ausgangsform lokal, nur für die Felder, die sie anfasst
 * (code-conventions.md) — eine spätere Schema-Änderung darf die Bedeutung
 * dieses veröffentlichten Schrittes nicht rückwirkend umziehen.
 */
import type { Migrationsschritt } from './index'

interface BestandV2 {
  schemaVersion: number
  orte: unknown[]
}

export const schritt003Tags: Migrationsschritt = {
  zielVersion: 3,
  migriere(bestand: BestandV2): BestandV2 {
    return {
      ...bestand,
      orte: bestand.orte.map((ort) => ({
        ...(ort as Record<string, unknown>),
        tags: [],
      })),
    }
  },
}

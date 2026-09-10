/**
 * v3 → v4 (PO-2026-09-07-005, ADR-0016 Punkt 4): fügt dem Bestand das
 * Bilder-Feld **aktiv** hinzu — `bilder: []`, nicht bloß weggelassen. Nur so
 * ist „keine Bilder" nach der Migration im Bestand vorhanden statt bloß
 * abwesend (kein `?? []` beim Lesen, ADR-0005), dieselbe Begründung wie bei
 * `tags: []` in Schritt 003.
 *
 * Anders als 002/003 hängt dieses Feld nicht an jedem einzelnen Ort, sondern
 * liegt einmal auf Bestandsebene (ADR-0016 Punkt 1: kein Rückverweis vom Ort
 * auf seine Bilder). Ein Bestand vor -005 hatte den Object Store `bilder`
 * noch gar nicht — hier gibt es also nichts weiterzureichen, nur aktiv
 * anzulegen.
 *
 * Reine Funktion ohne Zugriff auf Stores, UI, Netz oder Speicher (ADR-0003
 * Punkt 3) und ohne jeden Binärinhalt anzufassen (ADR-0016 Punkt 5).
 * Importiert nichts aus `../schema` und deklariert Ein-/Ausgangsform lokal,
 * nur für die Felder, die sie anfasst (code-conventions.md) — eine spätere
 * Schema-Änderung darf die Bedeutung dieses veröffentlichten Schrittes nicht
 * rückwirkend umziehen.
 */
import type { Migrationsschritt } from './index'

interface BestandV3 {
  schemaVersion: number
  orte: unknown[]
}

interface BestandV4 extends BestandV3 {
  bilder: unknown[]
}

export const schritt004Bilder: Migrationsschritt = {
  zielVersion: 4,
  migriere(bestand: BestandV3): BestandV4 {
    return {
      ...bestand,
      bilder: [],
    }
  },
}

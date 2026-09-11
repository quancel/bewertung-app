/**
 * v3 → v4 (PO-2026-09-07-005, ADR-0016 Punkt 4): fügt dem Bestand das
 * Bilder-Feld **aktiv** hinzu — nie bloß weggelassen. Nur so ist „keine
 * Bilder" nach der Migration im Bestand vorhanden statt bloß abwesend (kein
 * `?? []` beim LESEN, ADR-0005), dieselbe Begründung wie bei `tags: []` in
 * Schritt 003. Reicht ein bereits vorhandenes `bilder`-Feld unverändert
 * durch, statt es zu verwerfen — ein v3-Bestand hat dieses Feld nie (der
 * Object Store `bilder` entsteht erst mit dem Struktur-Upgrade zu -005), der
 * Fall ist heute unerreichbar, aber ein Migrationsschritt darf grundsätzlich
 * keine Daten verwerfen, die er nicht selbst kennt (ADR-0003: „jeder je
 * erzeugte Bestand bleibt lesbar").
 *
 * Anders als 002/003 hängt dieses Feld nicht an jedem einzelnen Ort, sondern
 * liegt einmal auf Bestandsebene (ADR-0016 Punkt 1: kein Rückverweis vom Ort
 * auf seine Bilder).
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
  bilder?: unknown[]
}

interface BestandV4 extends BestandV3 {
  bilder: unknown[]
}

export const schritt004Bilder: Migrationsschritt = {
  zielVersion: 4,
  migriere(bestand: BestandV3): BestandV4 {
    return {
      ...bestand,
      bilder: bestand.bilder ?? [],
    }
  },
}

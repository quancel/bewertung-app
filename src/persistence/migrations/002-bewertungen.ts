/**
 * v1 → v2 (PO-2026-09-07-002, ADR-0007): fügt jedem vorhandenen Ort die
 * vier Bewertungsachsen **aktiv** hinzu — `{ wert: null, kommentar: null }`
 * je Achse, nicht bloß weggelassen. Nur so ist „nicht bewertet" nach der
 * Migration im Bestand vorhanden statt bloß abwesend.
 *
 * Reine Funktion ohne Zugriff auf Stores, UI, Netz oder Speicher (ADR-0003
 * Punkt 3). Importiert nichts aus `../schema` und deklariert Ein-/
 * Ausgangsform lokal, nur für die Felder, die sie anfasst
 * (code-conventions.md) — eine spätere Schema-Änderung darf die Bedeutung
 * dieses veröffentlichten Schrittes nicht rückwirkend umziehen.
 */
import type { Migrationsschritt } from './index'

interface AchseV2 {
  wert: number | null
  kommentar: string | null
}

interface BestandV1 {
  schemaVersion: number
  orte: unknown[]
}

function leereBewertungenV2(): {
  ambiente: AchseV2
  zeit: AchseV2
  geschmack: AchseV2
  preisLeistung: AchseV2
} {
  const leereAchse = (): AchseV2 => ({ wert: null, kommentar: null })
  return {
    ambiente: leereAchse(),
    zeit: leereAchse(),
    geschmack: leereAchse(),
    preisLeistung: leereAchse(),
  }
}

export const schritt002Bewertungen: Migrationsschritt = {
  zielVersion: 2,
  migriere(bestand: BestandV1): BestandV1 {
    return {
      ...bestand,
      orte: bestand.orte.map((ort) => ({
        ...(ort as Record<string, unknown>),
        bewertungen: leereBewertungenV2(),
      })),
    }
  },
}

/**
 * v4 → v5 (PO-2026-09-27-002, ADR-0007-Muster): fügt jedem vorhandenen Ort
 * das Anfangsnotiz-Feld **aktiv** hinzu — `anfangsnotiz: null`, nicht bloß
 * weggelassen. Nur so ist „keine Anfangsnotiz" nach der Migration im Bestand
 * vorhanden statt bloß abwesend (kein `?? null`/`?? ''` beim Lesen, ADR-0005).
 * Ein bereits vorhandenes Feld wird unverändert durchgereicht, nie verworfen
 * (ADR-0003: ein Migrationsschritt verwirft keine Daten, die er nicht kennt —
 * der Fall ist heute unerreichbar, da ein v4-Bestand dieses Feld nie trägt,
 * dieselbe Begründung wie in 004-bilder.ts).
 *
 * Reine Funktion ohne Zugriff auf Stores, UI, Netz oder Speicher (ADR-0003
 * Punkt 3). Importiert nichts aus `../schema` und deklariert Ein-/
 * Ausgangsform lokal, nur für die Felder, die sie anfasst
 * (code-conventions.md) — eine spätere Schema-Änderung darf die Bedeutung
 * dieses veröffentlichten Schrittes nicht rückwirkend umziehen.
 */
import type { Migrationsschritt } from './index'

interface BestandV4 {
  schemaVersion: number
  orte: unknown[]
}

export const schritt005Anfangsnotiz: Migrationsschritt = {
  zielVersion: 5,
  migriere(bestand: BestandV4): BestandV4 {
    return {
      ...bestand,
      orte: bestand.orte.map((ort) => {
        const bisheriger = ort as Record<string, unknown>
        return {
          ...bisheriger,
          anfangsnotiz: 'anfangsnotiz' in bisheriger ? bisheriger.anfangsnotiz : null,
        }
      }),
    }
  },
}

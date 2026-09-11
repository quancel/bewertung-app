/**
 * Koordinaten-Filter (ADR-0019 Punkt 9, PO-2026-09-07-006): reine Funktion,
 * kein Store-/Speicherzugriff — Eingabe ist absichtlich eine strukturell
 * kompatible, MINIMALE Form statt eines Imports von `OrtDatensatz`
 * (`persistence/schema.ts`) oder eines Typs aus `features/orte/` — `karte`
 * importiert nichts aus `orte` (ADR-0019 Punkt 8). `Ortebereich.vue` ruft
 * diese Funktion mit `store.orteGefiltert` auf; TypeScripts strukturelle
 * Typisierung genügt, ein zusätzlicher Typimport ist dafür nicht nötig.
 *
 * `breite !== null && laenge !== null` — KEIN Falsy-Test (`!ort.breite`):
 * 0 ist am Äquator und am Nullmeridian eine gültige, gesetzte Koordinate
 * (Constraint DATENAUSWAHL, ADR-0007-Muster).
 */
import type { KartenOrt } from '../model/karte.types'

interface OrtMitOptionalenKoordinaten {
  id: string
  bezeichnung: string
  breite: number | null
  laenge: number | null
}

export function filtereOrteMitKoordinaten(
  orte: readonly OrtMitOptionalenKoordinaten[],
): KartenOrt[] {
  const ergebnis: KartenOrt[] = []
  for (const ort of orte) {
    if (ort.breite !== null && ort.laenge !== null) {
      ergebnis.push({ id: ort.id, bezeichnung: ort.bezeichnung, breite: ort.breite, laenge: ort.laenge })
    }
  }
  return ergebnis
}

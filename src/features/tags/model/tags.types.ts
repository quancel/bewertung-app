/**
 * Reines Typmodul (code-conventions.md: `model/*.types.ts` importiert
 * nichts) — nur der Anteil des Contexts `tags` am Ort-Datensatz (ADR-0014
 * Punkt 1). `src/persistence/schema.ts` setzt daraus den kanonischen
 * `OrtDatensatz` zusammen; kein Import von hier nach `features/orte/`
 * (ADR-0014, code-conventions.md „Ein Feature importiert nicht aus einem
 * anderen Feature").
 *
 * Kein eigener Object Store, kein eigenes Tag-Register (ADR-0014 Punkt 1/2):
 * `Tags` ist nur die Form des Feldes im Ort-Datensatz. Reihenfolge trägt
 * keine Bedeutung (ADR-0014 Punkt 5) — angezeigt wird überall alphabetisch
 * über `Intl.Collator('de')` (siehe `shared/lib/tagfilter.ts`).
 */
export type Tags = string[]

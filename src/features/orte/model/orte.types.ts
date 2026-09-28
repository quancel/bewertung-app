/**
 * Reines Typmodul (code-conventions.md: `model/*.types.ts` importiert
 * nichts) — nur der Anteil des Contexts `orte` am Ort-Datensatz.
 * `src/persistence/schema.ts` setzt daraus den kanonischen `OrtDatensatz`
 * zusammen; Stores und Views arbeiten mit jenem Typ, nicht mit diesem hier
 * direkt (ADR-0008).
 */

/**
 * Stammdaten eines Ortes. `bezeichnung` ist das einzige Pflichtfeld beim
 * Anlegen; alle anderen Felder dürfen leer bleiben.
 *
 * Leere Werte sind ausdrücklich `null`, nie ein fehlendes Feld und nie ein
 * stiller Ersatzwert wie `""` oder `0` (ADR-0007-Muster, hier erstmals für
 * Adresse und Koordinaten angewandt: `0` ist am Äquator/Nullmeridian ein
 * gültiger, gesetzter Koordinatenwert und muss von „nicht gesetzt"
 * unterscheidbar bleiben).
 */
export interface OrtStammdaten {
  id: string
  bezeichnung: string
  adresse: string | null
  breite: number | null
  laenge: number | null
  /**
   * Freier Kurztext ohne Zeilenumbruch, höchstens
   * `ANFANGSNOTIZ_MAX_ZEICHEN` (100) UTF-16-Codeeinheiten
   * (`features/orte/lib/anfangsnotiz.ts`, PO-2026-09-27-002). Leer ist
   * ausdrücklich `null`, nie `""` (ADR-0007-Muster). Ersetzt die Adresse als
   * Sekundärzeile der Ortsliste, sobald gesetzt (design-conventions.md
   * „Ortszeile: Sekundärzeile (Adresse/Anfangsnotiz)").
   */
  anfangsnotiz: string | null
  /** ISO-8601, bei jeder inhaltlichen Änderung neu gesetzt. */
  geaendertAm: string
}

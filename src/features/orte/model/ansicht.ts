/**
 * Anzeigeeinstellung „Sortierung der Ortsliste" (ADR-0006, ADR-0009): Typ,
 * Voreinstellung und Prüffunktion an genau einer Stelle — importiert nichts
 * (code-conventions.md, „Neue Anzeigeeinstellung"). Gelesen/geschrieben wird
 * über `persistence/einstellungen-repository.ts` unter dem Schlüssel
 * `orte.sortierung` (ADR-0009 Punkt 3); diese Datei kennt die
 * Persistenzschicht nicht.
 *
 * Zentrale Quelle auch für die Kriterien-Listen und -Labels, damit
 * `shared/lib/sortierung.ts`, `Werkzeugleiste.vue` und `Ortebereich.vue`
 * sie nicht je einzeln duplizieren.
 */

/** Die vier Bewertungsachsen als Sortierkriterium (Gruppe „Einzelachse" im
 * Sortier-Sheet, design_notes PO-2026-09-07-003). */
export type AchsenKriterium = 'ambiente' | 'zeit' | 'geschmack' | 'preisLeistung'

/** Gruppe „Allgemein" im Sortier-Sheet. */
export type AllgemeinKriterium = 'bezeichnung' | 'geaendertAm' | 'gesamtnote'

export type SortierKriterium = AllgemeinKriterium | AchsenKriterium

export type SortierRichtung = 'aufsteigend' | 'absteigend'

export interface OrteSortierung {
  kriterium: SortierKriterium
  richtung: SortierRichtung
}

export const ALLGEMEIN_KRITERIEN: readonly AllgemeinKriterium[] = [
  'bezeichnung',
  'geaendertAm',
  'gesamtnote',
]

export const ACHSEN_KRITERIEN: readonly AchsenKriterium[] = [
  'ambiente',
  'zeit',
  'geschmack',
  'preisLeistung',
]

const GUELTIGE_KRITERIEN: readonly SortierKriterium[] = [...ALLGEMEIN_KRITERIEN, ...ACHSEN_KRITERIEN]
const GUELTIGE_RICHTUNGEN: readonly SortierRichtung[] = ['aufsteigend', 'absteigend']

export const SORTIER_KRITERIUM_LABEL: Record<SortierKriterium, string> = {
  bezeichnung: 'Bezeichnung',
  geaendertAm: 'Zuletzt geändert',
  gesamtnote: 'Gesamtnote',
  ambiente: 'Ambiente',
  zeit: 'Zeit (Wartezeit)',
  geschmack: 'Geschmack',
  preisLeistung: 'Preis/Leistung',
}

/**
 * Voreinstellung (Nutzerentscheidung 2026-09-09, GESETZT): Bezeichnung
 * aufsteigend (A→Z) — ein Kriterium, für das jeder Ort einen Wert hat
 * (ADR-0009 Punkt 7), nie Gesamtnote und nie eine Einzelachse. Hält die
 * Liste beim Inline-Bearbeiten ruhig.
 */
export const ORTE_SORTIERUNG_VOREINSTELLUNG: OrteSortierung = {
  kriterium: 'bezeichnung',
  richtung: 'aufsteigend',
}

/**
 * Anfangsrichtung beim erstmaligen Wechsel zu einem Kriterium
 * (design_notes PO-2026-09-07-003): Bezeichnung A→Z, Zuletzt geändert
 * neueste zuerst, Gesamtnote/Achsen höchster Wert zuerst — danach frei
 * umschaltbar. Genau EIN Paar (Kriterium, Richtung) wird gespeichert, kein
 * Richtungsgedächtnis je Kriterium.
 */
export const SORTIER_ANFANGSRICHTUNG: Record<SortierKriterium, SortierRichtung> = {
  bezeichnung: 'aufsteigend',
  geaendertAm: 'absteigend',
  gesamtnote: 'absteigend',
  ambiente: 'absteigend',
  zeit: 'absteigend',
  geschmack: 'absteigend',
  preisLeistung: 'absteigend',
}

/**
 * Prüffunktion (ADR-0009 Punkt 5, ADR-0006 Punkt 3/4): Ein fehlender,
 * unbekannter oder ungültiger gespeicherter Wert führt zur Voreinstellung —
 * still, ohne Meldung, ohne Rückfrage. Das ist die ausdrückliche Ausnahme
 * von „kein stiller Ersatzwert beim Lesen" und gilt ausschließlich für den
 * Object Store `einstellungen`, nie für den Bestand (ADR-0005/ADR-0007
 * bleiben dort unverändert in Kraft).
 */
export function istGueltigeOrteSortierung(wert: unknown): wert is OrteSortierung {
  if (typeof wert !== 'object' || wert === null) return false
  const kandidat = wert as Record<string, unknown>
  return (
    GUELTIGE_KRITERIEN.includes(kandidat.kriterium as SortierKriterium) &&
    GUELTIGE_RICHTUNGEN.includes(kandidat.richtung as SortierRichtung)
  )
}

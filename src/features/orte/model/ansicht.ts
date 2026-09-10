/**
 * Anzeigeeinstellungen der Ortsliste (ADR-0006, ADR-0009): Typ,
 * Voreinstellung und Prüffunktion an genau einer Stelle je Einstellung —
 * importiert nichts (code-conventions.md, „Neue Anzeigeeinstellung").
 * Gelesen/geschrieben wird über `persistence/einstellungen-repository.ts`
 * unter Schlüsseln mit Context-Präfix (`orte.sortierung`, `orte.tagfilter`,
 * ADR-0009 Punkt 3); diese Datei kennt die Persistenzschicht nicht.
 *
 * Zentrale Quelle auch für die Kriterien-Listen und -Labels, damit
 * `shared/lib/sortierung.ts`, `Werkzeugleiste.vue` und `Ortebereich.vue`
 * sie nicht je einzeln duplizieren.
 *
 * Der Tag-Filter (PO-2026-09-07-004, ADR-0009/ADR-0014) gehört ebenfalls
 * hierher: „zuständig" im Sinne von ADR-0006 Punkt 4 ist der Context, dem
 * die konfigurierte ANSICHT gehört (`orte`), nicht der Context, der die
 * Bedeutung des Tags trägt (`tags`). Persistiert wird ausschließlich die
 * UND/ODER-Verknüpfung (`OrteTagfilterEinstellung`) — die aktive
 * Tag-Auswahl ist Ansichtszustand ohne eigene Persistenz und lebt direkt in
 * `useOrteStore` (Nutzerentscheidung 2026-09-09: überdauert Navigation und
 * den Wechsel Liste↔Detail, nicht das Neuladen).
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

/**
 * Verknüpfung mehrerer aktiver Tag-Filter (ADR-0014 Punkt 9): UND = alle
 * gewählten Tags müssen vorhanden sein, ODER = mindestens einer. Eine leere
 * Auswahl liefert in beiden Modi „alle Orte" — keine Sonderlogik.
 */
export type TagVerknuepfung = 'und' | 'oder'

const GUELTIGE_TAGVERKNUEPFUNGEN: readonly TagVerknuepfung[] = ['und', 'oder']

/** Strukturierter Wert unter dem Schlüssel `orte.tagfilter` (ADR-0009 Punkt
 * 3) — bewusst ein Objekt statt eines rohen Strings, damit eine künftige
 * Erweiterung der Wertform kostenlos bleibt (ADR-0009 Punkt 3). */
export interface OrteTagfilterEinstellung {
  verknuepfung: TagVerknuepfung
}

/**
 * Voreinstellung UND (Nutzerentscheidung 2026-09-08, GESETZT): weder die
 * reine UND-Annahme des product-owner noch die reine ODER-Annahme des
 * ux-ui-designer, sondern die vom Nutzer entschiedene Mitte.
 */
export const ORTE_TAGFILTER_VOREINSTELLUNG: OrteTagfilterEinstellung = { verknuepfung: 'und' }

/**
 * Prüffunktion (ADR-0009 Punkt 5, ADR-0006 Punkt 3/4): Ein fehlender,
 * unbekannter oder ungültiger gespeicherter Wert führt zur Voreinstellung
 * UND — still, ohne Meldung, ohne Rückfrage (Kriterium: „Fehlt in einem
 * älteren Bestand eine gespeicherte UND/ODER-Verknüpfung, startet die App
 * mit der Voreinstellung UND").
 */
export function istGueltigeTagfilterEinstellung(wert: unknown): wert is OrteTagfilterEinstellung {
  if (typeof wert !== 'object' || wert === null) return false
  const kandidat = wert as Record<string, unknown>
  return GUELTIGE_TAGVERKNUEPFUNGEN.includes(kandidat.verknuepfung as TagVerknuepfung)
}

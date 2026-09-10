/**
 * Tag-Identität, abgeleitetes Vokabular und Filter-Prädikat (PO-2026-09-07-004,
 * ADR-0014 Punkt 2/3/9): reine Funktionen ohne Store- oder Speicherzugriff
 * (ADR-0008 Punkt 6). Zwei Nutzer von Anfang an: `useOrteStore` (Filtern,
 * Vergabe) und die präsentationalen Komponenten in `features/tags/`
 * (Vorschläge) — deshalb hier in `shared/lib/`, nicht in `features/tags/`.
 *
 * Identität (Nutzerentscheidung 2026-09-09, GESETZT): zwei Tags sind
 * derselbe, wenn sie nach Trimmen und `toLocaleLowerCase('de')` gleich sind.
 * Diese eine Regel gilt einheitlich für Dedup am Ort, Vorschläge, Vokabular
 * und Filter — nicht je Stelle neu formuliert. Gespeichert/angezeigt wird
 * die Schreibweise, in der ein Tag im Bestand zuerst vergeben wurde.
 *
 * `TagVerknuepfung` gehört dem Context `orte` (`features/orte/model/
 * ansicht.ts`, ADR-0009 Punkt 1) — dieser Import ist rein typbezogen, keine
 * Store-/Zustandsbindung (gleiches Muster wie `shared/lib/sortierung.ts`).
 */
import type { TagVerknuepfung } from '../../features/orte/model/ansicht'

const tagCollator = new Intl.Collator('de')

/** Normalisierter Vergleichsschlüssel für die Tag-Identität. */
export function normalisiereTagSchluessel(tag: string): string {
  return tag.trim().toLocaleLowerCase('de')
}

/**
 * Ein Tag ist ein getrimmter, nicht-leerer String (ADR-0014 Punkt 4).
 * Leereingaben und reine Leerzeichen liefern `null` — still, ohne
 * Fehlermeldung.
 */
export function bereinigeTagEingabe(eingabe: string): string | null {
  const getrimmt = eingabe.trim()
  return getrimmt === '' ? null : getrimmt
}

interface OrtMitTags {
  tags: readonly string[]
}

/**
 * Liefert die Schreibweise, in der ein zu `eingabe` identischer Tag im
 * Bestand bereits existiert (erste Fundstelle in Lesereihenfolge — durch die
 * dedupende Schreibfunktion kann zu einem Zeitpunkt ohnehin nur eine
 * Schreibweise je Identität im Bestand stehen). Existiert keiner, ist die
 * getrimmte Eingabe selbst die neue kanonische Schreibweise. `null` bei
 * Leereingabe (ADR-0014 Punkt 3/4).
 */
export function ermittleKanonischeSchreibweise(orte: readonly OrtMitTags[], eingabe: string): string | null {
  const bereinigt = bereinigeTagEingabe(eingabe)
  if (bereinigt === null) return null
  const schluessel = normalisiereTagSchluessel(bereinigt)
  for (const ort of orte) {
    for (const tag of ort.tags) {
      if (normalisiereTagSchluessel(tag) === schluessel) return tag
    }
  }
  return bereinigt
}

/**
 * Abgeleitetes Tag-Vokabular über alle Orte (ADR-0014 Punkt 2): kein
 * Register, keine Referenzzählung — „ein Tag verschwindet mit seinem
 * letzten Ort" ist damit strukturell erfüllt. Eindeutig nach normalisiertem
 * Schlüssel, alphabetisch über `Intl.Collator('de')` (ADR-0014 Punkt 5 —
 * dieselbe Collator-Regel wie beim Sekundärschlüssel der Sortierung).
 */
export function leiteTagVokabularAb(orte: readonly OrtMitTags[]): string[] {
  const kanonischJeSchluessel = new Map<string, string>()
  for (const ort of orte) {
    for (const tag of ort.tags) {
      const schluessel = normalisiereTagSchluessel(tag)
      if (!kanonischJeSchluessel.has(schluessel)) {
        kanonischJeSchluessel.set(schluessel, tag)
      }
    }
  }
  return [...kanonischJeSchluessel.values()].sort(tagCollator.compare)
}

/**
 * Tag-Prädikat (ADR-0014 Punkt 9): `(tags, aktiveTags, verknuepfung) =>
 * boolean`. Eine leere Auswahl liefert in BEIDEN Modi „true" (alle Orte);
 * ein einzelner aktiver Tag liefert in beiden Modi dasselbe — keine
 * Sonderlogik für „genau ein Tag".
 */
export function ortErfuelltTagfilter(
  tags: readonly string[],
  aktiveTags: readonly string[],
  verknuepfung: TagVerknuepfung,
): boolean {
  if (aktiveTags.length === 0) return true
  const schluesselDesOrts = new Set(tags.map(normalisiereTagSchluessel))
  const aktiveSchluessel = aktiveTags.map(normalisiereTagSchluessel)
  if (verknuepfung === 'und') {
    return aktiveSchluessel.every((schluessel) => schluesselDesOrts.has(schluessel))
  }
  return aktiveSchluessel.some((schluessel) => schluesselDesOrts.has(schluessel))
}

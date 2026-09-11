/**
 * Entscheidung des dritten Kartenzustands (ADR-0019 Punkt 10,
 * design-conventions.md „Karte"): reine Funktion, kein Store-Zugriff.
 *
 * Die beiden anderen Leerzustände — Bestand insgesamt leer, Tag-Filter lässt
 * gar keinen Ort übrig — werden bereits VOR Erreichen dieser Funktion in
 * `Ortebereich.vue` entschieden (dieselben Prüfungen wie in der Listenansicht,
 * ADR-0019 Punkt 10 a/b). Diese Funktion entscheidet ausschließlich den NEUEN
 * dritten Fall: Der Filter lässt Orte übrig, aber keiner davon hat
 * Koordinaten.
 */
export type KartenLeerzustand = 'keiner' | 'ohne_koordinaten'

export function bestimmeKartenLeerzustand(gefilterteAnzahl: number, sichtbareAnzahl: number): KartenLeerzustand {
  if (gefilterteAnzahl > 0 && sichtbareAnzahl === 0) return 'ohne_koordinaten'
  return 'keiner'
}

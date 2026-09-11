/**
 * Wortlaut der Trefferzahl in Zeile 1 von `Werkzeugleiste.vue` — gemeinsame
 * Stelle für Listen- UND Kartenansicht (design-conventions.md „Listen:
 * Sortieren, Filtern, Gruppierung" -> „Ansichtsumschalter" und „Karte" ->
 * „Trefferzahl"; beide verweisen inzwischen hierher). Reine Funktionen, kein
 * Store-/DOM-Zugriff — `Werkzeugleiste.vue` bleibt store- und routerfrei
 * (Constraint UMSCHALTER) und entscheidet nur noch, welche der beiden
 * Formen sie zeigt.
 *
 * Jede Form liefert sowohl den vollen Wortlaut (`lang`, sichtbar ab 768px
 * Containerbreite UND immer als `aria-label`) als auch die Kurzform (`kurz`,
 * sichtbar unterhalb 768px) — die Auswahl zwischen beiden übernimmt CSS
 * (`@container`) in `Werkzeugleiste.vue`, nicht diese Funktion.
 */

export interface TrefferzahlText {
  /** Vollständiger Wortlaut. */
  lang: string
  /** Kurzform unterhalb 768px Containerbreite. */
  kurz: string
  /** Nur in der Kartenansicht `true`: Die Kurzform ersetzt das Suffix „mit
   * Koordinaten" durch ein Stecknadel-Symbol statt eines Wortes. */
  kartenKurzform: boolean
}

function orteWort(anzahl: number): string {
  return anzahl === 1 ? 'Ort' : 'Orte'
}

function ortenWort(anzahl: number): string {
  return anzahl === 1 ? 'Ort' : 'Orten'
}

/**
 * Listen-Trefferzahl (seit PO-2026-09-07-003, jetzt inkl. Kurzform):
 * `angezeigt === gesamt` -> „N Orte"; sonst -> „M von N Orten" bzw. „M/N"
 * unterhalb 768px. Der Gleichstand-Fall ändert sich unterhalb 768px NICHT —
 * er ist bereits kurz genug (design-conventions.md „Karte" -> „Trefferzahl"
 * -> „Platz").
 */
export function formatiereListenTrefferzahl(angezeigt: number, gesamt: number): TrefferzahlText {
  if (angezeigt === gesamt) {
    const text = `${angezeigt} ${orteWort(angezeigt)}`
    return { lang: text, kurz: text, kartenKurzform: false }
  }
  return {
    lang: `${angezeigt} von ${gesamt} ${ortenWort(gesamt)}`,
    kurz: `${angezeigt}/${gesamt}`,
    kartenKurzform: false,
  }
}

/**
 * Kartenansicht-Trefferzahl (Nutzerentscheidung 2026-09-11, GESETZT — keine
 * Ableitung des `ux-ui-designer`, deshalb nicht als Redundanz kürzbar):
 * nennt sichtbare Marker UND gefilterte Gesamtmenge, Suffix „mit
 * Koordinaten". Singular/Plural richtet sich nach der ZWEITEN Zahl
 * (`gefiltert`), wie bei der Listen-Trefferzahl auch.
 *
 * Bei `sichtbar === 0` Rückfall auf das GEWÖHNLICHE Listen-Format (gefiltert
 * gegen Gesamtbestand, OHNE „mit Koordinaten") — der Leerzustand-Text trägt
 * die Koordinaten-Aussage in diesem Fall bereits allein; die Zahl würde sie
 * sonst ein zweites Mal machen.
 */
export function formatiereKartenTrefferzahl(
  sichtbar: number,
  gefiltert: number,
  gesamtbestand: number,
): TrefferzahlText {
  if (sichtbar === 0) {
    return formatiereListenTrefferzahl(gefiltert, gesamtbestand)
  }
  if (sichtbar === gefiltert) {
    const text = `${sichtbar} ${orteWort(sichtbar)} mit Koordinaten`
    return { lang: text, kurz: `${sichtbar}`, kartenKurzform: true }
  }
  return {
    lang: `${sichtbar} von ${gefiltert} ${ortenWort(gefiltert)} mit Koordinaten`,
    kurz: `${sichtbar}/${gefiltert}`,
    kartenKurzform: true,
  }
}

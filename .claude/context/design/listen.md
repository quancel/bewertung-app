# Listen: Sortieren, Filtern, Gruppierung, Ortszeile

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: „Listen: Sortieren, Filtern, Gruppierung", „Ortszeile: Sekundärzeile
> (Adresse/Anfangsnotiz)", „Ansichtswechsel innerhalb eines Bereichs".
> Zonen/Schatten der Zeile: [zonen-ortsliste.md](zonen-ortsliste.md).

## Listen: Sortieren, Filtern, Gruppierung

- **Werkzeugleiste: zwei Zeilen, nie zwei konkurrierende Leisten, in jeder
  Breite.** Zeile 1: links Sortier-Chip (Kriterium als Text) + angehängter
  Icon-Button für die Richtung (eigener Tap); rechts die Trefferzahl („12
  Orte" / „4 von 12 Orten"); äußerster rechter Platz: Ansichtsumschalter.
  Zeile 2 (nur wenn Tags existieren): links fest der UND/ODER-Umschalter,
  Mitte die horizontal scrollbare Tag-Pill-Leiste, rechts bei aktivem Filter
  fest die Zurücksetzen-Aktion — zwei feste Anker, dazwischen scrollt nur die
  Pill-Leiste. Die zwei Zeilen rücken in keiner Breite zusammen; die Leiste
  richtet sich nach der Spaltenbreite (~400px ab `lg`), nicht nach dem Fenster.
- **Ansichtsumschalter (Liste/Karte) in Zeile 1**: Icon-only, 44×44,
  `aria-label` nennt Zustand **und** Ziel („Listenansicht aktiv — zur
  Kartenansicht wechseln" / „Kartenansicht aktiv — zur Listenansicht
  wechseln"), **kein** Segment-Control (in ~368px Inhaltsbreite passt neben
  Chip ~172px, Toggle 44px und Gaps ~16px nur eine Trefferzahl von ~136px). Gilt
  in jeder Breite. Bei Enge: Container Query auf Zeile 1, Schwelle und
  Kurzform der Trefferzahl stehen in [karte.md](karte.md) → „Trefferzahl".
- **Sortieren bei > 4 Kriterien: Sheet statt Auswahlfeld.** Der Sortier-Chip
  öffnet ein Sheet (Radius 16px, 240 ms), Kriterien gruppiert unter
  „Allgemein" (Bezeichnung, Zuletzt geändert, Gesamtnote) und „Einzelachse"
  (vier Achsen). Auswahl wirkt sofort, kein „Anwenden". Aktive Zeile
  `--color-primary-50`. (Gewichtungs-Einstieg: [gewichtung.md](gewichtung.md).)
- **Richtung**: eigener Ein-Tap-Umschalter mit Pfeil-Icon, unabhängig vom
  Kriterium. Anfangswert je Kriterium: Bezeichnung A→Z, Zuletzt geändert
  neueste zuerst, Gesamtnote/Achsen höchster Wert zuerst; danach frei.
- **Gruppierung „ohne Wert" ans Ende** (Gesamtnote wie jede Einzelachse): kein
  Ausblenden, keine Trennlinie — 32px Abstand + gemutete Zwischenüberschrift
  mit Anzahl („3 Orte ohne Bewertung in Ambiente"), Zeilen ohne Wert-Slot.
  Nie eingeklappt. **Wert 0 gehört nicht in diese Gruppe** (gesetzter Wert,
  normale Sortierposition mit Balken + „0").
- **Tag-Pills**: gleiche Optik in Bearbeitung und Filter, Radius 999px.
  Unausgewählt: `--surface-muted`, `--text`, 1px `--border`. Aktiv:
  `--color-primary-50` Fläche, `--color-primary-700` Text, kein Rahmen.
- **UND/ODER-Umschalter** (Mehrfachfilter): fester, nicht scrollender
  Segment-Control (zwei Tap-Ziele, Höhe der Pills, Radius 999px) am linken
  Rand von Zeile 2, immer sichtbar (auch bei null/einem Filter, kein
  Ein-/Ausblenden). Aktiver Modus nur am Umschalter ablesbar, die Pills sehen
  in beiden Modi gleich aus. Anzeigeeinstellung wie die Sortierung:
  überdauert Navigation/Neuladen, wird vom Zurücksetzen nicht gelöscht.
- **Zurücksetzen des Tag-Filters** (nur bei aktivem Filter): fest am
  **rechten** Rand von Zeile 2, außerhalb der Pill-Leiste, Icon-only „×"
  (`aria-label` „Filter zurücksetzen", Optik wie Tag-Entfernen), in jeder Breite.
- Vorschlagsliste und Type-ahead: [formulare.md](formulare.md).

## Ortszeile: Sekundärzeile (Adresse/Anfangsnotiz)

- **Priorität**: Hat der Ort eine Anfangsnotiz, zeigt die Sekundärzeile die
  Notiz, sonst die Adresse; ohne beides entfällt die Zeile (Listen-Ausnahme
  von „Leeres Feld (regulär)").
- **Wrap statt Kürzen (bindend)**: kein Auslassungszeichen, kein `line-clamp`,
  die Zeile wächst über so viele Zeilen wie nötig (eine 100-Zeichen-Notiz muss
  bei 320/390/1280px vollständig lesbar sein).
- **Langes Wort ohne Leerzeichen**: `overflow-wrap: anywhere` (bzw.
  `word-break: break-word`).
- **Reiner Fließtext** (kein `white-space: pre-line`, kein `<br>`).
- **Reagiert ohne Neuladen**: `Ortszeile.vue` liest Adresse/Notiz rein aus
  Props/Store, ohne eigenen Zwischenzustand.

## Ansichtswechsel innerhalb eines Bereichs (Query-Parameter `ansicht`)

- **Wechsel zwischen Ansichten desselben Bereichs** (`/orte` ↔
  `/orte?ansicht=karte`) **ist ein Sprung**, keine Zustandsanimation —
  projektweit gilt: ein vollständiger Inhaltsaustausch springt.
- **Gemeinsame Bedienelemente** (Kopfzeile, Werkzeugleiste inkl. Tag-Filter)
  bleiben über beide Ansichten identisch, nur der Container ist breiter.
- **Ein in einer Ansicht wirkungsloses Bedienelement**, das in einer anderen
  eine gespeicherte Einstellung repräsentiert (Sortierung in der Karte),
  **bleibt sichtbar und bedienbar**.
- **Rückkehr aus der Detailansicht in eine Nicht-Listen-Ansicht** (Karte):
  Fokus zurück auf das geöffnete Element (den Marker).

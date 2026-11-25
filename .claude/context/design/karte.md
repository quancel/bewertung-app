# Karte: Leerzustände, Trefferzahl, Marker, Namen, Ausschnitt

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: „Karte", „Karte: Marker, Namen, Ausschnitt (PO-2026-11-24-003/-004)".
> Schnellansicht: [schnellansicht.md](schnellansicht.md).

## Karte

- **Drei unterscheidbare Leerzustände** (ADR-0019 P10, nie derselbe Text):
  (1) Bestand leer — der allgemeine Zustand „Leer (kein Datensatz)", vor jeder
  Ansicht. (2) Tag-Filter lässt keinen Ort übrig — „Leer (gefiltert, kein
  Treffer)" (Kopfzeile und Werkzeugleiste bleiben darüber). (3) Filter lässt
  Orte übrig, aber keiner hat Koordinaten — „Keiner der angezeigten Orte hat
  Koordinaten.", typografisch, zentriert, ersetzt nur die Kartenfläche;
  Primär-Aktion **„Zur Ortsliste"** (Filter bleibt erhalten).
- **Kein Netz für Kacheln, Orte vorhanden**: Marker bleiben sichtbar, dazu ein
  kleiner Hinweis-Chip an einer festen Kante (kein vollflächiger Text).
  Fehlende Kacheln: einheitliche `--color-neutral-100`-Fläche, kein
  Bild-Icon, kein Fehler-Rot/Alarm-Icon, kein „Wiederholen" als Primäraktion.
- <a id="trefferzahl"></a>**Trefferzahl in der Kartenansicht nennt zwei Zahlen**
  (Nutzerentscheidung 2026-09-11, gesetzt, keine Ableitung — nicht als
  Redundanz kürzbar): sichtbare Marker **und** gefilterte Gesamtmenge. Gleich:
  „{N} {Ort/Orte} mit Koordinaten"; sonst „{sichtbar} von {gefiltert}
  {Ort/Orten} mit Koordinaten" (Ort/Orten nach der **zweiten** Zahl). Nur bei
  `sichtbar > 0`; bei `sichtbar === 0` (Leerzustand 2/3) gilt das gewöhnliche
  Listen-Format ohne „mit Koordinaten" (der Leerzustand-Text trägt die Aussage).
  - **Platz/Kurzform**: ein gemeinsamer Container-Query-Schwellenwert auf
    Zeile 1 für beide Ansichten: **unter 768px Containerbreite** („md")
    Kurzform, ab 768px ausgeschrieben. Kurzform: „von … Ort(en)" wird zum
    Schrägstrich („{sichtbar}/{gefiltert}"); in der Kartenansicht entfällt
    „mit Koordinaten" zugunsten eines kleinen Stecknadel-Symbols vor der Zahl
    (`--text-muted`, nicht `--color-accent-500` — der Akzent gehört den Markern).
    Der Gleichstand-Fall der Liste („12 Orte") bleibt unverändert. Der volle
    Wortlaut bleibt per `aria-label` am Trefferzahl-Element hörbar.
- **Sortier-Bedienelement bleibt in der Kartenansicht sichtbar und bedienbar**
  (ohne sichtbare Wirkung, ADR-0019 P9): kein Ausblenden, kein `disabled` —
  ein erscheinendes/verschwindendes Element wäre der größere Bruch; die
  Sortierung ist eine gespeicherte Einstellung.
- Marker bleiben ohne Kacheln vorhanden (`--color-accent-500`, einziger
  Verwendungszweck) und anklickbar; die Karte friert nie ein. Per Tastatur
  erreichbar (Tab/Enter), im Fokus zusätzlich sichtbare Bezeichnung.
- Orte ohne Koordinaten bekommen in der Liste **keine** Kennzeichnung
  (fehlende optionale Werte weglassen).

## Karte: Marker, Namen, Ausschnitt (PO-2026-11-24-003/-004)

- **Marker mit Note**: Scheibe Ø 40px, Füllung `--surface`, 3px Ring
  `--color-accent-500`, Note als Zahl mit Komma, 14px, Gewicht 600,
  `tabular-nums`, `--text` (weiße Schrift auf `accent-500` nur ≈ 4,1:1).
  „10,0" (≈ 30px) passt in die 34px Innenfläche. Trefferfläche 44×44
  (transparent). Keine Zonenfarbe.
- **Marker ohne Note**: ausgefüllter Punkt Ø 16px `--color-accent-500`, ohne
  Zahl und ohne „–", Trefferfläche 44×44.
- **Ausgewählt** (offene Schnellansicht): Scheibe Ø 48px, Ring 4px — Größe und
  Ringstärke tragen, nicht nur Farbe. Ohne Note: Punkt Ø 24px mit 3px
  `--surface`-Außenring. Name immer sichtbar.
- **Namensetikett** über dem Marker: 4px Abstand, Pille `--surface` (92 %
  Deckkraft), 1px `--border`, Radius `--radius-8`, Padding 2px 6px, 14px 500
  `--text`, einzeilig, max. 120px mit Auslassungszeichen, `pointer-events:
  none`, `aria-hidden` (der Marker trägt den Namen). Bei Hover/Tastaturfokus/
  Auswahl: volle Breite bis 240px, bis 2 Zeilen, immer sichtbar. 8px Abstand
  zum Kartenrand (verschiebt sich horizontal).
- **Kollisionsregel**: Überlappt das Etikett-Rechteck (+4px Rand) ein Etikett
  mit Vorrang oder die Scheibe/den Punkt eines anderen Markers, entfällt es.
  Vorrang: ausgewählt/fokussiert, dann höhere Gesamtnote (ungerundet), ohne
  Note zuletzt, bei Gleichstand Bezeichnung alphabetisch (`de`, ohne
  Groß/Klein), dann Id. Greedy in dieser Reihenfolge. Neu berechnet nach
  `moveend`/`zoomend`, Filter-, Gewichtungs- und Bestandswechsel (nicht beim
  Ziehen). Ein-/Ausblenden nur `opacity`, 180ms; unter reduzierter Bewegung
  unverändert.
- **Zugänglicher Name**: „{Bezeichnung}, Gesamtnote {x,y}" bzw. „{Bezeichnung},
  keine Gesamtnote" (Variante bei Gewicht 0: [gewichtung.md](gewichtung.md)) —
  unabhängig von der Etikett-Sichtbarkeit.
- **Ausschnitt in der Sitzung merken** (ADR-0038): ohne sichtbare Rückmeldung
  und Animation; beim Aufbau der Karte als Startansicht gesetzt (kein
  sichtbares Einpassen mit Sprung). Fokusrückgabe auf den Marker ohne
  Verschieben (`preventScroll`). Nach einer Änderung des Tag-Filters **in der
  Kartenansicht** wird neu eingepasst. Bei der **Rückkehr in die
  Kartenansicht** (aus Detail oder Liste, auch nach Filteränderung in der
  Liste) wird der Ausschnitt wiederhergestellt, **außer** im Ausschnitt liegt
  kein sichtbarer Marker — dann Einpassen auf die gefilterten Marker.

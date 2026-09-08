# Design Conventions — bewertung-app

> **Single-Writer: Nur der `ux-ui-designer`-Agent schreibt hierhin.** Alle
> anderen Rollen lesen nur; der `frontend-lead` setzt daraus um.
>
> Zweck: Das Gedächtnis des Designers. Einmal entschiedene
> Interaktions-Konventionen stehen hier, damit sie beim nächsten Feature
> wiederverwendet statt neu erfunden werden. Kein Styleguide, kein
> Moodboard — nur Festlegungen, die für die Umsetzung bindend sind und
> direkt in Code übersetzbar bleiben.
>
> **Kuratieren statt anhängen.** Wird eine Konvention abgelöst, ersetze den
> Eintrag statt einen zweiten danebenzustellen. Faustregel: < 150 Zeilen.

Entstanden aus der Design-Schleife: Gruppe A (010/001/002) legt Tokens,
Zustände und Formulare an; Gruppe B (003/004) ergänzt Sortieren/Filtern;
Runde 2 von 002 klärt Wert 0 vs. „nicht bewertet"; Gruppe C (005/006/008)
ergänzt Karte, Bilder, Ortssuche.

- **Zuletzt kuratiert**: 2026-09-07

## Zustände

Grundsatz: **Zwei Zustände mit unterschiedlicher Ursache tragen nie
denselben Text**, auch wenn sie optisch ähnlich aussehen — sonst sind sie
für die Nutzerin ununterscheidbar (gilt u. a. für die drei Leer-Varianten
unten und für die beiden Karten-Leerzustände, siehe „Karte").

| Zustand | Konvention | Seit |
|---------|------------|------|
| Leer (kein Datensatz) | Rein typografisch, kein Bild (design-concept.md: bis auf weiteres ohne Illustration); kurzer Satz + eine Primär-Aktion, zentriert. Beispiel: „Noch keine Orte eingetragen" + „Ort hinzufügen". | 2026-09-07 |
| Leer (gefiltert, kein Treffer) | Gleiches Muster wie oben, andere Aussage (aktive Auswahl führt zu keinem Treffer) und andere Aktion („Filter zurücksetzen"). | 2026-09-07 |
| Lädt | Rein lokale Lesevorgänge zeigen **keinen** Ladezustand — gilt als synchron schnell genug. Skeleton/Spinner erst ab spürbar > 400 ms (z. B. Import/Export, viele Bilder). | 2026-09-07 |
| Fehler | Kaum Feld-Validierung nötig, da fast alles optional; Werte außerhalb eines Bereichs werden geklemmt statt abgelehnt. Echte Fehler (Speicherzugriff, unbekannte Datenversion) als ruhige, nicht-modale Inline-/Vollflächen-Meldung in `--color-danger`, nie als Modal. | 2026-09-07 |
| Erfolg | Autosave hat **keine** sichtbare Bestätigung — Persistenz gilt als sofort und selbstverständlich. Toast nur bei seltenen, expliziten Aktionen (z. B. Export/Import). | 2026-09-07 |
| Leeres Feld (regulär) | Ein leeres, aber vorgesehenes Feld (Adresse, eine nicht bewertete Achse) ist normal, kein Fehler: Label bleibt, Wert-Slot zeigt „noch nichts eingetragen" / „Noch nicht bewertet" auf `--surface-muted`/`--text-muted`, Radius 8px, kein Icon. In Listenzeilen wird ein fehlender optionaler Wert normalerweise ganz weggelassen — **Ausnahme:** aktives Sortierkriterium (siehe „Listen" unten). | 2026-09-07 |

## Interaktion & Animation

- Kein separater „Bearbeiten"-Modus: Felder sind in der Detailansicht
  inline editierbar, Autosave onBlur (Text) bzw. sofort (Zahl/Auswahl) —
  Notizbuch-Charakter statt Formular-Ritual.
- Bestätigungsdialog (Sheet, 240 ms) nur bei **schwer/nicht rückgängig
  machbarem Verlust** (ganzer Ort, ein Bild); Button beschriftet, in
  `--color-danger` (Zweitzweck des Fehler-Tons für riskante Aktionen).
  **Leichte, folgenlos wiederholbare Entfernungen** (Tag, Achse
  zurücksetzen) brauchen **keine** Bestätigung — in einem Schritt
  wiederherstellbar, eine Bestätigung wäre reine Reibung.
- Ein-/Ausblenden bedingter Formularteile 180 ms ease-out, nichts über
  300 ms (design-concept.md).

## Formulare

- Nur echte Pflichtfelder über eine **deaktivierte Primär-Aktion**
  erzwungen (Button inaktiv bis Mindestangabe vorhanden) — nie Sternchen
  oder Inline-Fehler. Optionale Felder nicht als „(optional)" markiert.
- Werte mit Bereich (z. B. 0–10) werden beim Verlassen des Feldes auf die
  nächstliegende Grenze geklemmt statt mit Fehler abgelehnt. **Das Klemmen
  greift nur bei tatsächlich eingegebenen Zahlen — ein leeres Feld ist
  kein Wert und wird nie auf die Untergrenze geklemmt**, sonst wäre
  Zurücksetzen unmöglich.
- Zahleneingabe ist bei Regler-Pendants die primäre Quelle; der Regler ist
  unterstützend, ohne sichtbaren Thumb solange kein Wert gesetzt ist,
  danach bidirektional synchron.

## Werte mit Bereich, bei denen 0 gültig ist

Gilt für jedes Feld mit numerischem Bereich, in dem 0 ein gültiger,
gesetzter Wert ist **und** ein davon getrennter Zustand „nicht gesetzt"
existiert — aktuell die vier Achsen, künftig jedes Feld mit dieser
Eigenschaft.

- **0 und „nicht gesetzt" sind zwei verschiedene Dinge**, nie über
  dieselbe Darstellung geführt. „Nicht gesetzt" = Muster „Leeres Feld
  (regulär)". Ein gesetztes 0 = dieselbe Darstellung wie jeder andere Wert
  (Zahl + Balken, normale Textfarbe, keine gemutete Fläche).
- **Rücksetzen**: sobald ein Wert gesetzt ist, erscheint ein kleiner
  Icon-Button („×", `aria-label` „[Achse] zurücksetzen" — gleiche Optik
  wie das Tag-Entfernen, Wiedererkennung statt neuem Muster), per Tastatur
  erreichbar. Alternativ genügt weiterhin das Leeren der Zahleneingabe.
- **Intensitätsbalken**: Spur hat **immer** einen sichtbaren 1px-Rahmen
  (`--border`), unabhängig vom Füllstand — 0 zeigt eine erkennbare leere
  Spur statt einer mit dem Hintergrund verschmelzenden Fläche. Die Zahl
  steht immer zusätzlich daneben, auch bei 0. Füllfarbe eine Tonleiter
  zwischen `--color-neutral-100` (0) und `--color-primary-600` (10), keine
  Stufenfarben. „Nicht gesetzt" zeigt **keinen** Balken, nur den
  Platzhaltertext.

## Listen: Sortieren, Filtern, Gruppierung

- **Eine Werkzeugleiste, zwei Zeilen, nie zwei konkurrierende Leisten.**
  Zeile 1: links Sortier-Chip (Kriterium als Text) + angehängter
  Icon-Button für die Richtung (eigener Tap); rechts die Trefferzahl
  („12 Orte" / „4 von 12 Orten") — eine gemeinsame Stelle für Sortierung
  und Filter. Zeile 2 (nur wenn Tags existieren): horizontal scrollbare
  Tag-Pill-Leiste mit Zurücksetzen-Aktion bei aktivem Filter. Ab `lg`
  rücken beide Zeilen nebeneinander in eine gemeinsame Kopfzeile.
- **Sortieren bei > 4 Kriterien: Sheet statt Auswahlfeld.** Sortier-Chip
  öffnet ein Sheet (Radius 16px, 240 ms), Kriterien gruppiert unter
  „Allgemein" (Bezeichnung, Zuletzt geändert, Gesamtnote) und
  „Einzelachse" (die vier Achsen). Auswahl wirkt sofort, kein
  „Anwenden"-Button. Aktive Auswahl als Zeilen-Highlight in
  `--color-primary-50`.
- **Richtung** ist ein eigener Ein-Tap-Umschalter mit Pfeil-Icon,
  unabhängig vom Kriterium. Sinnvoller Anfangswert je Kriterium
  (Bezeichnung A→Z, Zuletzt geändert neueste zuerst, Gesamtnote/Achsen
  höchster Wert zuerst), danach frei umschaltbar.
- **Gruppierung „ohne Wert" ans Ende** (Gesamtnote wie jede Einzelachse):
  kein Ausblenden, keine Trennlinie — großzügiger Abstand (32px) +
  gemutete Zwischenüberschrift mit Anzahl („3 Orte ohne Bewertung in
  Ambiente"), danach die Zeilen normal, aber ohne den sonst gezeigten
  Wert-Slot (die Überschrift trägt die Leer-Aussage stellvertretend). Nie
  eingeklappt. **Ein Ort mit Wert 0 gehört nicht in diese Gruppe** — 0 ist
  ein gesetzter Wert und steht ganz normal an seiner Sortierposition mit
  Balken + Zahl „0"; nur eine wirklich unbewertete Achse zählt in die
  Gruppe.
- **Tag-Pills**: gleiche Optik in Bearbeitung wie im Filter, Radius 999px.
  Neutral/unausgewählt: `--surface-muted`, `--text`, 1px `--border`.
  Aktiv: `--color-primary-50` Fläche, `--color-primary-700` Text, kein
  Rahmen.
- **Vorschlagsliste (Autocomplete)**: erstmals für Tag-Eingabe, wiederholt
  für die Ortssuche (008). Erscheint unter dem Feld, max. ~6 Einträge,
  Teilstring-Treffer case-insensitive, Pfeiltasten + Enter, Escape
  schließt. Ein am selben Ort bereits vergebener Tag, erneut exakt
  eingetippt und bestätigt: nichts passiert (kein zweiter Pill, keine
  Fehlermeldung).
- **Netzabhängige Aktion ohne Erfolg (z. B. Ortssuche)**: dieselbe Stelle
  unter dem Feld trägt je nach Ursache einen anderen, immer gemuteten
  Text — kein Icon, keine Warn-/Fehlerfarbe. Kein Netz, kein Treffer und
  Suchfehler/Zeitüberschreitung sind drei verschiedene Texte. Feld bleibt
  in allen Fällen bedienbar, Werte weiterhin von Hand eintragbar.

## Karte

- Zwei Leerzustände, zwei Texte: „kein Ort hat Koordinaten" (unabhängig
  vom Netz, typografisch wie „Leer (kein Datensatz)", Aktion „Zur
  Ortsliste") vs. „Orte vorhanden, aber kein Netz für Kacheln" (Marker
  bleiben sichtbar, dazu ein kleiner Hinweis-Chip an einer festen Kante —
  kein vollflächiger Text, der die Marker verdeckt).
- Fehlende Kacheln: einheitliche `--color-neutral-100`-Fläche, keine
  kaputten Bild-Icons. Kein Fehler-Rot, kein Alarm-Icon, kein
  „Wiederholen" als Primäraktion.
- Marker bleiben ohne Kacheln vorhanden, farbig (`--color-accent-500`,
  einziger Verwendungszweck) und anklickbar; die Karte friert nie ein.
  Per Tastatur erreichbar (Tab/Enter), im Fokus zusätzlich eine sichtbare
  Beschriftung (Bezeichnung), nicht nur der Fokusring.
- Orte ohne Koordinaten bekommen in der Liste **keine** eigene
  Kennzeichnung (kein Icon/Badge) — konsistent mit „fehlende optionale
  Werte weglassen"; eine Sonderkennzeichnung sähe wie ein Mangel aus.

## Bilder

- Speichermangel beim Hinzufügen ist der **einzige** Anwendungsfall von
  `--color-warning`. Darstellung: manuell schließbarer Banner im
  Detailbereich (kein Modal, kein Auto-Dismiss — die Bedingung besteht
  fort, bis der Nutzer reagiert), Icon + Text, sagt konkret was zu tun ist.
- Leeres Bilder-Raster: kein Platzhaltertext — die „Bild
  hinzufügen"-Aktion (Primär-Button) steht immer sichtbar und erklärt den
  Zustand selbst.
- Bild löschen nutzt die Bestätigungsdialog-Konvention für schwer
  rückgängig machbare Aktionen (Original ist ohnehin nicht mehr
  vorhanden, ein gelöschtes Bild ist endgültig weg).

## Tokens & Spacing

- Komponenten binden ausschließlich an die semantische Ebene: `--surface`,
  `--surface-muted`, `--surface-sunken`, `--text`, `--text-muted`,
  `--text-on-primary`, `--border`, `--border-strong`, `--focus-ring` — nie
  an `neutral-XXX` direkt.
- Dezimalwerte (Gesamtnote, Achsenwerte) mit Komma als Trennzeichen,
  `tabular-nums`.

## Barrierefreiheit (Baseline)

- Fokusring (2px, 2px Offset) nie entfernen — auch nicht bei
  deaktivierten Primär-Buttons.
- Jede Regler-Bedienung hat eine gleichwertige Zahleneingabe-Alternative;
  bei leerem Wert kein `aria-valuenow`, sondern
  `aria-valuetext="nicht bewertet"`.

## Bewusst offen gelassen

- Dichte von Tabellen/Listen — hängt vom Datenvolumen ab.
- Farbcodierung der vier Bewertungsachsen — weiterhin offen
  (design-concept.md), erst bei einem künftigen Achsen-Diagramm neu
  bewerten.
- Verknüpfung mehrerer aktiver Tag-Filter (UND/ODER) — reine
  Verhaltensfrage, nicht in den `acceptance_criteria` von
  PO-2026-09-07-004 festgelegt, siehe `design_open_questions` dort.

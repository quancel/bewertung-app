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
ergänzt Karte, Bilder, Ortssuche; Runde 2 von 004 klärt die UND/ODER-
Verknüpfung des Tag-Filters; Gruppe D (007/009) ergänzt den
Update-Hinweis der Offline-Auslieferung und Export/Import. Runde 2 von 011
ergänzt Navigation, Zurück-Verhalten und die projektweite
Navigationschrome-Regel; 012 ergänzt das Master-Detail-Pattern ab `lg`.

- **Zuletzt kuratiert**: 2026-09-08

## Zustände

Grundsatz: **Zwei Zustände mit unterschiedlicher Ursache tragen nie
denselben Text**, auch wenn sie optisch ähnlich aussehen — sonst sind sie
für die Nutzerin ununterscheidbar (gilt u. a. für die drei Leer-Varianten
unten und für die beiden Karten-Leerzustände, siehe „Karte").

| Zustand | Konvention | Seit |
|---------|------------|------|
| Leer (kein Datensatz) | Rein typografisch, kein Bild (design-concept.md: bis auf weiteres ohne Illustration); kurzer Satz + eine Primär-Aktion, zentriert. Beispiel: „Noch keine Orte eingetragen" + „Ort hinzufügen". | 2026-09-07 |
| Leer (gefiltert, kein Treffer) | Gleiches Muster wie oben, andere Aussage (aktive Auswahl führt zu keinem Treffer) und andere Aktion („Filter zurücksetzen"). | 2026-09-07 |
| Lädt | Rein lokale Lesevorgänge zeigen **keinen** Ladezustand — gilt als synchron schnell genug. Skeleton/Spinner erst ab spürbar > 400 ms (z. B. Import/Export, viele Bilder). Bei einer expliziten, netzabhängigen Aktion (Export/Import mit vielen Bildern, Ortssuche) wandert der Ladezustand in das auslösende Element selbst (Button-Inhalt wechselt zu Spinner + Kurztext, bleibt an Ort und Stelle) — kein Vollflächen-Overlay. | 2026-09-08 |
| Fehler | Kaum Feld-Validierung nötig, da fast alles optional; Werte außerhalb eines Bereichs werden geklemmt statt abgelehnt. Echte Fehler (Speicherzugriff, unbekannte Datenversion, beschädigte/fremde Import-Datei) als ruhige, nicht-modale Inline-/Vollflächen-Meldung in `--color-danger`, nie als Modal. | 2026-09-07 |
| Warnung | Nur bei angekündigten, noch nicht eingetretenen Aktionen mit drohendem Datenverlust (Speichermangel beim Bild-Hinzufügen, „Bestand ersetzen" beim Import) — auslösendes/bestätigendes Element in `--color-warning`, nicht `--color-danger`. Unterscheidet sich von „Fehler": hier ist noch nichts schiefgelaufen, es wird nur vor einer Folge gewarnt, die der Nutzer selbst auslösen würde. | 2026-09-08 |
| Erfolg | Autosave hat **keine** sichtbare Bestätigung — Persistenz gilt als sofort und selbstverständlich. Toast nur bei seltenen, expliziten Aktionen (z. B. Export/Import, ein bereitstehendes App-Update). | 2026-09-08 |
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
- **Verknüpfungs-Umschalter (UND/ODER) für Mehrfachfilter**: fester,
  nicht scrollender Segment-Control (zwei Tap-Ziele, gleiche Höhe wie die
  Pills, Radius 999px) am Anfang der scrollbaren Filter-Pill-Leiste —
  bleibt immer sichtbar und bedienbar, auch bei null oder einem aktiven
  Filter (kein Ein-/Ausblenden, kein Zustandssprung beim ersten Filter-Tap).
  Aktiver Modus ist über die Hervorhebung im Umschalter selbst ablesbar,
  nicht über die Pills — die sehen in beiden Modi gleich aus. Die
  Verknüpfung ist eine Anzeigeeinstellung wie die Sortierung: überdauert
  Navigation/Neuladen, wird vom Zurücksetzen des Filters nicht
  mitgelöscht.

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

- Speichermangel beim Hinzufügen ist im Bilder-Kontext der Anwendungsfall
  von `--color-warning` (siehe „Zustände" → Warnung für die allgemeine
  Regel; ein zweiter Fall ist „Bestand ersetzen" beim Import).
  Darstellung: manuell schließbarer Banner im Detailbereich (kein Modal,
  kein Auto-Dismiss — die Bedingung besteht fort, bis der Nutzer
  reagiert), Icon + Text, sagt konkret was zu tun ist.
- Leeres Bilder-Raster: kein Platzhaltertext — die „Bild
  hinzufügen"-Aktion (Primär-Button) steht immer sichtbar und erklärt den
  Zustand selbst.
- Bild löschen nutzt die Bestätigungsdialog-Konvention für schwer
  rückgängig machbare Aktionen (Original ist ohnehin nicht mehr
  vorhanden, ein gelöschtes Bild ist endgültig weg).

## Navigation & Routing

- **Navigationschrome nur, wenn dahinter noch etwas funktioniert.** Zustände,
  die den gesamten Bestand unbenutzbar machen (z. B. eine unbekannte,
  neuere Formatversion), bleiben ohne Navigationsebene — sie böte Bereiche
  an, die alle ins Leere führen, eine Zusage, die die App nicht halten
  kann. Jeder andere Zustand, auch „Adresse ohne Ziel", zeigt die
  Navigation weiterhin, weil der Rest der App dort funktioniert. Gilt
  projektweit, nicht nur für den Fall, der sie ausgelöst hat.
- **Chrome-Pattern**: mobil (bis `lg`) fixierte Bottom-Tab-Leiste (56px +
  `env(safe-area-inset-bottom)`, `--surface`, 1px `--border` oben statt
  Schatten, Hauptinhalt mit passendem Bottom-Padding); ab `lg` fixierte
  linke Nav-Rail (~80px) als eigene Chrome-Spalte außerhalb des
  1120px-Containers, keine dritte Content-Spalte. Beide zeigen dasselbe
  Bereichsregister: Icon (Lucide Outline 24px) **plus sichtbarem Label**,
  nie Icon-only, nicht ausgeblendet bei nur einem Eintrag. Einträge werden
  nur angehängt, nie neu positioniert. Aktiver Zustand ohne
  Farbabhängigkeit: Schriftgewicht 600 (inaktiv 400) + 2px-Indikatorlinie
  in `--color-primary-600`, dazu `aria-current="page"`. Kein
  App-Titel/Wortmarke (design-concept.md legt keine fest). Touch-Ziele
  mind. 44×44px, Icon+Label ein Tap-Ziel.
- **Skip-Link** „Zum Hauptinhalt springen": erstes fokussierbares Element
  im DOM, visuell versteckt bis `:focus`, Ziel `#main-content`.
  DOM-/Tab-Reihenfolge Skip-Link → Navigation → Hauptinhalt; die
  abweichende visuelle Position läuft über CSS, nicht über DOM-Reihenfolge.
- **Adresse ohne Ziel** (gehört zu keinem Bereich, oder Detailadresse zu
  einem nicht vorhandenen Datensatz, inkl. „gerade gelöscht" und „Bereich
  existiert in dieser Version noch nicht"): **ein** Text für alle
  Ursachen, nennt **keine** Ursache — kein „Link kaputt", kein „gelöscht",
  kein „Bereich existiert nicht", auch nicht im Konjunktiv. Zum
  Anzeigezeitpunkt ist die Ursache nie sicher bekannt, und Bereiche
  entstehen nacheinander — dieselbe Adresse würde sonst von Release zu
  Release die Meldung wechseln. Der Text sagt nur, was zutrifft, und wohin
  es weitergeht: „Diese Adresse führt zu keinem Inhalt." + Primär-Aktion
  zur Startübersicht des ersten Bereichs. Rein typografisch wie andere
  Leerzustände, zentriert; Navigation bleibt sichtbar und bedienbar; keine
  Fehler-/Warnfarbe, kein Alarm-Icon.
- **Zurück-Aktion**: sticky am Kopf des Detailbereichs (bleibt bei langen
  Detailseiten erreichbar), Icon `arrow-left` + Text „Zurück" unterhalb
  `lg`. Löst denselben History-Schritt aus wie natives Browser-Zurück,
  kein zweiter Navigationspfad. Ausnahme: Deep-Link ohne vorherige
  App-History → frische Listenansicht im Default-Zustand. Rückkehr zur
  Liste zeigt Sortierung, Tag-Filter, Verknüpfung und Scrollposition
  unverändert, ohne sichtbaren Sprung/Reflow und ohne erneuten
  Ladezustand. Bereichswechsel selbst läuft ohne Seitenübergangs-Animation
  (kein Fade/Slide) — ein Bereichswechsel ist ein Sprung, keine
  Zustandsanimation.

## Master-Detail (ab `lg`)

- **Zwei Spalten innerhalb des 1120px-Containers** (nicht die
  Nav-Rail-Spalte): Liste fixe Breite (Richtwert ~400px), Detail nimmt den
  Rest (Mindestbreite, damit Formulare/Bilder-Raster nicht gequetscht
  werden), 24px Abstand, 1px `--border` als Spaltentrennung — Trennung
  hier über Rahmen **und** Abstand, da zwei parallel bediente Bereiche
  eine erkennbare Kante brauchen. Beide Spalten scrollen unabhängig
  voneinander.
- **Keine automatische Vorauswahl.** Ohne gewählten Ort zeigt die zweite
  Spalte einen ruhigen, rein typografischen Hinweis ohne Primär-Aktion
  (bewusste Abweichung vom „Leer"-Muster: es gibt keine andere Aktion als
  die bereits sichtbare Liste) — z. B. „Wähle einen Ort aus der Liste, um
  Details zu sehen." Erscheint **nicht**, wenn der Bestand leer ist oder
  der Filter null Treffer liefert — dort bleibt der jeweils bestehende
  Leerzustand die einzige Aussage. Keine Fehler-/Warnfarbe.
- **Auswahl-Hervorhebung** in der Liste: linke 3px-Kante
  `--color-primary-600` + Fläche `--color-primary-50`, zusätzlich
  `aria-current="true"`. Bleibt bestehen, auch wenn der Ort durch eine
  Filteränderung aus der sichtbaren Liste fällt (Detail bleibt offen,
  Hervorhebung ist dann nur nicht sichtbar).
- **Schließen ab `lg`**: Icon-only „×" (`aria-label` „Detailansicht
  schließen"), sticky an derselben Stelle wie die mobile Zurück-Aktion,
  ersetzt dort „Zurück" — die Liste bleibt ja sichtbar. Löst denselben
  History-Schritt aus wie Browser-Zurück. Erneuter Klick auf die bereits
  gewählte Zeile schließt nicht (kein Toggle) — Schließen hat genau einen
  Weg.
- **Wechsel des Inhalts** der Detailspalte (Auswahl ↔ leer, Ort A ↔ Ort
  B): 180ms-Crossfade (bestehende Ein-/Ausblenden-Konvention), keine
  Sheet-artige Slide-Bewegung — die Spalte selbst bewegt sich nicht, nur
  ihr Inhalt.
- **Fokus**: Öffnen bewegt den Fokus in die Detailspalte (erstes
  sinnvolles Element, z. B. Überschrift oder Schließen-Button), nicht
  erst nach Durchtabben der restlichen Liste. Schließen oder Löschen gibt
  den Fokus zurück auf die zugehörige Listenzeile bzw. die an ihrer
  Position nachrückende Zeile — nicht an den Listenanfang.
- **Breakpoint-Wechsel bei offener Detailspalte**: Unterschreiten von `lg`
  wechselt zur vollflächigen Detailansicht (nicht zurück zur Liste);
  Überschreiten hält denselben Ort offen, jetzt zweispaltig. Reiner
  CSS-Layoutwechsel bei gleicher Adresse, kein Navigations-Event, kein
  Refetch, keine Reflow-Animation.
- **Breitenabhängige Layouts in der Detail-Spalte** (z. B. das
  Bilder-Raster) richten sich nach der Spaltenbreite, nicht nach der
  Viewport-Breite — sonst zeigt sich bei ~1024px Viewport ein Raster mit
  mehr Spalten, als in der schmaleren Detail-Spalte Platz haben.

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

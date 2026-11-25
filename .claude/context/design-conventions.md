# Design Conventions — bewertung-app

> **Single-Writer: Nur der `ux-ui-designer`-Agent schreibt hierhin** (und nach
> `design/`). Alle anderen Rollen lesen nur; der `frontend-lead` setzt daraus um.
>
> Zweck: Das Gedächtnis des Designers. Einmal entschiedene
> Interaktions-Konventionen stehen hier, damit sie beim nächsten Feature
> wiederverwendet statt neu erfunden werden. Kein Styleguide, kein Moodboard —
> nur Festlegungen, die für die Umsetzung bindend und direkt in Code
> übersetzbar sind.
>
> **Kuratieren statt anhängen.** Wird eine Konvention abgelöst, ersetze den
> Eintrag statt einen zweiten danebenzustellen. Aufbau: **Hauptdatei = kurze,
> projektweit gültige Kernregeln (Faustregel < 300 Zeilen) + Register**;
> Detailspezifikationen einzelner Themen liegen in `design/*.md`, die Historie
> verdichtet in [`design/HISTORIE.md`](design/HISTORIE.md). Jede Regel steht an
> genau einem Ort. Neue Detailkonventionen gehören in die passende
> Themendatei, nicht hierher.

- **Zuletzt kuratiert**: 2026-11-25

## Register der Themendateien

Abschnittsnamen sind unverändert geblieben, damit Verweise der Form
„design-conventions.md ‚Abschnitt X'" über diese Tabelle auflösbar bleiben.

| Datei | Abschnitte darin |
|-------|------------------|
| [design/formulare.md](design/formulare.md) | Formulare (Detailregeln) · Mehrzeilige Textfelder wachsen mit dem Inhalt · Kurztextfeld mit Zeichenobergrenze · Bedingt sichtbare Formularabschnitte (Reveal ohne Rückweg) · Vorschlagsliste (Autocomplete) · Netzabhängige Type-ahead-Aktion |
| [design/commit-ohne-enter.md](design/commit-ohne-enter.md) | Tag-Eingabe: Commit ohne Enter · Tag-Eingabe: Ortswechsel ab `lg` · Bewertungsachse: Commit ohne Enter/Blur-Ersatz |
| [design/regler-bewertungsachse.md](design/regler-bewertungsachse.md) | Werte mit Bereich, bei denen 0 gültig ist (inkl. Intensitätsbalken) · Regler-Bahn und -Thumb |
| [design/listen.md](design/listen.md) | Listen: Sortieren, Filtern, Gruppierung (inkl. Werkzeugleiste, Ansichtsumschalter, Tag-Pills, UND/ODER) · Ortszeile: Sekundärzeile (Adresse/Anfangsnotiz) · Ansichtswechsel innerhalb eines Bereichs |
| [design/zonen-ortsliste.md](design/zonen-ortsliste.md) | Ortsliste: Zonenfarben und Hervorhebungs-Schatten (Plakette, Schatten, Auswahlkante, Screenreader-Text, Legende) |
| [design/gewichtung.md](design/gewichtung.md) | Gewichtung der Gesamtnote (inkl. Texte für Orte ohne Gesamtnote) |
| [design/karte.md](design/karte.md) | Karte (Leerzustände, Trefferzahl) · Karte: Marker, Namen, Ausschnitt |
| [design/schnellansicht.md](design/schnellansicht.md) | Karte: Quick-Look-Sheet (Schnellansicht) |
| [design/bildvorschau.md](design/bildvorschau.md) | Bilder · Bildvorschau (Vollbild) |
| [design/master-detail.md](design/master-detail.md) | Master-Detail (ab `lg`) |
| [design/zieh-wisch-schwellen.md](design/zieh-wisch-schwellen.md) | Zieh- und Wisch-Schwellen |
| [design/HISTORIE.md](design/HISTORIE.md) | Verdichtete Änderungshistorie aller Runden (keine geltenden Regeln) |

## Zustände

Grundsatz: **Zwei Zustände mit unterschiedlicher Ursache tragen nie denselben
Text**, auch wenn sie ähnlich aussehen (gilt für die Leer-Varianten unten, die
Karten-Leerzustände und „ohne Bewertung" vs. „ohne Gesamtnote bei dieser
Gewichtung").

| Zustand | Konvention |
|---------|------------|
| Leer (kein Datensatz) | Rein typografisch, kein Bild (design-concept.md: bis auf weiteres ohne Illustration); kurzer Satz + eine Primär-Aktion, zentriert. Beispiel: „Noch keine Orte eingetragen" + „Ort hinzufügen". |
| Leer (gefiltert, kein Treffer) | Gleiches Muster, andere Aussage (aktive Auswahl ohne Treffer) und andere Aktion („Filter zurücksetzen"). |
| Lädt | Rein lokale Lesevorgänge zeigen **keinen** Ladezustand. Skeleton/Spinner erst ab spürbar > 400 ms (Import/Export, viele Bilder, Bild-Verkleinerung). Bei einer Aktion mit **eigenem auslösenden Bedienelement** (Button) wandert der Ladezustand in dieses Element (Spinner + Kurztext an Ort und Stelle), kein Vollflächen-Overlay. Gilt **nicht** für Type-ahead ohne Auslöse-Element (siehe `design/formulare.md` → „Netzabhängige Type-ahead-Aktion"). Ein pro Ergebnis erscheinender Platzhalter (z. B. Bilder-Raster) folgt derselben > 400 ms-Schwelle ohne Button-Bezug. |
| Fehler | Kaum Feld-Validierung (fast alles optional); Werte außerhalb eines Bereichs werden geklemmt statt abgelehnt. Echte Fehler (Speicherzugriff, unbekannte Datenversion, beschädigte/fremde Import-Datei) als ruhige, nicht-modale Inline-/Vollflächen-Meldung in `--color-danger`, nie als Modal. |
| Warnung | Nur bei angekündigten, noch nicht eingetretenen Aktionen mit drohendem Datenverlust (Speichermangel beim Bild-Hinzufügen, „Bestand ersetzen" beim Import) — auslösendes/bestätigendes Element in `--color-warning`, nicht `--color-danger`. |
| Erfolg | Autosave hat **keine** sichtbare Bestätigung. Einzige Ausnahme: die Rückkehr-Markierung einer automatisch übernommenen Tag-Pille (`design/commit-ohne-enter.md`). Toast nur bei seltenen, expliziten Aktionen (Export/Import, bereitstehendes App-Update). |
| Leeres Feld (regulär) | Ein leeres, vorgesehenes Feld (Adresse, nicht bewertete Achse) ist normal, kein Fehler: Label bleibt, Wert-Slot zeigt „noch nichts eingetragen" / „Noch nicht bewertet" auf `--surface-muted`/`--text-muted`, Radius 8px, kein Icon. In Listenzeilen wird ein fehlender optionaler Wert weggelassen — **Ausnahme:** aktives Sortierkriterium. |

## Interaktion & Animation

- Kein separater „Bearbeiten"-Modus: Felder der Detailansicht sind inline
  editierbar, Autosave onBlur (Text) bzw. sofort (Zahl/Auswahl). Unbestätigter
  Text gilt als gewollter Wert und wird über die vier Auslöser aus ADR-0005
  Punkt 5 committet (`design/commit-ohne-enter.md`).
- Bestätigungsdialog (Sheet, 240 ms) nur bei **schwer/nicht rückgängig
  machbarem Verlust** (ganzer Ort, ein Bild); Button beschriftet, in
  `--color-danger`. **Leichte, wiederholbare Entfernungen** (Tag, Achse
  zurücksetzen) brauchen keine Bestätigung.
- Ein-/Ausblenden bedingter Formularteile 180 ms ease-out, nichts über 300 ms
  (design-concept.md); reduzierte Bewegung ersetzt statt entfällt.
- **Ein vollständiger Inhaltsaustausch ist projektweit ein Sprung**, keine
  Zustandsanimation (Bereichswechsel, Ansichtswechsel Liste ↔ Karte,
  Master-Detail-Inhaltswechsel, Bildvorschau-Blättern, Höhe wachsender
  Textfelder).
- Zieh-/Wisch-Entprellung: `design/zieh-wisch-schwellen.md`.

## Formulare (Kernregeln)

Detail (Regler-Commit, Zahlenfeld-Paare, wachsende Felder, Reveal, Type-ahead):
`design/formulare.md`.

- Nur echte Pflichtfelder über eine **deaktivierte Primär-Aktion** erzwungen
  (Button inaktiv bis Mindestangabe) — nie Sternchen oder Inline-Fehler.
  Optionale Felder nicht als „(optional)" markiert.
- Werte mit Bereich (z. B. 0–10) werden beim Verlassen des Feldes auf die
  nächstliegende Grenze geklemmt statt abgelehnt. **Das Klemmen greift nur bei
  tatsächlich eingegebenen Zahlen — ein leeres Feld ist kein Wert und wird nie
  auf die Untergrenze geklemmt**, sonst wäre Zurücksetzen unmöglich.
- 0 und „nicht gesetzt" sind verschieden (`design/regler-bewertungsachse.md`).

## Navigation & Routing

- **Navigationschrome nur, wenn dahinter noch etwas funktioniert.** Zustände,
  die den gesamten Bestand unbenutzbar machen (z. B. unbekannte, neuere
  Formatversion), bleiben ohne Navigationsebene. Jeder andere Zustand, auch
  „Adresse ohne Ziel", zeigt die Navigation. Gilt projektweit.
- **Chrome-Pattern**: mobil (bis `lg`) fixierte Bottom-Tab-Leiste (56px +
  `env(safe-area-inset-bottom)`, `--surface`, 1px `--border` oben statt
  Schatten, Hauptinhalt mit passendem Bottom-Padding); ab `lg` fixierte linke
  Nav-Rail (~80px) als eigene Chrome-Spalte außerhalb des 1120px-Containers,
  keine dritte Content-Spalte. Beide zeigen dasselbe Bereichsregister: Icon
  (Lucide Outline 24px) **plus sichtbarem Label**, nie Icon-only, auch bei nur
  einem Eintrag. Einträge werden nur angehängt, nie neu positioniert. Aktiv ohne
  Farbabhängigkeit: Gewicht 600 (inaktiv 400) + 2px-Indikatorlinie
  `--color-primary-600` + `aria-current="page"`. Kein App-Titel/Wortmarke.
  Touch-Ziele mind. 44×44px, Icon+Label ein Tap-Ziel.
- **Skip-Link** „Zum Hauptinhalt springen": erstes fokussierbares Element,
  visuell versteckt bis `:focus`, Ziel `#main-content`. DOM-/Tab-Reihenfolge
  Skip-Link → Navigation → Hauptinhalt; abweichende visuelle Position per CSS.
- **Adresse ohne Ziel** (kein Bereich, oder Detailadresse zu nicht
  vorhandenem Datensatz, inkl. „gerade gelöscht" und „Bereich existiert noch
  nicht"): **ein** Text für alle Ursachen, der **keine** Ursache nennt (die
  Ursache ist zur Anzeigezeit nie sicher bekannt, Bereiche entstehen
  nacheinander): „Diese Adresse führt zu keinem Inhalt." + Primär-Aktion zur
  Startübersicht des ersten Bereichs. Typografisch, zentriert, Navigation
  bleibt bedienbar, keine Fehler-/Warnfarbe, kein Alarm-Icon.
- **Zurück-Aktion**: sticky am Kopf des Detailbereichs, Icon `arrow-left` +
  Text „Zurück" unterhalb `lg`. Löst denselben History-Schritt aus wie
  Browser-Zurück, kein zweiter Navigationspfad. Ausnahme: Deep-Link ohne
  App-History → frische Listenansicht im Default-Zustand. Rückkehr zur Liste
  zeigt Sortierung, Tag-Filter, Verknüpfung und Scrollposition unverändert,
  ohne Sprung/Reflow und ohne erneuten Ladezustand. Ab `lg` siehe
  `design/master-detail.md` („×" statt „Zurück").

## Tokens & Spacing

- Komponenten binden ausschließlich an die semantische Ebene: `--surface`,
  `--surface-muted`, `--surface-sunken`, `--text`, `--text-muted`,
  `--text-on-primary`, `--border`, `--border-strong`, `--focus-ring` — nie an
  `neutral-XXX` direkt.
- Dezimalwerte (Gesamtnote, Achsenwerte) mit Komma, `tabular-nums`.

## Barrierefreiheit (Baseline)

- Fokusring (2px, 2px Offset) nie entfernen — auch nicht bei deaktivierten
  Primär-Buttons.
- Jede Regler-Bedienung hat eine gleichwertige Zahleneingabe-Alternative; bei
  leerem Wert kein `aria-valuenow`, sondern `aria-valuetext="nicht bewertet"`.
- Farbe ist nie alleiniger Bedeutungsträger (Details am Regler:
  `design/regler-bewertungsachse.md`).

## Bewusst offen gelassen

- Dichte von Tabellen/Listen — hängt vom Datenvolumen ab.
- Farbcodierung der vier Bewertungsachsen — weiterhin offen (design-concept.md),
  erst bei einem künftigen Achsen-Diagramm neu bewerten.

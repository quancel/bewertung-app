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
Eine gemeinsame Nachtrags-Runde von 003/004 (nach dem Schnitt-Wechsel, der
012 vor 003/004 einordnet) zieht die Werkzeugleiste auf die ~400px schmale
Listen-Spalte nach: zwei Zeilen bleiben in jeder Breite zwei Zeilen, die
Zurücksetzen-Aktion des Tag-Filters wandert an einen festen rechten Rand.
Eine Nachtrags-Runde von 006 (nach der Nutzerentscheidung für die volle
Breite der Kartenansicht, ADR-0019) ergänzt den Ansichtsumschalter in
Zeile 1, den dritten Karten-Leerzustand und den neuen Abschnitt
„Ansichtswechsel innerhalb eines Bereichs". Eine zweite Nachtrags-Runde von
006 (Nutzerentscheidung zur zwei-zahligen Kartenansicht-Trefferzahl) zieht
deren Wortlaut samt Kurzform-Schwelle nach und vereinheitlicht sie mit dem
Fallback des Ansichtsumschalters.

- **Zuletzt kuratiert**: 2026-09-11

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

- **Eine Werkzeugleiste, zwei Zeilen, nie zwei konkurrierende Leisten — in
  jeder Breite.** Zeile 1: links Sortier-Chip (Kriterium als Text) +
  angehängter Icon-Button für die Richtung (eigener Tap); rechts die
  Trefferzahl („12 Orte" / „4 von 12 Orten") — eine gemeinsame Stelle für
  Sortierung und Filter. Zeile 2 (nur wenn Tags existieren): links fest
  der UND/ODER-Umschalter (nicht scrollend), Mitte die horizontal
  scrollbare Tag-Pill-Leiste, rechts bei aktivem Filter fest die
  Zurücksetzen-Aktion (ebenfalls nicht scrollend) — zwei feste Anker,
  dazwischen scrollt ausschließlich die Pill-Leiste. Die zwei Zeilen
  bleiben **immer** zwei Zeilen und rücken in keiner Breite zu einer
  zusammen: unterhalb der Master-Detail-Grenze nimmt die Liste die volle
  Fensterbreite ein, ab der Grenze sitzt dieselbe Leiste unverändert in
  der ~400px schmalen Listen-Spalte (siehe „Master-Detail" unten) —
  richtet sich nach der Spaltenbreite, nicht nach der Fensterbreite, und
  die Spaltenbreite ändert sich nicht mit dem Fenster. (Eine frühere,
  breiten-umschaltende Variante mit einer gemeinsamen Kopfzeile ab `lg`
  ist überholt und ersatzlos gestrichen — sie ging von einer vollen
  Fensterbreite aus, die es seit der Zweispaltigkeit nicht mehr gibt.)
- **Ansichtsumschalter (z. B. Liste/Karte) in Zeile 1**: Icon-only Button,
  44×44, `aria-label` beschreibt Zustand **und** Ziel wie beim
  Richtungs-Button („Listenansicht aktiv — zur Kartenansicht wechseln" /
  „Kartenansicht aktiv — zur Listenansicht wechseln"), **kein**
  Segment-Control — in der ~368px schmalen Inhaltsbreite reicht der Platz
  nicht für ein zweites beschriftetes Tap-Ziel neben Sortier-Chip,
  Richtungs-Button und Trefferzahl (durchgerechnet: Chip + Richtung ~172px,
  Toggle 44px, Gaps ~16px lassen ~136px für die Trefferzahl — „128 von 128
  Orten" passt darin noch, zwei beschriftete Segmente á ~45-55px nicht
  mehr). Fester äußerster rechter Platz in Zeile 1, rechts von der
  Trefferzahl — dieselbe Logik wie die festen Ränder in Zeile 2; die
  Trefferzahl rückt dafür einen Schritt nach innen. Gilt unverändert in
  jeder Breite, auch über die volle Breite einer anderen Ansicht desselben
  Bereichs. **Fallback bei echter Enge**: Zeile 1 bekommt dafür erstmals
  eine Container Query (bislang bewusst keine, siehe Kommentar in
  `Werkzeugleiste.vue`) — Schwellenwert und Kurzform der Trefferzahl stehen
  jetzt an einer Stelle unter „Karte" → „Trefferzahl", weil die dortige,
  längere Kartenansicht-Fassung den eigentlich knappen Fall ist.
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
  Pills, Radius 999px) fest am linken Rand von Zeile 2, außerhalb der
  scrollbaren Filter-Pill-Leiste — bleibt immer sichtbar und bedienbar,
  auch bei null oder einem aktiven Filter (kein Ein-/Ausblenden, kein
  Zustandssprung beim ersten Filter-Tap). Aktiver Modus ist über die
  Hervorhebung im Umschalter selbst ablesbar, nicht über die Pills — die
  sehen in beiden Modi gleich aus. Die Verknüpfung ist eine
  Anzeigeeinstellung wie die Sortierung: überdauert Navigation/Neuladen,
  wird vom Zurücksetzen des Filters nicht mitgelöscht.
- **Zurücksetzen-Aktion des Tag-Filters** (nur bei aktivem Filter): sitzt
  spiegelbildlich zum Umschalter fest am **rechten** Rand von Zeile 2,
  ebenfalls außerhalb der scrollenden Pill-Leiste — dazwischen scrollt
  ausschließlich die Pill-Leiste selbst. Icon-only („×", `aria-label`
  „Filter zurücksetzen") statt Textlink, folgt derselben Optik wie
  Tag-Entfernen und Achse-Zurücksetzen (Wiedererkennung statt neuem
  Muster). Diese feste Randplatzierung gilt einheitlich für jede Breite —
  bei genügend Raum (volle Fensterbreite unterhalb der Master-Detail-
  Grenze) ebenso wie in der ~400px schmalen Listen-Spalte, wo sie sonst
  bei mehreren aktiven Tags nur durch Scrollen erreichbar wäre.

## Karte

- **Drei unterscheidbare Leerzustände** (ADR-0019 P10, „nie derselbe
  Text"): (1) Bestand insgesamt leer — der allgemeine Zustand aus „Leer
  (kein Datensatz)", greift bereits vor jeder Ansicht. (2) Tag-Filter lässt
  keinen Ort übrig — der bestehende Zustand „Leer (gefiltert, kein
  Treffer)", unverändert übernommen (Kopfzeile und Werkzeugleiste inkl.
  Tag-Filter bleiben sichtbar darüber). (3) **Neu**: Der Filter lässt Orte
  übrig, aber keiner davon hat Koordinaten — Text „Keiner der angezeigten
  Orte hat Koordinaten.", rein typografisch wie die übrigen Leerzustände,
  zentriert, ersetzt nur die Kartenfläche (Kopfzeile + Werkzeugleiste
  bleiben sichtbar). Primär-Aktion **„Zur Ortsliste"** (Filter bleibt beim
  Wechsel erhalten). Ersetzt den bisherigen Eintrag „kein Ort hat
  Koordinaten" vollständig: „angezeigten" macht den Bezug zum aktiven
  Filter klar, ohne dass der Zustand zwei Textvarianten bräuchte — ist kein
  Filter aktiv, ist die Aussage inhaltlich identisch zum bisherigen Text;
  ist einer aktiv, bleibt die feste Zurücksetzen-Aktion in Zeile 2 die
  schnellere Alternative zur eigenen Primär-Aktion.
- Zustand „Orte vorhanden, aber kein Netz für Kacheln" (Marker bleiben
  sichtbar, dazu ein kleiner Hinweis-Chip an einer festen Kante — kein
  vollflächiger Text, der die Marker verdeckt).
- **Trefferzahl in der Kartenansicht nennt zwei Zahlen** (Nutzerentscheidung
  2026-09-11, gesetzt — **keine Ableitung** des `ux-ui-designer`, deshalb
  nicht als Redundanz kürzbar): die sichtbaren Marker **und** die
  gefilterte Gesamtmenge, nicht wie in der Liste die gefilterte Menge und
  den Gesamtbestand. Zweiform-Muster analog zur Listen-Trefferzahl: sind
  beide Zahlen gleich (jeder gefilterte Ort hat Koordinaten), „{N} {Ort/
  Orte} mit Koordinaten"; sind sie unterschiedlich, „{sichtbar} von
  {gefiltert} {Ort/Orten} mit Koordinaten" — die Ort/Orten-Form richtet
  sich nach der **zweiten** Zahl (gefiltert), wie bei der Listen-Trefferzahl
  auch. Nur bei `sichtbar > 0` — bei `sichtbar === 0` (Leerzustand 2 oder 3
  oben) zeigt die Trefferzahl unverändert das gewöhnliche Listen-Format
  (gefiltert vs. Gesamtbestand, **ohne** „mit Koordinaten"): der
  Leerzustand-Text trägt die Koordinaten-Aussage dann bereits allein — die
  Zahl würde sie sonst ein zweites Mal machen („nie derselbe Text" gilt
  sinngemäß auch zwischen Zähler und Leerzustand-Prosa, nicht nur zwischen
  zwei Leerzuständen).
  **Platz**: Die lange Form läuft ausschließlich in der Kartenansicht, die
  immer die volle Inhaltsbreite hat (ADR-0019 P5, kein `MasterDetail`) —
  die ~400px schmale Listen-Spalte kommt dort nicht vor. Diese volle Breite
  ist unterhalb `lg` aber die tatsächliche, teils sehr schmale
  Fensterbreite eines Telefons (~320-390px Inhaltsbreite) — dort
  überschreitet der Extremfall „128 von 128 Orten mit Koordinaten" (34
  Zeichen) den verfügbaren Platz deutlich, mit oder ohne
  Ansichtsumschalter. Deshalb **ein gemeinsamer Container-Query-Schwellenwert
  auf Zeile 1 für beide Ansichten**, an der bestehenden Breakpoint-Skala
  ausgerichtet: **unterhalb 768px Containerbreite** („md") gilt die
  Kurzform, **ab 768px** die ausgeschriebene. Kurzform: das Wortpaar „von …
  Ort(en)" wird zum Schrägstrich („{sichtbar}/{gefiltert}"); in der
  Kartenansicht entfällt zusätzlich das Suffix „mit Koordinaten" zugunsten
  eines kleinen Stecknadel-Symbols vor der Zahl (gleiche Formsprache wie
  die Kartenmarker, aber **`--text-muted`, nicht `--color-accent-500`** —
  der Akzent bleibt ausschließlich den echten Markern auf der Karte
  vorbehalten). Der reine Gleichstand-Fall in der Liste („12 Orte") ändert
  sich unterhalb 768px nicht — er ist bereits kurz genug. Der volle Wortlaut
  bleibt in beiden Ansichten über `aria-label` am Trefferzahl-Element hörbar
  vorhanden, unabhängig von der visuellen Kurzform.
- **Sortier-Bedienelement bleibt in der Kartenansicht sichtbar und
  bedienbar**, obwohl es dort ohne sichtbare Wirkung ist (Marker haben
  keine Reihenfolge, ADR-0019 P9). Kein Ausblenden, kein `disabled`-
  Zustand: Ein bei jedem Ansichtswechsel erscheinendes/verschwindendes
  Bedienelement wäre der größere Bruch (Sprung in Zeile 1, Positionswechsel
  von Trefferzahl und Umschalter) als eines, das hier gerade nichts sichtbar
  bewirkt — die Sortierung ist eine gespeicherte Einstellung, die beim
  Rückwechsel zur Liste wieder wirkt, kein toter Programmierrest.
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

## Ansichtswechsel innerhalb eines Bereichs (Query-Parameter `ansicht`)

- **Ein Wechsel zwischen zwei Ansichten desselben Bereichs** (z. B. `/orte`
  ↔ `/orte?ansicht=karte`) **ist ein Sprung, keine Zustandsanimation** —
  kein Fade/Slide, analog zum Bereichswechsel (siehe „Navigation &
  Routing" → Zurück-Aktion). Das unterscheidet sich vom 180ms-Crossfade der
  Master-Detail-Spalte: Der Crossfade ist für einen Inhaltswechsel
  **innerhalb** einer stabil bleibenden Spalte reserviert (Auswahl ↔
  Auswahl), nicht für einen Wechsel, der die gesamte Spaltenstruktur ändert
  und eine eigene `push`-Navigation mit eigenem History-Eintrag ist.
- **Gemeinsame Bedienelemente** (Kopfzeile, Werkzeugleiste inkl.
  Tag-Filter) **bleiben über beide Ansichten identisch** — derselbe
  Baustein, nur ein breiterer Container; kein separates Erscheinungsbild
  je Ansicht.
- **Ein Bedienelement, das in einer Ansicht wirkungslos ist, aber in einer
  anderen Ansicht desselben Bereichs eine gespeicherte, dort wirksame
  Einstellung repräsentiert** (z. B. die Sortierung in der Kartenansicht,
  siehe „Karte"), **bleibt sichtbar und bedienbar** — kein Ein-/Ausblenden
  je Ansicht.
- **Rückkehr aus der Detailansicht in eine Nicht-Listen-Ansicht** (z. B.
  Karte): Fokus geht auf das zuvor geöffnete Element zurück (den Marker),
  analog zur Fokusrückgabe auf die Listenzeile im Master-Detail-Pattern.

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

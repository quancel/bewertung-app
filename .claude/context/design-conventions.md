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
Fallback des Ansichtsumschalters. Eine Korrektur-Runde nach einem
Abnahme-Befund zu 012 (2026-09-11) streicht den 180ms-Crossfade des
Master-Detail-Inhaltswechsels ersatzlos — er wurde nie gebaut, kein
Akzeptanzkriterium fordert ihn, und er war inhaltlich nicht mit dem
inzwischen für den Ansichtswechsel festgelegten Sprung-Verhalten
vereinbar. Beide Wechsel gelten jetzt einheitlich als Sprung. Eine zweite
Korrektur-Runde (2026-09-11, Meldung des `frontend-lead` zur Ortssuche)
präzisiert die „Lädt"-Zeile unter „Zustände": Sie galt nur für Aktionen mit
einem eigenen auslösenden Bedienelement (Button) und meinte nie eine
Type-ahead-Suche ohne Button — Ortssuche war dort das falsche Beispiel und
ist entfernt. Der zugehörige Eintrag unter „Listen" trägt jetzt zusätzlich
den bislang nur paketbezogen (`design_notes` PO-2026-09-07-008) notierten
Ladehinweis-Text nach, damit er als wiederkehrende Konvention und nicht nur
als Einzelfall-Notiz steht. Eine dritte Korrektur-Runde (2026-09-12,
Abnahmebefund PO-2026-09-12-003 — Wiederkehr des am 2026-09-11 nur
teilweise behobenen Befundes) revidiert „Netzabhängige Type-ahead-Aktion"
grundlegend: „dieselbe Stelle unter dem Feld" war als gemeinsame,
überlagernde Fläche gelesen worden und hatte auf schmalen Bildschirmen
weiterhin drei der vier Hinweistexte über das nachfolgende Feld gelegt,
ohne Escape-Möglichkeit auf Touchgeräten. Nur die tatsächliche Trefferliste
bleibt jetzt eine Überlagerung; die vier Hinweistexte stehen im
Dokumentfluss. Die „Vorschlagsliste (Autocomplete)"-Konvention bekommt im
selben Zug einen Blur-Schließt-Zusatz. Eine weitere Korrektur-Runde
(2026-09-12, PO-2026-09-12-002 — die Koordinatenzeile ragt auf 320-390px
schmalen Geräten aus dem Bildschirm) ersetzt das bisherige Nebeneinander von
Breite/Länge durch ein Untereinander, je ein volles Feld pro Zeile wie
Bezeichnung/Adresse; die neue Regel zu Zahlenfeld-Paaren unter „Formulare"
hält das als wiederkehrende Konvention fest, nicht nur als Einzelfall. Eine
dritte Design-Runde von PO-2026-09-12 (005 — Koordinatenfelder werden vom
gleichberechtigten Feldpaar zum Notnagel für eine erfolglose Ortssuche)
ergänzt den neuen Abschnitt „Bedingt sichtbare Formularabschnitte (Reveal
ohne Rückweg)" und löst damit den bislang nur vorausschauenden Hinweis unter
„Netzabhängige Type-ahead-Aktion" ein. Eine vierte Korrektur-Runde
(2026-09-13, PO-2026-09-13-001/-002 — ein Nutzer fand den Regler einer
frisch angelegten Achse „nicht existent", weil dessen Thumb bei `null` per
`opacity: 0` vollständig ausgeblendet war, dazu ein zweiter, unabhängiger
Fehler im Commit-Pfad) ersetzt unter „Formulare" und „Werte mit Bereich, bei
denen 0 gültig ist" die Sichtbarkeits-basierte Unterscheidung des
Regler-Thumbs durch eine Farb-basierte: der Thumb bleibt jetzt in jedem
Zustand sichtbar und bedienbar, „nicht gesetzt" und „gesetzt" unterscheiden
sich über `accent-color` (neutral vs. Primärton) statt über Sichtbarkeit —
die dahinterliegende Absicht („nicht bewertet" sieht nie wie eine gesetzte 0
aus) bleibt dabei erhalten. Eine fünfte Korrektur-Runde (2026-09-15,
Nachprüfung des `architekt` nach Abnahme von PO-2026-09-13-001/-002/-003)
korrigiert zwei Stellen dieser vierten Runde, die durch die anschließende
Umsetzung überholt bzw. schlicht falsch waren. Unter „Formulare" ist *jeder*
Eingabepfad eines Achsenwertes an dieselbe Runden-und-Klemmen-Logik
gebunden, auch der native Regler (ADR-0007 Punkt 7) — die ursprünglich
notierte Ausnahme für den Regler ist verworfen, da ein `<input>`-Element nur
einen String liefert und „bereits gültige Zahl" eine Annahme über
Browserverhalten und dauerhaft passende `min`/`max`/`step`-Attribute wäre,
keine Eigenschaft des Datenmodells. Ebenso falsch war die Annahme, ein Tipp
auf die Bahn löse immer dasselbe `input`-Ereignis aus wie ein
Zwischenschritt beim Ziehen: Steht der Regler bei `null` optisch auf 0,
ändert ein Tipp aufs linke Bahnende den nativen Wert nicht — es gibt **kein**
Ereignis, und eine bewusste 0 wäre über die Bahn nicht erreichbar.
Umgesetzt ist deshalb ein zusätzlicher Commit auf abgeschlossene
Zeigerbedienung (`pointerup`) und auf Tastenbedienung mit Wertbezug
(`keyup` auf Pfeil-/Pos1-/Ende-/Bild-Tasten), jeweils nur solange der Wert
`null` ist. Unter „Werte mit Bereich, bei denen 0 gültig ist" →
„Regler-Thumb" benennt dieselbe Runde die tragenden Auszeichnungen des
Kriteriums „nicht allein über Farbe" jetzt ausdrücklich (Intensitätsbalken,
Zurücksetzen-Knopf, Zahlenfeld-Platzhalter „–", Kopfbereich „Noch nicht
bewertet") statt eines isoliert lesbaren Satzes, der sich als Widerspruch
zur eigenen Baseline liest — Abnahme-Bestätigung des `product-owner` zu
PO-2026-09-13-003: das Kriterium ist erfüllt, aber nicht durch den Regler,
der für sich genommen rein farbunterschieden bleibt. Eine sechste
Korrektur-Runde (2026-09-16, PO-2026-09-16-001 — Live-Bestätigung des
Nutzers auf iOS Safari: der Regler-Thumb einer frisch angelegten Achse war
ohne jede Bedienung nicht erkennbar) korrigiert nicht die Absicht der
fünften Runde, sondern ihren Mechanismus: Der `product-owner` hat
verifiziert, dass `accent-color` bei `<input type="range">` in WebKit im
Wesentlichen die **gefüllte Bahn links vom Thumb** tönt, nicht den Thumb
selbst — bei Position 0 (gilt für `null` **und** eine bewusst gesetzte 0
gleichermaßen) ist diese Fläche null Pixel breit, es gibt nichts zu
färben, der Thumb bleibt ununterscheidbar vom Hintergrund. Eine einzelne,
browser-uneinheitliche Eigenschaft trug damit sowohl Sichtbarkeit als auch
Zustandsunterscheidung zugleich — fiel sie aus, fiel beides aus. Unter
„Regler-Thumb" trägt jetzt der Thumb **selbst**, über explizite
`::-webkit-slider-thumb`/`::-moz-range-thumb`-Regeln (Rahmen + Füllfarbe,
in **beiden** Zuständen vorhanden, unabhängig vom Füllstand der Bahn), die
Sichtbarkeit; `accent-color` bleibt als nicht-tragendes Zweitsignal
erhalten, ist aber nicht mehr die einzige Grundlage. Die Baseline „Farbe
nie alleiniger Bedeutungsträger" ändert sich dadurch nicht und bleibt
weiterhin durch dieselben drei Nachbar-Auszeichnungen erfüllt (unverändert
gegenüber der fünften Runde) — der Thumb bleibt für sich genommen zwischen
den zwei Zuständen weiterhin rein farbunterschieden, ist jetzt aber
überhaupt erst sichtbar. Eine siebte Korrektur-Runde (2026-09-17,
PO-2026-09-16-001) korrigiert die sechste Runde grundlegend: Der `architekt`
hat sie als strukturell unerfüllbar zurückgewiesen, weil ihr
Degradations-Satz — „zeigt ihren nativen, ungefärbten Thumb — bereits von
sich aus sichtbar" — exakt in den gemeldeten Fehler zurückführte; der
heutige, defekte Zustand IST nativer Thumb + `accent-color`. Zusätzlich blieb
offen, ob `appearance: none` allein auf dem Thumb-Pseudo-Element in WebKit
überhaupt greift, ohne dass das `<input>` selbst es trägt — hier nicht
verifizierbar (ADR-0023 Punkt 5). Der Nutzer wurde genau zu dieser Abwägung
befragt und hat sich für die sichere Variante entschieden: `appearance: none`
jetzt auch auf dem `<input>` selbst, nicht nur auf dem Thumb. Die native Bahn
entfällt damit vollständig; der Regler zeichnet Bahn **und** Thumb komplett
selbst und sieht auf keiner Engine mehr nativ aus — eine bewusste, vom Nutzer
getragene Entscheidung, kein Kompromiss. Der bisherige Abschnitt
„Regler-Thumb" heißt jetzt „Regler-Bahn und -Thumb" und ist entsprechend neu
gefasst: Die Bahn übernimmt dieselbe Optik wie die Intensitätsbalken-Spur
(8px, 1px `--border`, `--radius-full`, `--surface`, immer gleich, keine
eigene Füllung — die würde der bereits vorhandene Intensitätsbalken
redundant doppeln) und sitzt dabei direkt auf dem `<input>`-Element selbst,
nicht nur auf einem Pseudo-Element — genau das macht sie zum Ausfall-Anker
und löst den Blocker: Unterstützt eine Engine trotz erfolgreichem
`appearance: none` die Track-/Thumb-Pseudo-Selektoren nicht, bleibt die Bahn
trotzdem sichtbar, weil ihre Optik nicht hinter einem möglicherweise
ungenutzten Selektor liegt — ausfallen kann in diesem Fall ausschließlich der
Thumb. `accent-color` entfällt ersatzlos, da es sobald Bahn und Thumb
vollständig selbst gezeichnet werden in keiner Engine mehr eine Wirkung hat.
Thumb-Werte (Rahmen, Füllfarben, Kontraste, Größe) aus der sechsten Runde
bleiben unverändert gültig, da unabhängig von der Bahnfrage.

- **Zuletzt kuratiert**: 2026-09-17

## Zustände

Grundsatz: **Zwei Zustände mit unterschiedlicher Ursache tragen nie
denselben Text**, auch wenn sie optisch ähnlich aussehen — sonst sind sie
für die Nutzerin ununterscheidbar (gilt u. a. für die drei Leer-Varianten
unten und für die beiden Karten-Leerzustände, siehe „Karte").

| Zustand | Konvention | Seit |
|---------|------------|------|
| Leer (kein Datensatz) | Rein typografisch, kein Bild (design-concept.md: bis auf weiteres ohne Illustration); kurzer Satz + eine Primär-Aktion, zentriert. Beispiel: „Noch keine Orte eingetragen" + „Ort hinzufügen". | 2026-09-07 |
| Leer (gefiltert, kein Treffer) | Gleiches Muster wie oben, andere Aussage (aktive Auswahl führt zu keinem Treffer) und andere Aktion („Filter zurücksetzen"). | 2026-09-07 |
| Lädt | Rein lokale Lesevorgänge zeigen **keinen** Ladezustand — gilt als synchron schnell genug. Skeleton/Spinner erst ab spürbar > 400 ms (z. B. Import/Export, viele Bilder, Bild-Verkleinerung). Bei einer expliziten Aktion mit einem **eigenen auslösenden Bedienelement** (Button/Kontrollelement, z. B. „Export starten", Import-Datei wählen, „Bestand ersetzen" bestätigen) wandert der Ladezustand in dieses Element selbst (Button-Inhalt wechselt zu Spinner + Kurztext, bleibt an Ort und Stelle) — kein Vollflächen-Overlay. Gilt **nicht** für Type-ahead-Interaktionen ohne eigenes Auslöse-Element (die Suche läuft beim Tippen, es gibt keinen Button, in den ein Zustand wandern könnte) — dafür siehe „Listen" → „Netzabhängige Type-ahead-Aktion". Ein pro Ergebnis erscheinender Platzhalter an dessen künftiger Position (z. B. Bilder-Raster) ist ebenfalls kein „auslösendes Element" im Sinne dieser Regel, sondern folgt derselben > 400 ms-Schwelle ohne Button-Bezug. | 2026-09-08 |
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
  unterstützend, bidirektional synchron und **immer mit sichtbarem,
  bedienbarem Thumb** — auch ohne gesetzten Wert (PO-2026-09-13-002: ein
  komplett ausgeblendeter Thumb machte den Regler unauffindbar). Wie sich
  „nicht gesetzt" und „gesetzt 0" beim Regler unterscheiden, steht unter
  „Werte mit Bereich, bei denen 0 gültig ist" → „Regler-Bahn und -Thumb".
  Der Regler
  committet auf **jedes** `input`-Ereignis, nicht erst auf `change`. **Jeder**
  Eingabepfad eines Achsenwertes läuft durch dieselbe
  Runden-und-Klemmen-Logik, auch der native Regler (ADR-0007 Punkt 7,
  korrigiert 2026-09-15 — eine frühere Fassung nahm hier fälschlich eine
  Ausnahme an): Was aus dem `<input>`-Element kommt, ist zunächst nur ein
  String; dass er bereits eine gültige, auf Step/Min/Max geklemmte Zahl ist,
  wäre sonst eine Annahme über Browserverhalten und darüber, dass
  `min`/`max`/`step` im Template dauerhaft zur Domänenregel passen — keine
  Eigenschaft des Datenmodells selbst. **Sonderbehandlung bei `null`**: Steht
  der Regler bei „nicht bewertet" optisch auf 0, löst ein Tipp direkt auf das
  linke Bahnende **kein** `input`-Ereignis aus — der native Wert ändert sich
  nicht, weil er bereits 0 ist. Ohne Sonderbehandlung bliebe die Achse „nicht
  bewertet", und eine bewusste 0 wäre über die Bahn nicht erreichbar. Deshalb
  committet der Regler zusätzlich bei abgeschlossener Zeigerbedienung
  (`pointerup`) und bei Tastenbedienung mit Wertbezug (`keyup` auf
  Pfeil-/Pos1-/Ende-/Bild-Tasten) — jeweils **nur solange der Wert `null`
  ist** (sobald ein Wert gesetzt ist, trägt bereits jedes `input`-Ereignis).
- **Zahlenfeld-Paare (z. B. Koordinaten) stehen standardmäßig untereinander**,
  je ein volles Feld pro Zeile wie jedes andere Formularfeld — kein
  Nebeneinander per Flex-Row. Grund (PO-2026-09-12-002, durchgerechnet):
  bei 320px Gerätebreite bleiben zwei nebeneinander stehenden Feldern nur
  ~136px je Feld; ein Extremwert wie „-179.999999" (11 Zeichen) braucht bei
  16px Inter/tabular-nums allein rund 120px Text + Innenabstand — der Rest
  reicht kaum als Puffer und wird von einem nativen Zahlenfeld-Spinner
  (Desktop-Browser) bereits aufgezehrt. Untereinander steht derselbe Wert
  immer vor der vollen Feldbreite (mind. ~270px auch im schmalsten Fall),
  ohne Breitenumbruch oder Container Query. **Ausnahme**: das
  Zahl+Regler-Paar der Bewertungsachse (feste 64px-Zahl neben
  schrumpfendem Regler, `min-width: 0`) — dort ist die Zahl kurz (0–10,
  max. 2 Nachkommastellen) und kein Vergleichsfall für längere Werte wie
  Koordinaten.

## Bedingt sichtbare Formularabschnitte (Reveal ohne Rückweg)

Erstmals für die Koordinatenfelder als Notnagel (PO-2026-09-12-005) — gilt
für jeden künftigen Formularabschnitt, der nur unter bestimmten Bedingungen
sichtbar sein soll, während ein anderer Weg (hier: die Ortssuche) im
Normalfall vorrangig ist.

- **Reveal statt Toggle**: ein verborgener Abschnitt hat genau **ein**
  Bedienelement, das ihn zeigt — kein Wiedereinklappen. An der Stelle des
  Abschnitts steht bis dahin ein einzelner, zurückhaltender Text-Button
  (`--color-primary-700`, kein Rahmen/keine Fläche, wie ein Link),
  min. 44×44px Tap-Ziel, `aria-expanded="false"` und `aria-controls` auf die
  (stabile) ID des Wrapper-Elements. Sobald aktiviert, ersetzt der
  Abschnitt selbst den Button an genau dieser Stelle (kein Nebeneinander,
  kein toter Button daneben).
- **Einmal sichtbar, bleibt sichtbar** — für die Lebensdauer der aktuell
  geöffneten Instanz (z. B. eines Detaildatensatzes), unabhängig davon, ob
  der ursprüngliche Auslöser danach wieder entfällt (Grundsatz: ein
  zustandsgesteuertes Erscheinen darf kein zustandsgesteuertes Verschwinden
  nach sich ziehen). Beim erneuten Öffnen **derselben oder einer anderen**
  Instanz gilt die Sichtbarkeitsregel wieder von vorn — der aufgeklappte
  Zustand wird nicht gespeichert (keine Anzeigeeinstellung,
  ADR-0006/ADR-0009 gilt sinngemäß auch ohne Persistenzbezug). Bei
  mehreren Instanzen in derselben Ansicht (z. B. Master-Detail-Wechsel
  zwischen zwei Datensätzen ohne Schließen der Detailspalte) muss die
  Sichtbarkeits-Kennung an die jeweilige Instanz-ID gebunden sein, sonst
  überlebt sie fälschlich den Wechsel.
- **Fokus wandert NUR bei manueller Auslösung** in den neu sichtbaren
  Abschnitt (erstes Feld). Wird der Abschnitt durch einen automatischen
  Zustandswechsel eingeblendet (z. B. ein im Hintergrund fehlgeschlagener
  Abruf), bewegt sich der Fokus **nicht** — die Nutzerin bedient zu diesem
  Zeitpunkt typischerweise noch ein anderes Feld, ein Fokus-Sprung wäre eine
  Unterbrechung, kein Komfort.
- **Mehrere unabhängige Auslöser derselben Sichtbarkeit** (z. B. „Wert
  bereits vorhanden" ODER „ein anderer Vorgang ist erfolglos" ODER
  „manuell geöffnet") werden ODER-verknüpft, nie exklusiv — ein einzelner
  erfüllter Grund genügt und schließt keinen anderen aus.
- Ein-/Ausblenden des Abschnitts 180ms ease-out wie jeder andere bedingte
  Formularteil (design-concept.md „Motion"), reduzierte Bewegung ersetzt
  statt entfällt.

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
- **Regler-Bahn und -Thumb** (PO-2026-09-16-001, siebte Runde — der
  `architekt` hat die sechste Runde als strukturell unerfüllbar
  zurückgewiesen: ihr Degradations-Satz „zeigt ihren nativen, ungefärbten
  Thumb — bereits von sich aus sichtbar" führte in genau den gemeldeten
  Fehler zurück, siehe Änderungshistorie oben. Der Nutzer hat sich daraufhin
  für die sichere Variante entschieden: **`-webkit-appearance: none`/
  `appearance: none` jetzt auch auf dem `<input>` selbst**, nicht nur auf dem
  Thumb-Pseudo-Element — die native Bahn entfällt damit vollständig und wird
  komplett selbst gezeichnet. Der Regler sieht dadurch auf keiner Engine mehr
  nativ aus (bewusst, vom Nutzer getragen, nicht auf iOS beschränkt — dieselbe
  Optik gilt einheitlich in jedem Browser, analog zur bestehenden Praxis,
  beide Vendor-Präfixe immer gemeinsam zu pflegen statt browserspezifisch zu
  verzweigen).
  - **Bahn**: gleiche Werte wie die Intensitätsbalken-Spur
    (`Intensitaetsbalken.vue` → `.intensitaetsbalken__spur`), zur
    Wiedererkennung statt einer dritten Balkenoptik im selben Formular: Höhe
    8px, `border: 1px solid var(--border)`, `border-radius: var(--radius-full)`,
    `background-color: var(--surface)` — **in jedem Zustand identisch**,
    kein Unterschied zwischen „nicht gesetzt" und „gesetzt", keine Füllung.
    Bewusst **kein** per Füllstand eingefärbter Bahnabschnitt: Der
    Intensitätsbalken direkt darunter zeigt dieselbe Information bereits
    (Tonleiter `--color-neutral-100`→`--color-primary-600`) — ein zweiter,
    separat berechneter Füllbalken in der Reglerbahn wäre dieselbe
    Information doppelt gezeichnet und doppelt zu pflegen, ohne eigenen
    Erkenntniswert.
  - **Anker-Prinzip (löst den Blocker der sechsten Runde)**: Rahmen, Radius,
    Hintergrund und Höhe der Bahn stehen direkt auf dem Basis-Selektor
    (`input[type="range"].bewertungsachse__regler`), **nicht nur** auf
    `::-webkit-slider-runnable-track`/`::-moz-range-track`. Die
    Track-Pseudo-Elemente selbst bekommen nur einen Reset (`background:
    transparent`, `border: none`, dieselbe Höhe/Radius), damit sie die
    Anker-Optik des Inputs durchscheinen lassen statt sie zu überdecken.
    Grund: Sitzt die sichtbare Bahn nur auf einem vendor-spezifischen
    Pseudo-Element, hängt ihre Sichtbarkeit an genau dem Selektor, dessen
    Fehlen der eigentliche Ausfall wäre — sitzt sie stattdessen auf dem
    Element selbst, bleibt sie bestehen, unabhängig davon, ob die
    Pseudo-Selektoren zusätzlich greifen.
  - **Thumb** — Werte aus der sechsten Runde unverändert gültig, weil
    unabhängig von der Bahnfrage: `::-webkit-slider-thumb` **und**
    `::-moz-range-thumb` bekommen dieselbe Bauform, je ein eigener, immer
    vorhandener 2px-Rahmen + Füllfarbe. **Nicht gesetzt**: Hintergrund
    `var(--surface)`, Rahmen 2px `var(--text-muted)` (Kontrast ≈ 4,8:1).
    **Gesetzt** (inkl. 0): Hintergrund `var(--color-primary-600)`, Rahmen
    2px `var(--color-primary-600)` (Kontrast ≈ 6,1:1). Beide über dem
    3:1-Ziel für UI-Elemente. Größe/Form ändern sich zwischen den Zuständen
    nicht, nur Rahmen-/Füllfarbe. `-webkit-appearance: none`/
    `appearance: none` bleibt zusätzlich auf dem Thumb-Pseudo-Element selbst
    nötig (WebKit verlangt es dort separat, unabhängig davon, dass es jetzt
    auch auf dem `<input>` steht) — beide Vendor-Varianten weiterhin
    Pflicht, keine optional.
  - **`accent-color` entfällt ersatzlos.** Es war in der sechsten Runde als
    „nicht-tragendes Zweitsignal" vorgesehen; sobald `appearance: none`
    sowohl Bahn als auch Thumb vollständig selbst zeichnet, hat die
    Eigenschaft in keiner Engine mehr eine sichtbare Wirkung, ist also nicht
    mehr nachrangig, sondern gegenstandslos. Aus dem Code entfernen, kein
    toter Attribut-Rest, der ein Signal vortäuscht, das es nicht mehr gibt.
  - **Degradation — jetzt wahr, nicht mehr in den gemeldeten Fehler
    zurückführend.** Unterstützt eine Engine `appearance: none` auf dem
    `<input>`, aber nicht die vendor-spezifischen Track-/Thumb-Pseudo-Selektoren
    (kein bekannter Fall unter iOS Safari/Chromium, die Eigenschaft muss es
    dennoch aushalten, ADR-0023 Punkt 5 — kein WebKit-Testlauf hier
    verifizierbar): Weil die Bahn-Optik auf dem `<input>`-Element selbst
    sitzt (siehe Anker-Prinzip oben), bleibt sie in diesem Fall unverändert
    bestehen. Ausfallen kann in diesem Szenario ausschließlich der Thumb —
    er verliert seine eigene Farbe/seinen Rahmen und fällt auf die
    Engine-eigene, ungestylte Thumb-Darstellung zurück. Anders als die
    verworfene sechste Runde wird hier **nicht** behauptet, dieser native
    Thumb sei „bereits von sich aus sichtbar" — das war der widerlegte Satz,
    der genau in den gemeldeten Fehler zurückführte (nativer Thumb +
    `accent-color` **ist** der defekte Ausgangszustand). Die tragende
    Aussage ist eine andere: Der Regler als Ganzes ist in diesem Ausfall nie
    eine vollständig blanke/unsichtbare Fläche, weil die Bahn strukturell
    nicht vom Erfolg der Thumb-Pseudo-Selektoren abhängt — sie ist über den
    Basis-Selektor abgesichert, nicht über ein zusätzliches, mögliches
    Fallback-Signal.
  - **Fokusring**: Die projektweite `:focus-visible`-Regel (`base.css`)
    greift unverändert auf jedes fokussierbare Element, auch auf
    `input[type="range"]` — keine neue Mechanik nötig. Ein Nebeneffekt der
    Entscheidung gegen eine eigene Füllung in der Bahn (siehe oben): kein
    `overflow: hidden` auf der Bahn nötig, also auch kein Risiko, den Ring an
    der abgerundeten Bahn zu beschneiden. **Vom Frontend-Lead im Rauchtest zu
    verifizieren** (hier nicht prüfbar, kein WebKit-Testlauf, ADR-0023
    Punkt 5): Manche WebKit-Versionen unterdrücken den Fokusring auf
    `<input type="range">` zusätzlich bei gesetztem `-webkit-appearance:
    none`. Zeigt sich das, ergänzt eine explizite, höher-spezifische
    `.bewertungsachse__regler:focus-visible { outline: var(--focus-ring-width)
    solid var(--focus-ring); outline-offset: var(--focus-ring-offset); }` als
    Fallback — dieselben Tokens wie die globale Regel, keine neuen Werte.
  - **Baseline „Farbe nie alleiniger Bedeutungsträger" bleibt bestätigt,
    unverändert gegenüber der fünften Runde.** Die Bahn ist jetzt bewusst
    zustandsfarblos (immer `--surface`/`--border`, unabhängig vom Wert) —
    trägt also gar keine Unterscheidung mehr, weder tragend noch als
    Zweitsignal. Die Unterscheidung „nicht gesetzt"/„gesetzt" bleibt
    ausschließlich am Thumb (reine Farbänderung) sowie an denselben drei
    Nachbar-Auszeichnungen wie bisher: Intensitätsbalken (kein Balken bei
    `null`, nur Platzhaltertext, siehe oben), Zurücksetzen-Knopf (erscheint
    erst bei gesetztem Wert), Zahlenfeld-Platzhalter „–" statt einer Zahl.
    Wer eine davon entfernt oder auch bei `null` rendert, kippt das
    Kriterium weiterhin, ohne den Regler selbst anzufassen.
  - `aria-valuenow`/`aria-valuetext` unverändert (siehe „Barrierefreiheit
    (Baseline)"): bei `null` weiterhin kein `aria-valuenow`, sondern
    `aria-valuetext="nicht bewertet"` — assistive Technologie meldet nie
    eine Zahl für einen ungesetzten Wert, auch wenn der Thumb visuell auf 0
    steht.
  - **Trefferfläche**: unverändert die 44×44px-Mindestgröße
    (design-concept.md „Barrierefreiheit"), aber der Rechenweg ändert sich:
    Die Bahn hat jetzt eine explizite Höhe (8px) statt der nativen
    intrinsischen Höhe des Browsers, gegen die das bisherige
    `padding: 14px 0` gerechnet war. Der Frontend-Lead rechnet das vertikale
    Padding gegen die neue Bahnhöhe **und** die tatsächliche Thumb-Größe neu
    (beide zusammen müssen mindestens 44px Trefferfläche ergeben) —
    weiterhin über Padding auf dem `<input>`, nicht über eine sichtbar
    vergrößerte Bahn oder einen vergrößerten Thumb.

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
  Teilstring-Treffer case-insensitive, Pfeiltasten + Enter, Escape **und**
  Blur/Tap außerhalb schließen (Ergänzung 2026-09-12, PO-2026-09-12-003 —
  ohne Blur-Schluss könnte eine volle 6er-Liste auf einem Touchgerät ohne
  Escape-Taste ein direkt darunterliegendes Feld ebenso verdecken wie die
  Hinweistexte, die dieser Befund für die Ortssuche korrigiert; gilt für
  jedes Vorkommen, auch das bestehende `TagEingabe.vue`). Ein am selben Ort
  bereits vergebener Tag, erneut exakt eingetippt und bestätigt: nichts
  passiert (kein zweiter Pill, keine Fehlermeldung).
- **Netzabhängige Type-ahead-Aktion (z. B. Ortssuche)**: läuft beim Tippen,
  ohne eigenes auslösendes Bedienelement (kein „Suchen"-Button) — die
  allgemeine „Lädt"-Regel unter „Zustände", die ein solches Element
  voraussetzt, greift hier bewusst **nicht**. Vier unterscheidbare, immer
  gemutete Texte ohne Icon/Warn-/Fehlerfarbe: **lädt** (z. B. „Suche
  läuft…", Schwelle wie sonst auch spürbar > 400 ms nach der letzten
  Eingabe, kein Spinner-Icon nötig), **kein Netz**, **kein Treffer**,
  **Suchfehler/Zeitüberschreitung**.
  **Korrektur (2026-09-12, Abnahmebefund PO-2026-09-12-003, Wiederkehr
  eines am 2026-09-11 nur für „kein Netz" behobenen Befundes)**: „dieselbe
  Stelle unter dem Feld" hieß bislang eine gemeinsame, absolut
  positionierte Überlagerungsfläche — auf schmalen/kurzen Bildschirmen
  legte sie sich dauerhaft über das nachfolgende Feld, ohne dass ein
  Touchgerät eine Escape-Taste zum Befreien hätte. Jetzt gilt:
  - **Nur die tatsächliche Trefferliste** (Vorschlagsliste + Attribution)
    bleibt eine überlagernde, absolut positionierte Fläche unter dem Feld
    — sie ist ein aktiv bedientes Auswahlmenü (Pfeiltasten, Enter, Escape
    **und** Blur/Tap außerhalb schließen, siehe „Vorschlagsliste
    (Autocomplete)" oben), kein stehenbleibender Hinweis.
  - **Alle vier Hinweistexte** (lädt/kein Netz/kein Treffer/Fehler)
    erscheinen stattdessen **im normalen Dokumentfluss** unter dem Feld —
    sie schieben nachfolgende Felder nach unten, statt sie zu verdecken.
    Das gilt bewusst auch für „lädt", obwohl der Zustand meist nur
    Millisekunden steht: eine Sonderbehandlung nur für die drei länger
    stehenden Texte würde beim Wechsel zwischen ihnen (z. B. lädt →
    Fehler) einen Sprung zwischen Überlagerung und Fluss erzeugen, statt
    dass der Block ruhig an Ort und Stelle bleibt.
  - Ein-/Ausblenden dieses Hinweis-Blocks 180ms ease-out
    (design-concept.md „Motion"), reduzierte Bewegung ersetzt statt
    entfällt (design-concept.md „Reduced Motion").
  - **PO-2026-09-12-005** (Koordinatenfelder als Notnagel für eine
    erfolglose Ortssuche): Weil der Hinweistext bereits im Fluss steht,
    erscheint der bedingt sichtbare Koordinaten-Abschnitt (Reveal-Button
    oder die beiden Felder, siehe „Bedingt sichtbare Formularabschnitte
    (Reveal ohne Rückweg)") direkt darunter im selben Fluss — beide teilen
    sich die Stelle, ohne um eine Überlagerungsfläche zu konkurrieren.
    Sichtbarkeits-Auslöser (ODER-verknüpft): ein bereits hinterlegter Wert
    (`breite !== null || laenge !== null`, `0` ist gültig, ADR-0020
    Punkt 6) · einer der drei erfolglosen Zustände dieser Suche — **kein
    Netz** (`zeigeKeinNetzHinweis`, gilt unverändert auch bei bestehender
    Verbindung, sobald sie tatsächlich fehlt), **keine Treffer** oder
    **Fehler/Zeitüberschreitung** (`zustand.status`) — · der manuelle
    Reveal. `laedt`, `treffer` und `inaktiv` lösen nicht aus.
  Feld bleibt in allen Fällen bedienbar, Werte weiterhin von Hand
  eintragbar.
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
  Routing" → Zurück-Aktion) **und analog zum Inhaltswechsel der
  Master-Detail-Detailspalte** (siehe „Master-Detail (ab `lg`)" → „Wechsel
  des Inhalts"): ein vollständiger Austausch von Inhalt ist projektweit ein
  Sprung, unabhängig davon, ob dabei die Spaltenstruktur mitwechselt oder
  nicht.
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
  B): **Sprung, keine Zustandsanimation** — kein Fade. **Bewusste
  Streichung** der früheren 180ms-Crossfade-Konvention (Abnahme-Befund
  2026-09-11: nie gebaut, kein Akzeptanzkriterium fordert sie). Gründe
  gegen den Crossfade, nicht nur „nicht gebaut": (1) Auswahl ↔ leer
  überblendet zwei strukturell verschiedene Inhalte an derselben Stelle
  (dichtes, linksbündiges Formular vs. kurzer zentrierter Satz ohne
  Primär-Aktion) — bei abweichender Form/Position zweier sich
  überlagernder Inhalte entsteht ein sichtbarer Doppel-Eindruck statt einer
  ruhigen Überblendung. (2) Ort A ↔ Ort B überblendet zwei Formulare mit
  gleicher Feldstruktur, aber unterschiedlichem Text in Label-Nähe
  (Bezeichnung, Adresse, Kommentare) — das Risiko ist dort umgekehrt:
  lesbarer Text zweier Orte übereinander während der Überblendung
  (Ghosting), gerade weil die Positionen fast identisch sind. (3) Die
  Auswahl-Hervorhebung in der Liste (linke 3px-Kante + Fläche +
  `aria-current`) sowie die sofortige Fokusbewegung in die Detailspalte
  bestätigen den Wechsel bereits eindeutig — ein zusätzliches Überblenden
  wäre rein dekorativ (design-concept.md „Motion": Bewegung erklärt
  Herkunft und Zustandswechsel, sie dekoriert nicht). Einheitlich mit dem
  Ansichtswechsel Liste ↔ Karte (siehe „Ansichtswechsel innerhalb eines
  Bereichs"): jeder vollständige Inhaltsaustausch ist ein Sprung. Die
  Spalte selbst bewegt sich dabei ohnehin nicht, nur ihr Inhalt wechselt —
  daran ändert die Streichung nichts.
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

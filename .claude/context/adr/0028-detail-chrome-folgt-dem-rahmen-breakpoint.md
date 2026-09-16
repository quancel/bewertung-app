# ADR-0028: Chrome der Detailspalte folgt dem Rahmen-Breakpoint per `@media`, nicht der Containerbreite (Präzisierung von ADR-0012 Punkt 3)

- **Status**: accepted
- **Datum**: 2026-09-14
- **Bounded Context(s)**: `orte`, `app-shell`
- **task_id**: `PO-2026-09-13-003`

## Kontext

PO-2026-09-13-003 setzt unterhalb `lg` einen Abschluss-Knopf „Fertig" ans
Ende des Ortsdetails; ab `lg` entfällt er, weil dort das „×" der Weg aus dem
Detail ist (Nutzerentscheidung 2026-09-13). Der `product-owner` hat als
Constraint übernommen, die Breite werde „am Container statt am Viewport
ausgewertet (ADR-0012)". Das ist für **diesen** Umschalter falsch, und der
Fehler ist nicht harmlos.

Die Sichtbarkeit von „Fertig" hängt an genau einer Frage: **Ist die Liste
daneben sichtbar?** Das ist der ein-/zweispaltige Wechsel des Rahmens selbst,
und der steht bereits zweimal als `@media (min-width: 1024px)` im Code —
in `shared/ui/MasterDetail.vue:72` (Spaltenraster) und in
`features/orte/views/Ortebereich.vue:1221` (dort schaltet dieselbe Bedingung
„Zurück" gegen „×"). Ein `@container` auf der Detailspalte fragt etwas
anderes ab: Die Detailspalte ist am Umschaltpunkt nie so breit wie das
Fenster (1120px Container minus ~400px Liste minus 24px Abstand). Ein
Container-Umbruch bei 1024px träfe also erst bei rund 1550px Fensterbreite
zu — dazwischen gäbe es einen Bereich, in dem **„Fertig" und „×"
gleichzeitig** sichtbar sind. Umgekehrt erzeugte eine kleinere Zahl im
Container-Query zwar zufällig ähnliche Punkte, koppelte aber zwei
Bedingungen, die auseinanderlaufen, sobald jemand `--listen-spalte-breite`
oder `--container-max-width` ändert.

ADR-0012 Punkt 3 nennt diesen Fall bereits („den Layoutwechsel des
App-Rahmens selbst … das ist tatsächlich eine Frage der Fensterbreite"),
aber ohne ein Kriterium, an dem man ihn erkennt. `code-conventions.md`
verkürzt die Regel zu „breitenabhängige Layouts fragen ihren Container ab" —
genau die Lesart, die der `product-owner` hier übernommen hat.

## Entscheidung

1. **Kriterium statt Ort:** Eine Breitenabfrage gehört in `@media`, wenn ihre
   Bedingung lautet „**welches Navigationsmuster ist gerade aktiv**" (ein-
   oder zweispaltig, Bottom-Tabs oder Nav-Rail). Sie gehört in `@container`,
   wenn sie lautet „**wie viel Platz hat dieser Inhalt**" (Rasterspalten,
   Kurz- gegen Langform, Umbruch einer Zeile). Nicht der Ort im Baum
   entscheidet, sondern die Frage.
2. **Bedienelemente, die einander ersetzen, teilen wörtlich dieselbe
   Bedingung.** „Zurück" (unterhalb `lg`), „×" (ab `lg`) und „Fertig"
   (unterhalb `lg`) sind ein zusammengehöriger Satz. Sie stehen in
   **einem** `@media`-Block je Datei — für das Ortsdetail der bestehende
   Block `@media (min-width: 1024px)` in `Ortebereich.vue`. Kein zweiter
   Block, keine zweite Zahl, kein zweites Token.
3. **„Nicht vorhanden" heißt `display: none`**, nicht `visibility: hidden`,
   nicht `opacity: 0`, nicht ein Ausblenden per `aria-hidden` bei
   fokussierbarem Element. Nur `display: none` nimmt ein Element gleichzeitig
   aus Bild, Tabfolge und Accessibility-Baum — genau die drei Aussagen, die
   das Akzeptanzkriterium verlangt.
4. **Keine Breakpoint-Logik in JavaScript** (ADR-0011 Punkt 5, ADR-0012
   Punkt 1 unverändert): kein `matchMedia`, kein `ResizeObserver`, kein `v-if`
   auf einer Breitenvariablen. Der Breitenwechsel bleibt ein reiner
   CSS-Wechsel, damit er kein Remount, keinen Fokusverlust und keinen
   Eingabeverlust auslösen kann.
5. **Die Zahl bleibt wörtlich mit Tokennamen im Kommentar** (ADR-0012 Punkt
   5): `1024px` /* --breakpoint-lg */. Custom Properties werten in `@media`
   nicht aus.

## Konsequenzen

- Positiv: Der Zustand „beide Wege gleichzeitig sichtbar" bzw. „gar keiner"
  ist strukturell ausgeschlossen, weil beide Regeln in derselben Bedingung
  stehen — nicht, weil jemand zwei Zahlen gleich hält.
- Positiv: Das Kriterium aus Punkt 1 ist ohne Kenntnis dieses Pakets
  anwendbar; die verkürzte Fassung in `code-conventions.md` wird
  entsprechend nachgezogen.
- Negativ/Trade-off: `1024px` steht bereits an fünf Stellen wörtlich
  (`app/layout/AppRahmen.vue:47`, `app/layout/Bereichsnavigation.vue:133`,
  `shared/ui/MasterDetail.vue:72`, `shared/ui/Toast.vue:80`,
  `features/orte/views/Ortebereich.vue:1221`), und dieses Paket kommt **ohne
  eine sechste** aus, weil Punkt 2 den vorhandenen Block wiederverwendet.
  Das ist der von ADR-0012 Punkt 5 bewusst akzeptierte Preis dafür, dass CSS
  in Bedingungen keine Custom Properties auswertet — kein Anlass, eine
  JS-Konstante als „einzige Quelle" einzuführen (die wäre in CSS ebenso wenig
  nutzbar und erzeugte eine vierte Stelle).
- Negativ/Trade-off: Wer nur `code-conventions.md` liest, kann den Fall
  weiterhin falsch herum lesen. Deshalb steht das Kriterium ab jetzt dort,
  nicht nur hier.
- Betrifft künftig: Jeder weitere Umschalter im Detail-Chrome (z. B. ein
  Kopf, der ab `lg` anders aufgebaut ist) folgt Punkt 2 und kommt in
  denselben Block. Rasterartige Umbrüche **innerhalb** des Detailformulars
  bleiben unverändert `@container`.

## Alternativen (kurz)

- **`@container` auf der Detailspalte, Grenzwert empirisch passend gewählt**
  — verworfen: koppelt die Sichtbarkeit an Spaltenbreiten-Tokens, die
  jederzeit geändert werden dürfen, und erzeugt dabei still einen Bereich mit
  zwei oder null Schließwegen. Genau die Klasse Fehler, die niemand meldet,
  weil sie nur in einem Breitenfenster auftritt.
- **`Ortebereich.vue` zum Container machen und beide Bedingungen darauf
  stellen** — verworfen: Die Bereichsansicht enthält **beide** Spalten; ihre
  Breite ist bis zum 1120px-Container praktisch die Fensterbreite. Das wäre
  eine Media Query mit zusätzlichem Size-Containment und dessen
  Nebenwirkungen (ADR-0012, Konsequenzen), ohne einen Gewinn.
- **`container-name` aus `app-shell` abfragen** — verworfen, unverändert
  ADR-0012 Punkt 2: macht einen CSS-Namen zum Contract zwischen Contexts.
- **„Fertig" auch ab `lg` zeigen und die Fallunterscheidung sparen** —
  verworfen durch Nutzerentscheidung 2026-09-13; ab `lg` bleibt das „×".

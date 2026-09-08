# ADR-0012: Breitenabhängige Layouts richten sich nach ihrem Container, nicht nach dem Viewport

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `app-shell`, `orte`, `medien`, `karte`, `bewertungen`, `tags`

- **task_id**: `PO-2026-09-07-012`

## Kontext

Mit dem zweispaltigen Layout (ADR-0011) ist die Fensterbreite kein Maß mehr
für den Platz, den ein Inhalt tatsächlich hat. Bei ~1024px Fensterbreite ist
die Detail-Spalte nur noch rund halb so breit wie das Fenster. Ein Layout,
das per `@media (min-width: 1024px)` auf „ab lg" umschaltet, bekommt dort
mehr Spalten, als hineinpassen — der `ux-ui-designer` hat den Fall am
Bilder-Raster aus PO-2026-09-07-005 gefunden und ausdrücklich als
Umsetzungsfrage an den Architekten gemeldet.

Das betrifft nicht nur -005. Jedes später in der Detail-Spalte gebaute
breitenabhängige Layout hat dasselbe Problem, und dieselbe Komponente kann
unterhalb `lg` über die volle Breite und oberhalb in der schmalen Spalte
stehen. Eine Regel je Paket zu wiederholen, hieße sie irgendwann zu
vergessen.

## Entscheidung

1. **Breitenabhängige Layouts fragen ihren eigenen Container ab, nicht das
   Fenster.** Umgesetzt mit CSS Container Queries: Der breitenabhängige Block
   setzt auf seinem eigenen Wurzelelement `container-type: inline-size` und
   formuliert seine Umbrüche als `@container (min-width: …)`.
2. **Kein benannter Container über Context-Grenzen.** Ein Feature fragt
   **nicht** einen von `app-shell` benannten Container ab (kein
   `container-name` als Contract zwischen Contexts). Jeder Block macht sich
   selbst zum Container. Damit funktioniert derselbe Code unverändert, egal ob
   der Block in der Detail-Spalte, vollflächig oder später in einem dritten
   Rahmen steht — und es entsteht keine unsichtbare Kopplung an einen Namen,
   den `app-shell` jederzeit ändern könnte.
3. **`@media` bleibt für genau zwei Dinge zulässig**: den Layoutwechsel des
   App-Rahmens selbst (Navigationsmuster, ein- gegen zweispaltig — das ist
   tatsächlich eine Frage der Fensterbreite) und Nicht-Breiten-Abfragen wie
   `prefers-reduced-motion`. Alles, was **innerhalb** einer Spalte umbricht,
   nutzt `@container`.
4. **Spalten müssen schrumpfen dürfen.** Die Spalten des Grid-/Flex-Layouts
   bekommen `min-width: 0`. Ohne das verhindert der Vorgabewert
   `min-width: auto`, dass eine Spalte unter ihre Inhaltsbreite geht — der
   Inhalt drückt die Spalte auf, statt umzubrechen, und die Container-Abfrage
   misst eine Breite, die es nie gibt.
5. **Rohwerte bleiben in `src/styles/tokens.css`**, auch die neuen
   Layoutmaße (Container-Höchstbreite, Breite der Navigationsleiste, Breite
   der Listen-Spalte). Für die Abfragebedingung selbst gilt eine Ausnahme:
   In `@media`/`@container` steht die Zahl wörtlich, weil CSS Custom
   Properties dort nicht ausgewertet werden. `var(--breakpoint-lg)` in einer
   Media Query ist kein Stilfehler, sondern eine Bedingung, die stillschweigend
   nie zutrifft. Die Zahl trägt einen Kommentar mit dem Tokennamen.

## Konsequenzen

- Positiv: -005 und -006 fordern in ihren Kriterien nur noch die beobachtbare
  Wirkung („richtet sich nach der Breite seines Containers"); die Umsetzung
  steht einmal hier.
- Positiv: Dieselbe Komponente ist in beiden Layoutzuständen ohne Sonderfall
  benutzbar — der Breitenwechsel aus ADR-0011 bleibt ein reiner CSS-Wechsel.
- Negativ/Trade-off: `container-type: inline-size` erzeugt einen
  Size-Containment-Kontext; die Höhe des Blocks darf nicht mehr von seinem
  Inhalt zurück auf die Breite wirken. Für Raster, Kacheln und Formularspalten
  ist das folgenlos, für Sonderfälle ist es beim Bauen zu prüfen.
- Negativ/Trade-off: Container Queries sind nicht per Media Query
  entwicklertestbar — wer eine Umbruchgrenze prüfen will, muss die Spalte
  schmaler machen, nicht das Fenster.
- Betrifft künftig: **-003/-004** (Werkzeugleiste in der ~400px-Listen-Spalte),
  **-005** (Bilder-Raster), **-006** (Karte in der Detail-Spalte), und jede
  spätere Komponente mit einem Umbruch. Die Regel steht kurzgefasst in
  `code-conventions.md`; der Architekt nimmt sie in die `constraints` der
  betroffenen Pakete auf, weil gespawnte Subagents die Datei nicht zwingend
  sehen.

## Alternativen (kurz)

- **`ResizeObserver` + Klassen in JavaScript** — verworfen: löst dasselbe
  Problem mit Laufzeitkosten, einem zusätzlichen Renderdurchlauf und
  Layout-Zittern beim ersten Bild; CSS kann es ohne JavaScript.
- **Zweiter Satz Media-Query-Grenzen für den zweispaltigen Fall** — verworfen:
  Jede Komponente bräuchte zwei Regelsätze, und der Fall „gleiche Komponente,
  anderer Rahmen" käme bei jedem neuen Rahmen zurück.
- **Benannter Container `--detail` aus `app-shell`** — verworfen: macht einen
  CSS-Namen zum Contract zwischen Contexts, den weder `code-conventions.md`
  noch die Context-Map führen würden.
- **Feste Mindestbreite der Detail-Spalte, damit „ab lg" immer passt** —
  verworfen: verschiebt das Problem auf die Listen-Spalte und bricht bei
  1024px Fensterbreite an der anderen Kante.

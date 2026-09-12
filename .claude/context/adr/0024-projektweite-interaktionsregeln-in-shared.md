# ADR-0024: Projektweite Interaktionsregeln liegen einmal in `src/shared/`, und ein Paket darf sie über die Context-Grenze hinweg anbinden

- **Status**: accepted
- **Datum**: 2026-09-12
- **Bounded Context(s)**: `orte`, `tags` (Regel projektweit)
- **task_id**: `PO-2026-09-12-003`

## Kontext

Der `ux-ui-designer` hat die Konvention „Vorschlagsliste (Autocomplete)" um
einen Zusatz erweitert: Die Liste schließt zusätzlich bei **Blur und bei Tap
außerhalb** — ausdrücklich „für jedes Vorkommen, auch das bestehende
`TagEingabe.vue`" (`design-conventions.md`, Ergänzung 2026-09-12). Der Grund
ist derselbe wie beim Befund selbst: Auf einem Touchgerät ohne Escape-Taste
ist eine stehenbleibende Überlagerung ohne Ausweg.

Damit reicht PO-2026-09-12-003 über seinen `bounded_context` `orte` hinaus:
Das Muster steht zweimal im Repo, in
`features/orte/components/Ortssuche.vue` und in
`features/tags/components/TagEingabe.vue` — zwei Contexts. Der
`product-owner` hat die Entscheidung, ob daraus ein eigenes Teilpaket wird,
ausdrücklich dem Architekten überlassen.

Die naheliegende Sorge ist ADR-0013/ADR-0022: die Import-Einbahnstraße
zwischen den Feature-Contexts. Sie ist hier aber gar nicht berührt — es
entsteht kein Import von `orte` nach `tags` und keiner zurück.

## Entscheidung

1. **Die Regel wird genau einmal implementiert, in
   `src/shared/composables/`** — als zustandsloses Composable je Aufrufer,
   gleiche Bauform wie `useNetzzustand.ts` (ADR-0021 Punkt 5). Beide
   Komponenten binden es an; keine kopierte Zweitfassung je Feature.
2. **`shared/` ist kein Bounded Context.** Ein Baustein dort schafft keine
   Beziehung zwischen den Contexts, die ihn benutzen — ADR-0013 und ADR-0022
   bleiben wörtlich unverändert gültig, weil kein
   Feature-zu-Feature-Import entsteht. Die Schwelle „nach `shared/` erst ab
   zwei Nutzern" (`code-conventions.md`) ist mit `orte` und `tags` erfüllt.
3. **Kein eigenes Teilpaket für `tags`.** Ein Paket darf die Datei eines
   fremden Contexts anfassen, wenn die Änderung ausschließlich das
   **Anbinden einer projektweit entschiedenen, in `shared/` liegenden Regel**
   ist. Ein Paket, das nur „ruf das Composable auch hier auf" enthielte,
   hätte eine harte Abhängigkeit, keinen eigenen fachlichen Wert und keine
   eigene Abnahme — der Schnitt verteuerte die Sache, ohne sie zu klären.
4. **Die Grenze dieser Erlaubnis ist eng und prüfbar**: Sie gilt nur, solange
   die Änderung am fremden Context aus dem Anbinden der geteilten Regel
   besteht. Jede **fachliche** Änderung an einem fremden Context (anderes
   Verhalten, anderes Datenmodell, neue Felder) bleibt ein eigenes Paket mit
   eigenem `bounded_context`.
5. **Der `bounded_context` des Pakets bleibt der, in dem der Befund liegt**
   (`orte`). Die Reichweite steht sichtbar in `constraints` und
   `files_to_touch`, statt den Context zu verwässern oder einen
   Sammel-Context zu erfinden.
6. **Umsetzungsschranke, weil sie der wahrscheinlichste Fehler ist**: Der
   Listener hängt nur, solange die Liste offen ist, und am Dokument, nicht
   global auf Dauer; er wird beim Aushängen der Komponente entfernt (ADR-0021
   Punkt 5, gleiche Bauform). Er hört auf `pointerdown`, nicht auf `click` —
   sonst reagiert er auf einem Touchgerät zu spät. Das bestehende
   `@mousedown.prevent` an den Vorschlags-Buttons bleibt: Ohne es schließt
   die Liste, bevor die Auswahl ankommt.

## Konsequenzen

- Positiv: Die Konvention gilt ab sofort an **beiden** Stellen und kann nicht
  auseinanderlaufen. Der dritte Autocomplete im Projekt bekommt sie
  automatisch.
- Positiv: Die Frage „darf ein `orte`-Paket eine `tags`-Datei anfassen"
  ist beantwortet, ohne die Import-Regel aufzuweichen — der Unterschied
  zwischen *Import* und *Paketreichweite* steht jetzt fest.
- Negativ/Trade-off: Die Paketreichweite ist nicht mehr am
  `bounded_context` allein ablesbar. Deshalb Punkt 5: Die Reichweite muss im
  Handoff ausdrücklich dastehen.
- Negativ/Trade-off: Ein Composable in `shared/` hat zwei Nutzer mit
  unterschiedlichen Bedürfnissen; wird es später für einen von beiden
  aufgebohrt, leidet der andere. Bleibt es bei „schließt bei Blur/Tap
  außerhalb", ist die Fläche klein genug.
- Betrifft künftig: Jede weitere **projektweit** entschiedene
  Interaktionsregel (`design-conventions.md` sagt „gilt für jedes
  Vorkommen"). Erst `shared/` prüfen, dann anbinden — nicht je Feature
  nachbauen und nicht je Feature ein Paket schneiden.

## Alternativen (kurz)

- **Eigenes Teilpaket für `TagEingabe.vue`** — verworfen: siehe Punkt 3.
  Es hinge vollständig am Composable aus -003, wäre nie unabhängig
  abnehmbar und ließe zwischen beiden Paketen eine Ansicht mit der alten
  Regel stehen.
- **Verhalten in jeder Komponente einzeln nachbauen** — verworfen: Genau so
  entsteht die Abweichung, die `design-conventions.md` mit „gilt für jedes
  Vorkommen" verhindern will. Zwei Nutzer sind die im Projekt geltende
  Schwelle für `shared/`.
- **Eine gemeinsame Autocomplete-Komponente in `src/shared/ui/`, die beide
  Fälle ersetzt** — verworfen für dieses Paket: Das ist ein Umbau zweier
  abgenommener Komponenten mit verschiedenen Datenquellen, Trefferformen und
  Attributionspflichten (ADR-0020) — weit mehr als der Befund verlangt.
  Bleibt möglich, wenn ein dritter Autocomplete dazukommt; dann mit eigenem
  Paket und eigenem ADR.
- **`tags` importiert das Verhalten aus `features/orte/lib/`** — verworfen:
  Das wäre ein Feature-zu-Feature-Import in der **verbotenen** Richtung
  (ADR-0022 Punkt 3 erlaubt ausdrücklich keinen Weg zwischen Geschwistern).

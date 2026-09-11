# Learnings — bewertung-app

> **Single-Writer: Nur der `architekt`-Agent schreibt hierhin.** Alle
> anderen Agents lesen nur. Kein endloses Log — nach Abschluss eines
> Arbeitspakets kuratiert der Architekt, ob ein Learning aufnahmewürdig ist
> (wiederkehrend relevant für zukünftige Routing-/Constraint-Entscheidungen)
> und fasst es in 1–3 Zeilen zusammen. Alte, nicht mehr relevante Einträge
> werden gelöscht statt angehängt — diese Datei bleibt bewusst klein
> (Faustregel: < 50 Einträge, sonst aufräumen).

## Format pro Eintrag

```
- [YYYY-MM-DD] <bounded_context>: <Erkenntnis in 1-3 Sätzen> (task_id: <id>)
```

## Einträge

<!-- Der Architekt-Agent ergänzt hier neue Einträge und entfernt veraltete. -->

- [2026-09-10] app-shell/karte/orte: Ein ADR, das ein Browser-API pauschal
  verbietet („es gibt keinen `online`/`offline`-Listener", ADR-0015 P6),
  obwohl nur ein Zweck gemeint war, kollidiert später mit Design-Vorgaben und
  gewinnt per Rangfolge — der Lead müsste dann gutes Design verwerfen.
  Verbote im ADR an die **Wirkung** binden, nicht an das API; beim Einordnen
  eines Pakets die ADRs des betroffenen Contexts gegen die `design_notes`
  gegenlesen, bevor geroutet wird. (task_id: PO-2026-09-07-006, ADR-0021)
- [2026-09-11] karte/orte: Eine Context-Zuordnung, die auf der **Importrichtung**
  begründet ist, kann kippen — eine Layout-Entscheidung des Nutzers verschob
  den Store-Zugriff aus `karte` heraus, und das Zyklus-Argument war weg. Die
  haltbare Begründung ist, **wem die geschriebenen Felder gehören** (die
  Ortssuche schreibt `orte`-Felder), nicht die zufällige Richtung des Tages.
  Gemeinsame Infrastruktur-Eigenschaften („braucht Netz") sind ohnehin kein
  Context-Kriterium. (task_id: PO-2026-09-07-008, ADR-0019/0020)
- [2026-09-11] projektweit: Solange `user_questions` offen sind, steht das
  Ergebnis unter Vorbehalt — auch in `context-map.md` und
  `code-conventions.md`. Drei von vier Antworten wichen von den Annahmen ab
  und machten zwei frisch geschriebene ADRs und vier Stellen in den
  Kontextdateien ungültig. Entweder erst nach der Antwort fortschreiben oder
  die betroffene Stelle sichtbar als Annahme markieren; und bei einer
  Nachbesserung jede Stelle mitziehen, die auf der alten Begründung stand
  (hier: ein bereits geschriebener Learnings-Eintrag).
  (task_id: PO-2026-09-07-006)
- [2026-09-11] projektweit: Eine ADR-Begründung wird gelesen, kopiert und
  geglaubt — ADR-0011 P4 begründete `replace` mit einem **Neuladen**, das gar
  nicht betroffen ist, während der echte Schaden (Browser-Zurück auf die tote
  Adresse) ungenannt blieb. Der Lead baute `push`, und die Abnahme fand es.
  Eine Begründung muss den **beobachtbaren Fehlerfall** nennen, den jemand
  nachstellen kann; was man nicht nachstellen kann, prüft auch niemand nach.
  (task_id: PO-2026-09-07-012, ADR-0011)
- [2026-09-11] projektweit: Ein Constraint der Form „erneut, wenn sich X
  ändert" ist mehrdeutig, sobald X eine abgeleitete Menge ist: Der Lead
  implementiert **Identität** (neues Array bei jeder Neuberechnung), gemeint
  war **Inhalt**. Beim Formulieren dazusagen, was der Auslöser vergleicht —
  sonst ist die Abweichung weder im Review noch in der Abnahme sichtbar.
  (task_id: PO-2026-09-07-006, `useLeafletKarte.ts`)
- [2026-09-11] orte/tags/karte: Leerzustände sind je **Filterstufe** zu
  zählen, nicht pauschal einer. Bestand leer · Filter ohne Treffer · gefiltert,
  aber nichts davon darstellbar (Orte ohne Koordinaten) sind drei verschiedene
  Zweige mit verschiedenem Ausweg. Beim Einordnen eines Pakets mit Liste,
  Filter oder Karte die Stufen durchzählen und jede im Handoff benennen —
  sonst erbt der letzte Zweig den Text des ersten.
  (task_id: PO-2026-09-07-004/-006, ADR-0019 Punkt 10)

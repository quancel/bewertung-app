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
- [2026-09-13] projektweit: Absolute Wörter im ADR („nie", „immer") kosten
  beim Schreiben nichts, wenn die aktuelle Struktur den teuren Fall gar nicht
  erzeugt — ADR-0025 schrieb „die Kennung wird nie zurückgenommen", weil
  `Ortebereich.vue` nicht unmountet, und überschoss damit ein
  Akzeptanzkriterium desselben Pakets. Bei zustandsbindenden Entscheidungen
  die **Lebensdauer** ausdrücklich benennen (geöffnete Instanz? Route? Sitzung?)
  statt sie aus dem Komponentenverhalten mitlaufen zu lassen; Gegenprobe beim
  Schreiben ist der eigene Alternativen-Abschnitt, der hier bereits das
  Gegenteil sagte. (task_id: PO-2026-09-12-005, ADR-0025/0026)
- [2026-09-13] projektweit: Ein Testdouble, das eine **Plattformgrenze**
  nachbildet (`fake-indexeddb` bildet den strukturierten Klon in JS nach),
  kann die Fehlerklasse an genau dieser Grenze strukturell nicht fangen —
  224 grüne Tests und eine Code-Abnahme haben einen vollständigen
  Datenverlust durchgelassen. Beim Einordnen eines Pakets mit der Zusicherung
  „Daten überleben X" die **Prüfebene** mitentscheiden und als `constraint`
  setzen, statt sie dem Lead zu überlassen.
  (task_id: PO-2026-09-12-001, ADR-0023)
- [2026-09-13] projektweit: Ein Beleg für **Engine-Unabhängigkeit** darf nicht
  auf einer zweiten Implementierung derselben Familie ruhen — Node/V8 *ist*
  Chromiums Klon-Implementierung und sagt über WebKit nichts; tragend war
  allein das Spezifikations-Argument. Bei jeder Zusicherung der Form „gilt in
  jeder Engine" prüfen, ob die Begründung das Behauptete stützt oder nur
  plausibel klingt — eine zirkuläre Teilbegründung überlebt sonst jede
  spätere Kürzung des Kommentars. (task_id: PO-2026-09-12-001)
- [2026-09-13] projektweit: Wer eine Fehlerklasse behebt, entscheidet
  ausdrücklich zwischen **Aufrufkonvention** (dokumentiert, hält nur solange
  jemand daran denkt) und **Struktur** (Code oder Test erzwingt sie). -001
  wurde zur Konvention: `db.put` bleibt an drei Stellen ohne Wrapper
  erreichbar, kein Test fängt einen künftigen Verstoß. Beim Einordnen eines
  Korrekturpakets gehört diese Wahl in `constraints`, sonst wird es
  stillschweigend die billigere. (task_id: PO-2026-09-12-001)
- [2026-09-13] projektweit: Ein Paket, das eine **vorhandene Zusicherung auf
  eine neue Dimension ausweitet** (Verdeckungsprüfung → Telefonbreiten), ist
  keine Listenerweiterung: Die Hauptarbeit ist das generische Abgrenzen
  falscher Befunde (Viewport-Höhe ≠ Breite; fixierte Chrome; die Prüfumgebung
  meldet sich selbst). Im Handoff als Teil des Scopes benennen, sonst wird
  der Aufwand unterschätzt und die Ausnahme am Ende an Klassennamen
  festgemacht. (task_id: PO-2026-09-12-004, ADR-0023 Punkt 7)
- [2026-09-15] projektweit: Ein ADR, das beim Einordnen ein **konkretes
  Werkzeug** vorschreibt (API-Aufruf, Konfigurationszeile), rät — geschrieben
  hat es jemand, der es nie ausgeführt hat. ADR-0027 P5 verlangte
  `getComputedStyle(el, '::-webkit-slider-thumb')`; der Aufruf liefert in
  Chromium die UA-Vorgabe statt des Autoren-Stils, die Zusicherung wäre
  **nie rot geworden** und dauerhaft wie ein erfülltes Kriterium gelaufen.
  Im ADR die **Eigenschaft** verbindlich machen und ein genanntes Mittel
  ausdrücklich als „vom Lead zu verifizieren" kennzeichnen; bei Paketen,
  deren Ergebnis eine Zusicherung ist, den Rot-Nachweis gegen einen
  verletzenden Stand als `constraint` setzen (jetzt ADR-0027 P8).
  (task_id: PO-2026-09-13-002, ADR-0027 „Korrektur")
- [2026-09-15] projektweit: Akzeptanzkriterium und `constraints` **desselben**
  Pakets gegeneinander lesen, bevor geroutet wird. In -001 schloss Kriterium 3
  pauschal jeden Zustand „Zahl im Feld, Achse zeigt ‚nicht bewertet'" aus —
  genau den will ADR-0007 P7 während der laufenden, noch nicht bestätigten
  Eingabe. Ein Kriterium, das eine **gewollte Zwischenzustands-Eigenschaft**
  pauschal verbietet, fällt erst bei der Abnahme auf; es braucht die
  Ausnahme im Wortlaut („… ausgenommen die laufende Eingabe").
  (task_id: PO-2026-09-13-001)
- [2026-09-14] projektweit: Eine **verkürzte** Regel in `code-conventions.md`
  verliert die Ausnahme, die das ADR kennt — und wird im nächsten Handoff als
  `constraint` zur absoluten Vorgabe (Rangstufe 2 schlägt dann alles). Beim
  Kuratieren entweder die Ausnahme mitschreiben oder die Regel an der Frage
  formulieren, die sie entscheidet, statt am Ergebnis. Der Anlassfall
  (`@container` pauschal statt „welche Frage?") ist mit ADR-0028 geschlossen,
  der Mechanismus nicht. (task_id: PO-2026-09-13-003, ADR-0012 P3/0028)
- [2026-09-16] projektweit: Eine Zusicherung sichert die Eigenschaft, die sie
  **prüft** — nicht die, die brechen wird. `pruefeReglerGreifbarkeit` war
  korrekt gebaut und rot-nachgewiesen (ADR-0027 P8) und gegen den auf iOS
  defekten Stand trotzdem grün: Sie prüft „nicht unbedienbar gemacht", kaputt
  war „hebt sich ab", in einer Engine, die niemand fährt. Beim Einordnen die
  **Reichweite** einer vorhandenen Zusicherung ausschreiben (geprüft / nicht
  geprüft), statt ihren Namen als Deckung zu lesen.
  (task_id: PO-2026-09-16-001/-002, ADR-0029)
- [2026-09-16] projektweit: Der Degradations-Satz einer Darstellungsregel ist
  eine **Tatsachenbehauptung** und wird gegen den realen Befund geprüft, nicht
  gegen Plausibilität — „fällt unsere Regel aus, greift der native, sichtbare
  Thumb" beschrieb genau den Zustand, den der Nutzer als „nicht erkennbar"
  gemeldet hatte. Führt der Ausfallpfad in den gemeldeten Fehler zurück, ist
  die Zusicherung nicht degradiert, sondern nicht vorhanden.
  (task_id: PO-2026-09-16-001, ADR-0029 P5)
- [2026-09-11] orte/tags/karte: Leerzustände sind je **Filterstufe** zu
  zählen, nicht pauschal einer. Bestand leer · Filter ohne Treffer · gefiltert,
  aber nichts davon darstellbar (Orte ohne Koordinaten) sind drei verschiedene
  Zweige mit verschiedenem Ausweg. Beim Einordnen eines Pakets mit Liste,
  Filter oder Karte die Stufen durchzählen und jede im Handoff benennen —
  sonst erbt der letzte Zweig den Text des ersten.
  (task_id: PO-2026-09-07-004/-006, ADR-0019 Punkt 10)

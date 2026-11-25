# Handoff: Weiterentwicklung des `agent-team`-Plugins

Stand: 2026-11-25 · Quelle: Auswertung der Durchläufe `2026-11-23` bis `2026-11-25`
(7 Arbeitspakete PO-2026-11-24-001 bis -007, 22 Subagent-Aufrufe) im Repo
`quancel/bewertung-app`.

**Wohin die Änderungen gehören:** ins Plugin-Repo `quancel/agent-team-marketplace`.
Die Kopien in `bewertung-app/.claude/agents/`, `.claude/agent-team/` und
`.claude/commands/` werden von `.claude/scripts/sync-agent-team.sh` überschrieben.
Nach jeder Änderung im Marketplace-Repo im Ziel-Repo neu synchronisieren und einen
Probedurchlauf fahren.

**Wie belastbar die Aussagen sind:** Jeder Befund trägt ein Etikett.
- **[belegt]** steht in einer Datei dieses Repos oder in den Berichten der Agents.
- **[Beobachtung]** habe ich als Orchestrator in der Sitzung erlebt, aber nicht in
  einer Datei festgehalten.
- **[Vermutung]** ist eine Schlussfolgerung und muss geprüft werden.

---

## 1. Auftrag in einem Absatz

Die Kommunikationsstruktur zwischen Orchestrator und Rollen ist feinzuschleifen,
die Token-Nutzung ist so weit wie möglich zu senken, und es ist zu **bewerten**
(nicht blind umzusetzen), ob das Protokoll durch ein strukturiertes Ereignis-Log
ersetzt oder ergänzt werden soll, damit nachvollziehbar wird, was die KI wann und
warum getan hat. Reihenfolge der Arbeit: zuerst Messbarkeit herstellen (Abschnitt 3),
dann auf Messwerten optimieren (Abschnitt 4), dann das Protokoll an den Ergebnissen
ausrichten.

---

## 2. Befunde zur Kommunikationsstruktur

### 2.1 Das Protokoll hält die Ergebnisse nicht fest — [belegt]

- Der Hook `log-agent-run.py` hängt an `PostToolUse` mit Matcher `Task|Agent`.
  Bei **Hintergrund-Agents** feuert er beim *Start*. Die Datei enthält nur die
  Quittung: `"isAsync": true, "status": "async_launched", "agentId": …`.
- Folge: In allen 22 Dateien `NNN-<rolle>.json` ist `handoffs` leer. Im `index.md`
  stehen bei `task_id`, `status` und „offene Fragen" überall „—".
  `runs-report.py` und `/lauf-analyse` können deshalb weder übergangene Fragen,
  Roundtrips noch `accepted` auswerten.
- Die echten Berichte stehen als `<agent-message …>`-Einträge in
  `.claude/runs/<datum>/prompts.md` (2026-11-24: 202 KB, 2026-11-25: 57 KB) und
  sind dort **als „Nutzer-Eingabe" einsortiert**.
- Konsequenz im Ablauf: Der `architekt` im Nachpflege-Modus fand den Bericht des
  `frontend-lead` zu -005 nicht im Protokoll und musste sich auf die Stichpunkte
  des Orchestrators und den Code stützen.
  (Fundstelle: `2026-11-25_0ccbd4aa86cd/002-architekt.json`, Bericht in `prompts.md`.)
- **Auftrag:** Das Ergebnis eines Aufrufs muss im Protokoll landen, egal ob der Agent
  im Vordergrund oder Hintergrund lief. Lösungsrichtungen in Abschnitt 5.

### 2.2 `UserPromptSubmit` schreibt Systemmeldungen als Nutzer-Eingabe — [belegt]

Neben echten Eingaben („Jo fang an.") landen in `prompts.md` auch
`<agent-message>`, `<task-notification>` und Neustart-Hinweise. Der Index weist sie
als `_Nutzer-Eingabe_` aus. Das verfälscht jede Auswertung, wer wann etwas
entschieden hat, und bläht die Datei auf.
- **Auftrag:** Eingaben nach Herkunft trennen (Nutzer, Subagent-Bericht, System).
  Nur echte Nutzer-Eingaben in `prompts.md`; Berichte gehören zum Aufruf.

### 2.3 Nummernvergabe kollidiert bei parallelen Aufrufen — [belegt]

`2026-11-25/index.md` enthält zwei Zeilen mit Nr. 004 (`004-ux-ui-designer.json` und
`004-frontend-lead.json`, beide 05:48:46Z). `next_index()` liest die vorhandenen
Dateien und vergibt `max+1`, ohne Sperre. Zwei gleichzeitige Hook-Läufe sehen
denselben Stand.
- **Auftrag:** Atomare Vergabe (z. B. `O_EXCL`-Anlage der Datei oder Lock-Datei) oder
  Zeitstempel+`agentId` im Dateinamen statt einer Zählnummer.

### 2.4 Eine Sitzung erzeugt mehrere Verzeichnisse — [belegt]

Der Verzeichnisname enthält das Datum des *aktuellen* Aufrufs. Eine über Mitternacht
UTC laufende Sitzung erzeugt `2026-11-23_`, `2026-11-24_` und `2026-11-25_…` mit
derselben Sitzungs-ID. Die Zusammenhänge reißen auseinander, die Nummerierung
beginnt neu.
- **Auftrag:** Datum aus dem Sitzungsstart ableiten (erste Datei der Sitzung) oder
  gar kein Datum im Verzeichnisnamen.

### 2.5 Rückfragen an den Nutzer — Ablauf funktionierte, Nachvollziehbarkeit nicht — [Beobachtung]

- Die Regel „Rückfragen nur über `user_questions`, der Orchestrator stellt sie"
  hat funktioniert. Alle Fragen wurden gestellt und beantwortet zurückgegeben.
- Nicht nachvollziehbar ist das im Protokoll: Die Antwort des Nutzers steht nur im
  Gespräch, nicht an der Frage. Eine Frage ohne Kennung lässt sich nicht der Antwort
  zuordnen, und ob eine `annahme` stillschweigend galt, ist nicht prüfbar.
- **Auftrag:** Jede Frage bekommt eine ID (`q-<task_id>-<n>`), der Orchestrator
  protokolliert Frage, gewählte Option und Zeitpunkt als eigenes Ereignis.

### 2.6 Der Orchestrator gab einen ungeprüften Sachverhalt als Ist-Stand weiter — [belegt]

Ich habe dem `ux-ui-designer` den Wortlaut eines Legendensatzes als Ist-Stand des
Codes genannt. Der Satz stand nicht im Code. Der Designer hat es per Grep bemerkt
(`2026-11-25/004-ux-ui-designer`, Bericht in `prompts.md`). Der Fehler entstand, weil
ich den Wortlaut aus dem Bericht eines anderen Agents übernommen hatte.
- **Auftrag:** Regel für den Orchestrator: Zitate aus Agent-Berichten, die als
  Ist-Stand in einen Auftrag eingehen, sind mit Quelle (Datei:Zeile) zu belegen oder
  als „unverifiziert" zu kennzeichnen. Planende Rollen prüfen Behauptungen im
  Auftrag gegen den Code, bevor sie darauf aufbauen.

### 2.7 Roundtrip-Budget ist nicht maschinenlesbar — [belegt]

Die Regel „ein automatischer Roundtrip pro Paket" lässt sich nicht prüfen, weil das
Handoff keinen Zähler trägt und (2.1) die Ergebnisse fehlen.
- Fall: -002 wurde in der Abnahme mit `accepted: false` zurückgegeben, ein
  Nachbesserungsaufruf, erneute Abnahme. Dazu ein Zusatzauftrag für -005 im selben
  Aufruf (Flick-Mindestweg). [Vermutung: innerhalb des Budgets, aber gebündelt.]
- **Auftrag:** Felder `roundtrip` (Zähler je `task_id`) und `parent_call` im Handoff,
  vom Orchestrator gesetzt, nicht von der Rolle.

### 2.8 Abnahme: Umfang wird nicht ausgewiesen — [belegt]

Der `product-owner` darf nichts ausführen. Bei der zweiten Abnahme von -002
übernahm er neun von zehn Kriterien aus der ersten Abnahme ohne Neuprüfung
(`2026-11-25/005`, Bericht in `prompts.md`: „Dieses Urteil übernehme ich aus der
ersten Abnahme … Neu verfolgt habe ich sie nicht"). Die Ehrlichkeit ist gut, aber
das Feld `accepted: true` unterscheidet nicht zwischen „geprüft" und „übernommen".
- **Auftrag:** Im Handoff je Kriterium `status` (`geprueft` | `uebernommen` |
  `nicht_beurteilbar`) und `beleg` (Datei:Zeile oder Verweis auf Vorabnahme).

### 2.9 Handoff-Felder werden uneinheitlich benutzt — [Beobachtung, zu prüfen]

In den Berichten der Leads stand teils `source_role: "architekt"`, teils
`target_role: "product-owner"` oder `null`, `bounded_context` wechselte zwischen
Paketen, und manche Handoffs trugen `files_to_touch`, andere `files_touched`.
Ob das von `HANDOFF_SCHEMA.md` gedeckt ist, habe ich nicht gegen das Schema
geprüft.
- **Auftrag:** Schema gegen reale Handoffs aus `prompts.md` validieren
  (Skript `validate-handoff.py`), Abweichungen entweder ins Schema aufnehmen oder
  in den Agent-Prompts verbieten.

### 2.10 Agent-Beschreibung passt nicht zum Projekt — [belegt]

Die Beschreibung des `frontend-lead` lautet „… für Angular/NgRx umzusetzen". Das
Projekt ist Vue 3 mit Pinia. Die Rolle hat trotzdem korrekt gearbeitet, weil
`code-conventions.md` das Gegenteil sagt. Die Beschreibung steuert aber die
Auswahl des Agents.
- **Auftrag:** Technologie aus der Rollenbeschreibung entfernen und aus
  `code-conventions.md` beziehen.

### 2.11 Stop-Hook fordert Commits mitten im Lauf — [belegt]

Der Repo-Hook verlangte nach fast jedem Turn „commit und push", während ein
`frontend-lead` im Hintergrund Dateien änderte. Ich habe in diesen Fällen nur
`.claude/runs/` committet und den Code zurückgehalten. Gefahr: halbfertiger Code
im Remote oder ein Commit, der Dateien des Leads zerreißt.
- **Auftrag:** Regel im Orchestrator-Befehl: Solange ein Lead läuft, committet
  der Orchestrator nur Dateien, die die laufenden Rollen nicht schreiben. Alternativ
  ein Hook, der den Stand laufender Agents kennt und sich zurückhält.

### 2.12 Hintergrund-Agents sind gegen Neustarts und Limits ungeschützt — [belegt]

- Zwei Container-Neustarts haben je einen Hintergrund-Agent abgebrochen
  (Architekt-Nachpflege; ein Rauchtest-Lauf starb ohne Fehlermeldung).
- Ein Lead-Aufruf (Paket 004) endete mit `rate_limit` (HTTP 429). Er ließ sich per
  `SendMessage` fortsetzen, weil sein Stand im Arbeitsbaum lag.
- **Auftrag:** Leads schreiben nach jedem Teilschritt eine kurze
  `progress.md` (Paket, erledigte Schritte, nächster Schritt, offene Mutation/Datei).
  Damit kann jede Fortsetzung dort ansetzen. Der Orchestrator-Befehl beschreibt,
  wie nach Neustart/Limit fortgesetzt wird (zuerst `git status` und `progress.md`).

---

## 3. Messbarkeit zuerst: Token- und Zeitwerte erfassen

Es gibt heute **keine** Messung im Plugin. Die Zahlen unten stammen aus den
Abschluss-Benachrichtigungen der Sitzung (`subagent_tokens`, `duration_ms`) und sind
[belegt] für diese Läufe, aber nicht im Protokoll gespeichert.

| Aufruf | Rolle | Tokens | Dauer |
|---|---|---|---|
| Paket 006 | frontend-lead | 140 k | 75 min |
| Paket 001 | frontend-lead | 264 k | 66 min |
| Paket 002 | frontend-lead | 302 k | 30 min |
| Paket 007 | frontend-lead | 190 k | 45 min |
| Paket 003 | frontend-lead | 141 k | 27 min |
| Paket 004 | frontend-lead | 284 k (+ Abbruch durch Limit) | 42 min |
| Paket 005 | frontend-lead | 466 k, 148 Tool-Aufrufe | 87 min |
| Nachbesserung 002 + Flick-Weg | frontend-lead | 110 k | 35 min |
| Nachpflege | architekt | 230 k | 7 min |
| Zweite Abnahme (002, 005) | product-owner | 109 k | 2 min |
| Erste Abnahme 001–007 | product-owner | nicht erfasst | nicht erfasst |
| Design-Kuratierung | ux-ui-designer | 183 k | 5 min |

(Summe der Lead-Aufrufe ≈ 1,9 Mio. Tokens für sieben Pakete.)

- **Auftrag:** Der Hook (oder ein neuer `SubagentStop`-Hook, Abschnitt 5) schreibt
  je Aufruf `tokens_in`, `tokens_out`, `tool_uses`, `dauer_ms`, `modell`, `rolle`,
  `task_id` in den Index und in `events.jsonl`. `runs-report.py` zeigt Summen je
  Rolle und je Paket.
- Ohne diese Spalten bleibt jede Optimierung Raten.

---

## 4. Token-Optimierung

Gemessen im Ziel-Repo (Dateigrößen, [belegt]):

| Datei | Größe | Wer lädt sie |
|---|---|---|
| `CLAUDE.md` | 66 KB | jede Sitzung und jeder Subagent |
| `.claude/context/code-conventions.md` | 60 KB | Leads, Architekt |
| `.claude/context/adr/*` (42 Dateien) | 327 KB | Architekt (über `INDEX.md`) |
| `.claude/context/context-map.md` | 20 KB | PO, Architekt |
| `.claude/context/learnings.md` | 19 KB | Architekt, PO |
| `.claude/context/design-concept.md` | 13 KB | Designer, Leads |
| `.claude/context/design-conventions.md` | war 1641 Zeilen, jetzt 146 Zeilen + 11 Themendateien | Designer, Leads |
| Agent-Definitionen | `architekt` 22 KB, `product-owner` 15 KB, `frontend-lead` 13 KB, `ux-ui-designer` 11 KB, `backend-lead` 11 KB, `design-concept` 8 KB | je Aufruf eine |
| Regeln `rules/*.md` | 17 KB | alle Rollen |

Hebel in der Reihenfolge des erwarteten Nutzens:

1. **`CLAUDE.md` verschlanken.** [belegt] 66 KB, davon der überwiegende Teil
   Rauchtest-Absätze je Paket (Zeilenangaben, Rot-Nachweise, Messgrößen). Diese
   Absätze wachsen mit jedem Paket und wurden von jedem Lead angepasst. Zwei Wirkungen:
   Jeder Aufruf zahlt sie, und jede Änderung **entwertet den Prompt-Cache** für den
   gemeinsamen Anfang aller Aufrufe. [Vermutung zum Cache-Effekt.]
   - **Auftrag:** In der Vorlage für Ziel-Repos festlegen: `CLAUDE.md` bleibt eine
     kurze Landkarte (Regeln, Befehle, Verweise). Je Paket entstehende Detailberichte
     gehören nach `docs/…`, und der Agent liest sie nur bei Bedarf. Zeilenangaben auf
     `scripts/smoke.mjs` sollen nicht in `CLAUDE.md` stehen, sie veralten mit jeder
     Änderung (beim Nachziehen verbrauchte jeder Lead Aufrufe dafür).
2. **Größenbudget je Gedächtnisdatei.** `design-conventions.md` wuchs bis auf 1641
   Zeilen, weil die Regel „genau eine schreibende Rolle" kein Wachstumslimit kennt;
   die Datei trug eine eigene Soll-Vorgabe „< 150 Zeilen", die nie durchgesetzt
   wurde. `code-conventions.md` (60 KB) und `context-map.md` (20 KB) sind auf dem
   gleichen Weg.
   - **Auftrag:** Budget je Datei im Regelwerk (z. B. Hauptdatei ≤ 300 Zeilen, Details
     in Themendateien mit Register). Der Orchestrator oder ein Skript
     (`check-context-size.py`) meldet Überschreitungen. Kuratieren ist ein eigener,
     regelmäßiger Auftrag an die jeweilige schreibende Rolle.
3. **Selektives Laden statt Volllesen.** Die Rollen sollen nur lesen, was zum Paket
   gehört (ADR über `INDEX.md`, Konventionen über Themenregister). Im Regelwerk
   festhalten und im Agent-Prompt als Pflichtschritt „Register zuerst" verankern.
4. **Berichtsformat begrenzen.** Die Abschlussberichte der Leads waren mehrere KB
   Prosa **plus** Handoff-JSON mit denselben Aussagen. [belegt] (Berichte in
   `prompts.md`.) Vorschlag: Bericht = Kopf (≤ 10 Zeilen) + Handoff-JSON + optionaler
   Anhang. Ausführliche Nachweise (Rot-Nachweis, Mutationslisten) gehören in die
   Repo-Doku, nicht in die Nachricht an den Orchestrator, der sie dann weiterreicht.
5. **Kleinere Modelle für leichte Rollen.** Der `product-owner` im Abnahme-Modus
   liest nur Code und Doku, der Designer pflegt Texte. Rollen-Frontmatter kann
   `model` setzen. [Vermutung: Qualitätsverlust gering; als Experiment mit
   Vergleichsmessung fahren, nicht pauschal umstellen.]
6. **Rauchtest-Kosten senken.** Ein voller `npm run smoke` dauert ca. 7,5 Minuten.
   Für jeden Rot-Nachweis baute jeder Lead eine **temporäre gekürzte Kopie** des
   Skripts, die Mutationen mussten kompilieren, und liegen gebliebene `*.orig`
   mussten geprüft werden. [belegt in allen Lead-Berichten.]
   - **Auftrag (Ziel-Repo-Vorlage):** `smoke.mjs --only <ansicht|zusicherung>` und ein
     Mutations-Hilfsskript (Datei sichern, ersetzen mit `assert old in s`, Lauf,
     zurücksetzen). Spart den größten Teil der Lead-Zeit und viele Tool-Aufrufe.
7. **Aufträge per Dateiverweis statt per Volltext.** Das wurde in dieser Sitzung
   bereits so gemacht (Verweis auf `prompts.md`-Eintrag). Das Regelwerk sollte es
   festschreiben: Der Orchestrator gibt Pfade und Abschnittsnamen weiter, nicht
   Auszüge.
8. **Wiederholtes Lesen vermeiden.** [Vermutung] Jede Rolle liest zu Beginn dieselben
   Kontextdateien neu. Eine „Kontext-Zusammenfassung je Paket" (eine Seite, vom
   Architekten geschrieben) könnte das Volllesen ersetzen. Erst nach Messung
   (Abschnitt 3) entscheiden.

**Erfolgskriterium:** Gesamtverbrauch je Paket und je Rolle sinkt gegenüber der
Tabelle in Abschnitt 3 messbar, ohne dass die Abnahmequote oder die Zahl der
Rückläufer steigt.

---

## 5. Zu bewertende Frage: Protokoll durch strukturiertes Ereignis-Log ersetzen?

Ziel: nachvollziehen, was die KI wann getan und warum.

**Zustand heute:** `index.md` (Markdown-Tabelle) + `NNN-<rolle>.json` + `prompts.md`.
Es zeichnet Aufrufe auf, nicht Ereignisse. Es fehlen: Ergebnisse (2.1), Fragen und
Antworten (2.5), Tokens (3), Commits und Verifikationsläufe, Quelle der Eingaben (2.2).
Das Protokoll wird mitcommittet, `prompts.md` allein wuchs auf 260 KB.

**Zu bewertende Optionen** (nicht vorab entscheiden):

| Option | Idee | Spricht dafür | Spricht dagegen / offen |
|---|---|---|---|
| A | Zusätzlicher Hook am Ende des Subagents (`SubagentStop`), schreibt die Endnachricht | Behebt 2.1 direkt, kleiner Eingriff | **Zu verifizieren:** welche Felder der Hook-Payload liefert (Endnachricht, Pfad zum Transkript, Token-Zahlen) |
| B | Append-only `events.jsonl` je Sitzung, ein Ereignis je Zeile (`launch`, `result`, `question`, `answer`, `commit`, `verify`, `usage`) | Auswertbar mit Skript, ein Format für alles, keine Schreibkonflikte bei Parallelität | Neues Format, `runs-report.py` und `/lauf-analyse` müssen umgestellt werden |
| C | Agents schreiben ihr Handoff selbst als Datei (`handoffs/<task_id>-<rolle>.json`) und `validate-handoff.py` prüft sie | Ergebnis liegt strukturiert vor, unabhängig vom Hook | Verlässt sich auf das Modell (das Protokoll wurde bewusst per Hook gemacht, siehe Kopf von `log-agent-run.py`) |
| D | OpenTelemetry-Export von Claude Code (Metriken/Ereignisse) in ein externes System | Token- und Dauerdaten ohne eigene Erfassung | **Zu prüfen:** Verfügbarkeit in Cloud-Sitzungen, Datenschutz, Aufwand |
| E | Links zum vollständigen Transkript des Subagents je Eintrag | Volle Nachvollziehbarkeit der internen Schritte, die heute fehlen | Größe, Aufbewahrung, ob Transkripte im Repo landen dürfen |

**Vorschlag zur Bewertung (nicht Vorgabe):** B als Grundlage, A als Quelle für
`result` und `usage`, C als Rückfall für Fälle, in denen der Hook nichts liefert,
E nur als Verweis. D separat untersuchen.

**Bewertungskriterien:** Funktioniert in Cloud-Sitzungen (ohne Trust-Dialog; siehe
`CLAUDE.md`, Abschnitt „Durchlauf-Protokoll")? Verschluckt der Hook weiter alle Fehler
(Grundregel des Skripts)? Läuft bei parallelen Aufrufen ohne Kollision? Größe im
Repo vertretbar (Rohdaten ggf. in `.gitignore`, nur kompakter Index committen)?
Lesbar für Menschen ohne Skript (ein generierter `verlauf.md` je Sitzung)?

**Ergebnis der Bewertung als kurzes Entscheidungsdokument im Plugin-Repo ablegen**
(ADR-Stil), bevor umgebaut wird.

**Mindestanforderung an jedes neue Log** (aus den Befunden): Ergebnis je Aufruf,
Herkunft jeder Eingabe, Frage-ID mit Antwort, Tokens und Dauer, Commit-Hashes je Paket,
Sitzungs-ID ohne Datumsbruch.

---

## 6. Was gut funktioniert hat — nicht anfassen

- Single-Writer je Kontextdatei; `notes_for_learnings`/`notes_for_conventions` als
  Rückkanal; der Architekt wertet sie im Nachpflege-Modus aus. [belegt]
- `user_questions` mit `optionen`, `warum`, `annahme`; der Orchestrator stellt
  Fragen gebündelt, die Annahme lässt sich als Standard anbieten. [Beobachtung]
- Die Abnahme fand einen echten Fehler (Regler ohne Statuszeile bei -002), den
  Unit-Test, Rauchtest und Lead übersehen hatten. [belegt]
- Verifikationspflicht des Leads vor `done` (Typecheck, Lint, Vitest, Build,
  Rauchtest) und der Rot-Nachweis je neuer Zusicherung. Er fing mehrere nicht
  kompilierende Mutationen ab. [belegt]
- Regel „Abweichungen vom ADR sofort melden": In -005 meldete der Lead zwei bewusste
  Abweichungen von ADR-0039, der Architekt hat sie als Nachtrag aufgenommen. [belegt]

---

## 7. Vorgeschlagene Arbeitspakete im Plugin-Repo

| Nr. | Paket | Abhängigkeit | Fertig, wenn … |
|---|---|---|---|
| P1 | Protokoll-Grundlagen: Ergebnis je Aufruf erfassen (2.1), Herkunft der Eingaben trennen (2.2), Nummern atomar (2.3), Sitzungsverzeichnis ohne Datumsbruch (2.4) | — | Ein Probedurchlauf mit Hintergrund-Agents zeigt in `index.md` `task_id`, `status` und offene Fragen; keine doppelten Nummern |
| P2 | Messung: Tokens, Dauer, Tool-Aufrufe je Aufruf (Abschnitt 3), Summen in `runs-report.py` | P1 | Tabelle wie in Abschnitt 3 entsteht ohne Handarbeit |
| P3 | Bewertung Ereignis-Log (Abschnitt 5) als Entscheidungsdokument, danach Umsetzung der gewählten Variante | P1, P2 | Entscheidungsdokument liegt vor; gewählte Variante läuft im Probedurchlauf |
| P4 | Kommunikationsregeln: Frage-IDs (2.5), Belegpflicht für Aufträge (2.6), `roundtrip`-Zähler (2.7), Kriterien-Status in der Abnahme (2.8), Schema-Validierung (2.9), Rollenbeschreibung (2.10) | P1 | `validate-handoff.py` prüft reale Handoffs; Regelwerk und Agent-Prompts angepasst |
| P5 | Robustheit: `progress.md`-Pflicht und Fortsetzungsregel (2.12), Commit-Regel bei laufenden Agents (2.11) | — | Test: Agent mitten im Lauf abbrechen, Fortsetzung stellt den Stand her |
| P6 | Token-Optimierung (Abschnitt 4): Größenbudgets mit Prüfskript, Vorlage für schlanke `CLAUDE.md`, Berichtsformat, Rollen-Modelle als Experiment, `smoke --only` und Mutations-Hilfsskript als Vorlage | P2 | Vorher/Nachher-Messung zeigt sinkenden Verbrauch je Paket |

P1 und P5 können parallel beginnen. P6 erst nach P2.

---

## 8. Offene Entscheidungen für den Nutzer

1. Soll das Protokoll weiter im Repo mitcommittet werden (Größe, Datenschutz der
   Eingaben) oder nur der kompakte Index?
2. Dürfen Rollen mit kleineren Modellen laufen, wenn die Vergleichsmessung keinen
   Qualitätsverlust zeigt?
3. Ist ein externer Telemetrie-Export (Option D) erwünscht?

---

## 9. Anhang: Projekt-Restpunkte (gehören nicht ins Plugin, nur zur Vollständigkeit)

Aus dem Durchlauf im Ziel-Repo offen geblieben:
- Drei Lücken in den benannten Ausnahmen der Rauchtest-Prüfungen (ADR-0040 Punkt 5);
  Entscheidung des Nutzers: beim nächsten Paket mitnehmen, das die Prüfungen ohnehin
  anfasst.
- Sporadischer CORS-Fehler zu `photon.komoot.io` im Zustand „lädt" in zwei frühen
  Rauchtest-Läufen; danach nicht reproduziert. Beobachten.
- Regel „Komponenten binden nur an semantische Tokens" wird von Zonen-Skala,
  Intensitätsbalken und Bildvorschau mit `neutral-XXX` direkt verletzt.
- Verweise aus ADR-0021, `INDEX.md` Zeile 128 und `code-conventions.md` Zeile 870
  auf Abschnitte der Design-Konventionen sind veraltet oder widersprüchlich
  (Liste im Bericht des Designers zur Kuratierung).
- Kartenhöhe bleibt fest bei 480px (Nutzerentscheidung); die Schnellansicht hebt sich
  über die Tab-Leiste.
- Nicht geprüft: Touch und System-Zurück auf echten Geräten, WebKit und Firefox.

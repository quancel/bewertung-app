# Fortsetzen nach Abbruch, und Commits bei laufenden Leads

Gilt für `frontend-lead`, `backend-lead` und den Orchestrator. Anlass: Container-
Neustarts und Rate-Limits (HTTP 429) haben Leads mitten im Paket abgebrochen; Stand
und Absicht lagen nur im Kontext des toten Agents.

## 1. `progress.md` — die Leads schreiben mit

Datei: `.claude/progress/<task_id>.md` im Ziel-Repo. Wer ein Paket umsetzt, legt sie
**vor der ersten Änderung** an und aktualisiert sie **nach jedem Teilschritt** (eine
Datei fertig, ein Check gelaufen, eine Mutation angelegt/zurückgesetzt) — nicht erst
am Ende. Kurz halten, überschreiben statt anhängen:

```
# Fortschritt <task_id>
Rolle: frontend-lead
Aktualisiert: 2026-11-26T14:02:11Z
Status: läuft            # läuft | blocked | done

## Erledigt
- Store `foo` angelegt (src/stores/foo.ts), Typecheck grün

## Nächster Schritt
Komponente FooListe.vue anlegen, danach Lint und Vitest

## Offen
- src/scripts/smoke.mjs: temporäre Kopie `smoke.tmp.mjs` angelegt — vor `done` löschen
```

`Offen` nennt alles, was ein Abbruch **halb fertig** hinterlässt: temporäre Kopien,
`*.orig`, eine eingebaute Mutation, ein nicht abgeschlossener Umbau. Genau das findet
sonst niemand wieder.

`progress.md` wird **nicht** mit dem Code committet. Der Orchestrator löscht sie nach
der Abnahme des Pakets.

## 2. Fortsetzen — der Orchestrator

Ein Aufruf gilt als **abgebrochen**, wenn er gestartet wurde, aber kein Ergebnis
kam und der Agent nicht mehr antwortet (Neustart-Hinweis, `rate_limit`, Fehler im
Aufruf). Vorgehen:

1. `python3 .claude/agent-team/scripts/resume-status.py` ausführen (im Plugin-Betrieb:
   `find ~/.claude/plugins -name resume-status.py`). Es zeigt je Paket Status,
   Zeitpunkt, nächsten Schritt, Offenes — und `git status`.
2. Lebt der Agent noch (Rate-Limit), per `SendMessage` fortsetzen. Sonst **neuen**
   Aufruf derselben Rolle mit dem Handoff-Objekt **und** dem Satz „Fortsetzung:
   lies `.claude/progress/<task_id>.md` und prüfe den Arbeitsbaum, bevor du etwas
   änderst."
3. Der Lead beginnt in der Fortsetzung mit dem Abgleich: stimmt `Erledigt` mit dem
   Arbeitsbaum überein? Dann `Offen` abarbeiten (Aufräumen vor Weiterbauen), den
   zuletzt gelaufenen Check **einmal wiederholen**, erst dann `Nächster Schritt`.
   Er fängt nicht von vorn an und baut nichts doppelt.
4. Fehlt `progress.md` (Abbruch vor dem ersten Schritt oder Lead hielt sich nicht
   daran), gilt der Arbeitsbaum als einzige Wahrheit: `git status`/`git diff`
   auswerten, im Bericht kennzeichnen, dass der Stand rekonstruiert ist.

Eine Fortsetzung zählt **nicht** als Roundtrip im Sinne von `roundtrips` — es ist
derselbe Auftrag, nicht eine Rückgabe.

## 3. Commits, solange ein Lead läuft — der Orchestrator

Ein Stop-Hook oder die eigene Gewohnheit verlangt oft „committe und pushe", während
ein Lead im Hintergrund Dateien ändert. Ein Commit würde halbfertigen Code ins Remote
bringen oder die Dateien des Leads zerreißen.

- Solange ein Lead **läuft** (gestartet, noch kein Ergebnis), committet der Orchestrator
  **nur** Dateien, die keine laufende Rolle schreibt — in der Praxis `.claude/runs/`.
  Maßgeblich ist `files_to_touch` der laufenden Pakete plus `.claude/progress/`.
- Nie `git add -A` / `git commit -a` in diesem Zustand. Dateien einzeln benennen.
- Verlangt ein Hook trotzdem einen Commit: kurz antworten, dass ein Lead läuft und der
  Code-Commit zurückgestellt ist — und was stattdessen committet wurde.
- Nach dem Ergebnis des Leads (und der Abnahme) gilt wieder die normale Regel.

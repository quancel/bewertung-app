---
description: Analysiert die protokollierten Agent-Team-Durchlaeufe in .claude/runs/.
argument-hint: [Durchlauf-Verzeichnis oder Frage, optional]
---

Analysiere die protokollierten Durchläufe des Agent-Teams.

Fokus (falls angegeben): $ARGUMENTS

## Vorgehen

1. **Überblick zuerst, nicht alle Dateien lesen.** Es gibt ein
   Verdichtungs-Skript; wo es liegt, hängt davon ab, wie das Plugin
   eingebunden ist. Probier der Reihe nach:

   ```bash
   python3 .claude/agent-team/scripts/runs-report.py 2>/dev/null \
     || find ~/.claude/plugins -name runs-report.py 2>/dev/null | head -1
   ```

   Findest du es nicht, ist das kein Hindernis: Lies `index.md` des
   jeweiligen Durchlaufs — dort steht je Zeile Rolle, `task_id`, `status`,
   die Zahl offener Fragen und die Schleifenzähler `d/b/r`
   (design/blocked/review). Öffne die JSON-Dateien danach gezielt; die
   Rohprotokolle sind vollständig und entsprechend groß.

2. **Struktur der Daten.** Je Session ein Verzeichnis
   `.claude/runs/<datum>_<session>/`:

   | Datei | Inhalt |
   |-------|--------|
   | `index.md` | eine Zeile je Ereignis, chronologisch |
   | `NNN-<rolle>.json` | ein Subagent-Aufruf: `eingabe_prompt`, `ausgabe`, geparste `handoffs` |
   | `prompts.md` | die Eingaben des Nutzers, die den Durchlauf ausgelöst haben |

3. **Worauf zu achten ist** — das sind die Fehler, die im Ablauf sonst nicht
   auffallen:

   - **Übergangene `user_questions`.** Ein Eintrag im Handoff, auf den kein
     erneuter Aufruf derselben Rolle folgt, heißt: Das Team hat mit der
     `annahme` weitergearbeitet, und die steht jetzt im Ergebnis wie eine
     Entscheidung des Nutzers. Prüfe je Frage, ob danach ein Aufruf derselben
     Rolle mit einer Antwort kam.
   - **Unvollständige `user_questions`** — es fehlt `optionen`, `warum` oder
     `annahme`. Der Orchestrator hätte den Eintrag einmal zurückgeben müssen,
     statt die Felder selbst zu ergänzen.
   - **Reihenfolge.** Lief der `frontend-lead` vor fertigem Design
     (`design_notes` leer oder `design_open_questions` gefüllt)? Lief er trotz
     `frontend_start: after_backend` vor den `depends_on`-Paketen?
   - **Roundtrip-Budget.** Die Spalte `d/b/r` in `index.md` zeigt die
     Schleifenzähler des Pakets. Obergrenzen: `design` 2, `blocked` 1,
     `review` 1. Ein höherer Wert heißt, es wurde iteriert statt eskaliert.
     Ein Zähler, der über mehrere Aufrufe desselben Pakets **nicht steigt**,
     obwohl zurückgegeben wurde, heißt das Gegenteil: Eine Rolle zählt nicht
     mit, und die Obergrenze greift nie.
   - **Modus genannt?** Der Aufrufer soll `Modus: <name>` in den Aufruf
     schreiben (`eingabe_prompt` im JSON). Fehlt er, hat der Agent geraten —
     das ist kein Fehler des Agenten, sondern eine Lücke im Aufruf, und die
     häufigste Ursache für eine falsch gefahrene Runde.
   - **Rückkanal.** Kam nach den Leads noch ein `architekt`-Aufruf im
     Nachpflege-Modus (Schritt 7b)? Ohne ihn versickern
     `notes_for_learnings` und `notes_for_conventions`.
   - **Abnahme.** Wurden Pakete mit `accepted: false` oder offenen
     `review_findings` als fertig gemeldet? Was konnte der `product-owner`
     ausdrücklich *nicht* am Code beurteilen?
   - **Kontext vor den Fragen.** Trägt jedes Objekt mit gefülltem
     `user_questions` einen `frage_kontext` (max. 10 Sätze)? Ohne ihn hat der
     Nutzer die Frage ohne Ausgangslage gesehen — und vermutlich die Empfehlung
     angeklickt. Prüfe auch, ob bei Design-Fragen eine `design_demo` gesetzt war.
   - **Ergebnisse statt Startquittungen.** Bei asynchron gestarteten Agents
     steht die Antwort in den `*-ergebnis.json`-Dateien (Ereignis
     `SubagentStop`), nicht in der Datei des Aufrufs.
   - **Belege der Kriterien.** Trägt jedes `acceptance_criteria` eine
     `pruefung` und ein `ziel`? Hat der Lead bei `pruefung: "test"` ein
     `ergebnis` eingetragen — oder steht dort nichts, während das Paket auf
     `done` steht? Ein auffälliger Anteil `manuell` in einem Paket heißt
     nicht zwingend Nachlässigkeit, aber er sagt, wie viel von der Abnahme
     überhaupt am Code entschieden werden konnte.

4. **Ergebnis.** Nenne je Befund die Fundstelle (`<durchlauf>/NNN-<rolle>.json`)
   und unterscheide klar zwischen *belegt aus dem Protokoll* und *Vermutung*.
   Das Protokoll enthält Ein- und Ausgaben der Subagents, nicht deren interne
   Schritte — was daraus nicht hervorgeht, sag als nicht beurteilbar an,
   statt es zu erschließen.

Folgt aus der Analyse eine Änderung am Regelwerk, gehört sie ins
Plugin-Repo `quancel/agent-team-marketplace` — nicht in die Kopie im
Ziel-Repo, die beim nächsten Abgleich überschrieben wird.

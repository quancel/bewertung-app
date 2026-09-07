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
   jeweiligen Durchlaufs — dort steht je Zeile Rolle, `task_id`, `status` und
   die Zahl offener Fragen. Öffne die JSON-Dateien danach gezielt; die
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
   - **Roundtrip-Budget.** Pro Paket ist genau ein automatischer Roundtrip
     vorgesehen. Mehr heißt: Es wurde iteriert statt eskaliert.
   - **Rückkanal.** Kam nach den Leads noch ein `architekt`-Aufruf im
     Nachpflege-Modus (Schritt 7b)? Ohne ihn versickern
     `notes_for_learnings` und `notes_for_conventions`.
   - **Abnahme.** Wurden Pakete mit `accepted: false` oder offenen
     `review_findings` als fertig gemeldet? Was konnte der `product-owner`
     ausdrücklich *nicht* am Code beurteilen?

4. **Ergebnis.** Nenne je Befund die Fundstelle (`<durchlauf>/NNN-<rolle>.json`)
   und unterscheide klar zwischen *belegt aus dem Protokoll* und *Vermutung*.
   Das Protokoll enthält Ein- und Ausgaben der Subagents, nicht deren interne
   Schritte — was daraus nicht hervorgeht, sag als nicht beurteilbar an,
   statt es zu erschließen.

Folgt aus der Analyse eine Änderung am Regelwerk, gehört sie ins
Plugin-Repo `quancel/agent-team-marketplace` — nicht in die Kopie im
Ziel-Repo, die beim nächsten Abgleich überschrieben wird.

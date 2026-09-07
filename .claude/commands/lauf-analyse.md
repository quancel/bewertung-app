---
description: Analysiert die protokollierten Agent-Team-Durchlaeufe in .claude/runs/.
argument-hint: [Durchlauf-Verzeichnis oder Frage, optional]
---

Analysiere die protokollierten Durchläufe des Agent-Teams.

Fokus (falls angegeben): $ARGUMENTS

## Vorgehen

1. **Überblick zuerst, nicht alle Dateien lesen.** Starte mit:

   ```bash
   python3 .claude/scripts/runs-report.py
   ```

   Das Skript verdichtet `.claude/runs/*/` zu Rollen-Häufigkeiten, Status,
   Blockaden und Fragen an den Nutzer. Öffne danach gezielt nur die
   JSON-Dateien, die für die Frage relevant sind — die Rohprotokolle sind
   vollständig und entsprechend groß.

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
   - **Unvollständige `user_questions`** (es fehlt `optionen`, `warum` oder
     `annahme`) — `runs-report.py` markiert sie.
   - **Reihenfolge.** Lief der `frontend-lead` vor fertigem Design
     (`design_notes` leer oder `design_open_questions` gefüllt)? Lief er trotz
     `frontend_start: after_backend` vor den `depends_on`-Paketen?
   - **Roundtrip-Budget.** Pro Paket ist genau ein automatischer Roundtrip
     vorgesehen. Mehr heißt: Es wurde iteriert statt eskaliert.
   - **Rückkanal.** Kam nach den Leads noch ein `architekt`-Aufruf im
     Nachpflege-Modus? Ohne ihn versickern `notes_for_learnings` und
     `notes_for_conventions`.
   - **Abnahme.** Wurden Pakete mit `accepted: false` oder offenen
     `review_findings` als fertig gemeldet? Was konnte der `product-owner`
     ausdrücklich *nicht* am Code beurteilen?

4. **Ergebnis.** Nenne je Befund die Fundstelle (`<durchlauf>/NNN-<rolle>.json`)
   und unterscheide klar zwischen *belegt aus dem Protokoll* und *Vermutung*.
   Das Protokoll enthält Ein- und Ausgaben der Subagents, nicht deren interne
   Schritte — was daraus nicht hervorgeht, sag als nicht beurteilbar an,
   statt es zu erschließen.

Verbesserungen am Regelwerk gehören nicht ins Ziel-Repo, sondern ins
Plugin-Repo `quancel/agent-team-marketplace`; von dort per
`./.claude/scripts/sync-agent-team.sh` zurück. Direkt in `.claude/agents/`
oder `.claude/agent-team/` editierte Änderungen werden beim nächsten Sync
überschrieben.

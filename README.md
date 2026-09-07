# bewertung-app

Bewertungs-Anwendung — **Projekt initialisiert, noch ohne Anwendungscode.**

Das 6-Rollen KI-Agent-Team
([`agent-team`](https://github.com/quancel/agent-team-marketplace)) liegt
direkt im Repo. Es funktioniert damit sofort und überall — auch in
Cloud-Sessions, die keine Plugins installieren.

## Loslegen

```
/orchestrate <Feature-Beschreibung>
```

Der ausformulierte Erstauftrag für diese App liegt in
[`docs/feature-request-bewertungs-app.md`](docs/feature-request-bewertungs-app.md)
— den Block dort vollständig kopieren.

`product-owner` zerlegt den Request, `architekt` legt Struktur und
Konventionen fest, die Leads implementieren, `product-owner` nimmt ab.
Fachliche Domäne und Technologie-Stack sind bewusst noch offen und werden
über diesen Workflow entschieden.

## Was hier liegt

```
.claude/
  agents/                 6 Rollen                        ← generiert
  commands/
    orchestrate.md        /orchestrate                    ← generiert
    lauf-analyse.md       /lauf-analyse                   ← generiert
  agent-team/                                             ← generiert
    rules/                Handoff-Schema, Präzedenz, Reihenfolge
    context-templates/    Vorlagen (nicht die echten Projektdateien)
    scripts/
      log-agent-run.py    Hook: protokolliert jeden Subagent-Aufruf
      runs-report.py      verdichtet .claude/runs/ zu einer Übersicht
    VENDORED.md           Herkunft und Stand der Kopie
    GENERATED-COMMANDS    welche Befehle der Sync erzeugt hat
  context/                Projektgedächtnis: Context-Map, ADRs, Learnings,
                          Code- und Design-Konventionen (noch nicht befüllt)
  runs/                   Protokoll jedes Durchlaufs (entsteht zur Laufzeit)
  scripts/
    sync-agent-team.sh    Agent-Team aus dem Marketplace-Repo übernehmen
  settings.json           Hooks für das Durchlauf-Protokoll
CLAUDE.md                 Arbeitsanweisung für Claude Code in diesem Repo

Alles mit „← generiert" kommt aus dem Marketplace-Repo und wird beim
nächsten Sync ersetzt.
```

## Agent-Team aktualisieren

```bash
./.claude/scripts/sync-agent-team.sh
```

Holt den aktuellen Stand aus `quancel/agent-team-marketplace` und **ersetzt
`.claude/agents/` und `.claude/agent-team/` vollständig**; in
`.claude/commands/` entfernt er genau die Dateien des letzten Laufs, ein
repo-eigener Befehl daneben bleibt. Änderungen am Regelwerk gehören deshalb
ins Marketplace-Repo, nicht hierher.

Beim Kopieren wird `${CLAUDE_PLUGIN_ROOT}/` auf `.claude/agent-team/`
umgeschrieben — ohne das fänden die Agents ihre Regel- und Vorlagendateien
nicht und liefen stillschweigend ohne Regelwerk weiter. Das Skript bricht ab,
wenn danach ein Verweis übrig bleibt oder ins Leere zeigt.

## Durchlauf-Protokoll

Jeder Subagent-Aufruf landet automatisch in `.claude/runs/<datum>_<session>/`
— Eingabe, Ausgabe und die geparsten Handoff-Objekte. Auswertung:

```
/lauf-analyse
python3 .claude/agent-team/scripts/runs-report.py --last 3
```

Der Hook wird beim Session-Start geladen: nach Änderungen an
`.claude/settings.json` erst nach `/hooks` oder einem Neustart aktiv.

## Optional: Agent-Teams-Feature

Für vollständig unabhängige Claude-Code-Instanzen statt gewöhnlicher
Subagents `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` setzen — lokal in
`~/.claude/settings.json`, in Cloud-Sessions über die Environment-Variablen
der Cloud-Umgebung. Ohne die Variable läuft das Team normal.

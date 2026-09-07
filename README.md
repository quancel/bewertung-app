# bewertung-app

Bewertungs-Anwendung — **Projekt frisch initialisiert, noch ohne
Anwendungscode.**

Dieses Repo ist als Ziel-Repo für das 6-Rollen KI-Agent-Team
[`agent-team`](https://github.com/quancel/agent-team-marketplace)
eingerichtet:

- `.claude/settings.json` — Marketplace `quancel/agent-team-marketplace` und
  Plugin `agent-team` deklariert (greift in lokalen Sessions nach
  Workspace-Trust; Cloud-Sessions installieren keine Plugins).
- `.claude/context/` — Projektgedächtnis: Context-Map, ADRs, Learnings,
  Code- und Design-Konventionen. Angelegt, noch nicht befüllt; jede Datei
  hat genau eine schreibende Rolle.
- `CLAUDE.md` — Arbeitsanweisung für Claude Code in diesem Repo.

## Loslegen

In einer **lokalen** Claude-Code-Session:

```
/plugin marketplace add quancel/agent-team-marketplace
/plugin install agent-team@agent-team-marketplace
/agent-team:orchestrate <Feature-Beschreibung>
```

Der `product-owner` zerlegt den Request, der `architekt` legt Struktur und
Konventionen fest, die Leads implementieren. Fachliche Domäne und
Technologie-Stack sind bewusst noch offen und werden über diesen Workflow
entschieden.

## Optional: Agent-Teams-Feature

Für vollständig unabhängige Claude-Code-Instanzen statt gewöhnlicher
Subagents `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` setzen — lokal in
`~/.claude/settings.json`, in Cloud-Sessions über die Environment-Variablen
der Cloud-Umgebung. Ohne die Variable funktioniert das Plugin normal.

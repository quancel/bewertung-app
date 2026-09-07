# bewertung-app

Bewertungs-Anwendung. **Das Repo ist neu und enthält noch keinen
Anwendungscode** — nur die Projekt-Initialisierung für die Arbeit mit dem
KI-Agent-Team (`agent-team`).

Fachliche Domäne, Scope und Technologie-Entscheidungen sind **noch nicht
festgelegt**. Sie entstehen über den unten beschriebenen Workflow:
`product-owner` schneidet die Arbeitspakete, der `architekt` entscheidet
Struktur und Konventionen und hält sie in `.claude/context/` fest. Rate
nichts davon vorweg und lege keine App-Struktur „auf Verdacht" an.

## Arbeitsweise: 6-Rollen Agent-Team

Feature-Arbeit läuft über das Plugin `agent-team@agent-team-marketplace`
(Repo: `quancel/agent-team-marketplace`):

```
/agent-team:orchestrate <Feature-Beschreibung>
```

Ablauf: `design-concept` (einmalig) → `product-owner` ⇄ `ux-ui-designer`
(Design-Schleife) → `architekt` → `backend-lead` / `frontend-lead` →
`product-owner` (Abnahme). Die Reihenfolge ist bindend; Regelwerk und
Handoff-Schema liegen im Plugin und werden von den Agents selbst geladen.

**Nur die beiden Leads schreiben Code.** `product-owner`, `architekt`,
`design-concept` und `ux-ui-designer` planen und dokumentieren.

**Rückfragen an den Nutzer** gehen ausschließlich über das Handoff-Feld
`user_questions` — Subagents haben `AskUserQuestion` nicht. Der Orchestrator
(Hauptthread) prüft das Feld nach jedem Aufruf einer planenden Rolle.

## Projektgedächtnis in `.claude/context/`

Jede Datei hat **genau eine schreibende Rolle**; alle anderen lesen nur.

| Datei | Inhalt | Schreibt | Vorschläge über |
|-------|--------|----------|-----------------|
| `context-map.md` | Register der Bounded Contexts und ihrer Schnittstellen | `architekt` | — |
| `adr/*.md` + `adr/INDEX.md` | Architektur-Entscheidungen mit Begründung, plus Index | `architekt` | — |
| `learnings.md` | Kuratierte Erfahrungswerte für künftige Routing-Entscheidungen | `architekt` | `notes_for_learnings` |
| `code-conventions.md` | Ordnerstruktur und Namenskonventionen für FE und BE | `architekt` | `notes_for_conventions` |
| `design-concept.md` | Farbsystem, Typografie, Spacing, Theming, Corporate Design | `design-concept` | — |
| `design-conventions.md` | Entschiedene UI-Konventionen: Zustände, Timings, Formulare | `ux-ui-designer` | — |

Alle sechs Dateien existieren bereits als leere Instanzen und sind mit
„Stand: noch nicht befüllt" markiert. `adr/` enthält bisher nur
`INDEX.md` und die Vorlage `0000-template.md`.

**Bei Widersprüchen** gilt für alle Rollen dieselbe Rangfolge:

> ADR → `constraints` → `design-concept.md` / `code-conventions.md` →
> `design_notes` → `design-conventions.md` → Repo-Pattern → eigene Präferenz

## Plugin-Verfügbarkeit

`.claude/settings.json` deklariert Marketplace und Plugin. Das greift
**nur in lokalen Terminal-Sessions** und erst nach erteiltem Workspace-Trust.

**Claude Code on the web / Cloud-Sessions installieren keine Plugins** —
ohne Fehlermeldung; `/agent-team:orchestrate` und die Agent-Typen fehlen dann
einfach. Für den vollen Workflow eine lokale Session nutzen:

```
/plugin marketplace add quancel/agent-team-marketplace
/plugin install agent-team@agent-team-marketplace
```

Eine laufende Cloud-Session lässt sich mit `claude --teleport <session-id>`
in den lokalen Terminal ziehen. Details und Fehlersuche im
[Marketplace-README](https://github.com/quancel/agent-team-marketplace).

## Build, Test, Lint

Noch nichts eingerichtet — es gibt keinen Code. Sobald der `architekt` die
Struktur festgelegt und der erste Lead geliefert hat, gehören die
tatsächlichen Befehle hierher.

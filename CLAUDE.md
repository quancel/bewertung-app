# bewertung-app

Bewertungs-Anwendung. **Das Repo enthält noch keinen Anwendungscode** — nur
die Projekt-Initialisierung für die Arbeit mit dem KI-Agent-Team
(`agent-team`).

Fachliche Domäne, Scope und Technologie-Entscheidungen sind **noch nicht
festgelegt**. Sie entstehen über den unten beschriebenen Workflow:
`product-owner` schneidet die Arbeitspakete, der `architekt` entscheidet
Struktur und Konventionen und hält sie in `.claude/context/` fest. Rate
nichts davon vorweg und lege keine App-Struktur „auf Verdacht" an.

## Arbeitsweise: 6-Rollen Agent-Team

Das Team liegt **im Repo** (siehe „Herkunft der Agents"), nicht als
installiertes Plugin. Feature-Arbeit startet mit:

```
/orchestrate <Feature-Beschreibung>
```

Ablauf: `design-concept` (einmalig) → `product-owner` ⇄ `ux-ui-designer`
(Design-Schleife) → `architekt` → `backend-lead` / `frontend-lead` →
`product-owner` (Abnahme). Die Reihenfolge ist bindend; Regelwerk und
Handoff-Schema liegen unter `.claude/agent-team/rules/` und werden von den
Agents selbst geladen.

**Nur die beiden Leads schreiben Code.** `product-owner`, `architekt`,
`design-concept` und `ux-ui-designer` planen und dokumentieren.

**Rückfragen an den Nutzer** gehen ausschließlich über das Handoff-Feld
`user_questions` — Subagents haben `AskUserQuestion` nicht. Der Orchestrator
(Hauptthread) prüft das Feld nach jedem Aufruf einer planenden Rolle.

## Herkunft der Agents — generiert, nicht von Hand pflegen

`.claude/agents/`, die Befehle in `.claude/commands/` und
`.claude/agent-team/` (Regelwerk, Vorlagen, Skripte) sind **Kopien** aus dem
Plugin-Repo
`quancel/agent-team-marketplace`, erzeugt von:

```bash
./.claude/scripts/sync-agent-team.sh              # von GitHub (Standard)
./.claude/scripts/sync-agent-team.sh --from <pfad-zum-marketplace-klon>
```

Der Sync **ersetzt `.claude/agents/` und `.claude/agent-team/` vollständig**
und entfernt in `.claude/commands/` genau die Dateien, die der letzte Lauf
erzeugt hat (Liste in `.claude/agent-team/GENERATED-COMMANDS`) — ein
repo-eigener Befehl daneben bleibt unangetastet. Änderungen am Regelwerk
gehören deshalb ins Marketplace-Repo und kommen von dort zurück — direkt
hier editiert sind sie beim nächsten Sync weg.
Herkunft und Stand stehen in `.claude/agent-team/VENDORED.md`.

Der Sync schreibt beim Kopieren `${CLAUDE_PLUGIN_ROOT}/` auf
`.claude/agent-team/` um. Das ist kein Schönheitsfix: Die
Platzhalter-Ersetzung greift nur bei Plugin-Agents. Ein roher Kopiervorgang
liefert Agents, deren Verweise auf `rules/` und `context-templates/` ins Leere
zeigen — sie laufen dann ohne Regelwerk weiter, ohne dass es auffällt.

Weil die Agents als Projekt-Agents im Repo liegen, funktionieren sie auch in
**Claude Code on the web / Cloud-Sessions**, wo Plugins nicht installiert
werden. `.claude/settings.json` deklariert deshalb **kein** Plugin mehr: Wären
Plugin und Repo-Kopie gleichzeitig aktiv, gäbe es jede Rolle zweimal.

## Durchlauf-Protokoll: `.claude/runs/`

Jeder Subagent-Aufruf wird automatisch mitgeschrieben — per Hook
(`.claude/settings.json` → `.claude/agent-team/scripts/log-agent-run.py`),
nicht durch eine Zusammenfassung, die das Modell schreiben muss. Je Session
ein Verzeichnis `.claude/runs/<datum>_<session>/`:

| Datei | Inhalt |
|-------|--------|
| `index.md` | eine Zeile je Ereignis: Zeit, Rolle, `task_id`, `status`, offene Fragen |
| `NNN-<rolle>.json` | ein Aufruf vollständig: `eingabe_prompt`, `ausgabe`, geparste `handoffs` |
| `prompts.md` | die Nutzer-Eingaben, die den Durchlauf ausgelöst haben |

Auswertung mit `/lauf-analyse` oder direkt:

```bash
python3 .claude/agent-team/scripts/runs-report.py            # alle Durchläufe
python3 .claude/agent-team/scripts/runs-report.py --last 3
```

Hook-Skript, Report und beide Befehle stammen aus dem Plugin und werden
mitsynchronisiert; nur der `hooks`-Block in `.claude/settings.json` gehört
dem Repo. Das Plugin bringt für den Plugin-Betrieb ein eigenes
`hooks/hooks.json` mit — hier greift es nicht, weil die Rollen als
Projekt-Agents laufen.

Das Protokoll wird **mitcommittet** — es ist der Zweck der Sache, Durchläufe
später vergleichen zu können. Wer das nicht will, nimmt `.claude/runs/` in
die `.gitignore` auf; wer gar nicht protokollieren will, entfernt den
`hooks`-Block aus `.claude/settings.json`.

Drei Einschränkungen, damit sich niemand auf mehr verlässt, als da ist:
Hooks werden **beim Session-Start** geladen — nach Änderungen an
`.claude/settings.json` erst nach `/hooks` oder einem Neustart aktiv. Und
protokolliert werden Ein- und Ausgaben der Subagents, nicht deren interne
Schritte.

Die dritte wiegt am schwersten: Hooks aus einer **Projekt**-`settings.json`
laufen erst, wenn der Workspace-Trust-Dialog für den Ordner akzeptiert
wurde — und eine nicht-interaktive Session zählt ausdrücklich nicht als
Akzeptanz. **In Claude Code on the web / Cloud-Sessions schreibt
`.claude/runs/` deshalb nicht**, ohne Fehlermeldung: der Hook-Befehl endet
auf `2>/dev/null || true`, und er wird ohnehin nie aufgerufen. Ob die Hooks
aktiv sind, zeigt `/hooks` — bei geladenem Protokoll steht dort „Project
Settings" als Quelle.

Das ist die eine Stelle, an der die Überlegung aus „Herkunft der Agents"
nicht mehr trägt: Die Rollen liegen als Projekt-Agents im Repo, **damit sie
in Cloud-Sessions funktionieren** — das Protokoll daneben funktioniert dort
als einziges nicht. Wer einen Cloud-Durchlauf protokollieren will, muss den
Hook auf Benutzer-Ebene eintragen (`~/.claude/settings.json`; die braucht
keinen Trust). Das liegt dann außerhalb des Repos und gilt für alle
Projekte des Nutzers — eine bewusste Entscheidung, kein Nebenbei-Fix.

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

Alle sechs Dateien existieren als leere Instanzen mit „Stand: noch nicht
befüllt". `adr/` enthält bisher nur `INDEX.md` und die Vorlage
`0000-template.md`.

Nicht verwechseln: `.claude/context/` sind die **echten Projektdateien**,
`.claude/agent-team/context-templates/` sind die generierten **Vorlagen**
daneben.

**Bei Widersprüchen** gilt für alle Rollen dieselbe Rangfolge:

> ADR → `constraints` → `design-concept.md` / `code-conventions.md` →
> `design_notes` → `design-conventions.md` → Repo-Pattern → eigene Präferenz

## Build, Test, Lint

Ein Vite-Projekt (Vue 3, TypeScript, Pinia, vue-router; siehe
`.claude/context/code-conventions.md`). Vor allen Befehlen einmal
`npm install`.

| Zweck | Befehl |
|-------|--------|
| Dev-Server | `npm run dev` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` (Fix: `npm run lint:fix`) |
| Test | `npm run test` (Vitest, `src/**/*.spec.ts`) |
| Produktions-Build | `npm run build` (führt Typecheck + `vite build` aus) |
| Build-Vorschau lokal | `npm run preview` |

Test-Runner ist **Vitest** (`vitest.config.ts`), eingerichtet mit
PO-2026-09-07-001 (persistierte Migrationen, ADR-0003 — das erste Paket mit
Testbedarf). `environment: 'node'` genügt für `src/persistence/` und die
Pinia-Stores; `vitest.setup.ts` polyfüllt `indexedDB` über
`fake-indexeddb/auto`, damit gegen eine echte (In-Memory-)IndexedDB statt
gegen einen selbstgebauten Mock getestet wird. Tests liegen als `*.spec.ts`
neben der getesteten Datei (code-conventions.md). Noch keine
Component-Test-Infrastruktur (`@vue/test-utils`) — bislang reichen reine
Store-/Persistenz-Tests; das erste Paket mit Testbedarf für
Komponentenverhalten richtet das ein und ergänzt diese Zeile.

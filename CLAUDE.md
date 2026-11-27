# bewertung-app

> Landkarte, keine Chronik. **Budget hart 150 Zeilen** (`.claude/agent-team/rules/CONTEXT_BUDGET.md`):
> jede Sitzung und jeder Subagent lädt diese Datei. Nachweise je Paket → `docs/pakete/<task_id>.md`.

## Was das ist
Eine App zum Bewerten von Orten (vier Achsen, Tags, Bilder, Karte), ausgeliefert als statische
PWA. Die Daten bleiben auf dem Gerät (IndexedDB, kein Backend, ADR-0001). Stack: Vue 3,
TypeScript, Vite, Pinia, vue-router (ADR-0002). Struktur und Konventionen stehen in
`.claude/context/code-conventions.md`, Entscheidungen in `.claude/context/adr/` (Index: `INDEX.md`).

## Arbeitsweise: 6-Rollen Agent-Team
Feature-Arbeit startet mit `/orchestrate <Feature-Beschreibung>`. Ablauf: `design-concept` (einmalig) →
`product-owner` ⇄ `ux-ui-designer` (Design-Schleife) → `architekt` → `backend-lead` / `frontend-lead` →
`product-owner` (Abnahme). Die Reihenfolge ist bindend. Regelwerk und Handoff-Schema liegen unter
`.claude/agent-team/rules/` und werden von den Agents selbst geladen.
- **Nur die beiden Leads schreiben Code.** `product-owner`, `architekt`, `design-concept` und
  `ux-ui-designer` planen und dokumentieren.
- **Rückfragen an den Nutzer** gehen ausschließlich über das Handoff-Feld `user_questions` (Subagents
  haben `AskUserQuestion` nicht); der Orchestrator prüft das Feld nach jedem Aufruf einer planenden Rolle.

## Herkunft der Agents — generiert, nicht von Hand pflegen
`.claude/agents/`, die Befehle in `.claude/commands/` und `.claude/agent-team/` (Regelwerk,
Vorlagen, Skripte) sind **Kopien** aus dem Plugin-Repo `quancel/agent-team-marketplace`:
```bash
./.claude/scripts/sync-agent-team.sh              # von GitHub (Standard)
./.claude/scripts/sync-agent-team.sh --from <pfad-zum-marketplace-klon>
```
- Der Sync **ersetzt `.claude/agents/` und `.claude/agent-team/` vollständig**. In
  `.claude/commands/` entfernt er nur, was der letzte Lauf erzeugt hat
  (`.claude/agent-team/GENERATED-COMMANDS`); repo-eigene Befehle bleiben. Änderungen am
  Regelwerk gehören deshalb ins Marketplace-Repo. Stand: `.claude/agent-team/VENDORED.md`.
- Der Sync schreibt `${CLAUDE_PLUGIN_ROOT}/` auf `.claude/agent-team/` um. Ein roher Kopiervorgang liefert Agents,
  deren Verweise auf `rules/`/`context-templates/` ins Leere zeigen, und das fällt nicht auf.
- Die Rollen liegen als Projekt-Agents im Repo, damit sie auch in **Cloud-Sessions** laufen. `.claude/settings.json`
  deklariert deshalb **kein** Plugin; mit Plugin und Repo-Kopie zugleich gäbe es jede Rolle zweimal.

## Durchlauf-Protokoll: `.claude/runs/`
Ein Hook (`.claude/settings.json` → `.claude/agent-team/scripts/log-agent-run.py`) schreibt
jeden Subagent-Aufruf mit, je Session in `.claude/runs/<datum>_<session>/`: `index.md` (eine
Zeile je Ereignis), `NNN-<rolle>.json` (Eingabe, Ausgabe, geparste Handoffs), `prompts.md`
(Nutzer-Eingaben). Auswertung: `/lauf-analyse` oder
`python3 .claude/agent-team/scripts/runs-report.py [--last 3]`.
- Das Protokoll wird **mitcommittet** (sonst `.claude/runs/` in die `.gitignore`); ohne Protokoll den `hooks`-Block
  entfernen. Er gehört dem Repo, Hook-Skript, Report und Befehle kommen per Sync.
- Hooks laden **beim Session-Start** (nach Änderungen `/hooks` oder Neustart). Protokolliert
  werden Ein- und Ausgaben der Subagents, nicht deren interne Schritte.
- **In Cloud-Sessions schreibt `.claude/runs/` nicht**, ohne Fehlermeldung: Hooks einer
  Projekt-`settings.json` laufen erst nach akzeptiertem Workspace-Trust, und eine
  nicht-interaktive Session zählt nicht als Akzeptanz. Ein Cloud-Protokoll braucht den Hook
  auf Benutzer-Ebene (`~/.claude/settings.json`, gilt dann für alle Projekte, bewusste
  Entscheidung). Ob die Hooks aktiv sind, zeigt `/hooks` (Quelle „Project Settings").

## Projektgedächtnis in `.claude/context/`
Jede Datei hat **genau eine schreibende Rolle**, alle anderen lesen nur (Tabelle:
`.claude/agent-team/rules/HANDOFF_SCHEMA.md`, Grundregel 10). Gelesen wird die Hauptdatei und
danach nur die Themendatei zum Paket. `.claude/agent-team/context-templates/` sind die
**Vorlagen**, nicht die Projektdateien. Bei Widersprüchen gilt für alle Rollen:
> ADR → `constraints` → `design-concept.md` / `code-conventions.md` → `design_notes` →
> `design-conventions.md` → Repo-Pattern → eigene Präferenz

## Befehle
Vor allen Befehlen einmal `npm install`.

| Zweck | Befehl |
|---|---|
| Dev-Server | `npm run dev` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` (Fix: `npm run lint:fix`) |
| Test | `npm run test` (Vitest, `src/**/*.spec.ts`) |
| Produktions-Build | `npm run build` (Typecheck + `vite build`) |
| Precache-Prüfung | `npm run verify:pwa` |
| Build-Vorschau | `npm run preview` |
| Rauchtest im Browser | `npm run smoke` (baut vorher) |
| Gedächtnisgröße | `python3 .claude/agent-team/scripts/check-context-size.py` |

## Tests
Vitest (`vitest.config.ts`) mit `environment: 'node'`; `vitest.setup.ts` polyfüllt `indexedDB` über `fake-indexeddb/auto`
(echte In-Memory-IndexedDB statt Mock). Tests liegen als `*.spec.ts` neben der Datei. **Eine Komponenten-Spec setzt als
erste Zeile `// @vitest-environment jsdom`; global bleibt `environment: 'node'`** (ADR-0027, Vorbild `Bewertungsachse.spec.ts`).
Sichtbarkeit, Trefferfläche, Pseudo-Element-Wirkung beweist jsdom nicht, das bleibt Sache des Rauchtests (`code-conventions/tests-und-verifikation.md`).

## Auslieferung: GitHub Pages
- Jeder Push auf **`main`** löst `.github/workflows/deploy-pages.yml` aus: `npm ci`, Lint,
  Vitest, `npm run build`, `npm run verify:pwa`; erst dann wird nach
  `https://quancel.github.io/bewertung-app/` veröffentlicht.
- **Ausgeliefert wird nur von `main`, und `main` ist der Default-Branch**: Die Umgebung
  `github-pages` deployt nur vom Default-Branch. Von einem Feature-Branch wird der `deploy`-Job
  nach einer Sekunde rot abgelehnt (keine Schritte, kein Log), während `build` grün ist.
- **Die Pages-Quelle „GitHub Actions" ist einmalig von Hand zu setzen** (Settings → Pages → Build and deployment).
  `enablement: true` an `configure-pages` scheitert am `GITHUB_TOKEN` (`Resource not accessible by integration`, auch
  mit `pages: write`, das Anlegen verlangt Admin-Rechte); im Workflow als Kommentar festgehalten.
- **`BASE` in `vite.config.ts` ist die einzige Quelle des Unterpfads.** Router,
  `navigateFallback`, `scripts/smoke.mjs` und `scripts/verify-precache.mjs` ziehen ihn von
  dort; wer anders ausliefert, ändert nur `BASE`.
- `npm run smoke` läuft bewusst **nicht** in CI (Browser-Download).

## Rauchtest: `npm run smoke`
`scripts/smoke.mjs` baut, startet `vite preview` und öffnet mit Playwright jede Ansicht aus `ANSICHTEN` bei jeder Breite aus
`BREITEN` (1280, 320, 390px; ADR-0012). Je Ansicht gilt: Anwendung startet, keine Laufzeitfehler, CSS-Ressourcen aufgelöst,
kein Bedienelement verdeckt, nichts ragt aus dem Bildschirm. Die Verdeckung im Ortsdetail wird in allen `ORTSSUCHE_ZUSTAENDE`
geprüft (Request-Interception, nie ein echter Photon-Aufruf). Ausnahmen nur als benannte Bedingung, Register in ADR-0040.
Bildschirmfotos landen in `.smoke/`.
- **Der Lead führt `npm run smoke` vor jeder `done`-Meldung aus**, zusätzlich zu Typecheck,
  Lint und Vitest, nicht statt ihrer. Mehrere echte Fehler kamen durch alle drei und die
  Abnahme (Belege: `docs/pakete/PO-2026-09-12-004.md`).
- **Ein roter Rauchtest mit einem bekannten, bereits geschnittenen Befund ist kein Grund,
  eine Zusicherung abzuschwächen**: Er wird durch das zugehörige Paket grün (ADR-0023 P6).
- **Playwright ist keine Projekt-Abhängigkeit.** Fehlt es, sagt der Rauchtest das und endet
  mit 0; die Zusicherungen gelten dann als **ungeprüft**, und genau so gehört es in den Bericht.
- **Der Rauchtest fährt nur Chromium** (ADR-0023 P5, ADR-0029). Ein erfolgreicher Lauf weist
  engine-abhängige Darstellung (Pseudo-Elemente, `appearance`, native Bedienelemente) als
  **„auf WebKit ungeprüft"** aus, als Eigenschaft benannt.
- **Neue Ansicht → `ANSICHTEN`, neue Breite → `BREITEN`, neuer netzabhängiger Zustand →
  `ORTSSUCHE_ZUSTAENDE`** (alle oben in `scripts/smoke.mjs`), sonst prüft sie niemand.
- Neue Zusicherung: hier die Eigenschaft in einem Satz, die Nachweise in `docs/pakete/`;
  Bauformen in `.claude/context/code-conventions/rauchtest-bauformen.md`.

Zusicherungsgruppen (Eigenschaft; Nachweise in `docs/pakete/<task_id>.md`):
- **PO-2026-09-13-001…-003** — jeder Regler ist greifbar (Daumen per CDP gelesen), eine Bedienung genügt (vor dem Loslassen geprüft), je Breite genau ein Weg zurück.
- **PO-2026-09-26-001** — ein Tag committet ohne Enter (Tab, `pagehide` am weiterlebenden Dokument, Ortswechsel per Verlauf) und übersteht ein Neuladen; (b2) echtes Entladen mit Fokus wird nur gemeldet, nicht hart geprüft (ADR-0031).
- **PO-2026-09-26-002** — ab `lg` sind auf jeder Ansicht mit `.master-detail` beide Spalten sichtbar und überlappungsfrei, darunter nur die zum `detailOffen`-Zustand passende.
- **PO-2026-09-26-003** — ein Ortswechsel ab `lg` (Klick und Verlauf) setzt den Scroll-Versatz der Detail-Spalte auf 0 und legt den Fokus auf „Detailansicht schließen".
- **PO-2026-09-27-001** — jedes sichtbare `<textarea>` wächst mit dem Inhalt (kein `resize`, kein innerer Scroll) beim Mount, beim Ortswechsel und beim Breitenwechsel.
- **PO-2026-09-27-002** — die Anfangsnotiz committet auf allen vier Auslösern ohne Enter und übersteht ein Neuladen; 100 Zeichen ohne Leerzeichen ragen nirgends heraus.
- **PO-2026-09-27-004** — Kommentar und Zahlenwert einer Achse committen ohne Enter; bei mehreren offenen Entwürfen trägt schon der erste `put()` nach `pagehide` alle.
- **PO-2026-09-27-003** — Zonen und Hervorhebungen der Ortsliste; die Auswahlkante bleibt im `box-shadow` jeder Kombination; Button-Text bricht nie im Button um.
- **MasterDetail-Korrektur 2026-09-28** — ab `lg` wird weder das Fenster noch eine Spalte höher als das Ansichtsfenster, auch mit absolut positioniertem Inhalt (Nachweis in `PO-2026-09-27-003.md`).
- **PO-2026-11-24-006** — die Bildvorschau legt genau einen Verlaufseintrag an, blättert per Taste/Pfeil/Wischen, hält den Fokus im Dialog und gibt ihn an die zuletzt gezeigte Kachel zurück.
- **PO-2026-11-24-001** — eine gewählte Gewichtung wirkt sofort und nach einem Neuladen gleich in Zeile, Detail, Sortierung und Zone.
- **PO-2026-11-24-002** — eigene Gewichte: `zehntel` bestimmt Anzeige und Zone, es gibt eine Endgruppe „ohne Gesamtnote bei dieser Gewichtung", das Gate hält die letzte Achse auf 1, der Regler committet beim Ziehen.
- **PO-2026-11-24-007** — eine Zone hat eine Plakettenfläche, Zeilen ohne Zone haben keine; Kontrast, Zeilenhöhe und Zeilenabstand stimmen; der Legenden-Auslöser zeigt Text und ist ≥ 44px.
- **PO-2026-11-24-003** — der Kartenausschnitt übersteht vier Rückwege, ein Neuladen passt neu ein, ein Filter außerhalb des Ausschnitts passt ein.
- **PO-2026-11-24-004** — Marker zeigen dieselbe Note wie die Ortszeile, sichtbare Namen überlappen nie, bei Kollision bleibt der Name des höher bewerteten Orts sichtbar.
- **PO-2026-11-24-005** — die Schnellansicht ist nicht modal, ihre Zustände sind per Geste und Tastatur erreichbar, Verlauf und Fokus stimmen, genau die überdeckten Marker sind `inert`.

## Wohin was gehört (damit diese Datei klein bleibt)
- **Entscheidungen** → `.claude/context/adr/` (Index `adr/INDEX.md`) · **Bounded Contexts** →
  `.claude/context/context-map.md` · **Erfahrungswerte** → `.claude/context/learnings.md`
- **Code-Konventionen** → `.claude/context/code-conventions.md` mit Themendateien unter
  `.claude/context/code-conventions/` · **Farben, Typografie, Theming** → `.claude/context/design-concept.md` ·
  **UI-Konventionen** → `.claude/context/design-conventions.md` mit Themendateien unter `.claude/context/design/`
- **Nachweise je Paket** (Rot-Nachweise, Mutationslisten, Messwerte, Befunde, Kuratierberichte)
  → `docs/pakete/<task_id>.md`. Hier steht höchstens ein Verweis.
- **Zeilennummern in Skripten gehören nie hierher** (sie veralten) · Fortschritt laufender Pakete →
  `.claude/progress/<task_id>.md` (nicht committen, `.claude/agent-team/rules/RESUME.md`).

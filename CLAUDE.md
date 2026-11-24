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
| Rauchtest im Browser | `npm run smoke` (baut vorher) |

Test-Runner ist **Vitest** (`vitest.config.ts`), eingerichtet mit
PO-2026-09-07-001 (persistierte Migrationen, ADR-0003 — das erste Paket mit
Testbedarf). `environment: 'node'` genügt für `src/persistence/` und die
Pinia-Stores; `vitest.setup.ts` polyfüllt `indexedDB` über
`fake-indexeddb/auto`, damit gegen eine echte (In-Memory-)IndexedDB statt
gegen einen selbstgebauten Mock getestet wird. Tests liegen als `*.spec.ts`
neben der getesteten Datei (code-conventions.md). Seit PO-2026-09-13-001
(ADR-0027) gibt es zusätzlich eine **Component-Test-Infrastruktur**:
`@vue/test-utils` + `jsdom` als `devDependency`, `environment: 'node'`
bleibt die globale Vorgabe in `vitest.config.ts` — eine Komponenten-Spec
setzt dafür in Zeile 1 den Docblock `// @vitest-environment jsdom` (Vorbild
`src/features/bewertungen/components/Bewertungsachse.spec.ts`). Was ein
Component-Test in jsdom nicht beweisen kann (Sichtbarkeit, Trefferfläche,
Pseudo-Element-/`accent-color`-Wirkung), bleibt Sache des Rauchtests
(ADR-0027 Punkt 4).

## Auslieferung: GitHub Pages

Jeder Push auf **`main`** löst `.github/workflows/deploy-pages.yml` aus: `npm ci`, Lint, Vitest, `npm run
build` (enthält den Typecheck) und `npm run verify:pwa` — erst wenn alle
durchlaufen, wird nach Pages veröffentlicht. Die App liegt danach unter
`https://quancel.github.io/bewertung-app/`.

Damit der Workflow greift, muss in den Repo-Einstellungen unter
*Settings → Pages → Build and deployment* als Quelle **„GitHub Actions"**
gewählt sein (nicht „Deploy from a branch"). Das ist eine einmalige
Einstellung außerhalb des Repos und **nicht automatisierbar**: Der
Parameter `enablement: true` an `configure-pages` scheitert am
`GITHUB_TOKEN` des Workflows, der eine Pages-Seite nicht anlegen darf
(`Resource not accessible by integration`) — auch mit `pages: write`
nicht, denn das Anlegen verlangt Admin-Rechte. Im Workflow als Kommentar
festgehalten, damit es niemand ein zweites Mal versucht.

Ausgeliefert wird **von `main`, und `main` ist der Default-Branch** — das
ist keine Stilfrage: Die Umgebung `github-pages` erlaubt Deployments
standardmäßig nur vom Default-Branch. Von einem Feature-Branch aus wird
der `deploy`-Job abgelehnt, bevor er startet: keine Schritte, kein
Runner, kein Log, nach einer Sekunde rot — während `build` grün
durchläuft. Wer das Muster kennt, sucht den Fehler nicht im Workflow.

Eine Projektseite liefert unter einem **Unterpfad** aus, nicht unter `/`.
Dieser Pfad steht als `BASE` in `vite.config.ts` und ist die einzige
Quelle dafür: `createWebHistory(import.meta.env.BASE_URL)` im Router,
`navigateFallback` in der PWA-Konfiguration sowie `scripts/smoke.mjs` und
`scripts/verify-precache.mjs` (beide importieren `vite.config.ts` direkt)
ziehen ihn von dort. Wer die App unter einem anderen Pfad ausliefert,
ändert **nur** `BASE`.

`npm run smoke` läuft bewusst **nicht** im Workflow: Playwright ist keine
Projekt-Abhängigkeit (siehe unten), ein Lauf in CI zöge einen
Browser-Download nach sich. Der Rauchtest bleibt die Pflicht des Leads vor
der `done`-Meldung.

## Rauchtest: `npm run smoke`

Die **Minimalverifikation** aus `.claude/agent-team/rules/VERIFICATION.md`,
ausführbar. `scripts/smoke.mjs` baut, startet `vite preview`, öffnet mit
Playwright jede Ansicht **bei mehreren Breiten** (`BREITEN`: Desktop 1280px
sowie Telefon 320px und 390px, ADR-0012 — ein Prüfparameter des Skripts,
keine Layout-Entscheidung) und prüft dort dieselben Zusicherungen: Anwendung
startet · keine Laufzeitfehler · jede Ansicht einmal geöffnet · über CSS
geladene Ressourcen aufgelöst · kein Bedienelement verdeckt · **nichts ragt
aus dem Bildschirm** (kein horizontal scrollbares Dokument, kein Element
jenseits der Viewport-Breite). Zusätzlich läuft die Verdeckungsprüfung im
Ortsdetail in **allen vier Hinweiszuständen der Ortssuche** (lädt/keine
Treffer/Fehler/kein Netz, über Request-Interception erzeugt — nie ein echter
Aufruf an Photon, ADR-0020 Punkt 3) statt nur offline. Eine aktiv bediente
Auswahlliste (Trefferliste der Ortssuche, Tag-Vorschlagsliste) darf dabei
überlagern; das ist als benannte Bedingung im Skript ausgenommen, nie als
ID-/Klassenliste (ADR-0023 Punkt 7). Bildschirmfotos landen in `.smoke/`
(ignoriert), je Breite und Ansicht ein eigenes.

Drei weitere Zusicherungen prüfen das Ortsdetail (PO-2026-09-13-001/-002/-003):
**jeder Regler ist greifbar** (`pruefeReglerGreifbarkeit`) · **eine Bedienung
genügt** (`pruefeReglerCommitWaehrendZiehens`) · **je Breite genau ein
Weg zurück** (`pruefeAbschlussKombination`). Zwei davon sind nur deshalb
wirksam, weil sie den naheliegenden Weg meiden, und das bleiben sie auch nur
so: Die Greifbarkeit des Reglerdaumens liest ihre Werte über das Chrome
DevTools Protocol, weil `getComputedStyle(el, '::-webkit-slider-thumb')` aus
Seiten-JavaScript die UA-Vorgabe statt des Autoren-Stils liefert (ADR-0027
Punkt 5, korrigiert). Und die Commit-Prüfung hält die Maustaste gedrückt und
prüft **vor** dem Loslassen — ein Klick feuert `input` *und* `change`, eine
klickbasierte Prüfung wäre gegen den defekten Stand grün gewesen. Beides wirkt
umständlich und ist es nicht; wer es vereinfacht, bekommt eine Zusicherung,
die nie wieder rot wird.

Vier weitere Zusicherungen prüfen die Tag-Eingabe (PO-2026-09-26-001,
ADR-0030, `pruefeTagUeberlebtNeuladen`, nur bei 1280px): **ein Tag committet
auch ohne Enter** — (a) Tab statt Enter verlässt das Feld, der Tag übersteht
ein Neuladen und ist danach über die Filterleiste filterbar (der ursprünglich
gemeldete Fehler samt seinem zweiten Teil, „sind dann nicht filterbar"); (b1)
der Text bleibt im **fokussierten** Feld stehen, `pagehide` wird am
**weiterlebenden** Dokument ausgelöst (kein echtes Entladen) — der erste
dadurch angestoßene `put()` trägt bereits den Tag (ADR-0030 Punkt 4), und die
Pille übersteht ein anschließendes echtes Neuladen; (c) ein Ortswechsel ab
`lg` **ausschließlich über den Browserverlauf** (`goBack`/`goForward`, nie
über einen Klick, der selbst schon einen Commit auslösen würde) lässt
unbestätigten Text nicht im falschen Feld landen und committet ihn beim
vorherigen Ort.

Eine fünfte, **gemeldete, aber nicht harte** Zusicherung (b2, ADR-0031,
benannte Ausnahme zu ADR-0023 Punkt 2/7, analog zu „auf WebKit ungeprüft"
ADR-0029): Text im fokussierten Feld, ein **echtes** `seite.reload()` löst
das entladungsbedingte `pagehide` aus. Ursprünglich (PO-2026-09-26-001) war
das derselbe Fall wie (b1) und **dauerhaft rot** — Nachforschung ergab: Kein
Mechanismus im Rahmen von ADR-0001/0004 sichert zu, dass ein erst beim
Entladen der Seite angestoßener Schreibvorgang abschließt, das gilt
strukturell für **jedes** Feld im Ortsdetail, nicht nur Tags (ADR-0031 Punkt
1/5). Der Nutzer hat „als bekannte Grenze akzeptieren" gewählt: `pruefeTagUeberlebtNeuladen`
meldet diesen Fall bei jedem Lauf als „erhalten"/„verloren", ohne
`process.exitCode` zu beeinflussen. `src/persistence/orte-repository.ts`
härtet den Schreibweg zusätzlich (`tx.commit()` direkt nach `put()`, ADR-0031
Punkt 2) — Messlauf des `frontend-lead` (5× mit, 5× ohne diese Härtung):
5/5 erhalten mit `tx.commit()`, 0/5 ohne. Das ist ein empirischer Beleg für
Chromium in dieser Umgebung, **keine Zusicherung** — deshalb bleibt (b2)
gemeldet statt hart.

Ab PO-2026-09-26-002 (ADR-0032) kommt eine weitere harte Zusicherung dazu:
`MasterDetail.vue` zeigte die Listen-Spalte bei offener Detailansicht ab
`lg` nicht — eine unbedingte Ausblendregel gewann per höherer Spezifität
gegen die schwächere Gegenregel im `@media`-Block, unabhängig von
Reihenfolge und Zustandsklasse. `pruefeMasterDetailSpalten()` läuft für
**jede** Ansicht, auf der die Wurzel `.master-detail` im DOM ist (benannte
Bedingung, keine Ansichtsnamen-Liste): Ab `lg` müssen beide Spalten
gleichzeitig sichtbar, überlappungsfrei und randbündig sein und das Fenster
darf nicht scrollen; unterhalb `lg` bleibt nur die dem `detailOffen`-Zustand
entsprechende Spalte sichtbar. Dafür deckt eine neue Ansicht
(`ortsdetail-unbekannte-id`) die Detailadresse mit nicht auflösender ID bei
nicht leerem Bestand ab — anders als die bestehende `adresse-ohne-ziel`, die
als Sammelroute standalone rendert, ohne `MasterDetail` — und ein einmaliger
Nachweis bei 1280px deckt den Tag-Filter-Leerzustand bei ausgewähltem Ort ab
(`pruefeTagFilterLeerBeiAusgewaehltemOrt()`). Die vorher nötige Umgehung
`klickeOrtHinzufuegenTrotzListenSpaltenBug()` ist entfallen: Die
Listen-Spalte samt ihrem „Ort hinzufügen"-Button ist ab `lg` neben einem
offenen Detail jetzt regulär sichtbar und klickbar.

Ab PO-2026-09-26-003 (ADR-0033, Korrektur zu ADR-0011 Punkt 6) kommt eine
weitere harte Zusicherung dazu: `MasterDetail.vue` scrollt ab `lg` selbst,
das `scrollBehavior` des Routers wirkt nur auf das Fenster und erreichte die
Detail-Spalte deshalb nie — bei einem Ortswechsel A→B blieb sie auf dem
Scroll-Stand von A stehen, statt oben zu beginnen.
`pruefeScrollVersatzUndFokusBeiOrtswechsel()` läuft für **jede** Breite aus
`BREITEN` mit `width >= 1024` und prüft für **beide Auslöser** — Klick auf
die Listenzeile und ausschließlich über den Browserverlauf
(`goBack`/`goForward`) —: Der Scroll-Container der Detail-Spalte (bestimmt
als nächster Vorfahr von „Detailansicht schließen" mit `overflow-y:
auto|scroll`, keine Klassen-/ID-Liste) hat danach den Versatz 0, und der
Fokus liegt auf „Detailansicht schließen". **Vorbedingung Teil der
Zusicherung**: Vor jedem Wechsel muss bei Ort A tatsächlich ein Versatz > 0
erreicht worden sein (dafür öffnet die Funktion den Koordinaten-Notnagel und
legt zwölf Füll-Orte an, damit auch die Listen-Spalte scrollbar ist) — sonst
wäre „Versatz ist 0" kein Beleg für einen wirksamen Reset. In derselben
Funktion zusätzlich hart: Ein erneuter Klick auf die bereits hervorgehobene
Zeile setzt den Versatz **nicht** zurück, und ein Klick-Wechsel A→B ändert
den Versatz der Listen-Spalte **nicht**.

Ab PO-2026-09-27-001 (design-conventions.md „Mehrzeilige Textfelder wachsen
mit dem Inhalt") kommt eine weitere harte Zusicherung dazu:
`pruefeMehrzeiligeTextfelder()` prüft für **jedes sichtbare** `<textarea>`
(benannte Bedingung, keine Klassen-/Ansichtsliste — das Anfangsnotiz-Feld aus
PO-2026-09-27-002 läuft dadurch automatisch mit), dass berechnetes
`resize === 'none'`, `scrollHeight <= clientHeight` (1px Toleranz) und kein
horizontaler Überstand vorliegt. Geprüft für **drei Wege ohne Tippen** in der
Seitenlebensdauer, die gemessen wird (Treiberaktion und Messgröße getrennt,
learnings.md — das Anlegen der Kommentare selbst braucht zwangsläufig
Tippen, die eigentliche Messung aber nicht): (1) Mount — die Ansicht
`ortsdetail-langer-kommentar` legt lange Kommentare an allen vier Achsen an,
committet sie und lädt neu, bevor gemessen wird, bei allen drei `BREITEN`;
(2) ein Ortswechsel ab `lg` **per Klick** von einem Ort mit langem zu einem
mit einzeiligem Kommentar — seit PO-2026-09-27-004 trägt `Bewertungsachse.vue`
ein `:key="ortId ?? undefined"` und wird dabei neu gemountet; das
Kommentarfeld muss deshalb je Ort erneut über „Kommentar hinzufügen" geöffnet
werden, die Höhe stellt sich über den Mount-Auslöser des Composables ein, nicht
mehr über die Neuberechnung bei externer Wertänderung ohne Neumount
(`pruefeMehrzeiligesFeldBeiOrtswechsel()`); (3) eine reine Breitenänderung
1280→390 **ohne** Texteingabe (`pruefeMehrzeiligesFeldBeiBreitenwechsel()`).
Die Umsetzung selbst (`shared/composables/useMitwachsendesTextfeld.ts`) muss
in jedem unterstützten Browser wirken — dieser Rauchtest belegt das nur für
Chromium, WebKit/Firefox bleiben nur manuell prüfbar.

Ab PO-2026-09-27-002 (die Anfangsnotiz, ein neues 100-Zeichen-Kurztextfeld
ohne Zeilenumbruch, design-conventions.md „Kurztextfeld mit
Zeichenobergrenze") kommen vier weitere harte Zusicherungen dazu
(`pruefeAnfangsnotizUeberlebtNeuladen()`, nur bei 1280px): Die Anfangsnotiz
committet auch ohne Enter oder Klick über dasselbe Vier-Auslöser-Muster wie
Tags/Bewertungsachse (Feld verlassen, `/orte/:a`→`/orte`, `/orte/:a`→
`/orte/:b`, `visibilitychange`→hidden, `pagehide` am weiterlebenden
Dokument — dort zusätzlich hart geprüft: der **erste** `put()` trägt die
Notiz bereits) und übersteht ein Neuladen. Anders als bei Tags/Bewertungsachse
(ADR-0030/ADR-0035) gibt es dafür **keine** `uebernimmOffeneEingabe`-
Orchestrierung: Die Anfangsnotiz hat keinen lokalen Entwurf, jede Eingabe
geht sofort über den Store-Setter (`aktualisiereAnfangsnotiz`) in den
Arbeitsspeicher, und `persistiereOrt` schreibt bei jedem der vier Auslöser
ohnehin den vollständigen Datensatz — die Notiz reist „kostenlos" mit. Ab
`lg` landet unbestätigter Text bei einem Ortswechsel ausschließlich über den
Browserverlauf (`goBack`/`goForward`) bei Ort A, das Feld zeigt danach Bs
eigenen Wert — ohne eigenen `:key` an `AnfangsnotizFeld.vue`, weil die rein
aus `ort.anfangsnotiz` gespeiste `:wert`-Prop nach dem Wechsel automatisch
den neuen Wert zeigt. Wie bei Tags/Bewertungsachse bleibt das Verhalten beim
ECHTEN Entladen mit Fokus im Anfangsnotiz-Feld eine benannte, nicht
zusicherbare Grenze (ADR-0031) und wird nur gemeldet. Zwei neue Ansichten
(`ortsdetail-lange-anfangsnotiz`, `ortsliste-lange-anfangsnotiz`) legen
jeweils eine 100-Zeichen-Notiz als leerzeichenloses Wort an und liefern damit
nur die Daten für zwei bereits bestehende, generische Zusicherungen:
`pruefeMehrzeiligeTextfelder()` (PO-2026-09-27-001, jedes sichtbare
`<textarea>`) deckt das Feld selbst ab, `pruefeUeberlauf()` die Sekundärzeile
der Ortsliste (`Ortszeile.vue`s neue `overflow-wrap: anywhere`-Regel).
Zusätzlich läuft die Verdeckungsprüfung im Ortsdetail einmal zusätzlich mit
fokussiertem Anfangsnotiz-Feld und sichtbarem Zähler
(„{aktuell}/100" im normalen Textfluss, verdeckt nichts).

Ab PO-2026-09-27-004 (ADR-0035, Korrektur zu ADR-0030 Punkt 4/8) kommt eine
weitere Gruppe harter Zusicherungen dazu, nur bei 1280px: Kommentar UND
Zahlenwert einer Bewertungsachse committen auch ohne Enter oder Klick auf
denselben vier Auslösern wie die Tag-Eingabe (Feld verlassen, Route
verlassen inkl. Schließen der Detailansicht, `visibilitychange`→hidden,
`pagehide`) und überstehen ein Neuladen; ein geleertes Zahlenfeld kommt als
„nicht bewertet" zurück, nicht als 0. Der eigentliche Kern von ADR-0035
ist eine eigene Zusicherung: Sind gleichzeitig ein Tag-Text UND ein
Kommentar-Entwurf UND ein Zahlenwert-Entwurf (an zwei verschiedenen Achsen)
offen, trägt bereits der **erste** `put()` nach `pagehide` am
weiterlebenden Dokument alle drei — nicht erst ein nachfolgender, aus der
Warteschlange nachgezogener Schreibvorgang. Ein Ortswechsel ab `lg`
ausschließlich über den Browserverlauf lässt unbestätigten Kommentar UND
Zahlenwert bei Ort A, mindestens einmal mit demselben Kommentar wie an
Ort B vor der Eingabe — der Fall, den ein bloßer Prop-Watcher nicht fängt.
Wie bei den Tags bleibt das Verhalten beim ECHTEN Entladen mit Fokus im
Kommentarfeld eine benannte, nicht zusicherbare Grenze (ADR-0031) und wird
nur gemeldet.

Ab PO-2026-09-27-003 (ADR-0034, Zonenfarben + Hervorhebungs-Schatten der
Ortsliste, plus ein Design-Antwort-Roundtrip zur Kopfzeile) kommen zwei neue
Ansichten und zwei neue harte Zusicherungen dazu. `ortsliste-zonen`
(`bereiteOrtslisteZonenVor()`) legt alle fünf Zonen, einen Wert unter der
untersten Zonengrenze, die Gruppe „ohne Wert" und alle vier
Hervorhebungs-Kombinationen (keine/schwach/stark/beide) an, dazu eine
Zonenzeile mit deutlich längerer Bezeichnung als sonst üblich.
`ortsliste-legende` (`oeffneZonenLegende()`) zeigt das offene Legenden-Sheet
— dafür bekommt `pruefeVerdeckung()` eine neue, benannte Ausnahme: Elemente
HINTER einem offenen modalen Dialog (`aria-modal="true"`, strukturell für
jedes `Sheet.vue`) sind kein Befund, weil dessen Backdrop den ganzen
Bildschirm abdeckt, ohne den Rest der Seite `aria-hidden` zu setzen. Bei
1280px prüft `pruefeAusgewaehlteZeileSchattenUndName()` zusätzlich hart: Die
ausgewählte Zeile trägt in JEDER Hervorhebungs-Kombination weiterhin den
inset-3px-Auswahlkante-Layer im berechneten `box-shadow`
(design-conventions.md „Kombination mit der Auswahlkante" — zwei
`box-shadow`-Regeln würden sich sonst ersetzen statt ergänzen), und die
Accessible Name jeder Zeile (Rolle `link`) enthält den erwarteten
Screenreader-Text. Eine weitere harte Zusicherung läuft auf JEDER
Ansicht/Breite mit (`pruefeButtonTextUmbruch()`, Empfehlung der
Design-Antwort, hier umgesetzt statt nur gemeldet): Sichtbarer Button-Text
bricht innerhalb seines Buttons nie um — der ursprünglich gemeldete Fehler
(„Ort hinzufügen" brach bei 320px intern auf zwei Zeilen um, statt dass die
Kopfzeile selbst zweizeilig wurde, kein horizontaler Überlauf, deshalb vom
bisherigen Rauchtest nicht gefangen), jetzt als Eigenschaft geprüft.
`.ortebereich__liste-spalte` wird dafür zum `@container` (ADR-0012, analog
`.werkzeugleiste`) — unterhalb 360px Containerbreite (320px/390px Viewport
fallen beide darunter) zeigt die Kopfzeile mit `ZonenLegende` zwei Zeilen:
Zeile 1 unverändert `<h1>` + Legende, Zeile 2 ausschließlich „Ort
hinzufügen", rechtsbündig UND kompakt über ein CSS-Grid-Template statt eines
erzwungenen Flex-Umbruchs (`Ortebereich.vue`s Style-Kommentar begründet, warum
ein `flex-basis: 100%` direkt auf dem Button ihn selbst gestreckt hätte).

**Zwischen PO-2026-09-27-003 und der Korrektur an `MasterDetail.vue` (ADR-0011,
Nachtrag zu Punkt 6, 2026-09-28) war `npm run smoke` bewusst rot** —
`pruefeMasterDetailSpalten()` meldete bei `desktop-1280/ortsliste-legende`
„Fenster scrollt ab lg" (Dokument 1074px, Ansichtsfenster 900px). Die zuerst
gemeldete Ursache (impliziter `min-height: auto` eines Grid-Items gewinnt
gegen die feste Höhe) erwies sich als **unbestätigt**: Beide Spalten sind
bereits Scroll-Container, ihre automatische Mindestgröße ist nach CSS Grid
§6.6 schon 0, und die per Diagnose gemessenen Werte belegten das auch —
beide Spalten blieben exakt bei `innerHeight` (900px), keine von beiden war
höher als der Viewport. Tatsächliche Ursache: `.ortszeile__sr-hervorhebung`
(neu in PO-2026-09-27-003, ADR-0034 Punkt 5) ist `position: absolute` ohne
positionierten Vorfahren — ihr Containing Block war deshalb der initiale
Containing Block (das Dokument), nicht die Listen-Spalte. Die Spalte
schnitt sie nicht ab, und ihre statische Position tief in der Liste
verlängerte das **Dokument**, nicht die Spalte. Sichtbar wurde das erst, wenn
über die Lebensdauer eines Rauchtest-Laufs genug hohe Zeilen im DOM standen
UND eine davon eine Hervorhebung trug — `ortsliste-legende` war davon als
erste Ansicht betroffen, weil zu diesem Zeitpunkt bereits alle Orte aus den
vorangegangenen Ansichten dieses Laufs plus die neuen Zonen-Orte im Bestand
lagen. Der Fund war unabhängig vom Zonenfeature selbst.

**Korrektur** (`MasterDetail.vue`, `@media (min-width: 1024px)`-Block): drei
Deklarationen, alle drei bleiben stehen, auch wenn nur eine trägt — jede
schließt eine eigene Art ab, auf die eine Spalte das Dokument verlängern
kann. (1) Wurzel `grid-template-rows: minmax(0, 1fr)` — Gegenstück zur
Spaltenspur, macht die Zeile exakt die feste Höhe statt implizit `auto`. (2)
Spalten `min-height: 0` — Gegenstück zu `min-width: 0`. (3) Spalten
`position: relative` — macht den Scroll-Container zum Containing Block
seiner absolut positionierten Nachfahren (kein `z-index`, kein neuer
Stapelkontext). Per Differenzlauf (Inline-Stil, ohne Rebuild, gegen den
roten Stand) belegt: (3) allein behebt den gemessenen Fall vollständig
(Dokument 1074px → 900px), (1) und (2) allein je nicht (Dokument bleibt bei
1074px) — Befundlage B, nicht A.

Eine neue harte Zusicherung deckt das jetzt deterministisch ab, statt vom
zufällig angesammelten Bestand eines Laufs abzuhängen:
`pruefeSpaltenAbgeschlossenerScrollBereich()` legt einen eigenen Bestand an
(genug Füll-Orte, damit der Listen-Inhalt die Spalte überragt, plus ein
alphabetisch später Ort mit Geschmack ≥ 9 — erzeugt den Screenreader-Hinweis
tief in der Liste) und prüft für jede Breite aus `BREITEN` mit `width >=
1024` und beide `detailOffen`-Zustände: Weder das Fenster noch eine der
beiden Spalten selbst wird höher als das Ansichtsfenster. Die Vorbedingung
ist Teil der Zusicherung (Listen-Inhalt höher als die Spalte UND ein absolut
positioniertes Element im Spalteninhalt unterhalb der sichtbaren
Spaltenhöhe) — ohne sie wäre „scrollt nicht" kein Beleg für eine wirksame
Abschottung, sondern nur dafür, dass nie genug Inhalt vorlag.

Ab PO-2026-11-24-006 (ADR-0036, Bildvorschau im Vollbild) kommt eine weitere
Gruppe harter Zusicherungen dazu (`pruefeBildvorschau()`, `scripts/smoke.mjs`
ab Zeile 2010, je Breite aus `BREITEN` in einem eigenen Kontext mit
`hasTouch`; dazu die Ansicht `bildvorschau` in `ANSICHTEN`, Zeile 372, mit drei
im Browser erzeugten PNGs hoch/quer/hoch, `legeOrtMitBildernAn()` Zeile 797).
Geprüft werden Eigenschaften: Öffnen legt **genau einen** Verlaufseintrag mit
unveränderter Adresse an, Blättern keinen; jedes Bild ist vollständig sichtbar
(im Ansichtsfenster, nicht von einem Button geschnitten); Pfeiltaste,
Pfeil-Button und eine **CDP-Touch-Wischgeste** blättern, ein kurzer, langsamer
Wisch nicht; kein Umbruch an den Enden (`aria-disabled`); Fokus beim Öffnen auf
„×", Tab/Shift+Tab bleiben im Dialog; Esc und „×" schließen, der Fokus liegt auf
der Kachel des **zuletzt gezeigten** Bildes (Vorbedingung: es wurde tatsächlich
geblättert), die Adresse bleibt das Ortsdetail, und ein anschließendes Zurück
landet **nicht** erneut auf demselben Ort (der eigene Eintrag ist entfernt);
System-Zurück schließt nur den Dialog, Vorwärts und Neuladen auf dem markierten
Eintrag öffnen nie; der Scroll-Stand des Hintergrunds ändert sich weder beim
Öffnen noch beim Schließen; bei einem Bild entfallen Zähler und Pfeile. Zwei
Bauformen sind Absicht: Die Kachel wird per **Fokus ohne Scrollen + Enter**
geöffnet, nicht per `click()` — Playwrights Klick scrollt bei 320px selbst, wenn
die Kachel unter der festen Tab-Leiste liegt, und verfälschte die Messgröße
(Treiberaktion und Messgröße getrennt); und der Scroll-Stand wird **während**
geöffneter Vorschau gemessen, weil `router.back()` die gespeicherte Position
wiederherstellt und ein fehlerhaftes `scrollBehavior` nach dem Schließen sonst
unsichtbar bliebe. **Rot-Nachweis** (ADR-0027 Punkt 8; je eine kompilierbare
Mutation, danach Quelle zurückgesetzt, jeweils `npm run smoke` Exit 1 mit den
genannten Befunden): `force: true` aus dem Composable entfernt → „Öffnen legt 0
Verlaufseinträge an", „System-Zurück verlässt das Ortsdetail"; `router.back()`
beim Schließen entfernt → „nach Esc bleibt ein Verlaufseintrag … zurück",
„Vorwärts … öffnet die Vorschau"; `popstate`-Listener entfernt → „System-Zurück
schließt die Vorschau nicht"; Gleiche-`fullPath`-Bedingung in `scrollBehavior`
entfernt → „Öffnen verschiebt den Scroll-Stand dahinter" (bei 320px);
Pfeiltasten-Zweig entfernt → „Pfeil rechts am letzten Bild bricht um oder
wechselt"; `@pointerup` stillgelegt → „Wischen nach links wechselt nicht";
Fokus-Rückgabe entfernt → „nach Esc liegt der Fokus nicht auf der Kachel";
Tab-Falle entfernt → „Tab verlässt den Dialog". Unbelegt: eine Mutation, die
nur die Markierung `bildvorschau` im State entfernt (das Öffnen funktioniert
ohne sie, `schliesse()` lässt dann den Eintrag stehen — durch die
„nach Esc bleibt ein Verlaufseintrag"-Prüfung abgedeckt, aber nicht gesondert
rot gelaufen). Auch hier gilt: nur Chromium, Touch ist CDP-emuliert — echtes
iOS-/Android-System-Zurück bleibt nur manuell prüfbar.

Ab PO-2026-11-24-001 (ADR-0037, Gewichtung der Gesamtnote) kommen drei neue
Ansichten und eine harte Zusicherung dazu. `ortsliste-gewichtung-hinweis`,
`ortsdetail-gewichtung` und `gewichtung-sheet` (`scripts/smoke.mjs` Zeilen
373–375) zeigen die drei Einstiege je mit dem **längsten** Szenarionamen
(„Fokus Preis-Leistung") und laufen so durch Verdeckung, Überlauf und
Button-Umbruch bei allen `BREITEN`. Neu ist die optionale Ansichts-Eigenschaft
`aufraeumen` (Zeile 2816): Die Gewichtung ist persistiert und würde sonst für
den Rest des Laufs gelten und Noten und Zonen späterer Ansichten verschieben;
`setzeGewichtungZurueck` (Zeile 906) stellt Ausgewogen wieder her. Die harte
Zusicherung `pruefeGewichtungWirktUeberallUndUeberstehtNeuladen` (ab Zeile
2280, nur bei 1280px, eigener Bestand auf frischer Seite) prüft Eigenschaften:
Das Prüfbeispiel (Fokus Geschmack, Geschmack 10, Ambiente 6 → „8,7", bei
Ausgewogen „8,0") zeigt Zeile **und** Detail **sofort** und nach einem
Neuladen; die Reihenfolge nach Gesamtnote kippt von B-vor-A zu A-vor-B (das
ist die Vorbedingung, dass „die Sortierung folgt" nicht zufällig stimmt);
jede Zeile mit angezeigtem Wert ab 8,0 trägt eine Zone, keine darunter; A
trägt bei „8,7" `--color-zone-8-5`, bei „8,0" `--color-zone-8`; der
Hervorhebungs-Schatten bleibt unberührt; die Hinweiszeile steht nur bei
Abweichung von Ausgewogen; alle drei Einstiege öffnen dasselbe Sheet, die
aktive Zeile trägt `aria-pressed="true"`. Eine Bauform ist Absicht: Der
Button im Ortsdetail wird gemessen, **nachdem** das Fenster per `scrollTo(0, 0)`
in die Ausgangslage zurückgesetzt ist — Playwrights Klick scrollt selbst, und
ein dabei hinter die feste Kopfzeile des Details gerutschtes Element ist ein
Fehlbefund der Verdeckungsprüfung (zuerst gemessen: `#ortsdetail-adresse` und
der Button „verdeckt von div.ortsdetail__kopf", auch bei 1280px, sobald
stattdessen mittig gescrollt wurde). Die Grenze `159/20 = 7,95` (Anzeige
„8,0", Zone nur über `zehntel` richtig) war mit den festen Szenarien im
Rauchtest **nicht** beobachtbar (sie erzeugen nur Nenner bis 5, dort ist jede
Rundung auf ein Zehntel exakt); sie wird in Vitest (`gesamtnote.spec.ts`,
`zonen.spec.ts`) erschöpfend über 12⁴ × 5 Szenarien und als konstruierter Fall
belegt und ist seit PO-2026-11-24-002 (eigene Gewichte) auch im Rauchtest
beobachtbar, siehe unten. **Rot-Nachweis** (ADR-0027 Punkt 8, je eine kompilierbare
Mutation, danach Quelle zurückgesetzt, `npm run smoke` Exit 1): `gewichte`
im Store ignoriert das Szenario → „Reihenfolge … statt …", „zeigt 8,0 statt
8,7", falsche Zone, Detail ≠ Zeile (sofort und nach Neuladen); gespeicherte
Gewichtung unter falschem Schlüssel gelesen → alle „nach-neuladen"-Befunde
(Hinweiszeile fehlt, Detail-Button „Ausgewogen", `aria-pressed` falsch);
Detail rechnet mit 1:1:1:1 → „Detail zeigt 8,0, die Zeile 8,7"; `zehntel`
in `Ortszeile.vue` aus abgeschnittenem Rohwert → falsche Zahl und Zone in
allen Zuständen. Vitest-Mutation (Rundung `Math.floor(10·Z/N)` statt
halbe Zehntel auf): fünf rote Tests, darunter der erschöpfende
Ausgewogen-Vergleich. Unbelegt: eine Mutation, die nur die Hinweiszeile
unbedingt zeigt (durch die Prüfung „Hinweiszeile sichtbar, obwohl
Ausgewogen" abgedeckt, aber nicht gesondert rot gelaufen). Auch hier: nur
Chromium; die Darstellung des Reglers und der Haken-Maske ist auf WebKit
ungeprüft.

**Der Lead führt ihn aus, bevor er ein Paket als erledigt meldet** — nicht
statt der Unit-Tests, sondern zusätzlich. Typecheck, Lint und Vitest
prüfen, ob Code zusammenpasst; der Rauchtest prüft, ob das Ergebnis
benutzbar ist. Mehrere reale Fehler dieses Projekts sind durch alle drei
**und** durch die Code-Abnahme gekommen und erst in echter Nutzung
aufgefallen: jedes Icon war ein farbiger Kasten (ungültiges `url()` mit
einer Data-URI voller Hochkommata); das Feld „Adresse" war ohne Netz von der
Hinweisfläche der Ortssuche verdeckt; die Koordinatenzeile ragte ab ~390px
CSS-Breite aus dem Bildschirm (PO-2026-09-12-002); dieselbe Hinweisfläche
verdeckt „Adresse" weiterhin in den Zuständen lädt/keine Treffer/Fehler
(PO-2026-09-12-003). Alle sind als **Zusicherung** abgebildet, nicht als
Einzelfall-Test — geprüft wird die Eigenschaft, nicht die Stelle. Gegen den
jeweiligen Vor-Korrektur-Stand aus der Historie nachgewiesen: alle werden
gefangen, mit Exit-Code 1.

**Ein roter Rauchtest, der einen bekannten, bereits geschnittenen Befund
meldet, ist kein Grund, eine Zusicherung abzuschwächen** — er wird durch das
zugehörige Paket grün (ADR-0023 Punkt 6). Zwischen PO-2026-09-12-004 (dieser
erweiterte Rauchtest) und den Korrekturpaketen -002/-003 ist `npm run smoke`
deshalb bewusst rot: Er meldet genau die Koordinatenzeile und die
überlagernde Hinweisfläche und sonst nichts. Wer in diesem Fenster einen
grünen Lauf erwartet, hat die falsche Erwartung an das Werkzeug.

**Playwright ist bewusst keine Projekt-Abhängigkeit** — es zieht einen
Browser nach sich, den CI-Umgebungen meist schon mitbringen.
`scripts/smoke.mjs` sucht es an den üblichen Orten; fehlt es, sagt der
Rauchtest das und endet mit 0, statt einen Build rot zu färben, der nichts
dafür kann. Die Zusicherungen sind dann **ungeprüft**, und genau das gehört
so in den Bericht.

**Der Rauchtest fährt genau eine Engine, Chromium** (ADR-0023 Punkt 5,
bestätigt durch ADR-0029). Das gilt auch für Darstellung, nicht nur für
Verhalten: Ein **erfolgreicher** Lauf weist Zusicherungen über
engine-abhängige Darstellung (Pseudo-Element-Stile, `appearance`, native
Bedienelement-Darstellung) ausdrücklich als „auf WebKit ungeprüft" aus —
als Eigenschaft benannt, nicht als Funktions-/Klassenliste.

Neue Ansicht gebaut? In `ANSICHTEN` eintragen. Neue Breite oder neuer
netzabhängiger Zustand? In `BREITEN` bzw. `ORTSSUCHE_ZUSTAENDE` (alle oben in
`scripts/smoke.mjs`) — sonst prüft sie niemand.

Ab PO-2026-11-24-002 (ADR-0037, eigene Gewichte mit vier Reglern) kommen eine
Ansicht, zwei harte Zusicherungen und eine Erweiterung einer bestehenden
dazu. Die Ansicht `gewichtung-eigene` (`scripts/smoke.mjs` Zeile 386) zeigt das
Sheet mit offenem Block „Eigene" im **widersprüchlichsten** Zustand: Eine Achse
„zählt nicht", die letzte trägt „100 % · muss zählen", und die Statuszeile
steht nach einem abgefangenen Versuch — bei allen `BREITEN` durch Verdeckung,
Überlauf und Button-Umbruch. `setzeGewichtungZurueck` (Zeile 906) stellt für
**alle** Gewichtungs-Ansichten jetzt auch die **eigenen** Gewichte auf 1:1:1:1
zurück: Sie überstehen die Wahl eines festen Szenarios (das ist Absicht,
ADR-0037 Punkt 2) und würden sonst für die nächste „Eigene"-Vorbereitung bei
einer anderen Breite stehen bleiben. Die Erweiterung: `pruefeReglerGreifbarkeit`
(Zeile 1275) läuft nicht mehr über den Ansichtsnamen `ortsdetail`, sondern über
die **benannte Bedingung** „die Ansicht enthält einen `input[type="range"]`" —
dadurch deckt sie die Gewichtsregler im Sheet ohne weiteres Zutun mit ab, und
jeder künftige Regler ebenso. Die Befundzeile benennt einen Regler ohne `id`
über sein `aria-label`. Die harte Zusicherung
`pruefeEigeneGewichteUndEndgruppen` (ab Zeile 2475, nur bei 1280px, eigener
Browser-Kontext = frische IndexedDB, eigener Bestand mit drei Orten)
prüft Eigenschaften: Die Erstbelegung ist 1:1:1:1 und das Sheet **bleibt bei
„Eigene" offen**; mit Ambiente 9 / Zeit 1 / Geschmack 10 / Preis-Leistung 1
zeigt ein Ort mit nur drei bewerteten Achsen **159/20 = 7,95 als „8,0" und
trägt die Zone 8** (der Fall, der ADR-0037 begründet: „8,0" ohne Zonenfarbe);
nach Gewicht 0 an Ambiente zeigt der Ort mit **nur** einer bewerteten Achse
(Ambiente) **keine Zahl und keine Zone** und steht in einer **eigenen
Endgruppe „ohne Gesamtnote bei dieser Gewichtung" nach „ohne Bewertung in
Gesamtnote"** (die Vorbedingung, dass es BEIDE Gruppen gibt, steht in der
Messgröße selbst — sonst wäre „kommt nach der anderen Gruppe" leer erfüllt);
das Detail sagt „Keine Gesamtnote bei dieser Gewichtung" statt „Noch nicht
bewertet", das Detail des unbewerteten Ortes weiter „Noch nicht bewertet"; die
Gewichte (und die Endgruppe) überstehen ein Neuladen UND den Wechsel auf
Fokus Zeit und zurück, bei Fokus Zeit entfällt die leere Gruppe; das Gate:
„99" im Zahlenfeld wird „10", ein geleertes Feld kehrt beim Verlassen zum
bisherigen Wert zurück, die letzte Achse über 0 bleibt bei „0" auf „1" (Zeile
„100 % · muss zählen", Regler `min="1"`, Statuszeile `role="status"` bis zur
nächsten Änderung, auch Pos1 am Regler bleibt bei 1, danach darf die vorher
„letzte" Achse auf 0). Die zweite Zusicherung
`pruefeGewichtsreglerCommitWaehrendZiehens` (ab Zeile 2666, nur bei 1280px)
hält die Maustaste am Regler der Zeile „Zeit" gedrückt und prüft **vor** dem
Loslassen, dass das Zahlenfeld denselben Wert zeigt, der Anteil stimmt und die
Gesamtnote in der Liste dahinter sich geändert hat (Vorbedingung: der Regler
hat sich tatsächlich bewegt) — aus demselben Grund wie bei der Bewertungsachse:
ein Klick feuert `input` **und** `change`, eine klickbasierte Prüfung wäre gegen
einen Regler, der erst auf `change` committet, grün gewesen. Zwei Bauformen
sind Absicht: Die Zahlenfelder werden mit `fill` bedient (genau ein `input`,
kein Enter, kein Feldwechsel — das **ist** die „eine Bedienung"), und die
Gewichts-Zusicherung läuft auf einem **frischen** Kontext statt auf dem
Bestand der Ansichten (Vorbild `pruefeSpaltenAbgeschlossenerScrollBereich`).
**Rot-Nachweis** (ADR-0027 Punkt 8; je eine **kompilierbare** Mutation, danach
Quelle zurückgesetzt, jeweils Exit 1 mit den genannten Befunden): Gate ohne
„letzte Achse bleibt auf 1" → 12 Befunde (keine Endgruppe, „8 %" statt „zählt
nicht", „muss zählen"/`min`/Statuszeile fehlen); Gate klemmt nicht auf 10 →
„gate-klemmt: 99 statt 10"; Ortszeile liest die Zone am Rohwert statt an
`zehntel` → „Eig-Ziel zeigt 8,0 ohne Zone 8"; Endgruppe in die Gruppe der
unbewerteten gelegt → „2 Orte ohne Bewertung in Gesamtnote" statt zwei Gruppen
(Liste und nach Neuladen); Detail zeigt „Noch nicht bewertet" statt „Keine
Gesamtnote bei dieser Gewichtung"; Regler committet auf `change` statt
`input` → „Zahlenfeld zeigt 1", „Anteil 25 % statt 75 %", „Gesamtnote bleibt
5,0" (alle drei **während** des Ziehens); Wahl eines Szenarios verwirft die
eigenen Gewichte → „1/1/1/1 statt 0/1/10/1" nach der Rückkehr; Statuszeile
wird nie zurückgenommen → zwei Befunde; ein Thumb mit `opacity: 0` **nur im
Sheet** → vier Befunde je Breite an `gewichtung-eigene` (und keiner an
`ortsdetail`, d. h. die benannte Bedingung erreicht die Gewichtsregler
wirklich). Zwei erste Mutationsversuche kompilierten nicht (ein Typfehler
durch Narrowing, ein `noUnusedParameters`) und wurden durch andere ersetzt —
eine Mutation, die nicht baut, beweist nichts. Auch hier: nur Chromium; die
Thumb-/Bahn-Darstellung der **gemeinsamen Regler-Bauform** (`shared/ui/Regler.vue`,
ADR-0029) und das Reveal des Blocks sind auf WebKit ungeprüft. Die
Bildschirmfotos `.smoke/*-gewichtung-eigene.png` wurden je Breite angesehen
(Sheet scrollt intern, Zeilen bei 320/390px gestapelt, bei 1280px einzeilig,
Regler und Zahlenfeld sichtbar).

Ab PO-2026-11-24-007 (prägnantere Zonen, ADR-0034/0037, Nutzerentscheidung:
Plakette und 1px-Hairline sind zulässig) kommen eine Ansicht, drei harte
Zusicherungen und eine bewusste Messung dazu. Die Ansicht `ortsliste-keine-treffer`
(`scripts/smoke.mjs` Zeile 367, `bereiteOrtslisteKeineTrefferVor()` Zeile 738,
`aufraeumen` setzt den Tag-Filter zurück) erzeugt den Null-Treffer-Zustand der
Liste (zwei Orte, Tag-Filter UND auf beide) — er hat eine **eigene**
Kopfzeile mit Legenden-Auslöser neben der der Master-Detail-Liste. Die Tags
heißen bewusst nur `ka`/`kb`: Lange Tag-Namen blieben im Bestand und ließen die
Filter-Pillen in allen späteren Ansichten aus dem Bildschirm ragen (ein erster
Lauf meldete 23 solcher Befunde, durch meinen Rauchtest erzeugt, nicht durch die
App). `pruefeLegendenAusloeser()` (Zeile 1628) läuft auf **jeder** Ansicht über
die benannte Bedingung „Listen-Kopfzeile mit Legende" und prüft, dass der
Auslöser **gerenderten, nicht leeren Text** zeigt (`innerText`, nicht
`aria-label`), das Label den sichtbaren Text enthält, kein Icon darin steckt,
≥ 44 × 44 px groß ist, nicht aus dem Bildschirm ragt und ab `lg` die Kopfzeile
**einzeilig** bleibt; die Vorbedingung („beide Kopfzeilen-Varianten wurden je
Breite wirklich untersucht", Zähler `legendenGesehen`) steht in der Zusicherung
selbst. `pruefeZonenPlakette()` (Zeile 1684, auf `ortsliste-zonen`, alle
`BREITEN`) prüft Eigenschaften: Eine Zone hat eine Plakettenfläche, eine Zeile
ohne Zone keine (damit ist 8,0 von „kein Wert in einer Zone" eindeutig
unterscheidbar); Zahl auf Fläche ≥ 4,5:1; Höhe und Padding der Zahl sind in
Zeilen mit und ohne Zone gleich (die Zeilenhöhe springt nicht), rechte Kanten
fluchten; die fünf Flächen werden streng dunkler; ein Hervorhebungs-Schatten trägt einen
`0px 0px 0px 1px`-Hairline **und** einen Schattenlayer, eine Zeile ohne
Hervorhebung keinen; **Zeilenabstand ≥ 8px** — das war die Auflage der
Design-Konvention („Zeilenabstände ≥ `--space-8`"), die `Ortebereich.vue` mit
`gap: var(--space-4)` verletzte; der Wert steht jetzt auf `--space-8`.
`pruefeBalkenfuellungInZonenfarbe()` (Zeile 1760, nur 1280px) sortiert nach
Ambiente und prüft, dass die Füllung bei einem Wert in einer Zone der
Plakettenfläche entspricht (flach), bei einem Wert unter 8 weder Zonenfüllung
noch Fläche hat und dass der Balken im **Ortsdetail** keine Zonenfarbe trägt
(der Hook `--intensitaetsbalken-fuellung-farbe` ist kein Prop und darf nicht
lecken). Kontrast (Zahl ≥ 4,5:1, Fläche ≥ 3:1 gegen `neutral-0`/`neutral-50`/
`primary-50`, L* streng monoton mit Schritt ≥ 7) und die Schatten-Tokens
(Hairline + Schattenlayer, schwächer als der Sheet-Schatten) liegen in
`src/styles/zonenfarben-kontrast.spec.ts` (Vitest, billigste Ebene).
**Messung der 360px-Schwelle** (Auftrag: bei 360–368px messen, nur bei Bedarf
anheben): Die einzeilige Kopfzeile (h1 51 + Legende 74 + „Ort hinzufügen" 175 +
2 × 16 Gap = 332px) passt bei Containerbreite 360 bis 368 mit 28px Reserve und
ohne horizontalen Überlauf; die Schwelle bleibt bei 360px. **Rot-Nachweis**
(ADR-0027 Punkt 8; je eine **kompilierbare** Mutation gegen einen Differenz-
lauf der Ansichten `ortsliste-zonen`/`ortsliste-keine-treffer`, danach
Quelle zurückgesetzt, jeweils Exit 1): Text im Auslöser entfernt → „zeigt
keinen Text" an beiden Kopfzeilen bei allen Breiten; Plakettenfläche entfernt →
„Zone ohne Plakettenfläche" und Graustufen-Befunde; Padding nur noch in der
Zone → „unterschiedliche Höhen (32, 24px)" und „unterschiedliches Padding";
Hairline aus `--shadow-hervorhebung-schwach` entfernt → „Hervorhebung ohne
1px-Hairline"; Balken-Hook entfernt → „Füllung … ist keine Zonenfarbe";
`gap` zurück auf `--space-4` → „Zeilenabstand 4.0px < 8px"; Hook global auf
`body` gesetzt → „Wert unter 8 hat Zonenfüllung" und „Balken im Ortsdetail
trägt Zonenfarbe"; `--color-zone-9` aufgehellt → „Zone 3 ist nicht dunkler
als Zone 2" und „nur 3.96:1 Kontrast"; Legende im Null-Treffer-Zweig
entfernt → „Listen-Kopfzeile hat keinen Legenden-Auslöser" (nur dort);
`flex-wrap` plus Auslöser mit `flex-basis: 100%` → „Kopfzeile ist ab lg nicht
einzeilig". Auch hier: nur Chromium, die Graustufen-Aussage gilt für die
berechnete Luminanz, nicht für ein Foto — die Bildschirmfotos
`.smoke/*-ortsliste-zonen.png` und `*-ortsliste-legende.png` (alle drei
Breiten) wurden angesehen und gehen zur Graustufen-Begutachtung an den
`ux-ui-designer`.

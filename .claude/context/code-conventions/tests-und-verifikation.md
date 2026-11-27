# Tests und Verifikation (ADR-0023)

> Themendatei von `.claude/context/code-conventions.md` (Abschnitt „Tests und
> Verifikation", Teil Ebenen und Verfahren). Die Bauformen in
> `scripts/smoke.mjs` stehen in `rauchtest-bauformen.md`. Single-Writer:
> `architekt`. Maßgeblich ist dieser Wortlaut samt Ausnahmen, nicht die
> Kurzzeile im Register.

## Ebenen

- **Drei Ebenen, keine ersetzt die andere**: Vitest (`environment: 'node'` +
  `fake-indexeddb/auto`) prüft Logik und Verträge · `npm run smoke` prüft am
  echten Build in einer echten Engine, ob es benutzbar ist · die Abnahme
  prüft die Kriterien.
- **Komponentenverhalten** (ADR-0027): Zuerst prüfen, ob die Regel als reine
  Funktion nach `lib/` gehört (billigste Ebene, Vorbild `rundenUndKlemmen.ts`).
  Ist der **Handler- oder Emit-Weg selbst** der Gegenstand, entsteht eine
  Component-Spec mit `@vue/test-utils`: `environment: 'node'` bleibt die
  Vorgabe, die Spec setzt als erste Zeile `// @vitest-environment jsdom` — die
  globale Umgebung wird **nicht** umgestellt. Gemountet wird die
  präsentationale Komponente mit Props, gelesen werden Emits; kein Store.
  `vitest.config.ts` trägt dafür zweierlei, das zur Infrastruktur gehört und
  nicht je Paket neu gefunden werden soll: **`plugins: [vue()]`** (ohne den
  SFC-Transform „Failed to parse source … Install @vitejs/plugin-vue") und
  **denselben `@assets`-Resolve-Alias wie `vite.config.ts`** (sonst scheitert
  jede Spec, die einen Icon-Wrapper mitmountet, z. B. `IconKreuz.vue`).
  Wer einen Alias in `vite.config.ts` ergänzt, zieht ihn hier mit.
  **Nicht** in jsdom zusichern: Sichtbarkeit, Trefferfläche, Verdeckung,
  Pseudo-Element- oder `accent-color`-Wirkung, „überlebt ein Neuladen" —
  jsdom hat kein Layout und keine Pseudo-Element-Stile.
- **Grün gegen `fake-indexeddb` heißt nicht, dass der Browser schreibt** — es
  bildet den strukturierten Klon in JavaScript nach. Jede Zusicherung „Daten
  überleben ein Neuladen" gehört in den Rauchtest. Für die Klonbarkeit selbst
  ist `structuredClone()` der brauchbare Vitest-Nachweis; die Begründung
  dafür trägt die **Spezifikation** (Modulkommentar von `sichere-kopie.ts`),
  nicht Node/V8 — V8 *ist* Chromiums Klon-Implementierung und belegt über
  WebKit nichts. Diesen Kommentar nicht eindampfen.
- **Die Naht Store → Repository wird nicht vollständig wegmockt.** Je Store
  bleibt ein Test, der das **echte** Repository benutzt und den Wert übergibt,
  den der Store im Betrieb übergibt.

## Neue Zusicherungen

- **Eine neue Zusicherung ist erst eingerichtet, wenn sie gegen einen
  verletzenden Stand rot wird** (ADR-0027 P8) — Vor-Korrektur-Stand aus der
  Historie oder eine Wegwerf-Änderung; der Nachweis steht im Bericht und in
  `docs/pakete/<task_id>.md`. Ein Prüfweg, der die Eigenschaft gar nicht
  erreicht, sieht aus wie ein erfülltes Kriterium.
  - **Eine Mutation muss bauen.** Ein Typfehler (`noUnusedLocals`,
    `noUnusedParameters`, Narrowing etwa bei `false && x`) färbt den Lauf
    vor dem Rauchtest rot, und das aus dem falschen Grund. Den Zielzweig
    umlenken (anderer Schlüssel, anderer Text, anderer Event-Name), statt
    einen Ausdruck zu entfernen. Eine Textersetzung prüft vorher, dass der
    alte Text vorkommt, sonst bleibt die Mutation still wirkungslos.
  - **Gekürzte Rauchtest-Kopie**: Für Mutationsläufe ist eine temporäre
    Kopie von `scripts/smoke.mjs` mit gefilterten Ansichten zulässig. Der
    letzte Lauf vor `done` ist der volle.
  - **Keine Reste**: Backups und Wegwerf-Skripte liegen im Scratchpad,
    nicht im Repo. Vor `done` zeigt `git status` nur die beabsichtigten
    Dateien, also keine `*.orig`, `*.bak`, `*.rej` und keine Smoke-Kopien.
  - Lange Läufe im Hintergrund mit `setsid nohup` starten und auf das
    Prozessende prüfen. Ein abgebrochener Lauf endet ohne Meldung mitten im
    Ablauf.
- **Jede Dokumentations-Änderung steht im Bericht mit Beleg** — Datei plus
  Zeilenbereich oder Diff-Auszug, nie nur „aktualisiert". Maßstab ist
  `git diff`, nicht die Absicht: Eine Änderung, die dort fehlt, ist nicht
  gemacht (Anlass: `docs/pakete/PO-2026-09-27-004.md`). Eine neue
  Rauchtest-Zusicherung bekommt in `CLAUDE.md` die Eigenschaft in einem Satz;
  ihre Nachweise stehen in `docs/pakete/<task_id>.md`
  (`.claude/agent-team/rules/CONTEXT_BUDGET.md`). Zeilenangaben zu
  `scripts/` gehören weder nach `CLAUDE.md` noch in die Konventionen.

## Engines

- **Der Rauchtest fährt genau eine Engine: Chromium** (ADR-0023 P5).
  **WebKit prüft kein Automatismus** — obwohl der Datenverlust aus -001 dort
  auftrat. Ein Akzeptanzkriterium, das eine nicht gefahrene Engine nennt, ist
  **nur manuell prüfbar**, wird im Handoff so markiert und bleibt bei der
  Abnahme offen, bis der Nutzer bestätigt hat. Ist eine Ursache
  engine-spezifisch, ist ein grüner Chromium-Lauf kein Nachweis.
  **Das gilt auch für Darstellung, nicht nur für Verhalten** (ADR-0029):
  Pseudo-Element-Stile (`::-webkit-*`/`::-moz-*`), `appearance`,
  `accent-color` und native Bedienelement-Darstellung greifen zwischen
  Engines unterschiedlich. Ein erfolgreicher Lauf weist solche Zusicherungen
  **im Lauf selbst** als „auf WebKit ungeprüft" aus — als Eigenschaft
  benannt, nicht als Funktions-/Klassenliste.
- **Eine Darstellungsregel für die ungeprüfte Engine benennt ihren
  Ausfallpfad — und prüft ihn gegen den realen Befund** (ADR-0029 P5). Ein
  Ausfallpfad, der in den gemeldeten Fehlerzustand zurückführt, ist keine
  Degradation: Sichtbarkeit darf nicht an einer einzelnen, zwischen Engines
  uneinheitlich umgesetzten Eigenschaft hängen. Anlassfall: „fällt unsere
  Thumb-Regel aus, zeigt die Engine ihren nativen, sichtbaren Thumb" — genau
  der war auf iOS bei Position 0 nicht erkennbar.
- **Greift eine vorgeschriebene Bauform in einer Engine nicht, ist das ein
  `blocked` an den `architekt`** — nie eine stille Abweichung im Code und nie
  eine abgeschwächte Zusicherung (ADR-0023 P6, ADR-0029 P6).

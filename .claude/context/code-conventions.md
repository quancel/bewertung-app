# Code Conventions — bewertung-app

> **Single-Writer: Nur der `architekt`-Agent schreibt hierhin** (auch in
> `code-conventions/`). Die Leads liefern Vorschläge über
> `notes_for_conventions`. Hier steht je Regel **eine Zeile**; Wortlaut,
> Ausnahmen und Vorbilder stehen in der Themendatei, die Begründung im ADR.
> Budget: Richtwert 12 KB für diese Datei, Register Pflicht
> (`.claude/agent-team/rules/CONTEXT_BUDGET.md`). Nachweise, Messwerte,
> Paket-Chronik → `docs/pakete/<task_id>.md`, nicht hierhin.
>
> **Lesen**: diese Datei, dann **nur** die Themendatei zum Paket. Eine Kurzzeile
> ist keine vollständige Regel — wer sie als `constraint` übernimmt, übernimmt
> die Fassung der Themendatei samt Ausnahmen (learnings.md, 2026-09-14).

- **Modus**: `vorgegeben` (Greenfield, ADR-0002)
- **Zuletzt geprüft**: 2026-11-27, Nachpflege PO-2026-11-26-002 (Umbau auf
  Register + Themendateien). Frühere Stände: Anhang „Änderungschronik" in
  `docs/pakete/PO-2026-11-26-002.md`.

**Stapel**: Vue 3 · TypeScript · Vite · Pinia · vue-router. Ein Projekt, ein
Bundle, kein Monorepo. **Kein Backend** (ADR-0001) — `src/persistence/`
übernimmt dessen Rolle. Ein Proxy/BFF bräuchte ein eigenes ADR.

## Register

| Thema | Themendatei |
|---|---|
| Imports, Besitz, Gesamtnote, Komponenten/Views, Composables, `watch`, `app/dev/` | `code-conventions/struktur-regeln.md` |
| Tokens, Zonen-/Marker-/Schatten-Tokens, CSS-Hooks, `box-shadow`-Signale, Icons | `code-conventions/styles-und-tokens.md` |
| Fremdnetz, Netzzustand, Leaflet | `code-conventions/fremdnetz-und-karte.md` |
| Namenskonventionen; Routen, Query-Parameter, Verlaufseinträge | `code-conventions/namen-und-routen.md` |
| Rahmen, `@media`/`@container`, Sichtbarkeit, Scroll-Bereiche, Bedienelemente | `code-conventions/layout-und-breitenlogik.md` |
| Formatversion, IndexedDB, Migrationsschritte, Lesen und Schreiben | `code-conventions/persistenz.md` |
| Statisches Bundle, `BASE`, `CSS_TARGET`, Service Worker | `code-conventions/build-und-auslieferung.md` |
| Testebenen, Component-Specs, neue Zusicherungen, Engines | `code-conventions/tests-und-verifikation.md` |
| Bauformen in `scripts/smoke.mjs` | `code-conventions/rauchtest-bauformen.md` |
| Bewusst akzeptierte Stellen | `code-conventions/abweichungen.md` |

## Ordnerstruktur

~~~
scripts/                        # Node-Skripte um den Build (.mjs), importieren
                                #   nichts aus src/, prüfen dist/
src/
  main.ts · App.vue             # Einstieg: App, Pinia, Router, globale Styles
  app/                          # Shell — nur was genau einmal existiert
    router/ · layout/ · dev/    # dev/ nie im Produktions-Bundle
  features/<bounded_context>/   # orte · bewertungen · tags · medien ·
                                #   karte · datensicherung
    components/                 # präsentational, kennen keinen Store
    views/                      # an eine Route gebunden, binden den Store an
    stores/<context>.store.ts   # Pinia
    composables/
    lib/                        # reine Funktionen, inkl. des EINEN Moduls,
                                #   das einen Fremddienst kennt
    model/<context>.types.ts    # Typen der persistierten Form, importiert nichts
    model/ansicht.ts            # Anzeigeeinstellung: Typ + Default + Prüffunktion
  persistence/                  # EINZIGER Zugriff auf den Gerätespeicher
    schema.ts                   # SCHEMA_VERSION + OrtDatensatz
    db.ts                       # IndexedDB öffnen, Object Stores, IDB-Version
    <context>-repository.ts · einstellungen-repository.ts · bestand-repository.ts
    sichere-kopie.ts            # Pflicht-Wrapper vor jedem Schreiben
    migrations/index.ts · NNN-<kurzname>.ts · __fixtures__/vN-<kurzname>.json
  shared/ui/ · composables/ · lib/   # erst ab zwei Nutzern
  styles/tokens.css · semantic.css · base.css
  assets/fonts/ · icons/        # lokal mitgeliefert, nie vom CDN
~~~

## Regeln, die die Struktur tragen

→ `code-conventions/struktur-regeln.md`, `code-conventions/styles-und-tokens.md`,
`code-conventions/fremdnetz-und-karte.md`

- Ein Feature importiert nicht aus einem anderen, mit genau drei Ausnahmen: Store-Nutzung von `orte` (nicht `karte`), Views in `orte` mit fremden Komponenten/`lib/` (Zyklus-Prüfung), `datensicherung` stößt Neuladen an.
- Alles andere über `shared/` bzw. `persistence/schema.ts`; nach `shared/` erst ab zwei Nutzern; `app/` und `features/` importieren nicht voneinander.
- Fremder Inhalt in einem Baustein über einen benannten Slot, nicht über einen Import; `Werkzeugleiste.vue` bleibt store- und routerfrei.
- Der Ort-Datensatz hat genau einen Besitzer, `useOrteStore`; einen eigenen Store hat nur, wer einen eigenen Object Store hat (`medien`) — also kein globaler App- oder Ansichts-Store.
- Ableitungen mit zwei Nutzern in `shared/lib/`; eine Darstellungsregel nur der Ortsliste in `features/orte/lib/` (`zonen.ts`).
- Gesamtnote nur über `berechneGesamtnote(bewertungen, gewichte)`; Anzeige/Zone lesen `zehntel`, Sortierung/Gleichstand/Vorrang `roh`; `SortierErgebnis` hat drei Gruppen, jeder Konsument behandelt alle drei.
- `model/*.types.ts` importiert nichts; `persistence/schema.ts` setzt `OrtDatensatz` daraus zusammen.
- Nur `persistence/` spricht mit dem Gerätespeicher — kein `localStorage`/`indexedDB` anderswo, kein zweiter Weg.
- `components/` kennt keinen Store, `views/` binden an; einzige Ausnahme: `defineExpose` für die Abgabe einer unbestätigten Eingabe, abgeholt von allen Entwurfsbesitzern, danach genau ein Persistieren (ADR-0030/0035).
- Eine projektweite Interaktionsregel steht einmal in `shared/composables/`; „Blur" und „Tap außerhalb" sind zwei Mechanismen; mehrzeilige Felder wachsen über `useMitwachsendesTextfeld.ts`, nur per JS.
- Ein `watch` auf ein abgeleitetes Array vergleicht selbst (stabile Kennung); ein DOM-messender `watch` läuft mit `flush: 'post'`.
- Rohwerte nur in `styles/tokens.css`; Tokenwert in JS nur als benannte Konstante mit Tokennamen im Kommentar; Zonen-, Marker- und Hervorhebungs-Tokens nach Themendatei.
- Ein geteilter Baustein wird über eine dokumentierte Custom Property angepasst, nie über `:deep()`; der Hook sitzt am Wrapper des Nutzers, nie global.
- Mehrere Signale auf `box-shadow`: je Signal eine lokale Custom Property, kombiniert in einer Deklaration.
- Schriften und Icons lokal unter `src/assets/` (Lucide Outline, je Paket nachziehen); wer den letzten Nutzer eines Icons entfernt, löscht SVG und Wrapper.
- Fremdnetz nur für Kacheln, Ortssuche, Versionsauslieferung: ein Modul kennt den Anbieter, ausdrückliches Ergebnis, datensparsam, kein API-Schlüssel, Referer bleibt, Attribution sichtbar.
- Netzzustand nur im Feature für einen gemuteten Hinweis und Wiederholen; nie Reload, Toast, globaler Balken, `disabled`, Store-Zustand.
- Leaflet nur in `features/karte/`: asynchron eingebunden, `shallowRef`, Marker in-place aktualisiert, Etikett per `opacity`, Geometrie in `karte/lib/`, `.karte-wrapper` mit `isolation: isolate`.
- `app/dev/` ist Dev-Werkzeug (nur `import.meta.env.DEV`, importiert nichts aus `features/`); `Tokenschau.vue` bleibt.

## Namenskonventionen

→ `code-conventions/namen-und-routen.md`

- Framework-Vokabular englisch, Domänen-Vokabular deutsch; einteilige deutsche Komposita (`Ortsliste.vue`) sind erlaubt, nicht „korrigieren".
- Ordner kebab-case, Feature-Ordner exakt wie der `bounded_context`; Stores `<context>.store.ts`/`use<Context>Store`; Tests `*.spec.ts` neben der Datei.

## Routen, Ansichten, neue Bereiche

→ `code-conventions/namen-und-routen.md`

- Routen flach; `path` und `name` ausgelieferter Routen nie ändern (`orte`, `ort-detail`, `daten`, `adresse-ohne-ziel`); Sammelroute als letzter Eintrag; navigiert wird per Name.
- Beide Routen eines Bereichs zeigen auf dieselbe Bereichsansicht; kein zweiter „ausgewählt"-Zustand neben `route.params`.
- Neuer Bereich: Route vor der Sammelroute, angehängter Eintrag in `Bereichsnavigation.vue`, Icon.
- Zweite Ansicht eines Bereichs ist ein Query-Parameter, kein Routen-Eintrag; unbekannter Wert = Standardansicht ohne `replace`.
- Eingefrorene Query-Parameter `ansicht`/`ort`: Öffnen `push`, Wechsel `replace`, Schließen `back()` nur auf die Karte ohne `ort`, sonst `replace`.
- Modaler Zustand über Zurück bekommt einen Verlaufseintrag ohne eigene Adresse, über den Router, nie rohes `history.pushState`.

## Layout und Breitenlogik (ADR-0010/0011/0012)

→ `code-conventions/layout-und-breitenlogik.md`

- Der App-Rahmen ist eine Komponente, keine Route; kein `route.meta`-Flag, kein `<keep-alive>`.
- Breitenabhängige Layouts fragen den Container ab; `container-type` sitzt auf einem Vorfahren, nie auf dem umgeschalteten Element.
- Navigationsmuster → `@media`, Platz für Inhalt → `@container`; einander ersetzende Bedienelemente in einem `@media`-Block mit wörtlich derselben Bedingung.
- Sichtbarkeit unterhalb `lg` über `@media not all and (min-width: 1024px)`, nie überschrieben, nie `max-width: 1023px`; Zustandsregeln disjunkt.
- Custom Properties wirken nicht in `@media`/`@container`; Layoutmaße sind Tokens.
- Umschalten eines geteilten Bausteins über einen eigenen Wrapper; ein Baustein in zwei Breiten wird selbst Container.
- Ab `lg` scrollt die Spalte, nicht das Fenster; ein Scroll-Container mit fester Höhe ist abgeschlossen (Spur `minmax(0, …)`, `min-width`/`min-height: 0`, `position: relative`) — alle drei Teile bleiben.
- Visuell versteckter Text: `clip`-Muster lokal, `<block>__sr-<zweck>`, kein globales Utility.
- Den Scroll-Versatz setzt der Baustein zurück, dem der Container gehört (`defineExpose`), nie per DOM-Suche.
- Alles, was schrumpfen soll, bekommt `min-width: 0`; horizontal scrollt nie etwas.
- Selbst gezeichnetes Bedienelement: Trefferfläche über transparenten `border` mit `content-box`, `background-clip` und inset-`box-shadow`; ein permanenter Rahmen hängt nie an `:not(:focus-visible)`.

## Persistenz und Formatversion (ADR-0003/0004)

→ `code-conventions/persistenz.md`

- Eine `SCHEMA_VERSION` für den Bestand; neuere ablehnen, ältere migrieren; kein `if (version < N)` außerhalb von `persistence/migrations/`.
- IndexedDB über `idb`, kein `localStorage`; `IDB_STRUKTUR_VERSION` (Struktur) getrennt von `SCHEMA_VERSION` (Inhalt).
- Ein Ort ist ein Datensatz; kein Rückverweis auf Bilder; keine Binärdaten im Ort; Löschen kaskadiert in einer Transaktion.
- Zwei Sperrzustände (neuere Version, kein Speicher) sperren vollflächig und verbieten jedes Schreiben.

### Migrationsschritte

- Dateinummer = Zielversion (aktuelle + 1), reine Funktion, eine Datei je Schritt, nach Veröffentlichung nie geändert; importiert nichts aus `schema.ts`.
- Jede Formaterweiterung bringt Schritt und Fixture mit; ein Fixture wird nie geändert, Binärdaten nie im Fixture.

### Lesen und Schreiben (ADR-0005)

- Kein stiller Ersatzwert beim Lesen; jeder Achsen-Eingabepfad durch `rundenUndKlemmen()`, eigene Gewichte durch das Gate in `gewichtung.ts`.
- Begrenzter Freitext ohne Umbruch: eine reine Funktion, Gate im Store-Setter, Import übernimmt unverändert.
- Ergebnisse statt Ausnahmen; geschrieben wird der vollständige Datensatz aus dem Store, ohne Entprellung, auf vier Auslösern.
- Jeder `put()` mit Store-Anteil durch `sichereKopie()`; der Inline-Schreibweg committet mit `tx.commit()`; Warteschlange nur bei mehrfach geschriebenen Datensätzen.
- Anzeigeeinstellungen sind kein Bestandsinhalt (`model/ansicht.ts`, Schlüssel mit Context-Präfix, additiv erweitert).
- Export/Import über `bestand-repository.ts`; `fflate` nur in `datensicherung/lib/`.

## Build und Auslieferung (ADR-0001/0015)

→ `code-conventions/build-und-auslieferung.md`

- Statisches Bundle über HTTPS (sicherer Kontext); Unterpfad nur in `BASE` (`vite.config.ts`); Versionswechsel leert Caches, nie IndexedDB.
- `CSS_TARGET` ist eine Kompatibilitätsvorgabe, nicht „angleichen"; bei Vite-Update oder Änderung den Prüf-Grep auf `dist/assets/*.css` laufen lassen.
- Service Worker generiert; `globPatterns` überschrieben; `registerType: 'prompt'`, nie `autoUpdate`; kein Runtime-Caching für Fremd-Hosts.

## Tests und Verifikation (ADR-0023)

→ `code-conventions/tests-und-verifikation.md`, `code-conventions/rauchtest-bauformen.md`

- Drei Ebenen (Vitest, Rauchtest, Abnahme), keine ersetzt die andere.
- Component-Spec nur, wenn der Handler-/Emit-Weg selbst Gegenstand ist; Docblock `// @vitest-environment jsdom`, global bleibt `node`.
- Neue Zusicherung erst eingerichtet, wenn sie gegen einen verletzenden Stand rot wird; die Wegwerf-Änderung muss bauen; keine Reste im Repo.
- Doku-Änderung im Bericht mit Beleg; neue Rauchtest-Zusicherung: ein Satz in `CLAUDE.md`, Nachweise in `docs/pakete/`.
- `fake-indexeddb` belegt kein Schreiben im Browser; die Naht Store → Repository wird nicht vollständig wegmockt.
- Der Rauchtest fährt nur Chromium; engine-abhängige Darstellung wird als „auf WebKit ungeprüft" ausgewiesen; greift eine Bauform nicht, ist das ein `blocked` an den `architekt`.
- Greifbarkeit ist eine Rauchtest-Zusicherung; UA-Pseudo-Element-Stile nur über CDP lesen.
- Neue Ansicht/Breite/Zustand in die Listen in `scripts/smoke.mjs`; Ausnahmen als benannte Bedingung, Register in ADR-0040, je mit Gegenprobe.
- Ansichten teilen Bestand und Einstellungen: `aufraeumen`, `eigenerKontext`, kurze Tag-Namen, Vorbedingungen auf frischer Seite.
- Offene Entwürfe ohne Fokuswechsel herstellen; Existenz-Felder über `locator.count()`.
- Bildschirmfotos je Breite ansehen; ein roter Rauchtest mit bekanntem Befund wird nicht abgeschwächt; „überlebt ein Neuladen" gilt nur für benannte Felder.

## Abweichungen und bewusst akzeptierte Stellen

→ `code-conventions/abweichungen.md` — Stellen, die niemand nebenbei „korrigiert": `app/dev/` ohne Tests ·
sechs Schatten-Literale · zwei Hex-Konstanten in `Intensitaetsbalken.vue` · Koordinatenfelder klappen zu ·
Reglerdaumen-Literale · `istOffeneAuswahlliste()` ungeprüft · Override in `Ortebereich.vue` ·
`Schnellansicht.vue` liest `padding-bottom` von `<main>` · `.datenbereich__datei-input` · Abweichung von der
Greenfield-Referenz (ADR-0001/0002).

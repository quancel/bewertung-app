# Code Conventions — bewertung-app

> **Single-Writer: Nur der `architekt`-Agent schreibt hierhin.** Die Leads
> liefern Vorschläge über `notes_for_conventions` im Handoff.
>
> Zweck: Ordnerstruktur und Namenskonventionen stehen **einmal**
> beschrieben, statt von jedem Lead und jedem gespawnten Subagent neu aus
> dem Repo erraten zu werden. Gerade die Subagents sehen nur ihr
> Sub-Handoff — ohne diese Datei haben ausgerechnet sie die geringste
> Kenntnis der Projektkonventionen.
>
> Kompakt halten (Faustregel: < 120 Zeilen). Hier steht nur die **Regel**;
> die Begründung gehört ins ADR.

- **Modus**: `vorgegeben` (Greenfield, festgelegt in **ADR-0002**; kein
  Anwendungscode vorhanden, geprüft 2026-09-08)
- **Zuletzt geprüft**: 2026-09-08

**Stapel**: Vue 3 · TypeScript · Vite · Pinia · vue-router. Ein Projekt, ein
Bundle, kein Monorepo. **Kein Backend** (ADR-0001).

## Frontend

### Ordnerstruktur

~~~
index.html · package.json · tsconfig.json · vite.config.ts
src/
  main.ts                       # Einstieg: App, Pinia, Router, globale Styles
  App.vue
  app/                          # Shell — nur was genau einmal existiert
    router/index.ts
    layout/                     # App-Rahmen/Navigation (eigenes Paket)
    dev/                        # Dev-Werkzeuge, nie im Produktions-Bundle
  features/
    <bounded_context>/          # orte · bewertungen · tags · medien ·
                                #   karte · datensicherung
      components/               # präsentational, kennen keinen Store
      views/                    # an eine Route gebunden, binden den Store an
      stores/<context>.store.ts # Pinia
      composables/
      model/<context>.types.ts  # Typen inkl. der persistierten Form
  persistence/                  # EINZIGER Zugriff auf den Gerätespeicher
    schema.ts                   # SCHEMA_VERSION + Typ des Gesamtbestands
    migrations/NNN-<kurzname>.ts
    migrations/__fixtures__/vN-<kurzname>.json
  shared/
    ui/ · composables/ · lib/
  styles/
    tokens.css                  # Rohwerte aus design-concept.md
    semantic.css                # semantische Ebene (--surface, --text-muted …)
    base.css                    # Reset, Typo-Basis, Fokusring, Motion
  assets/
    fonts/ · icons/             # lokal mitgeliefert, nie vom CDN
~~~

### Regeln, die die Struktur tragen

- **Ein Feature importiert nicht aus einem anderen Feature.** Einzige
  Ausnahme: `bewertungen`, `tags`, `medien` dürfen den `orte`-Store **lesend**
  über sein öffentliches API nutzen — nur in diese Richtung (context-map.md).
- **Nur `persistence/` spricht mit dem Gerätespeicher.** Kein
  `localStorage`/`indexedDB` in Komponenten, Stores oder Composables.
- **Nach `shared/` erst ab zwei Nutzern**, nicht vorsorglich. `app/` enthält
  nur Einmaliges.
- **`components/` kennt keinen Store**, bekommt alles über Props und meldet
  über Emits zurück. `views/` sind die einzige Stelle, die Stores anbindet.
- **Rohwerte nur in `styles/tokens.css`.** In Feature-Stylesheets kein
  Hex-Wert, kein freier Pixel-Abstand außerhalb der Skalen aus
  `design-concept.md`. Komponenten binden nur an semantische Tokens.
- **Schriften und Icons liegen unter `src/assets/`.** Kein `<link>` auf einen
  Fremd-Host, kein `@import` einer Font-URL, kein Icon-CDN-Paket — das ist
  die Offline-Zusage (ADR-0001), keine Stilfrage. Icons werden als
  Teilmenge gebündelt, nie ein ganzes Set „auf Vorrat".
- **Fremdnetz-Zugriffe** sind auf die drei erlaubten Zwecke beschränkt
  (Kartenkacheln, Ortssuche, Versionsauslieferung) und liegen im Feature, das
  sie braucht. Jeder braucht einen Ausfallpfad, der die App bedienbar lässt.
- **`app/dev/`** ist Dev-Werkzeug: Routen dorthin werden nur unter
  `import.meta.env.DEV` registriert und sind im Produktions-Bundle nicht
  enthalten. Inhalt importiert **nichts** aus `features/`. Der
  „Token-Showcase" (`app/dev/Tokenschau.vue`, aus PO-2026-09-07-010) gehört
  hierher und **bleibt dauerhaft** — er ist bei jeder Token-Änderung nützlich.
  Kein späteres Paket entfernt ihn; er wird nur nie ausgeliefert.

### Namenskonventionen

**Framework-Vokabular englisch, Domänen-Vokabular deutsch** (ADR-0002).

- Ordner: kebab-case; Feature-Ordner heißt **exakt** wie der
  `bounded_context` im Handoff.
- SFC-Dateien: PascalCase mit deutschem Domänenwort — `Ortsliste.vue`,
  `Ortsdetail.vue`, `Bewertungsachse.vue`, `Bilderraster.vue`.
  **Einteilige deutsche Komposita sind ausdrücklich erlaubt** und keine
  Verletzung der Vue-Regel „multi-word component names": Diese Regel schützt
  vor Kollisionen mit HTML-Elementen, und `Ortsliste` kollidiert mit keinem.
  Nicht „korrigieren".
- TypeScript-Typen: PascalCase, deutsche Domänenbegriffe — `Ort`,
  `Bewertung`, `Tag`, `Bild`.
- Stores: Datei `<context>.store.ts`, Symbol `use<Context>Store`
  (`useOrteStore`). Composables: `use<Name>()`.
- Sonstige TS-Dateien: kebab-case.
- Tests: `*.spec.ts` direkt neben der getesteten Datei.

### Wo was hingehört

- **Neue Komponente**: `src/features/<context>/components/` — präsentational.
  Erst wenn sie von **zwei** Contexts genutzt wird, nach `src/shared/ui/`.
- **Neuer State**: `src/features/<context>/stores/<context>.store.ts`. Ein
  Store je Context; kein globaler App-Store.
- **Neue Route/Ansicht**: Ansicht nach `src/features/<context>/views/`,
  Registrierung in `src/app/router/index.ts`.
- **Neues Feld im gespeicherten Format**: Typ nach
  `src/features/<context>/model/`, Aufnahme in den Gesamtbestand in
  `src/persistence/schema.ts` — **plus** `SCHEMA_VERSION` +1,
  Migrationsschritt und Fixture (siehe unten).

## Persistenz und Formatversion (ADR-0003)

- Eine ganzzahlige `SCHEMA_VERSION` für den **gesamten** Bestand, identisch im
  Gerätespeicher und in der Exportdatei.
- Lesen: gleiche Version → direkt; **neuere** → ablehnen und nichts
  überschreiben; **ältere** → Migrationskette `vN → vN+1 → …` anwenden. Ein
  älterer Bestand wird nie abgelehnt.
- Ein Migrationsschritt ist eine **reine Funktion**, eine Datei je Schritt,
  fortlaufend nummeriert, und wird nach Veröffentlichung **nie geändert**.
- Jede Formaterweiterung liefert Schritt **und** Fixture des alten Formats
  mit; ohne Fixture-Test ist sie nicht fertig.
- Import (PO-2026-09-07-009) nutzt dieselbe Kette — kein zweiter Pfad.
- Kein `if (version < N)` außerhalb von `src/persistence/migrations/`.

## Backend

**Keiner** (ADR-0001). Kein `services/`, kein `libs/contracts/`, keine
Endpunkte, keine Events, keine DB-Migrationen. `src/persistence/` übernimmt
die Rolle, die sonst das Backend hätte. Ein Proxy- oder BFF-Dienst würde
ADR-0001 ablösen und braucht ein eigenes ADR — er entsteht nicht nebenbei.

## Abweichungen

Stellen im Repo, die bewusst von obigen Regeln abweichen — hier aufgeführt,
damit sie nicht bei nächster Gelegenheit „korrigiert" werden.

- `src/app/dev/`: liegt außerhalb von `features/` und hat keine Tests — reines
  Dev-Werkzeug, nicht Teil des Produkts.
- Bewusste Abweichung von der Greenfield-Referenz des Plugins (Angular/NgRx,
  Microservices): begründet in ADR-0002 bzw. ADR-0001.

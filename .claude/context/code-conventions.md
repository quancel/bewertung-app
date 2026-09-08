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
- **Zuletzt geprüft**: 2026-09-08 (beim Einordnen von PO-2026-09-07-011 und
  -012; Stand im Repo: PO-2026-09-07-010 gebaut, -001 in Arbeit)

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
    db.ts                       # IndexedDB öffnen, Object Stores, IDB-Version
    <context>-repository.ts     # Lese-/Schreib-API je Context (orte-repository.ts)
    einstellungen-repository.ts # Anzeigeeinstellungen (ADR-0006)
    migrations/index.ts         # geordnete Liste der Schritte + Kettenlauf
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
- **Der Ort-Datensatz hat genau einen Besitzer im Arbeitsspeicher:
  `useOrteStore`** (ADR-0008). Contexts, die Felder darin bearbeiten
  (`bewertungen`, `tags`), führen dafür **keinen eigenen Store** und rufen
  die Persistenzschicht nicht selbst auf — sie schreiben über das öffentliche
  API des `orte`-Stores. Einen eigenen Store hat nur, wer einen eigenen
  Object Store hat (`medien` ab -005).
- **Was die Ortsliste anzeigt, darf nicht aus einem Feature kommen**
  (ADR-0008): reine Ableitungen auf Ort-Feldern (Gesamtnote, Tag-Prädikat)
  liegen in `src/shared/lib/`, dort genutzte Darstellungsbausteine in
  `src/shared/ui/`. Typen fließen über `persistence/schema.ts`, nie über
  einen Feature-zu-Feature-Import.
- **Nur `persistence/` spricht mit dem Gerätespeicher.** Kein
  `localStorage`/`indexedDB` in Komponenten, Stores oder Composables. Auch
  kein zweiter Speicherweg „nur für Kleinigkeiten" — Anzeigeeinstellungen
  laufen ebenfalls über `persistence/` (ADR-0006).
- **`model/*.types.ts` importiert nichts.** Diese Dateien sind reine
  Typmodule und enthalten **nur den Anteil ihres eigenen Contexts**
  (`orte.types.ts` → `OrtStammdaten`, `bewertungen.types.ts` →
  `Bewertungen`). `persistence/schema.ts` setzt daraus den kanonischen
  Datensatztyp **`OrtDatensatz`** zusammen; Stores und Views arbeiten mit
  diesem. Damit kommt `orte` an die Bewertungsfelder, ohne aus
  `features/bewertungen/` zu importieren (ADR-0008). Ein Import von
  `persistence/` in ein `model/*.types.ts` dreht die Richtung um und ist ein
  Fehler.
- **Nach `shared/` erst ab zwei Nutzern**, nicht vorsorglich. `app/` enthält
  nur Einmaliges. Bausteine, die `app/` **und** ein Feature brauchen, liegen
  deshalb von Anfang an in `src/shared/ui/` — es gibt keinen anderen Weg
  dorthin: `app-shell` importiert nicht aus `features/`, und `features/`
  importiert nicht aus `app/`. Betrifft heute `AdresseOhneZiel.vue`
  (ADR-0010) und `MasterDetail.vue` (ADR-0011).
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
  Registrierung in `src/app/router/index.ts`. **Adressschema**: `/<bereich>`
  für die Übersicht, `/<bereich>/:<id>` für ein einzelnes Element — also
  `/orte` und `/orte/:ortId` (angelegt in PO-2026-09-07-001). `/` leitet auf
  `/orte`. Route-Namen sind der Pfad ohne Schrägstrich (`orte`,
  `ort-detail`). PO-2026-09-07-011 erweitert dieses Schema um weitere
  Bereiche und die Sammelroute für unbekannte Adressen; es benennt bestehende
  Adressen nicht um (PO-2026-09-07-012 verlangt ausdrücklich, dass die
  Detailadresse unverändert bleibt).
  **Routen bleiben flach**, ein Eintrag je Adresse, keine Elternroute als
  Layout-Träger (ADR-0010/0011). Die Sammelroute `/:pfad(.*)*` steht als
  **letzter** Eintrag. `path` und `name` einer einmal angelegten Route werden
  nie geändert — ab PO-2026-09-07-007 ist der Adressraum offline
  ausgeliefert.
- **Bereichsansicht je Bereich**: Beide Routen eines Bereichs
  (`/<bereich>` und `/<bereich>/:<id>`) zeigen auf **dieselbe**
  Bereichsansicht in `src/features/<context>/views/` (`Ortebereich.vue` ab
  PO-2026-09-07-012). Sie liest den Parameter aus der Route und entscheidet
  über `MasterDetail`, was zu sehen ist. Kein zweiter „ausgewählt"-Zustand
  neben `route.params` (ADR-0011).
- **Neues Feld im gespeicherten Format**: Typ nach
  `src/features/<context>/model/`, Aufnahme in den Gesamtbestand in
  `src/persistence/schema.ts` — **plus** `SCHEMA_VERSION` +1,
  Migrationsschritt und Fixture (siehe unten).

## Layout und Breitenlogik (ADR-0010 · ADR-0011 · ADR-0012)

- **Der App-Rahmen ist eine Komponente, keine Route.** `App.vue` verzweigt
  vor dem `<router-view>`: Sperrzustand aus `src/persistence/` →
  vollflächige Meldung ohne Rahmen; sonst Rahmen (Skip-Link,
  Bereichsnavigation, `<main id="main-content">`) um das `<router-view>`.
  Kein `route.meta`-Flag für die Chrome-Frage, kein `<keep-alive>` um das
  `<router-view>`.
- **Breitenabhängige Layouts fragen ihren Container ab, nicht das Fenster**
  (ADR-0012): eigener Block setzt `container-type: inline-size`, Umbrüche als
  `@container (min-width: …)`. Kein `container-name` als Contract zwischen
  Contexts. `@media` bleibt nur für den Layoutwechsel des Rahmens selbst und
  für Nicht-Breiten-Abfragen (`prefers-reduced-motion`).
- **Spalten in Grid/Flex bekommen `min-width: 0`.** Sonst hält
  `min-width: auto` die Spalte auf Inhaltsbreite auf, und die
  Container-Abfrage misst eine Breite, die es nie gibt.
- **Custom Properties funktionieren nicht in `@media`/`@container`.** Dort
  steht die Zahl wörtlich (`1024px`), mit Kommentar auf den Tokennamen.
  `var(--breakpoint-lg)` in einer Bedingung trifft stillschweigend nie zu.
- **Layoutmaße sind Tokens**: Container-Höchstbreite (1120px), Breite der
  Nav-Rail, Breite der Listen-Spalte, Höhe der Bottom-Tab-Leiste gehören nach
  `styles/tokens.css` — kein freier Pixelwert in einem Feature-Stylesheet.
- **Icons werden je Paket nachgezogen, nicht auf Vorrat.** Neue Icons als SVG
  nach `src/assets/icons/<deutscher-kurzname>.svg` plus Wrapper
  `src/shared/ui/icons/Icon<Name>.vue` — gleiche Bauform wie die drei aus
  PO-2026-09-07-010. Lucide Outline bleibt die Quelle, das CDN-Verbot gilt
  unverändert.

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

### Speichertechnik (ADR-0004)

- **IndexedDB über die Bibliothek `idb`.** Kein `localStorage`, kein Dexie,
  kein localForage.
- **Zwei Versionen, die nie vermischt werden**: die IndexedDB-Datenbank­version
  beschreibt nur Struktur (Object Stores, Indizes) und wird ausschließlich in
  `onupgradeneeded` verwendet — dort wird **kein Inhalt** umgeschrieben. Die
  `SCHEMA_VERSION` beschreibt den Inhalt und wird nach dem Öffnen über
  `migrations/` verarbeitet.
- Object Stores: `meta` (ein Datensatz `bestand` mit `schemaVersion`), `orte`
  (Schlüssel = Ort-ID), `einstellungen`. `bilder` kommt mit -005 dazu.
- **Ein Ort ist ein Datensatz**; Bewertungen, Kommentare und Tags sind Felder
  darin. **Binärdaten nie im Ort-Datensatz** — Blobs in einen eigenen Store,
  nie als Base64.
- **IDs sind `crypto.randomUUID()`**, keine fortlaufenden Zahlen (der Import
  „Ergänzen" aus -009 führt zwei Geräte zusammen).
- **Löschen kaskadiert in einer Transaktion**; eine leere Datenbank ist kein
  alter Bestand, sondern ein Erststart.
- **Zwei Zustände sperren die App vollflächig und verbieten jeden
  Schreibzugriff** — nicht nur den auf den Bestand: eine unbekannte, neuere
  `SCHEMA_VERSION` und ein nicht verfügbarer Gerätespeicher (Privatmodus,
  blockierte IndexedDB; Nutzerentscheidung 2026-09-08). Beide kommen aus
  `src/persistence/`, nicht aus einem Feature-Store, und tragen dieselbe
  Bauform: vollflächig, nicht schließbar, ohne Navigationschrome (-011/-012
  fassen sie nicht ein), kein automatischer Löschen-/Zurücksetzen-Knopf.

### Migrationsschritte: Benennung und Typisierung

- **Dateinummer = Zielversion.** `migrations/002-bewertungen.ts` führt von
  v1 nach v2. Damit ist am Dateinamen ablesbar, welche Version sie erzeugt.
- **Ein Migrationsschritt importiert nichts aus `schema.ts`.** Er deklariert
  seine Eingangs- und Ausgangsform lokal (nur die Felder, die er anfasst).
  Sonst zieht eine spätere Schemaänderung rückwirkend die Bedeutung eines
  bereits veröffentlichten Schrittes um — genau das, was ADR-0003 Punkt 4
  ausschließt.
- **Jedes Paket, das `SCHEMA_VERSION` erhöht, hinterlässt ein Fixture seines
  neuen Formats** (`__fixtures__/vN-bestand.json`). Es ist das „alte Format"
  des nächsten Pakets. Ein bereits vorhandenes Fixture wird nie geändert.

### Lesen und Schreiben (ADR-0005)

- **Kein stiller Ersatzwert beim Lesen.** `?? 0`, `|| []` und Ähnliches auf
  gespeicherten Werten sind verboten. Fehlt ein Feld, wird es in einem
  Migrationsschritt gefüllt — nicht beim Lesen. Ein fehlender Wert und ein
  gesetzter Nullwert bleiben unterscheidbar.
- **Ergebnisse statt Ausnahmen.** Lade- und Schreibfunktionen geben ein
  ausdrückliches Ergebnis zurück (u. a. „zu neue Version", „Speicher voll"),
  das der Aufrufer auswerten muss. Kein `try/catch`, das den Fehler
  verschluckt.
- **Geschrieben wird der vollständige Datensatz aus dem Store**, nie
  Lesen-Ändern-Zurückschreiben gegen die Datenbank. Schreibvorgänge je ID
  werden serialisiert.
- **Keine Entprellung vor dem Schreiben.** Auslöser: Feld verlassen bzw.
  Wert geändert, Route verlassen, `visibilitychange` → `hidden`, `pagehide`.
- **Anzeigeeinstellungen sind kein Bestandsinhalt** (ADR-0006): Store
  `einstellungen`, keine `SCHEMA_VERSION`, keine Migration, kein Export.
  Fehlt eine, gilt die Voreinstellung — ohne Meldung.

## Build und Auslieferung

- **Rein statisches Bundle über HTTPS**, Anbieter offen (Nutzerentscheidung
  2026-09-08). Kein Server-Laufzeitanteil, kein SSR (ADR-0001).
- **`base` in `vite.config.ts` bleibt `/`** — das ist zugleich der
  Vite-Standard. Läuft die App später unter einem Unterpfad, ist das genau
  diese eine Zeile; nichts im Code darf einen absoluten Pfad fest verdrahten.
- Der **sichere Kontext ist damit gegeben**: `crypto.randomUUID()`
  (ADR-0004) und der Service Worker aus PO-2026-09-07-007 sind ohne weitere
  Vorbedingung nutzbar. -007 muss das nicht erneut klären.
- Ein Versionswechsel leert **Caches, niemals IndexedDB** — der
  Gerätespeicher ist der Datenbestand, nicht Teil der Auslieferung.

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

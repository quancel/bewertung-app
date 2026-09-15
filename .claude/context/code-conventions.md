# Code Conventions — bewertung-app

> **Single-Writer: Nur der `architekt`-Agent schreibt hierhin.** Die Leads
> liefern Vorschläge über `notes_for_conventions`. Hier steht nur die
> **Regel**; die Begründung gehört ins ADR. Kompakt halten
> (Faustregel: < 120 Zeilen) — Paket-Historie gehört in `adr/INDEX.md`,
> nicht hierhin.

- **Modus**: `vorgegeben` (Greenfield, ADR-0002)
- **Zuletzt geprüft**: 2026-09-15, Nachpflege nach der Reglerrunde
  PO-2026-09-13-001…-003: der korrigierte Prüfweg für UA-Pseudo-Elemente und
  der Rot-Nachweis für neue Zusicherungen (ADR-0027 P5/P8), die beiden
  `vitest.config.ts`-Zutaten der Component-Tests, der Wrapper beim
  Umschalten eines gemeinsam genutzten Bausteins. Davor 2026-09-14, beim
  Einordnen derselben Runde: Component-Tests und die Zusicherung
  „Bedienelement ist greifbar" (ADR-0027), das Kriterium `@media` gegen
  `@container` (ADR-0028), ein Gate für jeden Achsen-Eingabepfad
  (ADR-0007 P7). Davor
  2026-09-13, Nachpflege nach der Korrekturrunde PO-2026-09-12-001…-005:
  von 624 auf 366 Zeilen kuratiert — Paket-Historie, ADR-Begründungen und
  Einzelfall-Anekdoten entfernt, die Regeln selbst vollständig erhalten.

**Stapel**: Vue 3 · TypeScript · Vite · Pinia · vue-router. Ein Projekt, ein
Bundle, kein Monorepo. **Kein Backend** (ADR-0001) — `src/persistence/`
übernimmt dessen Rolle. Ein Proxy/BFF bräuchte ein eigenes ADR.

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
    sichere-kopie.ts            # Pflicht-Wrapper vor jedem Schreiben (s.u.)
    migrations/index.ts · NNN-<kurzname>.ts · __fixtures__/vN-<kurzname>.json
  shared/ui/ · composables/ · lib/   # erst ab zwei Nutzern
  styles/tokens.css · semantic.css · base.css
  assets/fonts/ · icons/        # lokal mitgeliefert, nie vom CDN
~~~

## Regeln, die die Struktur tragen

- **Ein Feature importiert nicht aus einem anderen Feature.** Drei enge
  Ausnahmen:
  1. `bewertungen`, `tags`, `medien` dürfen den `orte`-Store über sein
     öffentliches API nutzen — nur in diese Richtung. **`karte` nicht**: der
     Context fasst gar keinen Store an (ADR-0019 P8).
  2. Eine **View** in `orte` darf Komponenten und reine
     `features/<context>/lib/`-Funktionen fremder Contexts importieren und
     über Props/Emits anbinden (ADR-0013/0022). Geprüft wird am **Zyklus**,
     nicht am Wort „Store": verboten ist der Import eines Moduls, das
     seinerseits den `orte`-Store oder `persistence/` anfasst, Zustand über
     Aufrufe hält oder aus dem importierenden Context zurückimportiert.
     `medien` darf seinen **eigenen** Store anfassen, solange es nichts aus
     `orte` importiert (ADR-0016 P9/10).
  3. `datensicherung` darf nach einem Import `useOrteStore`/`useMedienStore`
     **zum Neuladen** anstoßen — nur das, ohne Rückrichtung (ADR-0017 P9).

  Alles andere läuft über `shared/` bzw. `persistence/schema.ts`, nie quer.
  Nach `shared/` erst **ab zwei Nutzern**; ein zweiter Nutzer zählt, sobald
  er in einem freigegebenen Paket steht. `app/` und `features/` importieren
  nicht voneinander — was beide brauchen, liegt von Anfang an in `shared/`.
- **Reicht ein anderer Context in einen Baustein hinein, bekommt er einen
  benannten Slot statt eines Imports** (ADR-0013; `Werkzeugleiste.vue`,
  Slot `zeile-2`). Leerer Slot = Zeile wird nicht gerendert.
- **Der Ort-Datensatz hat genau einen Besitzer im Arbeitsspeicher:
  `useOrteStore`** (ADR-0008). Contexts, die Felder darin bearbeiten
  (`bewertungen`, `tags`), führen **keinen eigenen Store** und rufen
  `persistence/` nicht selbst auf. Einen eigenen Store hat nur, wer einen
  eigenen Object Store hat (`medien`). Ableitungen auf Ort-Feldern
  (Gesamtnote, Tag-Prädikat, Sortierung) liegen in `shared/lib/` und liefern
  alles mit, was die Ansicht sonst zweimal formulieren müsste (ADR-0009 P9).
- **`model/*.types.ts` importiert nichts** und enthält nur den Anteil seines
  Contexts; `persistence/schema.ts` setzt daraus `OrtDatensatz` zusammen. Ein
  Import von `persistence/` dorthin dreht die Richtung um und ist ein Fehler.
- **Nur `persistence/` spricht mit dem Gerätespeicher** — kein
  `localStorage`/`indexedDB` in Komponenten, Stores, Composables; auch kein
  zweiter Weg „nur für Kleinigkeiten" (ADR-0006).
- **`components/` kennt keinen Store** (Props rein, Emits raus); `views/`
  sind die einzige Stelle, die Stores anbinden.
- **Eine projektweit entschiedene Interaktionsregel steht einmal in
  `shared/composables/`**, nicht je Feature nachgebaut (ADR-0024; Bauform wie
  `useNetzzustand.ts`). `shared/` ist kein Bounded Context — ein Baustein
  dort erzeugt keinen Feature-zu-Feature-Import. Ein Paket darf zum Anbinden
  die Datei eines fremden Contexts anfassen, **nur** dafür.
  - **„Blur" und „Tap außerhalb" sind zwei Mechanismen, nicht einer**
    (`useSchliesseBeiAussenaktion.ts`): `focusout` mit
    `relatedTarget`-Containment fürs Wegtabben, `document`-`pointerdown` für
    Touch/Maus. Ein `@blur` auf dem Input allein zerstört das Tabben in die
    eigene Vorschlagsliste.
- **Ein `watch` auf ein abgeleitetes Array feuert bei jeder Neuberechnung**,
  nicht erst bei inhaltlicher Änderung — `computed` + `filter`/`map` liefert
  jedes Mal ein neues Array. Soll eine Wirkung nur bei **Inhalts**änderung
  eintreten, vergleicht der Watcher selbst (stabile Kennung der Menge).
  Offene Stelle: `features/karte/composables/useLeafletKarte.ts` ruft
  `wendeKartenausschnittAn()` bei jeder Neuberechnung — das nächste Paket an
  der Karte korrigiert das mit.
- **Rohwerte nur in `styles/tokens.css`.** Kein Hex-Wert, kein freier Abstand
  außerhalb der Skalen aus `design-concept.md` in Feature-Stylesheets;
  Komponenten binden an semantische Tokens. Muss ein Tokenwert
  ausnahmsweise in JavaScript stehen (CSS kann keine Farbskala
  interpolieren), dann als benannte Konstante **mit dem Tokennamen im
  Kommentar** — wer eine Farbe ändert, greppt nach ihrem Namen. Siehe
  „Abweichungen".
- **Schriften und Icons unter `src/assets/`** — kein Fremd-Host, kein
  Icon-CDN (Offline-Zusage, ADR-0001). Icons je Paket nachziehen: SVG nach
  `assets/icons/<kurzname>.svg` + Wrapper `shared/ui/icons/Icon<Name>.vue`,
  Quelle Lucide Outline. Nie ein ganzes Set auf Vorrat.
- **Fremdnetz-Zugriffe** nur für drei Zwecke (Kartenkacheln, Ortssuche,
  Versionsauslieferung), im Feature, das sie braucht, jeder mit Ausfallpfad
  (ADR-0018/0020):
  - **Genau ein Modul kennt den Anbieter** (`features/<context>/lib/<dienst>.ts`);
    kein Anbieter-Feldname außerhalb.
  - **Ausdrückliches Ergebnis statt Ausnahme**: Treffer · keine Treffer ·
    kein Netz · Fehler/Timeout sind unterscheidbar; jede Anfrage mit
    `AbortController` und Zeitüberschreitung.
  - **Datensparsam**: nur die Nutzereingabe, keine Bestandsdaten, keine IDs,
    kein Standort-Bias (`lat`/`lon`/`bbox`), keine Telemetrie. Antworten
    werden nicht gespeichert.
  - **Kein API-Schlüssel im Bundle** — ein Anbieter, der einen verlangt, ist
    nicht wählbar. **Referer nicht unterdrücken** (einzige Identifikation
    gegenüber OSM/Photon). **Attribution ist Pflicht**, sichtbar.
- **Netzzustand** (ADR-0021): `navigator.onLine` und `online`/`offline` nur
  **im Feature**, für einen gemuteten Hinweis an der netzabhängigen
  Bedienstelle und zum Wiederholen eines dort sichtbar fehlgeschlagenen
  Abrufs. Nie Reload, Navigation, Toast, globaler Offline-Balken,
  `disabled`, Store-Zustand. `onLine === false` ist verlässlich, `true` ist
  keine Zusage. Gemeinsame Stelle: `shared/composables/useNetzzustand.ts`.
- **Leaflet nur in `features/karte/`** (ADR-0018), Bibliothek **und** CSS.
  `Kartenflaeche.vue` wird asynchron eingebunden (`defineAsyncComponent`), da
  die Karte an der Startroute hängt. Karteninstanz in `shallowRef`, beim
  Unmount `map.remove()`. Marker als `L.divIcon`; ihre Styles nicht in
  `<style scoped>` (Leaflet-DOM trägt kein `data-v-`).
- **`app/dev/`** ist Dev-Werkzeug: Routen nur unter `import.meta.env.DEV`,
  importiert nichts aus `features/`. `Tokenschau.vue` **bleibt dauerhaft**.

## Namenskonventionen

**Framework-Vokabular englisch, Domänen-Vokabular deutsch** (ADR-0002).

- Ordner kebab-case; Feature-Ordner heißt **exakt** wie der `bounded_context`.
- SFC: PascalCase mit deutschem Domänenwort (`Ortsliste.vue`). **Einteilige
  deutsche Komposita sind erlaubt** — die Vue-Regel „multi-word" schützt vor
  HTML-Kollisionen, `Ortsliste` kollidiert mit keiner. Nicht „korrigieren".
- Typen: PascalCase deutsch (`Ort`, `Bewertung`). Stores:
  `<context>.store.ts` / `use<Context>Store`. Composables: `use<Name>()`.
  Sonstige TS-Dateien kebab-case. Tests: `*.spec.ts` neben der Datei.

## Routen, Ansichten, neue Bereiche

- **Adressschema** `/<bereich>` und `/<bereich>/:<id>`; `/` leitet auf
  `/orte`. Route-Name = Pfad ohne Schrägstrich. **Routen bleiben flach**,
  keine Elternroute als Layout-Träger; die Sammelroute `/:pfad(.*)*` steht
  als **letzter** Eintrag in `app/router/routes.ts`. `path` und `name` einer
  ausgelieferten Route werden **nie** geändert (ADR-0010/0011).
- **Beide Routen eines Bereichs zeigen auf dieselbe Bereichsansicht** in
  `features/<context>/views/`, die den Parameter aus der Route liest. Kein
  zweiter „ausgewählt"-Zustand neben `route.params` (ADR-0011).
- **Neuer Bereich**: flache Route **vor** der Sammelroute + **angehängter**
  Eintrag im Register von `app/layout/Bereichsnavigation.vue` (nie einfügen
  oder umsortieren, ADR-0010) + Icon. Nicht jeder Bereich ist zweispaltig.
- **Zweite Ansicht eines bestehenden Bereichs**: kein Routen-Eintrag, keine
  Navigation, sondern ein Query-Parameter (`/orte?ansicht=karte`, ADR-0019).
  Die Ansicht leitet sich allein daraus ab — kein Store-Flag, keine
  Anzeigeeinstellung. Unbekannter/fehlender Wert = Standardansicht **ohne**
  `replace`. Parametername und -wert sind ab Auslieferung eingefroren.

## Layout und Breitenlogik (ADR-0010/0011/0012)

- **Der App-Rahmen ist eine Komponente, keine Route.** `App.vue` verzweigt
  vor dem `<router-view>`: Sperrzustand aus `persistence/` → vollflächige
  Meldung ohne Rahmen; sonst Rahmen (Skip-Link, Bereichsnavigation,
  `<main id="main-content">`). Kein `route.meta`-Flag, kein `<keep-alive>`.
- **Breitenabhängige Layouts fragen ihren Container ab, nicht das Fenster**:
  eigener Block mit `container-type: inline-size`, `@container (min-width: …)`.
  Kein `container-name` als Contract zwischen Contexts. `@media` bleibt für
  den Rahmen selbst und Nicht-Breiten-Abfragen (`prefers-reduced-motion`).
- **Welche der beiden Abfragen, entscheidet die Frage, nicht der Ort im Baum**
  (ADR-0028): „welches Navigationsmuster ist aktiv" (ein-/zweispaltig,
  Bottom-Tabs/Nav-Rail, Chrome das an „ist die Liste daneben sichtbar" hängt)
  → `@media`. „wie viel Platz hat dieser Inhalt" (Raster, Kurz-/Langform,
  Zeilenumbruch) → `@container`. **Bedienelemente, die einander ersetzen**
  („Zurück" ↔ „×", „Fertig"), stehen in **einem** `@media`-Block je Datei mit
  wörtlich derselben Bedingung — sonst gibt es ein Breitenfenster mit beiden
  oder keinem. „Ab `lg` nicht vorhanden" ist `display: none` (nimmt Bild,
  Tabfolge und Accessibility-Baum in einem), nie `visibility`/`opacity`.
- **Schaltet ein Elternteil die Sichtbarkeit eines gemeinsam genutzten
  Bausteins um, bekommt der Baustein einen eigenen Wrapper** — das
  `display: none` liegt auf dem Wrapper, nie auf einer Klasse am
  Wurzelelement des Kind-Bausteins. Grund: Vue hängt an das eigenständige
  Root-Element eines Kindes **beide** scoped-CSS-Attribute (seins und das des
  Elternteils); Elternregel und die eigene Regel des Bausteins
  (`.primaer-button { display: inline-flex }`) haben dann dieselbe
  Spezifität, und wer gewinnt, hängt an der Bündelungs-/Importreihenfolge
  statt an der Quelle. Der Wrapper umgeht das strukturell. Vorbilder:
  `shared/ui/MasterDetail.vue`, `.ortsdetail__fertig` in `Ortebereich.vue`.
  Layoutangaben für den Baustein selbst (z. B. `width: 100%`) bleiben an
  seiner eigenen Klasse — die kollidieren nicht.
- **Ein Baustein, der in zwei verschieden breiten Containern steht, wird
  selbst zum Container** und schaltet zwischen Kurz- und Langform um, statt
  die Elternbreite anzunehmen. Vorbild: `orte/components/Werkzeugleiste.vue`.
- **Ab `lg` scrollt die Listen-Spalte selbst, nicht das Fenster** (ADR-0011
  P6). Was kleben soll, klebt **innerhalb** des scrollenden Spaltenelements.
- **Alles, was in Grid/Flex schrumpfen soll, bekommt `min-width: 0`** — nicht
  nur Layout-Spalten, sondern **jedes Flex-Item mit eigener Inhaltsbreite**,
  besonders `input` (Standard-`size`, Spinner bei `type="number"`). Sonst
  misst die Container-Abfrage eine Breite, die es nie gibt, oder das Element
  läuft aus dem Bildschirm. **Vertikal scrollen ist normal, horizontal nie** —
  aus dem Bildschirm ragen darf nichts.
- **Custom Properties funktionieren nicht in `@media`/`@container`** — dort
  steht die Zahl wörtlich, mit Tokennamen im Kommentar. `var(--breakpoint-lg)`
  in einer Bedingung trifft stillschweigend nie zu.
- **Layoutmaße sind Tokens** (Container-Höchstbreite, Nav-Rail, Listen-Spalte,
  Höhe der Bottom-Tab-Leiste) — kein freier Pixelwert im Feature-Stylesheet.

## Persistenz und Formatversion (ADR-0003/0004)

- Eine ganzzahlige `SCHEMA_VERSION` für den **gesamten** Bestand, identisch im
  Gerätespeicher und in der Exportdatei. Lesen: gleiche Version → direkt;
  **neuere** → ablehnen, nichts überschreiben; **ältere** → Migrationskette.
  Ein älterer Bestand wird nie abgelehnt. Import nutzt dieselbe Kette.
  Kein `if (version < N)` außerhalb von `persistence/migrations/`.
- **IndexedDB über `idb`** — kein `localStorage`, kein Dexie/localForage.
  **Zwei Versionen, nie vermischt**: `IDB_STRUKTUR_VERSION` beschreibt nur
  Struktur (nur in `onupgradeneeded`, dort kein Inhalt), `SCHEMA_VERSION` den
  Inhalt (nach dem Öffnen über `migrations/`).
- Object Stores: `meta` · `orte` · `einstellungen` · `bilder` (Index `ortId`).
  **Kein Rückverweis vom Ort auf seine Bilder** — die Zuordnung steht genau
  einmal, im Bild-Datensatz. **Ein Ort ist ein Datensatz**; Bewertungen,
  Kommentare, Tags sind Felder darin. **Binärdaten nie im Ort-Datensatz**,
  nie als Base64. IDs sind `crypto.randomUUID()`. **Löschen kaskadiert in
  einer Transaktion**; eine leere Datenbank ist ein Erststart.
- **Zwei Zustände sperren die App vollflächig und verbieten jeden
  Schreibzugriff**: unbekannt-neuere `SCHEMA_VERSION` und nicht verfügbarer
  Gerätespeicher. Beide aus `persistence/`, gleiche Bauform: vollflächig,
  nicht schließbar, ohne Navigationschrome, kein Zurücksetzen-Knopf.

### Migrationsschritte

- **Dateinummer = Zielversion** (`002-bewertungen.ts` führt v1 → v2); die
  Zielversion ist immer die **aktuelle** `SCHEMA_VERSION` + 1, nicht eine im
  Handoff genannte Zahl. Ein Schritt ist eine **reine Funktion**, eine Datei
  je Schritt, und wird nach Veröffentlichung **nie geändert**.
- **Ein Schritt importiert nichts aus `schema.ts`** — er deklariert Ein- und
  Ausgangsform lokal (nur die Felder, die er anfasst). Ein neues Feld in
  `RohBestand` wird **optional** deklariert, damit veröffentlichte Schritte
  zuweisbar bleiben; der neue Schritt füllt es aktiv.
- **Jede Formaterweiterung liefert Schritt und Fixture des alten Formats mit**
  (`__fixtures__/vN-bestand.json`) — ohne Fixture-Test nicht fertig. Ein
  vorhandenes Fixture wird nie geändert. **Binärdaten stehen nie im Fixture**,
  sondern nur in seinem Test (Base64 → `Blob` vor dem Kettenlauf). Ein Schritt
  fasst Binärinhalt nicht an: weiterreichen ja, dekodieren/messen nein.

### Lesen und Schreiben (ADR-0005)

- **Kein stiller Ersatzwert beim Lesen** (`?? 0`, `|| []`). Fehlt ein Feld,
  füllt es ein Migrationsschritt — fehlender und gesetzter Nullwert bleiben
  unterscheidbar.
- **Eine Gültigkeitsregel, eine Stelle** (ADR-0007 P7): **Jeder** Eingabepfad
  eines Achsenwertes läuft durch `rundenUndKlemmen()` — auch der native
  `<input type="range">` mit `min`/`max`/`step`. Dessen Zusage ist
  Browserverhalten über einen String (`Number(el.value)`), keine Eigenschaft
  des Datenmodells; ein zweiter Pfad ohne Gate macht die Zusicherung
  „ganze Zahl 0–10, unabhängig vom Weg" zur Konvention statt zur Struktur.
  Ausgenommen bleibt nur das **Leeren** — es führt direkt zu `null` und wird
  nie geklemmt.
- **Ergebnisse statt Ausnahmen**: Lade-/Schreibfunktionen geben ein
  ausdrückliches Ergebnis zurück, das der Aufrufer auswerten muss.
- **Geschrieben wird der vollständige Datensatz aus dem Store**, nie
  Lesen-Ändern-Zurückschreiben gegen die Datenbank. **Keine Entprellung**;
  Auslöser: Feld verlassen, Route verlassen, `visibilitychange` → `hidden`,
  `pagehide`.
- **Jeder `put()`, dessen Wert auch nur teilweise aus einem Pinia-Store
  stammt, läuft durch `sichereKopie()`** (`persistence/sichere-kopie.ts`).
  Ein `ref`/`reactive`-Objekt ist ein `Proxy`, und der strukturierte Klon der
  HTML-Spezifikation lehnt `Proxy` ab — eine echte IndexedDB scheitert
  synchron mit `DataCloneError`, **engine-unabhängig**. Ein flacher `toRaw()`
  genügt **nicht**: Wer ein Objekt per Spread teilweise neu zusammensetzt,
  reicht die unveränderten Geschwisterfelder als tiefe Proxys durch. Der
  Schutz muss rekursiv sein und darf nichts aus `vue` importieren.
  **Heute ist das eine Aufrufkonvention, keine Struktur** — `put()` ist in
  `bilder-repository.ts`, `bestand-repository.ts` und `init.ts` ohne Wrapper
  erreichbar; dort kommen derzeit keine Store-Werte an. Wer das ändert,
  wrappt.
- **Serialisiert wird nur, wo derselbe Datensatz mehrfach geschrieben wird.**
  Die Schreib-Warteschlange je ID gehört zum Inline-Autosave auf dem
  **Ort**-Datensatz. Ein Repository, dessen Datensätze nach dem Anlegen nie
  geändert werden, braucht sie nicht (`bilder-repository.ts`). Wer ein neues
  Repository baut, entscheidet an der Frage „konkurrierende Änderungen auf
  **einem** Datensatz?" und sagt im Modulkommentar, warum so.
- **Anzeigeeinstellungen sind kein Bestandsinhalt** (ADR-0006/0009): Store
  `einstellungen`, keine `SCHEMA_VERSION`, keine Migration, kein Export. Typ,
  Voreinstellung und Prüffunktion zusammen in
  `features/<context>/model/ansicht.ts`; der Zustand lebt im Store des
  Contexts, dem die **konfigurierte Ansicht** gehört. Schlüssel mit
  Context-Präfix (`orte.sortierung`). Fehlt eine, gilt die Voreinstellung —
  ohne Meldung; ein fehlgeschlagenes Schreiben bricht nichts ab.
- **Export/Import**: Bestand als Einheit in `persistence/bestand-repository.ts`
  (lesen, ersetzen, ergänzen — je eine Transaktion, ausdrückliches Ergebnis).
  Ein-/Auspacken in `features/datensicherung/lib/`, **`fflate` nur dort**.
  `persistence/` kennt kein Dateiformat, `datensicherung` kein IndexedDB.

## Build und Auslieferung (ADR-0001/0015)

- **Rein statisches Bundle über HTTPS**, kein Server-Laufzeitanteil, kein SSR.
  `base` in `vite.config.ts` bleibt `/`; nichts im Code verdrahtet einen
  absoluten Pfad. Sicherer Kontext ist damit gegeben. Ein Versionswechsel
  leert **Caches, niemals IndexedDB**.
- **Service Worker generiert, nicht handgeschrieben**: `vite-plugin-pwa`,
  Modus `generateSW`, `manifest: false`. **`globPatterns` werden
  überschrieben, nicht übernommen** (der Vorgabewert enthält kein `woff2`) —
  jedes Paket, das ein neues Dateiformat ins Bundle bringt, prüft die Liste.
  **Adressen stehen nicht im Service Worker** (`navigateFallback`), ein Paket
  mit neuer Route fasst den `pwa`-Block nicht an. **`registerType: 'prompt'`,
  nie `autoUpdate`** — kein Reload aus `controllerchange` (Inline-Autosave).
  **Kein Runtime-Caching für Fremd-Hosts**; `scripts/verify-precache.mjs`
  prüft, dass in `dist/sw.js` kein Fremd-Host vorkommt.

## Tests und Verifikation (ADR-0023)

- **Drei Ebenen, keine ersetzt die andere**: Vitest (`environment: 'node'` +
  `fake-indexeddb/auto`) prüft Logik und Verträge · `npm run smoke` prüft am
  echten Build in einer echten Engine, ob es benutzbar ist · die Abnahme
  prüft die Kriterien.
- **Komponentenverhalten** (ADR-0027): Zuerst prüfen, ob die Regel als reine
  Funktion nach `lib/` gehört (billigste Ebene, Vorbild `rundenUndKlemmen.ts`).
  Ist der **Handler- oder Emit-Weg selbst** der Gegenstand, entsteht eine
  Component-Spec mit `@vue/test-utils`: `environment: 'node'` bleibt die
  Vorgabe, die Spec setzt in Zeile 1 `// @vitest-environment jsdom` — die
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
- **„Bedienelement ist greifbar" ist eine Rauchtest-Zusicherung** (ADR-0027
  P5): Sichtbarkeit und 44×44px-Trefferfläche werden am berechneten Stil in
  einer echten Engine geprüft, inklusive `::-webkit-slider-thumb`, und als
  Eigenschaft formuliert — nie als Prüfung auf eine bestimmte Klasse.
  Ungeprüft bleiben `::-moz-range-thumb` und WebKit-Touchverhalten.
- **Stile eines UA-Pseudo-Elements (`::-webkit-*`) werden über das Chrome
  DevTools Protocol gelesen, nie über `getComputedStyle(el, '::-webkit-…')`**
  (ADR-0027 P5, korrigiert): Letzteres liefert in Chromium die UA-Vorgabe
  statt des Autoren-Stils — zweifach nachgewiesen, die Zusicherung wäre
  dauerhaft grün geblieben. Bauform in `pruefeReglerGreifbarkeit()`
  (`scripts/smoke.mjs`): `DOM.getDocument({ pierce: true })` →
  Knoten über **matchende Selektoren** finden
  (`CSS.getMatchedStylesForNode`, nicht über interne `id`-Namen) →
  `CSS.getComputedStyleForNode`. Wirkt umständlich, ist es nicht — nicht
  „vereinfachen".
- **Eine neue Zusicherung ist erst eingerichtet, wenn sie gegen einen
  verletzenden Stand rot wird** (ADR-0027 P8) — Vor-Korrektur-Stand aus der
  Historie oder eine Wegwerf-Änderung; der Nachweis steht im Bericht. Ein
  Prüfweg, der die Eigenschaft gar nicht erreicht, sieht aus wie ein
  erfülltes Kriterium.
- **Grün gegen `fake-indexeddb` heißt nicht, dass der Browser schreibt** — es
  bildet den strukturierten Klon in JavaScript nach. Jede Zusicherung „Daten
  überleben ein Neuladen" gehört in den Rauchtest. Für die Klonbarkeit selbst
  ist `structuredClone()` der brauchbare Vitest-Nachweis; die Begründung
  dafür trägt die **Spezifikation** (`sichere-kopie.ts:6-13`), nicht Node/V8
  — V8 *ist* Chromiums Klon-Implementierung und belegt über WebKit nichts.
  Diesen Kommentar nicht eindampfen.
- **Die Naht Store → Repository wird nicht vollständig wegmockt.** Je Store
  bleibt ein Test, der das **echte** Repository benutzt und den Wert übergibt,
  den der Store im Betrieb übergibt.
- **Der Rauchtest fährt genau eine Engine: Chromium** (ADR-0023 P5).
  **WebKit prüft kein Automatismus** — obwohl der Datenverlust aus -001 dort
  auftrat. Ein Akzeptanzkriterium, das eine nicht gefahrene Engine nennt, ist
  **nur manuell prüfbar**, wird im Handoff so markiert und bleibt bei der
  Abnahme offen, bis der Nutzer bestätigt hat. Ist eine Ursache
  engine-spezifisch, ist ein grüner Chromium-Lauf kein Nachweis.
- **Neue Ansicht, neue Breite, neuer Zustand?** In die zentralen Listen oben
  in `scripts/smoke.mjs` eintragen — sonst prüft sie niemand. Ausnahmen von
  einer Zusicherung stehen als **benannte Bedingung** (Bauform), nie als
  Liste von IDs oder Klassennamen.
- **Wer eine Zusicherung auf eine neue Dimension ausweitet, grenzt zuerst die
  falschen Befunde ab** — generisch, nicht am Einzelfall: Prüfpunkte jenseits
  der Viewport-**Höhe** sind normales Scrollen; eine fixierte Bottom-Tab-Leiste
  überdeckt bei einem nicht scrollenden Test zwangsläufig die Unterkante,
  obwohl `AppRahmen.vue` `padding-bottom` reserviert. Und die Prüfumgebung
  meldet sich selbst: Chromium protokolliert jeden abgefangenen `fetch`/`xhr`
  als Konsolenfehler.
- **Ein roter Rauchtest, der einen bekannten, bereits geschnittenen Befund
  meldet, wird nicht abgeschwächt** — er wird durch das zugehörige Paket
  grün. Fehlt Playwright: überspringen, Exit-Code 0, im Bericht ausdrücklich
  „ungeprüft" sagen.
- **Die Neulade-Zusicherung deckt heute nur den Anlege-Fall.** Dass spätere
  **Feldänderungen** ein Neuladen überleben, ist nicht zugesichert; das
  nächste Paket, das daran arbeitet, erweitert sie.

## Abweichungen und bewusst akzeptierte Stellen

Damit sie niemand bei nächster Gelegenheit „korrigiert" oder als neuen
Befund meldet.

- `src/app/dev/`: außerhalb von `features/`, ohne Tests — Dev-Werkzeug.
- **Schatten als Literal an sechs Stellen** (`shared/ui/Sheet.vue`,
  `Toast.vue`, `tags/TagEingabe.vue`, `orte/Ortssuche.vue`,
  `karte/Kartenflaeche.vue` 2×), Werte bereits abweichend, obwohl
  `design-concept.md` nur zwei Elevation-Stufen kennt. Die einzige
  Token-Lücke. **Kein Einzelfall-Aufräumen** — das Auflösen braucht die zwei
  Tokenwerte aus `design-concept.md` und geht in einem Zug. Nicht betroffen:
  Scrims hinter Sheets/Dialogen und Bildkacheln.
- **Zwei Tokenwerte als Hex-Konstanten in JS**
  (`shared/ui/Intensitaetsbalken.vue`) — CSS kann keine Farbskala
  interpolieren. Bei einer Token-Änderung mitziehen, nicht aufräumen.
- **Ortsdetail, Koordinatenfelder** (Nutzerentscheidung 2026-09-13,
  „akzeptabel so"): Leert man bei einem Ort **mit** hinterlegten Koordinaten
  beide Felder, klappt der Abschnitt zu und der Reveal-Button muss erneut
  gedrückt werden. Im Browser bestätigt, bewusst so gelassen — **kein
  unentdeckter Fehler**, nicht nebenbei reparieren.
- **`istOffeneAuswahlliste()` in `scripts/smoke.mjs` ist ungeprüft**
  (Nutzerentscheidung 2026-09-13): `ORTSSUCHE_ZUSTAENDE` kennt keinen
  `treffer`-Zustand, die Ausnahme wird von keinem Testzustand durchlaufen.
  Dokumentiert, bewusst so.
- Bewusste Abweichung von der Greenfield-Referenz des Plugins (Angular/NgRx,
  Microservices): ADR-0001/0002.

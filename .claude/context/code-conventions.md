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
- **Zuletzt geprüft**: 2026-09-12, beim Einordnen der **Korrekturrunde**
  PO-2026-09-12-001…-005 (Befunde aus echter Nutzung auf einem iPhone).
  Neu bzw. präzisiert: `min-width: 0` gilt für **jedes** schrumpfende
  Flex-Item, nicht nur für Layout-Spalten (-002); projektweite
  Interaktionsregeln in `src/shared/composables/` (ADR-0024, -003); der
  Abschnitt „Tests und Verifikation" (ADR-0023, -001/-004).
- **Davor geprüft**: 2026-09-11, **Nachpflege nach der Abnahme aller zwölf
  Pakete** (`notes_for_conventions` der Leads plus drei Beobachtungen des
  `product-owner`). Neu bzw. präzisiert: `lib`-Import über Context-Grenzen
  (ADR-0022), Container-Schwellenwert in geteilten Bausteinen,
  Schreib-Warteschlange nur bei änderbaren Datensätzen, `scripts/` und
  `Sheet.vue` in der Struktur, Tokenwerte in JavaScript, Schatten-Token-Lücke,
  `watch` auf abgeleitete Arrays.
- **Und davor**: 2026-09-11 (beim Einordnen von PO-2026-09-07-006 und
  -008; Stand im Repo: zehn Pakete gebaut und committet, 173 Tests grün,
  `SCHEMA_VERSION` = 4, `IDB_STRUKTUR_VERSION` = 2, `features/karte/` noch
  leer). Ergänzt: `lib/` als vorhandener Feature-Unterordner (vier Features
  nutzen ihn), die Regeln zu Fremdnetz-Clients, Leaflet, Netzzustand und zur
  zweiten Ansicht eines Bereichs. **Am 2026-09-11 nachgezogen**, nachdem der
  Nutzer die `user_questions` zu -006/-008 anders entschieden hat als
  angenommen: `karte` ist store-frei (vorher als Nutzer des `orte`-Stores
  notiert), die Karte ist kein eigener Bereich mehr, Geocoder ist Photon.

**Stapel**: Vue 3 · TypeScript · Vite · Pinia · vue-router. Ein Projekt, ein
Bundle, kein Monorepo. **Kein Backend** (ADR-0001).

## Frontend

### Ordnerstruktur

~~~
index.html · package.json · tsconfig.json · vite.config.ts
scripts/                        # Node-Skripte um den Build herum, kein
                                #   Anwendungscode: als `.mjs`, importieren
                                #   nichts aus `src/`, prüfen `dist/`
                                #   (`verify-precache.mjs`, ab -006)
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
      lib/                      # reine Funktionen des Contexts, inkl. des
                                #   EINEN Moduls, das einen Fremddienst kennt
      model/<context>.types.ts  # Typen inkl. der persistierten Form
      model/ansicht.ts          # Anzeigeeinstellungen: Typ + Voreinstellung
                                #   + Prüffunktion (ADR-0009 P.4; ab -003)
  persistence/                  # EINZIGER Zugriff auf den Gerätespeicher
    schema.ts                   # SCHEMA_VERSION + Typ des Gesamtbestands
    db.ts                       # IndexedDB öffnen, Object Stores, IDB-Version
    <context>-repository.ts     # Lese-/Schreib-API je Context (orte-repository.ts)
    einstellungen-repository.ts # Anzeigeeinstellungen (ADR-0006); noch nicht
                                #   vorhanden, entsteht mit -003
    migrations/index.ts         # geordnete Liste der Schritte + Kettenlauf
    migrations/NNN-<kurzname>.ts
    migrations/__fixtures__/vN-<kurzname>.json
  shared/
    ui/ · composables/ · lib/   # ab zwei Nutzern; `ui/` enthält u. a.
                                #   Sheet.vue als gemeinsame Bauform für
                                #   Sheets UND Dialoge (orte, medien,
                                #   datensicherung) — nicht je Feature neu
  styles/
    tokens.css                  # Rohwerte aus design-concept.md
    semantic.css                # semantische Ebene (--surface, --text-muted …)
    base.css                    # Reset, Typo-Basis, Fokusring, Motion
  assets/
    fonts/ · icons/             # lokal mitgeliefert, nie vom CDN
~~~

### Regeln, die die Struktur tragen

- **Ein Feature importiert nicht aus einem anderen Feature.** Drei
  Ausnahmen, alle eng:
  1. `bewertungen`, `tags` und `medien` dürfen den `orte`-Store über sein
     öffentliches API nutzen — nur in diese Richtung (context-map.md).
     **`karte` nicht**: Dieser Context fasst gar keinen Store an (ADR-0019
     Punkt 8).
  2. Eine **View** in `orte` darf Komponenten aus `bewertungen`, `tags`,
     `medien` importieren und über Props/Emits anbinden (ADR-0013). Prüfbar
     am Modul, und zwar am **Zyklus**, nicht am Wort „Store": Verboten ist
     der Import einer Komponente, die ihrerseits **den `orte`-Store** oder
     `persistence/` anfasst — das war der einzige Grund, aus dem ADR-0008 die
     Gegenrichtung verworfen hat. `bewertungen` und `tags` bearbeiten Felder
     des Ort-Datensatzes und sind deshalb praktisch immer store-frei.
     **Ausnahme `medien`** (ADR-0016 Punkt 9/10): `Bilderbereich.vue` fasst
     seinen **eigenen** Store an und importiert nichts aus `features/orte/`;
     `Ortebereich.vue` darf ihn importieren. Die Erlaubnis endet in dem
     Moment, in dem `medien` etwas aus `orte` importiert.
     **`karte` fällt unter Ausnahme 2**: `Ortebereich.vue` importiert
     `Kartenflaeche.vue` und bindet sie über Props/Emits an. Die Erlaubnis
     trägt, weil `karte` store-frei ist und nichts aus `orte` importiert —
     sie endet in dem Moment, in dem eines von beidem nicht mehr stimmt
     (ADR-0019 Punkt 8). Die Ortssuche liegt trotzdem in `orte`, weil sie
     `orte`-Felder schreibt (ADR-0020 Punkt 1).
     **Dasselbe gilt für reine Funktionen aus `features/<context>/lib/`**
     (ADR-0022): `Ortebereich.vue` importiert `filtereOrteMitKoordinaten`
     und `bestimmeKartenLeerzustand` aus `features/karte/lib/`. Bedingung ist
     wörtlich dieselbe wie oben und wird am Modul geprüft: kein Store, kein
     `persistence/`, kein Rückimport aus dem importierenden Context, kein
     Zustand über Aufrufe hinweg. Kein vorsorgliches Verschieben nach
     `shared/lib/` — dort landet nur, was **zwei** Contexts nutzen.
  3. `datensicherung` darf nach einem Import `useOrteStore` und
     `useMedienStore` über deren öffentliches API **zum Neuladen** anstoßen —
     nur das, ohne Rückrichtung (ADR-0017 Punkt 9).
  Alles andere (Ableitungen, Composables mit Store-/Speicherzugriff, Typen)
  läuft über `shared/lib/` bzw. `persistence/schema.ts`, nie quer.
- **Ein Baustein, in den ein anderer Context hineinreicht, bekommt einen
  benannten Slot statt eines Imports.** `Werkzeugleiste.vue` (`orte`)
  besitzt Rahmen und Zeile 1 und stellt Zeile 2 als Slot `zeile-2` bereit;
  gefüllt wird er ausschließlich von `Ortebereich.vue`. Leerer Slot = Zeile
  wird nicht gerendert (ADR-0013).
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
  (ADR-0010), `MasterDetail.vue` (ADR-0011) und ab -007 `Toast.vue` — der
  Update-Hinweis aus -007 (`app-shell`) und die Export-/Import-Meldungen aus
  -009 (`datensicherung`) sind zwei Nutzer, und `features/` käme an eine
  Ablage in `app/` nicht heran. **Ein zweiter Nutzer zählt, sobald er in
  einem freigegebenen Paket steht** — nicht erst, wenn er gebaut ist; ein
  späteres Verschieben wäre reine Umbenennung. Was nur ein Paket je braucht,
  bleibt trotzdem draußen.
- **Eine projektweit entschiedene Interaktionsregel steht einmal in
  `src/shared/composables/`, nicht je Feature nachgebaut** (ADR-0024;
  Bauform wie `useNetzzustand.ts`, ADR-0021 Punkt 5). Ab -003 betrifft das
  das Schließen einer Auswahlliste bei Blur/Tap außerhalb, genutzt von
  `features/orte/components/Ortssuche.vue` **und**
  `features/tags/components/TagEingabe.vue`. `shared/` ist kein Bounded
  Context: Ein Baustein dort erzeugt **keinen** Feature-zu-Feature-Import,
  ADR-0013/0022 bleiben unberührt. Ein Paket darf dafür die Datei eines
  fremden Contexts anfassen — aber **nur** zum Anbinden der geteilten Regel;
  jede fachliche Änderung an einem fremden Context bleibt ein eigenes Paket.
- **`components/` kennt keinen Store**, bekommt alles über Props und meldet
  über Emits zurück. `views/` sind die einzige Stelle, die Stores anbindet.
- **Ein `watch` auf ein abgeleitetes Array feuert bei jeder Neuberechnung**,
  nicht erst bei inhaltlicher Änderung. Ein `computed` mit `filter`/`map`
  liefert jedes Mal ein **neues** Array, und Vue vergleicht die Referenz —
  der Watcher läuft also, sobald irgendeine Abhängigkeit des `computed`
  angefasst wurde, auch wenn dieselben Elemente herauskommen. Soll eine
  Wirkung nur bei **inhaltlicher** Änderung eintreten (Kartenausschnitt neu
  setzen, Scrollposition zurücksetzen, Fokus verschieben), vergleicht der
  Watcher selbst — etwa über eine stabile Kennung der Menge (verkettete IDs).
  Ein Handoff, das „erneut, wenn sich X ändert" verlangt, meint den
  **Inhalt**. Bekannte offene Stelle:
  `features/karte/composables/useLeafletKarte.ts` ruft
  `wendeKartenausschnittAn()` bei jeder Neuberechnung von `kartenOrte` — das
  nächste Paket, das die Karte anfasst, prüft und korrigiert das mit.
- **Rohwerte nur in `styles/tokens.css`.** In Feature-Stylesheets kein
  Hex-Wert, kein freier Pixel-Abstand außerhalb der Skalen aus
  `design-concept.md`. Komponenten binden nur an semantische Tokens.
  - **Ausnahme, wenn CSS es nicht kann**: Eine Farbskala lässt sich in CSS
    nicht interpolieren. Wo ein Tokenwert deshalb in JavaScript stehen muss,
    steht er als **benannte Konstante mit dem Tokennamen im Kommentar**,
    genau einmal je Komponente — heute nur
    `src/shared/ui/Intensitaetsbalken.vue` (`--color-neutral-100`,
    `--color-primary-600`). Das ist die einzige Kopie eines Tokenwerts im
    Projekt: **Wer eine Farbe in `tokens.css` ändert, greppt zuerst nach
    ihrem Namen** — die Kopien tragen ihn im Kommentar und sind so auffindbar.
    Kein Auslesen über `getComputedStyle`, kein zweiter Ort für denselben
    Wert.
  - **Schatten kommen aus einem Token, nicht aus einem Literal.**
    `design-concept.md` kennt **zwei** Elevation-Stufen (flach mit Rahmen /
    schwebend über dem Inhalt); `tokens.css` hat dafür bisher **kein** Token,
    und im Bestand stehen sechs `rgb(0 0 0 / …)`-Literale mit fünf
    verschiedenen Werten (siehe „Abweichungen"). Das nächste Paket, das eine
    schwebende Fläche anfasst, legt die Tokens in `styles/tokens.css` an und
    zieht die vorhandenen Stellen mit — es erfindet **keine** dritte Stufe.
    Nicht betroffen sind Verdunkelungsflächen hinter Sheets/Dialogen und
    Bildkacheln (`background-color: rgb(0 0 0 / …)`): das sind Scrims, keine
    Elevation.
- **Schriften und Icons liegen unter `src/assets/`.** Kein `<link>` auf einen
  Fremd-Host, kein `@import` einer Font-URL, kein Icon-CDN-Paket — das ist
  die Offline-Zusage (ADR-0001), keine Stilfrage. Icons werden als
  Teilmenge gebündelt, nie ein ganzes Set „auf Vorrat".
- **Fremdnetz-Zugriffe** sind auf die drei erlaubten Zwecke beschränkt
  (Kartenkacheln, Ortssuche, Versionsauslieferung) und liegen im Feature, das
  sie braucht. Jeder braucht einen Ausfallpfad, der die App bedienbar lässt.
  Regeln dazu (ADR-0018/0020):
  - **Genau ein Modul kennt den Anbieter** — URL, Parameter und Antwortform
    stehen in `features/<context>/lib/<dienst>.ts` (`geocoding.ts`), sonst
    nirgends. Kein Anbieter-Feldname außerhalb dieser Datei.
  - **Ausdrückliches Ergebnis statt Ausnahme** (wie `persistence/`,
    ADR-0005): Treffer · keine Treffer · kein Netz · Fehler/Zeitüberschreitung
    sind unterscheidbare Ergebnisse, kein `throw`, kein verschlucktes
    `try/catch`. Jede Anfrage hat Abbruch (`AbortController`) und
    Zeitüberschreitung.
  - **Datensparsam**: übertragen wird nur, was der Nutzer eingegeben hat —
    keine Bestandsdaten, keine IDs, keine Telemetrie. Antworten werden nicht
    gespeichert; persistiert wird nur die Übernahme, über den `orte`-Store.
  - **Kein API-Schlüssel im Bundle** (ADR-0001). Ein Anbieter, der einen
    verlangt, ist nicht wählbar.
  - **Referer nicht unterdrücken**: kein `<meta name="referrer" content="no-referrer">`
    und keine `referrerPolicy`, die die eigene Origin verschweigt — sie ist
    die einzige Identifikation gegenüber OSM und Photon (ein `User-Agent` ist
    aus dem Browser nicht setzbar).
  - **Kein Standort-Bias**: Parameter, die Position oder Ausschnitt
    mitsenden (`lat`/`lon`/`bbox` bei Photon), werden nicht benutzt — sie
    übertragen mehr, als der Nutzer eingegeben hat (ADR-0020 Punkt 5).
  - **Attribution ist Pflicht**, an Karte und Trefferliste sichtbar.
- **Netzzustand** (ADR-0021): `navigator.onLine` und `online`/`offline` sind
  **im Feature** erlaubt — nur für einen gemuteten Hinweis an der
  netzabhängigen Bedienstelle und für das Wiederholen eines dort sichtbar
  fehlgeschlagenen Abrufs. Nie Reload, Navigation, Toast, globaler
  Offline-Balken, `disabled`-Feld oder Store-Zustand; Listener hängen an der
  Komponentenlebensdauer. `onLine === false` ist verlässlich, `true` ist keine
  Zusage — Fehlertexte kommen aus dem Abrufergebnis. Für die Update-Mechanik
  in `app-shell` gilt weiterhin ADR-0015 Punkt 6: dort löst ein Netzwechsel
  nichts aus. Gemeinsame Stelle: `src/shared/composables/useNetzzustand.ts`.
- **Leaflet nur in `features/karte/`** (ADR-0018): Bibliothek **und**
  `leaflet/dist/leaflet.css` werden ausschließlich dort importiert, nie in
  `main.ts`, `src/styles/` oder `shared/`. Weil die Karte an der **Startroute**
  `/orte` hängt (ADR-0019), wird `Kartenflaeche.vue` zusätzlich **asynchron**
  eingebunden (`defineAsyncComponent(() => import(...))`) — ein statischer
  Import legte Leaflet ins Einstiegs-Bundle. Die Karteninstanz
  liegt in einer nicht-reaktiven Referenz (`shallowRef`), beim Unmount
  `map.remove()`. Marker sind `L.divIcon` (kein Standard-Icon, keine
  Bilddatei); **ihre Styles gehören nicht in `<style scoped>`** — von Leaflet
  erzeugtes DOM trägt kein `data-v-`-Attribut, also `:deep()` vom
  Kartencontainer aus oder ein unscoped Block.
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
- **Neuer Bereich**: bringt seine flache Route selbst mit (Eintrag **vor**
  der Sammelroute in `src/app/router/routes.ts`) **und** einen **angehängten**
  Eintrag im Bereichsregister von `app/layout/Bereichsnavigation.vue` —
  Einträge werden nie eingefügt oder umsortiert (ADR-0010). Dazu je ein Icon
  nach dem üblichen Weg (SVG in `src/assets/icons/`, Wrapper in
  `src/shared/ui/icons/`). Nicht jeder Bereich ist zweispaltig: `daten`
  (-009) bleibt einspaltig und benutzt `MasterDetail.vue` nicht (ADR-0011).
- **Zweite Ansicht eines bestehenden Bereichs** (ADR-0019, erstmals die Karte
  in -006): **kein** neuer Routen-Eintrag und **kein** Eintrag in der
  Bereichsnavigation, sondern ein Query-Parameter auf der vorhandenen
  Bereichsadresse — `/orte?ansicht=karte`. Die Bereichsansicht leitet die
  Ansicht allein daraus ab; es gibt keinen Ansichts-Zustand daneben (kein
  Store-Flag, keine Anzeigeeinstellung). Unbekannter oder fehlender Wert =
  Standardansicht, **ohne** die Adresse zu korrigieren (kein `replace`).
  Parametername und -wert sind ab Auslieferung genauso eingefroren wie ein
  `path` — sie stehen nur nicht in `routes.ts`, deshalb hier. Die
  Bereichsnavigation bleibt unangetastet und hebt den Bereich weiterhin
  hervor, weil `istAktiv` den Pfad prüft.
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
- **Neue Anzeigeeinstellung** (ADR-0006/ADR-0009): Typ, Voreinstellung und
  Prüffunktion („was liest man aus einem unbekannten gespeicherten Wert?")
  zusammen in `src/features/<context>/model/ansicht.ts` — genau eine Stelle,
  importiert nichts. Der Zustand lebt im Store des Contexts, dem die
  **konfigurierte Ansicht** gehört (Ortsliste → `useOrteStore`, auch für den
  Tag-Filter). Gelesen/geschrieben wird über
  `persistence/einstellungen-repository.ts`, das generisch bleibt und keine
  Einstellung inhaltlich kennt. Ein Schlüssel je Einstellung mit
  Context-Präfix und strukturiertem Wert (`orte.sortierung`,
  `orte.tagfilter`). Ein fehlgeschlagenes Schreiben wird **nicht** gemeldet
  und bricht nichts ab.
- **Export/Import (-009)**: Der Bestand als Einheit gehört nach
  `src/persistence/bestand-repository.ts` (lesen, ersetzen, ergänzen — je in
  einer Transaktion, als ausdrückliches Ergebnis). Das Ein- und Auspacken der
  Datei liegt in `src/features/datensicherung/lib/`; **`fflate` wird nur dort
  importiert**. `persistence/` kennt kein Dateiformat, `datensicherung` kennt
  kein IndexedDB (ADR-0017 Punkt 8).
- **Ableitungen für die Ortsliste** liegen in `src/shared/lib/` und liefern
  alles mit, was die Ansicht sonst ein zweites Mal formulieren müsste — die
  Sortierfunktion liefert die Partition „mit Wert / ohne Wert" mit, statt sie
  der Ansicht zu überlassen (ADR-0009 Punkt 9).

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
- **Ein Baustein, der in zwei verschieden breiten Containern steht, wird
  selbst zum Container.** Sobald eine zweite Ansicht (ADR-0019) oder ein
  zweiter Bereich denselben Baustein in anderer Breite zeigt, trägt die
  Einschätzung „passt in jeder Breite" nicht mehr: Der Baustein setzt
  `container-type: inline-size` auf seinem **eigenen** Wurzelblock und
  schaltet zwischen Kurz- und Langform um, statt die Breite des Elternteils
  anzunehmen. Vorbild ist `features/orte/components/Werkzeugleiste.vue`
  (Zeile 1: Trefferzahl in Kurzform unter 768px = `--breakpoint-md`, als Zahl
  wörtlich) — sie steht sowohl in der ~368px schmalen Listen-Spalte als auch
  über die volle Inhaltsbreite der Kartenansicht, und letztere kann auf dem
  Telefon **schmaler** sein als erstere auf dem Laptop. Wer denselben Fall
  hat, kopiert dieses Muster, statt neu zu raten.
- **Ab `lg` scrollt die Listen-Spalte selbst, nicht das Fenster** (ADR-0011
  Punkt 6). Was dort kleben soll (Werkzeugleiste), klebt an der Spalte:
  `position: sticky; top: 0` **innerhalb** des scrollenden Spaltenelements.
  Ein `sticky` gegen den Viewport wirkt dort nicht wie erwartet, und ein
  `overflow` auf einem Vorfahren macht es wirkungslos.
- **Alles, was in Grid/Flex schrumpfen soll, bekommt `min-width: 0`** — nicht
  nur Layout-Spalten, sondern **jedes Flex-Item mit eigener Inhaltsbreite**,
  insbesondere `input`. Sonst hält `min-width: auto` es auf seiner
  Inhaltsbreite auf: Die Container-Abfrage misst eine Breite, die es nie
  gibt (ADR-0012 Punkt 4), oder das Element läuft aus dem Bildschirm.
  Formularfelder tragen eine browserabhängige Standard-`size`, ein
  `type="number"` zusätzlich einen Spinner — sie sind die häufigste Stelle,
  an der diese Regel vergessen wird (PO-2026-09-12-002: die Koordinatenzeile
  ragte ab ~390px aus dem Bildschirm). **Zahlenfeld-Paare stehen ohnehin
  untereinander** (`design-conventions.md` „Formulare"), ohne Umbruchpunkt
  und ohne Container-Abfrage — eine gestapelte Zeile braucht keine, und
  ADR-0012 verlangt keine Breitenabhängigkeit, sondern regelt nur, wie eine
  vorhandene gefragt wird.
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
  (Schlüssel = Ort-ID), `einstellungen`. `bilder` kommt mit -005 dazu
  (Schlüssel = Bild-ID, Index auf `ortId`) und erhöht als bisher einziges
  Paket **beide** Zahlen getrennt: `IDB_STRUKTUR_VERSION` 1 → 2 **und**
  `SCHEMA_VERSION` 3 → 4 (ADR-0016).
- **Kein Rückverweis vom Ort auf seine Bilder** — keine Liste von Bild-IDs im
  Ort-Datensatz. Die Zuordnung steht genau einmal, als `ortId` im
  Bild-Datensatz (ADR-0016 Punkt 1).
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
  Die Zielversion ist immer die **aktuelle** `SCHEMA_VERSION` + 1, nicht eine
  im Handoff genannte Zahl: nach -002 ist -004 der Schritt `003-tags.ts`
  (v2 → v3). Weicht der Repo-Stand ab, gilt die Regel, nicht die Zahl.
- **Ein Migrationsschritt importiert nichts aus `schema.ts`.** Er deklariert
  seine Eingangs- und Ausgangsform lokal (nur die Felder, die er anfasst).
  Sonst zieht eine spätere Schemaänderung rückwirkend die Bedeutung eines
  bereits veröffentlichten Schrittes um — genau das, was ADR-0003 Punkt 4
  ausschließt.
- **Jedes Paket, das `SCHEMA_VERSION` erhöht, hinterlässt ein Fixture seines
  neuen Formats** (`__fixtures__/vN-bestand.json`). Es ist das „alte Format"
  des nächsten Pakets. Ein bereits vorhandenes Fixture wird nie geändert.
- **Ein neues Feld in `RohBestand` wird optional deklariert**
  (`bilder?: unknown[]`, ADR-0016 Punkt 4). Die veröffentlichten Schritte
  deklarieren ihre Form lokal und ohne das neue Feld; ein Pflichtfeld machte
  sie unzuweisbar und erzwänge eine Änderung an bereits veröffentlichtem
  Code (ADR-0003 Punkt 4). Nach dem Kettenlauf ist das Feld trotzdem immer
  gesetzt, weil der neue Schritt es **aktiv** füllt.
- **Binärdaten stehen nie im Fixture, sondern nur in seinem Test.** Ein
  Bild-Datensatz im Fixture trägt seinen Inhalt als kurzen Base64-String,
  den der Test vor dem Kettenlauf in einen `Blob` umwandelt. Base64 ist ein
  Behelf der Testdatei — nie eine Form, in der gespeichert oder exportiert
  wird (ADR-0004 Punkt 6, ADR-0016 Punkt 5).
- **Ein Migrationsschritt fasst keinen Binärinhalt an**: weiterreichen ja,
  dekodieren/umkodieren/messen nein.

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
  Lesen-Ändern-Zurückschreiben gegen die Datenbank.
- **Serialisiert wird nur, wo derselbe Datensatz mehrfach geschrieben
  wird.** Die Schreib-Warteschlange je ID (ADR-0005 Punkt 3) gehört zum
  Inline-Autosave auf dem **Ort**-Datensatz: schnelle Feldwechsel stauen
  Schreibvorgänge auf dieselbe ID. Ein Repository, dessen Datensätze nach dem
  Anlegen **nie mehr geändert** werden (nur schreiben oder löschen), braucht
  sie nicht — `bilder-repository.ts` hat sie deshalb bewusst nicht
  (ADR-0016 Punkt 7). Wer ein neues Repository baut, entscheidet an dieser
  Frage, nicht nach Vorbild: Gibt es konkurrierende Änderungen auf **einem**
  Datensatz? Der Kommentar im Modul sagt, warum es die Warteschlange hat oder
  nicht.
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

### Service Worker (ab -007, ADR-0015)

- **Generiert, nicht handgeschrieben**: `vite-plugin-pwa` im Modus
  `generateSW`, konfiguriert im `pwa`-Block von `vite.config.ts`.
  `manifest: false` — kein Web-App-Manifest, keine Installierbarkeit
  (ADR-0001: kein App-Icon).
- **`globPatterns` werden überschrieben, nicht übernommen.** Der Vorgabewert
  enthält kein `woff2`; die lokale Inter-Datei fiele damit aus dem Cache und
  der Start ohne Netz zeigte die Systemschrift. Jedes Paket, das ein neues
  Dateiformat ins Bundle bringt, prüft diese Liste.
- **Adressen stehen nicht im Service Worker.** Tiefenlinks laufen über
  `navigateFallback: '/index.html'`; eine Routenliste wäre eine zweite Quelle
  für den Adressraum und veraltete bei jedem neuen Bereich. Ein Paket, das
  eine Route ergänzt (`/daten` in -009, Karte in -006), fasst -007 nicht an.
- **`registerType: 'prompt'`, nie `autoUpdate`.** Der wartende Service Worker
  übernimmt ausschließlich auf Nutzeraktion; kein Reload aus einem
  `controllerchange`-Handler. Grund: Inline-Autosave (ADR-0005).
- **Kein Runtime-Caching für Fremd-Hosts.** Kartenkacheln und Ortssuche
  bringen ihren Ausfallpfad im eigenen Feature mit (-006/-008). -006 fasst
  den `pwa`-Block **nicht** an: Leaflet-JS/-CSS und die von seinem CSS
  emittierten Bilder decken die vorhandenen `globPatterns` bereits ab,
  Kacheln werden nie precacht (ADR-0018 Punkt 5). `scripts/verify-precache.mjs`
  prüft ab -006 zusätzlich, dass in `dist/sw.js` **kein Fremd-Host** vorkommt.
- Der Registrierungspunkt (`virtual:pwa-register/vue`) braucht die
  Typreferenz in `src/vite-env.d.ts`.

## Tests und Verifikation (ADR-0023)

- **Drei Ebenen, keine ersetzt die andere**: Vitest (`environment: 'node'` +
  `fake-indexeddb/auto`) prüft Logik und Verträge · `npm run smoke` prüft am
  echten Build in einer echten Browser-Engine, ob es benutzbar ist · die
  Abnahme prüft die Kriterien.
- **Grün gegen `fake-indexeddb` heißt nicht, dass der Browser schreibt.**
  `fake-indexeddb` bildet den strukturierten Klon in JavaScript nach; Werte,
  die eine echte IndexedDB nicht klonen kann, gehen dort durch. Jede
  Zusicherung „Daten überleben ein Neuladen" gehört deshalb in den
  Rauchtest, nicht in Vitest.
- **Die Naht Store → Repository wird nicht vollständig wegmockt.** Je Store
  bleibt mindestens ein Test, der das **echte** Repository benutzt und den
  Wert übergibt, den der Store im Betrieb auch übergibt. Vorhandene
  Mock-Tests bleiben daneben stehen.
- **Neue Ansicht, neue Breite, neuer Zustand?** In die zentralen Listen oben
  in `scripts/smoke.mjs` eintragen — sonst prüft sie niemand. Ausnahmen von
  einer Zusicherung stehen als benannte Bedingung im Skript, nie als Liste
  einzelner Element-IDs.
- **Ein roter Rauchtest, der einen bekannten, bereits geschnittenen Befund
  meldet, wird nicht abgeschwächt** — er wird durch das zugehörige Paket
  grün. Fehlt Playwright oder eine Engine: überspringen, Exit-Code 0, und im
  Bericht ausdrücklich „ungeprüft" sagen.

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
- **Schatten als Literal an sechs Stellen** (`shared/ui/Sheet.vue`,
  `shared/ui/Toast.vue`, `features/tags/components/TagEingabe.vue`,
  `features/orte/components/Ortssuche.vue`,
  `features/karte/components/Kartenflaeche.vue` 2×). Die einzige Token-Lücke
  im Projekt; die Werte weichen bereits voneinander ab, obwohl
  `design-concept.md` nur zwei Stufen kennt. **Kein Einzelfall-Aufräumen**:
  Das Auflösen braucht die zwei Tokenwerte aus `design-concept.md` (fremde
  Datei) und geht in einem Zug, nicht Datei für Datei.
- **Zwei Tokenwerte zusätzlich als Hex-Konstanten in JavaScript**
  (`shared/ui/Intensitaetsbalken.vue`). Bewusst: CSS kann eine Farbskala
  nicht interpolieren. Die Konstanten tragen den Tokennamen im Kommentar und
  sind über ihn auffindbar — nicht „aufräumen", sondern bei einer
  Token-Änderung mitziehen.
- Bewusste Abweichung von der Greenfield-Referenz des Plugins (Angular/NgRx,
  Microservices): begründet in ADR-0002 bzw. ADR-0001.

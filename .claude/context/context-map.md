# Context Map — bewertung-app

> **Single-Writer: Nur der `architekt`-Agent aktualisiert diese Datei.**
> Alle anderen Rollen lesen sie nur.
>
> Halte sie kompakt (Faustregel: < 100 Zeilen). Sie ist ein Register,
> kein Design-Dokument — Details gehören in ADRs unter `adr/`.

- **Stand**: 2026-09-11 (Nachpflege nach der Abnahme aller zwölf Pakete:
  Import-Gegenrichtung um reine `lib`-Funktionen erweitert, ADR-0022).
  Angelegt beim Einordnen von PO-2026-09-07-010,
  fortgeschrieben beim Einordnen von PO-2026-09-07-001 (Gerätespeicher), von
  PO-2026-09-07-011/-012 (App-Rahmen und zweispaltiges Layout), von
  PO-2026-09-07-003/-004 (Sortierung und Tag-Filter), von
  PO-2026-09-07-007/-005/-009 (Offline-Auslieferung, Bilder, Export/Import)
  und von PO-2026-09-07-006/-008 (Kartenansicht, Ortssuche).

**Es gibt genau ein Artefakt**: ein clientseitiges Vue-Bundle ohne
Backend-Dienst (ADR-0001). Ein „Bounded Context" ist hier deshalb ein
Feature-Modul unter `src/features/` plus seinem Ausschnitt des lokalen
Datenformats — **keine Prozess- oder Netzgrenze**. Der Ordnername ist
identisch mit dem `bounded_context` im Handoff (ADR-0002).

## Bounded Contexts

| Context | Repo/Service | Zuständigkeit (1 Satz) | Owner-Team |
|---------|--------------|------------------------|------------|
| `app-shell` | `src/app/`, `src/styles/`, `src/assets/`, `src/main.ts` | Gerüst, Design-Tokens, Schriften/Icons, Router, Offline-Auslieferung | frontend-lead |
| `orte` | `src/features/orte/` | Ort als Aggregatwurzel (Bezeichnung, Adresse, Koordinaten), Liste, Detail, Sortierung, Ortssuche (ADR-0020) | frontend-lead |
| `bewertungen` | `src/features/bewertungen/` | Vier Achsen 0–10 je Ort, Achsen-Kommentare, Gesamtnote | frontend-lead |
| `tags` | `src/features/tags/` | Freie Tags je Ort und der Tag-Filter über die Liste | frontend-lead |
| `medien` | `src/features/medien/` | Bilder je Ort (Verkleinerung, Anzeige, Löschen) | frontend-lead |
| `karte` | `src/features/karte/` | Kartendarstellung mit Markern als **präsentationaler** Baustein (Leaflet-Kapselung) — keine View, keine Route, kein Store; **nicht** die Ortssuche (ADR-0018/0019) | frontend-lead |
| `datensicherung` | `src/features/datensicherung/` | Export/Import des gesamten Bestands als eine Datei | frontend-lead |

**Kein Bounded Context, sondern geteilte Infrastruktur**: `src/persistence/`
(einziger Zugriff auf den Gerätespeicher, Formatversion und Migrationskette,
ADR-0003) und `src/shared/` (zustandslose UI-Bausteine, ab zwei Nutzern).

`src/persistence/` entsteht mit PO-2026-09-07-001: **IndexedDB über `idb`**,
Object Stores `meta` · `orte` · `einstellungen` (`bilder` ab -005),
IDB-Datenbankversion strikt getrennt von der `SCHEMA_VERSION` (ADR-0004),
Schreibmodell nach ADR-0005. Sie ist damit ab -001 kein offener Punkt mehr,
sondern eine benutzbare Schnittstelle für alle Feature-Contexts.

## Schnittstellen zwischen Contexts

Nur die Beziehungen, die für Routing-Entscheidungen relevant sind — kein
vollständiges Sequenzdiagramm.

- **Alle Feature-Contexts → `src/persistence/`**: Kein Feature liest oder
  schreibt den Gerätespeicher direkt. Das ist die einzige Stelle, an der die
  Speichertechnik und die Formatversion bekannt sind.
- **`orte` besitzt die Aggregatwurzel.** `bewertungen`, `tags` und `medien`
  hängen an einer Ort-ID und dürfen den `orte`-Store über dessen öffentliches
  API nutzen. Für **Zustand und Logik** (Stores, Composables mit
  Store-/Speicherzugriff, Ableitungen) zeigt diese Beziehung ausschließlich
  in Richtung `orte`; `orte` importiert davon nichts zurück.
- **Für Darstellung gibt es eine enge Gegenrichtung** (ADR-0013, ab -003/-004):
  Eine **View** in `orte` darf **präsentationale, store-freie** Komponenten
  aus `bewertungen`, `tags` und `medien` importieren und sie über Props und
  Emits anbinden — die Filterleiste und die Tag-Eingabe aus -004, die
  Achsen-Bearbeitung aus -002. Dasselbe gilt für **reine Funktionen** aus
  `features/<context>/lib/` (ADR-0022, ab -006: `koordinatenFilter.ts` und
  `leerzustand.ts` aus `karte`). Sobald ein solches Modul selbst einen Store
  anfasst oder aus `orte` importiert, entfällt die Erlaubnis; nur so bleibt
  der Import-Graph zyklenfrei. `features/orte/components/Werkzeugleiste.vue` kennt `tags`
  **nicht**: Zeile 2 kommt als benannter Slot aus `Ortebereich.vue`.
- **`useOrteStore` ist der einzige Besitzer des Ort-Datensatzes im
  Arbeitsspeicher** (ADR-0008). `bewertungen` (-002) und `tags` (-004)
  bearbeiten Felder darin über sein öffentliches API und haben **keinen
  eigenen Store**; nur `medien` (-005) bekommt einen, weil es einen eigenen
  Object Store hat. Was die Ortsliste von diesen Feldern zeigt oder auswertet
  (Gesamtnote, Achsenwert, Tag-Filter), liegt als reine Funktion in
  `src/shared/lib/` und als Darstellungsbaustein in `src/shared/ui/` — nicht
  im besitzenden Feature.
- **`karte` liefert Darstellung, `orte` liefert die Daten** (ADR-0019 ab
  -006): `karte` fasst **keinen** Store an, kennt `persistence/` nicht und
  importiert nichts aus `orte`. `features/orte/views/Ortebereich.vue` bindet
  `features/karte/components/Kartenflaeche.vue` über Props und Emits an —
  dieselbe Richtung wie bei `bewertungen`, `tags` und `medien` (ADR-0013).
  Der Prop-Typ steht in `features/karte/model/karte.types.ts` und importiert
  nichts, auch nicht `OrtDatensatz`: Eine Formatänderung berührt die Karte
  nicht. Das Nachtragen von Koordinaten läuft unverändert über die
  Ort-Bearbeitung in `orte`. Die Ortssuche (-008) liegt aus eigenen Gründen in
  `orte` (ADR-0020 Punkt 1), nicht wegen einer Importrichtung.
- **`medien` (-005) hat als einziger Feature-Context einen eigenen Object
  Store und deshalb einen eigenen Pinia-Store** (ADR-0016). Er importiert
  **nichts** aus `features/orte/` — nur unter dieser Bedingung darf
  `Ortebereich.vue` umgekehrt seinen `Bilderbereich.vue` importieren, obwohl
  der einen Store anfasst (Präzisierung von ADR-0013 Punkt 3, das den
  Zyklus meint, nicht das Wort „Store"). Der Ort-Datensatz kennt seine Bilder
  nicht; die Zuordnung ist der Index `ortId` im Store `bilder`.
- **`datensicherung` arbeitet auf dem gesamten Bestand über
  `src/persistence/`**, nicht über die einzelnen Feature-Stores. Sonst wäre
  eine vollständige Sicherung von der Ladereihenfolge der Features abhängig.
  Der Store `einstellungen` gehört **nicht** zum Bestand und wird weder
  exportiert noch importiert (ADR-0006). Die Exportdatei ist ein
  ZIP-Container (`bestand.json` + `bilder/<bildId>`), der durch **dieselbe**
  Migrationskette läuft wie der Gerätespeicher (ADR-0017).
- **Genau eine Gegenrichtung von `datensicherung`**: Nach einem erfolgreichen
  Import stößt es `useOrteStore` und `useMedienStore` über deren öffentliches
  API zum **Neuladen** an — mehr nicht, keine Rückrichtung (ADR-0017 Punkt 9).
  Ohne das bliebe der `istGeladen`-Riegel der Stores auf dem Stand vor dem
  Import stehen.
- **Der Store `einstellungen` bekommt mit -003 seinen ersten Inhalt.** Der
  Zugriffsweg `src/persistence/einstellungen-repository.ts` existiert noch
  nicht und entsteht dort — generisch (Wert zu einem Schlüssel), ohne
  Kenntnis einzelner Einstellungen (ADR-0009 Punkt 4). Schlüssel:
  `orte.sortierung` (-003), `orte.tagfilter` (-004). Beide gehören dem
  Context `orte`, auch der zweite: Zuständig ist, wem die konfigurierte
  **Ansicht** gehört, nicht wem die gefilterten Daten gehören (ADR-0009).
- **Das Tag-Vokabular ist abgeleitet, nicht gespeichert** (ADR-0014): Es
  entsteht als reine Funktion über alle Orte in `src/shared/lib/`. Es gibt
  kein Tag-Register, keine referenzielle Integrität zwischen `einstellungen`
  und `orte` und keine Aufräumroutine.
- **Der Zustand „Bestand hat eine zu neue Formatversion" kommt aus
  `src/persistence/`**, nicht aus dem `orte`-Store. So können `app-shell`
  (-011) und das zweispaltige Layout (-012) darauf verzweigen, ohne aus einem
  Feature zu importieren — die Regel „`app-shell` importiert nicht aus
  `features/`" bliebe sonst nicht haltbar.
- **`app-shell` wird von niemandem importiert.** Der Weg dorthin führt über
  `src/shared/` und die globalen Stylesheets. Konkret ab -011/-012: Was
  `app-shell` **und** ein Feature brauchen, liegt in `src/shared/ui/` —
  `AdresseOhneZiel.vue` (Sammelroute in `app/` + Detailansicht in `orte`,
  ADR-0010) und `MasterDetail.vue` (zustandsloser Zweispalter, ab -012 von
  `orte`, ab -006 von `karte` genutzt, ADR-0011).
- **Der App-Rahmen kennt nur `persistence/` und `shared/`.** Er verzweigt auf
  die beiden Sperrzustände aus `src/persistence/` und rendert sonst
  Navigation und `<router-view>`; die Bereichsansichten dahinter gehören den
  Features (ADR-0010).

## Externe Abhängigkeiten (kein eigener Dienst dahinter)

Drei erlaubte Netz-Zwecke, jeder mit definiertem Ausfallpfad (ADR-0001):

- **Kartenkacheln** (`karte`) — **Leaflet** (BSD-2-Clause) auf den
  OSM-Standard-Rasterkacheln `tile.openstreetmap.org`, schlüsselfrei,
  Attribution Pflicht (ADR-0018). Kacheln werden nie precacht; Ausfall =
  leere Kachelfläche, Marker bleiben.
- **Ortssuche** (`orte`, **nicht** `karte`) — **Photon**
  (`photon.komoot.io`), schlüsselfrei, Suche beim Tippen (entprellt, ab drei
  Zeichen, ohne Standort-Bias), Anbieterwissen nur in
  `features/orte/lib/geocoding.ts` (ADR-0020, Nutzerentscheidung 2026-09-10).
  Optional und streichbar, PO-2026-09-07-008.
- **Auslieferung neuer Versionen** (`app-shell`) — generierter Service Worker
  über `vite-plugin-pwa`, Update im Prompt-Modus, kein Web-App-Manifest
  (PO-2026-09-07-007, ADR-0015). Kein Runtime-Caching für Fremd-Hosts: Die
  beiden Zwecke oben bringen ihren Ausfallpfad selbst mit.

**Netzzustand im UI** (ADR-0021): `navigator.onLine` und die
`online`/`offline`-Ereignisse sind **im Feature** erlaubt, um an der
netzabhängigen Bedienstelle einen gemuteten Hinweis zu zeigen oder einen
sichtbar fehlgeschlagenen Abruf zu wiederholen — nie für Reload, Navigation,
Toast, globalen Offline-Balken oder einen Store-Zustand. Für die
Update-Mechanik in `app-shell` bleibt ADR-0015 Punkt 6 unverändert: dort löst
ein Netzwechsel nichts aus.

## Bekannte Grenzen / bewusst nicht geteilt

- **Kein Backend, keine API-Contracts, keine Events** (ADR-0001). Es gibt in
  diesem Projekt keine `backend_contract`-Felder und keinen `backend-lead`.
- **Grundnavigation und App-Rahmen gehören PO-2026-09-07-011**, die
  Zweispaltigkeit ab großen Breiten PO-2026-09-07-012. Beides sind
  Layout-Belange, keine Datenbelange: Kein Paket vor -011 legt eigenmächtig
  einen App-Rahmen an, und weder -011 noch -012 fassen Persistenz- oder
  Zustandsschicht an. PO-2026-09-07-001 registriert lediglich die beiden
  Routen `/orte` und `/orte/:ortId`, damit -011 sie einfangen kann, statt sie
  umzubauen. **-012 ist seit dem Schnitt vom 2026-09-08 ein
  Grundlagen-Paket** (Platz 5, vor -003/-004/-005/-006), kein Nachrüster:
  Werkzeugleiste, Bilder-Raster und Karte bauen in die dort festgelegte
  Spaltenbreite hinein.
- **Bestehende Adressen sind ab -011 eingefroren**: Änderungen an
  `path`/`name` einer angelegten Route brauchen ein eigenes ADR
  (ADR-0010/0011). **Neue** Adressen sind davon nicht betroffen — `/daten`
  (-009) hängt seine flache Route und seinen Navigationseintrag selbst an;
  die Karte (-006) kommt seit ADR-0019 **ohne** beides aus und erweitert den
  Adressraum nur um den Query-Parameter `ansicht`. -007 muss in keinem der
  beiden Fälle angefasst werden: Der
  Service Worker kennt keine Routenliste, sondern beantwortet jede Navigation
  über `navigateFallback` mit dem App-Einstieg (ADR-0015 Punkt 4).
- **Kartenstil und Tile-Anbieter sind entschieden** (ADR-0018, fällig laut
  `design-concept.md` als Architektur-/Lizenzentscheidung): Leaflet mit
  OSM-Rasterkacheln, kein eigener Kartenstil, kein API-Schlüssel. Ein Wechsel
  des Anbieters ist eine ADR-Frage, keine Konfigurationsfrage — ein Anbieter
  mit Schlüssel löste ADR-0001 ab.
- **Die Karte ist kein Bereich, sondern die zweite Ansicht des Bereichs Orte**
  (ADR-0019, Nutzerentscheidung 2026-09-10): Adresse `/orte?ansicht=karte`,
  Umschalter in der Werkzeugleiste, **kein** Eintrag in der
  Bereichsnavigation, **kein** neuer Routen-Eintrag. Der Query-Parameter ist
  ab Auslieferung eingefroren wie ein Pfad. In der Kartenansicht entfällt
  `MasterDetail.vue`; Werkzeugleiste und Karte stehen über die volle
  Inhaltsbreite. Ein Marker-Klick führt nach `/orte/:ortId` (push), es gibt
  keine zweite Detailansicht und keinen zweiten Auswahl-Zustand.
- **Die Karte folgt dem Tag-Filter** (`orteGefiltert`), eingeschränkt auf
  Orte mit beiden Koordinaten (Nutzerentscheidung 2026-09-10). Die
  **Sortierung bleibt ohne Wirkung** — Marker haben keine Reihenfolge.
- **Kein persistierter Kartenausschnitt** (ADR-0019 Punkt 6): Zoom und
  Mittelpunkt sind flüchtig, der Startausschnitt ergibt sich aus den
  vorhandenen Markern. Ein gespeicherter Ausschnitt wäre eine
  Anzeigeeinstellung nach ADR-0006/0009 und braucht ein eigenes ADR.
- **Mehrere gleichzeitig geöffnete Tabs werden bewusst nicht abgefangen**
  (Nutzerentscheidung 2026-09-08, GESETZT). Nach ADR-0005 gewinnt der zuletzt
  geschriebene vollständige Datensatz; ein Tab mit veraltetem Stand kann
  Änderungen eines anderen still überschreiben. Kein `BroadcastChannel`, keine
  Schreibsperre — der Mechanismus würde sonst nirgends gebraucht. Nachrüstbar
  ohne Datenmigration, Ort der Änderung wäre `src/persistence/`.
- **Nicht verfügbarer Gerätespeicher** (Privatmodus, blockierte IndexedDB):
  vollflächige Meldung, kein Schreibversuch, App nicht benutzbar
  (Nutzerentscheidung 2026-09-08, GESETZT). Gleiches Muster wie die Meldung
  zur unbekannten, neueren Formatversion — es soll kein Bestand entstehen,
  der sich anfühlt, als wäre er gesichert.

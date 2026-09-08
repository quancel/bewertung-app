# Context Map — bewertung-app

> **Single-Writer: Nur der `architekt`-Agent aktualisiert diese Datei.**
> Alle anderen Rollen lesen sie nur.
>
> Halte sie kompakt (Faustregel: < 100 Zeilen). Sie ist ein Register,
> kein Design-Dokument — Details gehören in ADRs unter `adr/`.

- **Stand**: 2026-09-08, angelegt beim Einordnen von PO-2026-09-07-010,
  fortgeschrieben beim Einordnen von PO-2026-09-07-001 (Gerätespeicher).

**Es gibt genau ein Artefakt**: ein clientseitiges Vue-Bundle ohne
Backend-Dienst (ADR-0001). Ein „Bounded Context" ist hier deshalb ein
Feature-Modul unter `src/features/` plus seinem Ausschnitt des lokalen
Datenformats — **keine Prozess- oder Netzgrenze**. Der Ordnername ist
identisch mit dem `bounded_context` im Handoff (ADR-0002).

## Bounded Contexts

| Context | Repo/Service | Zuständigkeit (1 Satz) | Owner-Team |
|---------|--------------|------------------------|------------|
| `app-shell` | `src/app/`, `src/styles/`, `src/assets/`, `src/main.ts` | Gerüst, Design-Tokens, Schriften/Icons, Router, Offline-Auslieferung | frontend-lead |
| `orte` | `src/features/orte/` | Ort als Aggregatwurzel (Bezeichnung, Adresse, Koordinaten), Liste, Detail, Sortierung | frontend-lead |
| `bewertungen` | `src/features/bewertungen/` | Vier Achsen 0–10 je Ort, Achsen-Kommentare, Gesamtnote | frontend-lead |
| `tags` | `src/features/tags/` | Freie Tags je Ort und der Tag-Filter über die Liste | frontend-lead |
| `medien` | `src/features/medien/` | Bilder je Ort (Verkleinerung, Anzeige, Löschen) | frontend-lead |
| `karte` | `src/features/karte/` | Kartenansicht mit Markern und die optionale Ortssuche | frontend-lead |
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
  API nutzen. Das ist die **einzige** erlaubte Feature-zu-Feature-Beziehung,
  und sie zeigt ausschließlich in Richtung `orte`. Kein Rückweg: `orte`
  importiert aus keinem der drei.
- **`useOrteStore` ist der einzige Besitzer des Ort-Datensatzes im
  Arbeitsspeicher** (ADR-0008). `bewertungen` (-002) und `tags` (-004)
  bearbeiten Felder darin über sein öffentliches API und haben **keinen
  eigenen Store**; nur `medien` (-005) bekommt einen, weil es einen eigenen
  Object Store hat. Was die Ortsliste von diesen Feldern zeigt oder auswertet
  (Gesamtnote, Achsenwert, Tag-Filter), liegt als reine Funktion in
  `src/shared/lib/` und als Darstellungsbaustein in `src/shared/ui/` — nicht
  im besitzenden Feature.
- **`karte` liest Koordinaten aus `orte`** und schreibt nichts zurück; das
  Nachtragen von Koordinaten läuft über die Ort-Bearbeitung in `orte`.
- **`datensicherung` arbeitet auf dem gesamten Bestand über
  `src/persistence/`**, nicht über die einzelnen Feature-Stores. Sonst wäre
  eine vollständige Sicherung von der Ladereihenfolge der Features abhängig.
  Der Store `einstellungen` gehört **nicht** zum Bestand und wird weder
  exportiert noch importiert (ADR-0006).
- **Der Zustand „Bestand hat eine zu neue Formatversion" kommt aus
  `src/persistence/`**, nicht aus dem `orte`-Store. So können `app-shell`
  (-011) und das zweispaltige Layout (-012) darauf verzweigen, ohne aus einem
  Feature zu importieren — die Regel „`app-shell` importiert nicht aus
  `features/`" bliebe sonst nicht haltbar.
- **`app-shell` wird von niemandem importiert.** Der Weg dorthin führt über
  `src/shared/` und die globalen Stylesheets.

## Externe Abhängigkeiten (kein eigener Dienst dahinter)

Drei erlaubte Netz-Zwecke, jeder mit definiertem Ausfallpfad (ADR-0001):

- **Kartenkacheln** (`karte`) — Anbieter noch offen, Entscheidung mit
  PO-2026-09-07-006.
- **Ortssuche** (`karte`) — optional und streichbar, PO-2026-09-07-008.
- **Auslieferung neuer Versionen** (`app-shell`) — Service Worker,
  PO-2026-09-07-007.

## Bekannte Grenzen / bewusst nicht geteilt

- **Kein Backend, keine API-Contracts, keine Events** (ADR-0001). Es gibt in
  diesem Projekt keine `backend_contract`-Felder und keinen `backend-lead`.
- **Grundnavigation und App-Rahmen gehören PO-2026-09-07-011**, die
  Zweispaltigkeit ab großen Breiten PO-2026-09-07-012. Beides sind
  Layout-Belange, keine Datenbelange: Kein Paket vor -011 legt eigenmächtig
  einen App-Rahmen an, und weder -011 noch -012 fassen Persistenz- oder
  Zustandsschicht an. PO-2026-09-07-001 registriert lediglich die beiden
  Routen `/orte` und `/orte/:ortId`, damit -011 sie einfangen kann, statt sie
  umzubauen.
- **Kartenstil und Tile-Anbieter sind offen** — laut `design-concept.md`
  bewusst als Architektur-/Lizenzentscheidung dem Architekten zugewiesen,
  fällig mit PO-2026-09-07-006.
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

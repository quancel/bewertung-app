# Context Map — bewertung-app

> **Single-Writer: Nur der `architekt`-Agent aktualisiert diese Datei.**
> Alle anderen Rollen lesen sie nur.
>
> Halte sie kompakt (Faustregel: < 100 Zeilen). Sie ist ein Register,
> kein Design-Dokument — Details gehören in ADRs unter `adr/`.

- **Stand**: 2026-09-08, angelegt beim Einordnen von PO-2026-09-07-010.

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

## Schnittstellen zwischen Contexts

Nur die Beziehungen, die für Routing-Entscheidungen relevant sind — kein
vollständiges Sequenzdiagramm.

- **Alle Feature-Contexts → `src/persistence/`**: Kein Feature liest oder
  schreibt den Gerätespeicher direkt. Das ist die einzige Stelle, an der die
  Speichertechnik und die Formatversion bekannt sind.
- **`orte` besitzt die Aggregatwurzel.** `bewertungen`, `tags` und `medien`
  hängen an einer Ort-ID und dürfen den `orte`-Store über dessen öffentliches
  API **lesend** nutzen. Das ist die **einzige** erlaubte
  Feature-zu-Feature-Beziehung, und sie zeigt ausschließlich in Richtung
  `orte`. Kein Rückweg: `orte` importiert aus keinem der drei.
- **`karte` liest Koordinaten aus `orte`** und schreibt nichts zurück; das
  Nachtragen von Koordinaten läuft über die Ort-Bearbeitung in `orte`.
- **`datensicherung` arbeitet auf dem gesamten Bestand über
  `src/persistence/`**, nicht über die einzelnen Feature-Stores. Sonst wäre
  eine vollständige Sicherung von der Ladereihenfolge der Features abhängig.
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
- **Keine gemeinsame Grundnavigation registriert.** Ein elftes Paket dafür
  wird gerade geschnitten; bis dahin legt kein Paket eigenmächtig einen
  App-Rahmen oder eine Navigationsstruktur an.
- **Kartenstil und Tile-Anbieter sind offen** — laut `design-concept.md`
  bewusst als Architektur-/Lizenzentscheidung dem Architekten zugewiesen,
  fällig mit PO-2026-09-07-006.
- **Die Speichertechnik ist offen** und fällt mit PO-2026-09-07-001. Gesetzt
  ist nur die Untergrenze aus ADR-0003: Sie muss Binärdaten in unbegrenzter
  Zahl tragen (Bilder aus PO-2026-09-07-005).

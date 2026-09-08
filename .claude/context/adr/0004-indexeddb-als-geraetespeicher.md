# ADR-0004: IndexedDB als Gerätespeicher; Bestandsstruktur und Trennung von IDB-Version und SCHEMA_VERSION

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `orte`, `bewertungen`, `tags`, `medien`, `datensicherung`, `app-shell`
- **task_id**: `PO-2026-09-07-001` (Paket, in dem `src/persistence/` entsteht)

## Kontext

`src/persistence/` ist als einzige Stelle mit Gerätespeicher-Zugriff gesetzt
(ADR-0001, ADR-0002), die Speichertechnik selbst war bis hierher offen
(context-map.md). Sie fällt mit PO-2026-09-07-001, weil dort der Bestand
entsteht. Gesetzte Untergrenze aus ADR-0003: Binärdaten in unbegrenzter Zahl
(Bilder aus -005). Hinzu kommt eine Fallgrube, die nur einmal am Anfang
billig zu vermeiden ist: IndexedDB bringt eine **eigene** Datenbankversion
mit, die nichts mit der `SCHEMA_VERSION` aus ADR-0003 zu tun hat. Werden
beide vermischt, laufen die Migrationen aus ADR-0003 in
`onupgradeneeded` — einem Transaktionskontext, in dem sie keine reinen
Funktionen mehr sein können — und der Importpfad aus -009 hätte gar keine
IDB-Version auszuwerten.

## Entscheidung

1. **IndexedDB ist der Gerätespeicher**, angesprochen über die Bibliothek
   `idb` (dünner Promise-Wrapper über die native API, kein eigenes
   Datenmodell). `localStorage` ist ausgeschlossen (String-basiert, ~5 MB).
2. **Die IndexedDB-Datenbankversion beschreibt ausschließlich die Struktur**
   (welche Object Stores und Indizes existieren). Sie wird nur erhöht, wenn
   ein Object Store oder Index dazukommt, und `onupgradeneeded` legt
   **ausschließlich** Stores und Indizes an — dort wird **kein** Inhalt
   umgeschrieben.
3. **Die `schemaVersion` nach ADR-0003 beschreibt den Inhalt** und liegt als
   Feld im Datensatz `meta` (Schlüssel `bestand`). Sie ist die Version, die
   auch in der Exportdatei steht. Inhaltsmigration läuft nach dem Öffnen der
   Datenbank in `src/persistence/migrations/`, nie in `onupgradeneeded`.
4. **Object Stores zum Start** (PO-2026-09-07-001):
   - `meta` — ein Datensatz `bestand` mit `schemaVersion` und sonstigen
     bestandsweiten Angaben.
   - `orte` — ein Datensatz je Ort, Schlüssel ist die Ort-ID.
   - `einstellungen` — Gerätezustand, **nicht** Teil des Bestands (ADR-0006).
5. **Ein Ort ist ein Datensatz.** Bewertungen, Achsen-Kommentare und Tags
   (-002, -004) sind Felder dieses Datensatzes, keine eigenen Stores — sie
   sind klein, werden immer zusammen mit dem Ort gelesen und geschrieben.
6. **Binärdaten kommen nie in den Ort-Datensatz.** Bilder (-005) bekommen
   einen eigenen Object Store `bilder` (Schlüssel Bild-ID, Index auf
   `ortId`), Blobs werden nativ abgelegt, nicht als Base64. Grund: Ein
   Autosave beim Verlassen eines Textfeldes darf nicht sämtliche Fotos eines
   Ortes mit zurückschreiben.
7. **Ort-IDs sind `crypto.randomUUID()`**, keine fortlaufenden Zahlen. Der
   Import „Ergänzen" aus -009 führt Bestände zweier Geräte zusammen; mit
   fortlaufenden Zahlen kollidieren sie dabei zwangsläufig. Der sichere
   Kontext, den `crypto.randomUUID()` braucht, ist durch die Auslieferung über
   HTTPS gegeben (Nutzerentscheidung 2026-09-08, festgehalten in
   `code-conventions.md`).
8. **Löschen kaskadiert in einer Transaktion.** Das Löschen eines Ortes
   entfernt in **einer** Transaktion den Ort-Datensatz und alles, was über
   seine ID an ihm hängt. -005 erweitert die Kaskade um `bilder`, führt aber
   keine zweite Löschstelle ein.
9. **Migration läuft in genau einer Transaktion** über alle betroffenen
   Stores, am Anwendungsstart, vor dem ersten Lesezugriff eines Features.
   Damit ist die Alles-oder-nichts-Zusage aus ADR-0003 Punkt 9 technisch
   eingelöst.
10. **Eine leere Datenbank ist kein alter Bestand.** Beim allerersten Start
    wird sie mit der aktuellen `SCHEMA_VERSION` angelegt; die Migrationskette
    läuft nicht an und es erscheint keine Meldung.

## Konsequenzen

- Positiv: Binärdaten, unbegrenzte Menge, Transaktionen und ein
  auswertbarer `QuotaExceededError` (Grundlage für die Speichermangel-Meldung
  aus -005) kommen ohne eigene Konstruktion mit.
- Positiv: Die Trennung aus Punkt 2/3 hält die Migrationsschritte reine
  Funktionen und macht Gerätespeicher und Exportdatei zu genau demselben
  Format — die Voraussetzung dafür, dass -009 keinen zweiten Pfad braucht.
- Negativ/Trade-off: Eine Laufzeitabhängigkeit (`idb`) mehr. Sie ist bewusst
  die kleinstmögliche: `idb` bildet die native API ab und lässt sich ohne
  Datenmigration wieder entfernen.
- Negativ/Trade-off: Alle Zugriffe sind asynchron. Für die Ortsliste bleibt
  das unsichtbar (design-conventions.md: rein lokale Lesevorgänge zeigen
  keinen Ladezustand), erzwingt aber einen definierten Startzustand, solange
  der Bestand noch nicht geladen ist.
- Betrifft künftig: **-002 und -004** erweitern den Ort-Datensatz und erhöhen
  nur `SCHEMA_VERSION`, nicht die IDB-Version. **-005** erhöht als bisher
  einziges Paket die IDB-Version (neuer Store `bilder`) **und**
  `SCHEMA_VERSION` — beide Schritte sind getrennt zu halten. **-009** liest
  und schreibt über dieselbe Kette. **-007** darf den Gerätespeicher nicht
  mit dem Anwendungs-Cache des Service Workers verwechseln: Ein
  Versionswechsel leert Caches, niemals IndexedDB.

## Alternativen (kurz)

- **Dexie / localForage** — verworfen: Dexie bringt ein eigenes Versions- und
  Migrationsmodell mit, das mit ADR-0003 konkurriert; zwei
  Versionsbegriffe nebeneinander sind genau die Verwechslung, die Punkt 2/3
  verhindern soll. localForage verdeckt Transaktionen und Blobs hinter einer
  Key-Value-Fassade, die für Punkt 8 und 9 nicht reicht.
- **Rohe IndexedDB-API ohne Wrapper** — verworfen: Transaktionslebensdauer
  und Event-Handling sind fehleranfällig; der handgeschriebene Wrapper wäre
  Code ohne Nutzen und ohne Wartung.
- **Origin Private File System (OPFS)** — verworfen: Für strukturierte Daten
  müsste Serialisierung, Indizierung und Transaktionalität selbst gebaut
  werden.
- **Ein einziger Datensatz für den gesamten Bestand** — verworfen: Jeder
  Autosave beim Verlassen eines Feldes würde den kompletten Bestand
  inklusive aller Bilder neu schreiben.
- **Je Feature ein eigener Object Store** (`bewertungen`, `tags` getrennt) —
  verworfen: Sie werden immer gemeinsam mit dem Ort gelesen und geschrieben;
  getrennt bräuchte jeder Lesezugriff einen Join und jeder Schreibzugriff
  eine Mehr-Store-Transaktion ohne Gegenwert.

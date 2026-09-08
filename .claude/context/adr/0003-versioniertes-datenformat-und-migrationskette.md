# ADR-0003: Versioniertes lokales Datenformat mit vorwärtsgerichteter Migrationskette

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `orte`, `bewertungen`, `tags`, `medien`, `datensicherung`, `app-shell`
- **task_id**: `PO-2026-09-07-010` (Anlass: Befund des `product-owner`; die Regel
  greift ab PO-2026-09-07-001)

## Kontext

Der `product-owner` hat einen Befund an den Architekten übergeben: **Nur der
Weg nach vorn ist beschrieben, nicht der nach hinten.** PO-2026-09-07-001 und
-009 sagen beide, was bei einer **neueren** Formatversion passiert (ablehnen,
nichts überschreiben). Was bei einer **älteren** passiert, sagt kein Paket —
obwohl -002 (Achsen, Kommentare), -004 (Tags) und -005 (Bilder) das
gespeicherte Format jeweils erweitern werden.

Das ist keine theoretische Lücke. Das Gerät ist der **endgültige**
Speicherort (ADR-0001): Ein Bestand, der unter -001 entstanden ist, hat kein
Backup außer dem, was der Nutzer selbst exportiert hat. Wird er nach -004
nicht mehr gelesen, ist er weg. Und eine Exportdatei von vor drei Paketen
muss importierbar bleiben, sonst ist die Sicherung genau dann wertlos, wenn
man sie braucht.

Kein Akzeptanzkriterium fordert das derzeit.

## Entscheidung

1. **Eine ganzzahlige `schemaVersion` für den gesamten Bestand**, nicht je
   Feature. Sie steht im Gerätespeicher **und** in der Exportdatei und meint
   dort dasselbe Format. Eine Exportdatei identifiziert damit immer das
   Schema, unter dem sie geschrieben wurde.
2. **Drei Fälle beim Lesen**, überall gleich:
   - `gelesen == aktuell` → direkt verwenden.
   - `gelesen > aktuell` → ablehnen, **nichts** schreiben (Kriterium bereits
     in -001 und -009).
   - `gelesen < aktuell` → Migrationskette `vN → vN+1 → … → aktuell`
     anwenden, dann verwenden. **Ein älterer Bestand wird nie abgelehnt.**
3. **Ein Migrationsschritt ist eine reine Funktion** `(bestand) => bestand`
   ohne Zugriff auf Stores, UI, Netz oder den Speicher selbst. Eine Datei je
   Schritt unter `src/persistence/migrations/`, fortlaufend nummeriert.
4. **Ein veröffentlichter Migrationsschritt wird nie wieder geändert.** Er ist
   Historie, kein Code, den man aufräumt. Korrekturen sind ein neuer Schritt.
5. **Jede Formaterweiterung erhöht `SCHEMA_VERSION` um 1** und bringt genau
   zwei Dinge mit: einen Migrationsschritt und ein **Fixture des alten
   Formats**, gegen das ein Test die Kette ausführt. Ohne Fixture ist die
   Erweiterung nicht fertig.
6. **Neue Felder werden additiv eingeführt** — optional oder im
   Migrationsschritt mit Defaultwert belegt. Umbenennen und Entfernen sind
   erlaubt, aber ausschließlich über einen Migrationsschritt, nie durch
   Anpassen des Lesecodes.
7. **Der Import (-009) nutzt dieselbe Kette** wie der Gerätespeicher. Es gibt
   keinen zweiten Migrationspfad.
8. **Die Migrationskette ist die einzige Stelle, die altes Format kennt.**
   Feature-Code liest ausschließlich die aktuelle Form; `if (version < 3)` in
   einer Komponente oder einem Store ist ein Fehler, keine Abkürzung.
9. **Alles-oder-nichts beim Zurückschreiben.** Der migrierte Bestand wird erst
   persistiert, wenn die gesamte Kette fehlerfrei durchgelaufen ist. Schlägt
   ein Schritt fehl, bleibt der alte Bestand unverändert und die App meldet
   das nach dem Muster „unbekannte Version" aus -001.

## Konsequenzen

- Positiv: Kein Datenverlust bei Formaterweiterungen, und der Nachweis dafür
  ist ein Test statt einer Zusicherung.
- Negativ/Trade-off: Jede Erweiterung kostet einen Schritt plus Fixture. Das
  ist der Preis dafür, dass -002, -004 und -005 das Format anfassen dürfen,
  ohne den Bestand zu gefährden.
- Betrifft künftig — der Architekt trägt das beim Einordnen als `constraints`
  in die jeweiligen Pakete ein:
  - **-001**: führt `SCHEMA_VERSION`, den Bestandstyp **und die (bei v1 noch
    leere) Migrationsinfrastruktur** ein. Die Kette muss von Anfang an
    existieren; nachträglich eingeführt hilft sie bereits erzeugten Beständen
    nicht mehr — dieselbe Begründung, mit der -001 schon die
    Versionskennzeichnung fordert.
  - **-002, -004, -005**: je `SCHEMA_VERSION` +1, ein Schritt, ein Fixture.
  - **-009**: Export schreibt die Version, Import läuft durch dieselbe Kette.
  - **-005 wirkt zurück auf -001**: Bilder sind Binärdaten in unbegrenzter
    Zahl. Die in -001 gewählte Speichertechnik muss Binärdaten tragen können;
    `localStorage` (String-basiert, ~5 MB) genügt dafür nicht. Die konkrete
    Technik entscheidet -001, diese Untergrenze ist gesetzt.
- **Lücke in den Akzeptanzkriterien**: Keines der Pakete fordert die
  Rückwärts-Lesbarkeit bisher. Der `product-owner` muss in -002, -004, -005
  und -009 je ein Kriterium der Form „ein unter der Vorgängerversion
  erzeugter Bestand bzw. eine unter ihr erzeugte Exportdatei ist nach diesem
  Paket unverändert lesbar" ergänzen. Ein ADR allein macht es nicht prüfbar.

## Alternativen (kurz)

- **Je Feature eine eigene Versionsnummer** — verworfen: Export und Import
  müssten dann eine Versionsmatrix auswerten, und der Nutzer hätte eine Datei
  ohne eindeutige Identität.
- **Migration erst dann bauen, wenn sie das erste Mal gebraucht wird
  (bei -002)** — verworfen: Der unter -001 entstandene Bestand wäre der erste
  Fall und hätte dann bereits keinen Pfad.
- **Alten Bestand ablehnen statt migrieren** — verworfen: Ohne Server-Backup
  ist Ablehnen gleichbedeutend mit Datenverlust.
- **Semantische Versionierung (`2.1.0`) statt fortlaufender Ganzzahl** —
  verworfen: Der Unterschied zwischen Minor und Patch hätte hier keine
  Auswirkung; entscheidend ist allein „liegt ein Schritt dazwischen".

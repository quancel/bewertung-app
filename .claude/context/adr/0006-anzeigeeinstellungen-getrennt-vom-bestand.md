# ADR-0006: Anzeigeeinstellungen sind Gerätezustand, nicht Bestandsinhalt

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `orte`, `tags`, `datensicherung`, `app-shell`
- **task_id**: `PO-2026-09-07-001` (entschieden, weil die Struktur des Bestands hier entsteht)

## Kontext

Zwei kommende Pakete legen Einstellungen dauerhaft ab, die kein Inhalt sind:
die Sortierung der Ortsliste (-003) und die UND/ODER-Verknüpfung des
Tag-Filters (-004, ausdrücklich „eine Anzeigeeinstellung wie die
Sortierung"). Beide sollen Navigation und Neuladen überdauern. Ob sie im
Bestand liegen, entscheidet sich nicht in -003 oder -004, sondern hier: Liegen
sie im Bestand, tragen sie die `SCHEMA_VERSION` mit, brauchen bei jeder
Änderung einen Migrationsschritt samt Fixture (ADR-0003) und landen dauerhaft
in jeder Exportdatei (-009) — dort, wo laut Akzeptanzkriterium „alle Orte mit
Bewertungen, Kommentaren, Tags und Bildern" hineingehören und sonst nichts.

## Entscheidung

1. **Anzeigeeinstellungen liegen im Object Store `einstellungen`** (ADR-0004)
   und sind **nicht** Teil des Bestands.
2. **Sie tragen keine `SCHEMA_VERSION`, durchlaufen keine Migrationskette und
   werden nicht exportiert.** Der Import (-009) fasst sie nicht an.
3. **Fehlt eine Einstellung, gilt ihre Voreinstellung — ohne Meldung, ohne
   Rückfrage, ohne Migrationsschritt.** Das ist der reguläre Zustand, nicht
   ein zu reparierender. Ein Gerät, auf dem noch nie sortiert wurde, ist
   davon nicht zu unterscheiden.
4. **Jede Einstellung bringt ihre Voreinstellung mit**, an genau einer Stelle
   im Code des zuständigen Features definiert. Ein unbekannter oder
   ungültiger gespeicherter Wert (z. B. ein Sortierkriterium, das es nicht
   mehr gibt) fällt auf die Voreinstellung zurück, ebenfalls ohne Meldung.
5. **Die Abgrenzung ist inhaltlich, nicht technisch**: Was der Nutzer nach
   einer Wiederherstellung auf einem neuen Gerät zurückhaben muss, ist
   Bestand. Was er dort in einem Handgriff neu einstellen würde, ist
   Gerätezustand. Sortierung, Filterauswahl und Verknüpfung sind
   Gerätezustand; Orte, Bewertungen, Kommentare, Tags und Bilder sind
   Bestand.

## Konsequenzen

- Positiv: Die Rückwärtskompatibilitäts-Zusage aus ADR-0003 bleibt auf das
  beschränkt, was sie schützen soll. Eine neue Anzeigeeinstellung kostet
  weder Schema-Version noch Migrationsschritt noch Fixture.
- Positiv: Für -003 ist die Frage „was passiert mit einem Bestand von vor
  -003, der keine gespeicherte Sortierung hat?" damit strukturell
  beantwortet — dieselbe Antwort wie beim allerersten Start: Voreinstellung,
  stillschweigend. Ein Kriterium dafür fehlt in -003 dennoch und ist beim
  `product-owner` angemeldet.
- Negativ/Trade-off: Nach einem Import auf einem neuen Gerät ist die
  Sortierung die Voreinstellung, nicht die zuletzt benutzte. Bewusst
  hingenommen — ein Handgriff gegen dauerhafte Formatlast.
- Betrifft künftig: **-003** und **-004** legen ihre Einstellung in
  `einstellungen` ab und **nicht** in den Bestand; keines der beiden Pakete
  erhöht dafür `SCHEMA_VERSION`. **-009** exportiert `einstellungen` nicht
  und überschreibt sie beim Import nicht — auch nicht beim Import mit
  „Ersetzen". **-012** (Zweispaltigkeit) speichert nichts: Die Breite ist
  Darstellung, kein Zustand.

## Alternativen (kurz)

- **Einstellungen im Bestand und mitexportiert** — verworfen: Jede neue
  Einstellung würde die Migrationskette verlängern, und eine Exportdatei
  trüge Gerätevorlieben, die -009 nicht zusagt.
- **Einstellungen in `localStorage` statt IndexedDB** — verworfen: Es wäre
  eine zweite Speichertechnik neben der aus ADR-0004 und eine zweite Stelle,
  an der die Regel „nur `src/persistence/` spricht mit dem Gerätespeicher"
  durchgesetzt werden müsste. Der Gegenwert (synchroner Zugriff) wiegt das
  nicht auf.
- **Einstellungen nur im Arbeitsspeicher halten** — verworfen: -003 und -004
  fordern ausdrücklich, dass sie das Neuladen überdauern.

# ADR-0009: Ansichtszustand der Ortsliste gehört dem Context `orte` — und Gerätezustand darf eine Voreinstellung haben

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `orte`, `tags`, `datensicherung`
- **task_id**: `PO-2026-09-07-003` (erstes Paket mit einer gespeicherten Anzeigeeinstellung)

## Kontext

PO-2026-09-07-003 füllt den Object Store `einstellungen` aus
PO-2026-09-07-001 zum ersten Mal. Dabei treffen drei bereits getroffene
Entscheidungen aufeinander, und zwei davon widersprechen sich auf **gleicher
Rangstufe**, wenn man sie wörtlich nimmt:

- ADR-0005 und ADR-0007 verbieten den stillen Ersatzwert beim Lesen
  (`?? 0`, `|| []`) ohne Einschränkung.
- ADR-0006 Punkt 3/4 verlangt für Anzeigeeinstellungen genau das Gegenteil:
  fehlender oder ungültiger Wert → Voreinstellung, ohne Meldung.

Ein Lead, der beide liest, steht vor einem Patt aus zwei ADRs — auflösbar nur
hier. Hinzu kommt eine Zuständigkeitsfrage, die spätestens bei
PO-2026-09-07-004 hart wird: Der Tag-Filter gehört fachlich `tags`, filtert
aber die Ortsliste, die `orte` gehört. ADR-0006 Punkt 4 („Voreinstellung im
Code des zuständigen Features") sagt nicht, wer bei so einer Einstellung
„zuständig" ist, und ADR-0008 verbietet den Import in beide Richtungen
zwischen Features.

## Entscheidung

1. **Der Ansichtszustand der Ortsliste gehört dem Context `orte` und liegt in
   `useOrteStore`.** Das ist heute Sortierkriterium und Richtung (-003), ab
   -004 zusätzlich die aktiven Tags und die UND/ODER-Verknüpfung. „Zuständig"
   im Sinne von ADR-0006 Punkt 4 ist der Context, dem die **konfigurierte
   Ansicht** gehört — nicht der, dem die gefilterten Daten gehören.
2. **Der beitragende Context liefert Bedeutung und Bedienung, nicht Zustand.**
   `tags` bringt in -004 die Filterleiste (Komponenten) und das Tag-Prädikat
   (`src/shared/lib/`) mit und schaltet über das öffentliche API des
   `orte`-Stores. Es entsteht kein zweiter Ansichtszustand und kein
   Feature-zu-Feature-Import.
3. **Ein Schlüssel je Einstellung, mit Context-Präfix und strukturiertem
   Wert**: `orte.sortierung`, ab -004 `orte.tagfilter`. Nicht mehrere flache
   Schlüssel je Einstellung. Weil Einstellungen keine Migrationskette haben
   (ADR-0006), ist eine spätere Erweiterung der Wertform dadurch kostenlos:
   Die alte Form fällt beim Lesen auf die Voreinstellung zurück, mehr
   passiert nicht.
4. **Voreinstellung und Prüffunktion je Einstellung liegen an genau einer
   Stelle im besitzenden Context.** Die Persistenzschicht bleibt generisch
   (lesen/schreiben eines Wertes zu einem Schlüssel) und kennt keine
   Einstellung inhaltlich.
5. **Die Regel „kein stiller Ersatzwert beim Lesen" gilt für Bestandsdaten,
   nicht für Gerätezustand.** Sie schützt, was der Nutzer erzeugt hat und
   nicht wiederherstellen kann. Eine Sortierung ist in einem Handgriff neu
   gesetzt; dort ist die Voreinstellung die richtige Antwort und keine
   Notlösung. Damit ist der Patt aufgelöst: ADR-0005/ADR-0007 gelten für
   `meta`, `orte` und `bilder`, ADR-0006/dieses ADR für `einstellungen`.
6. **Ein fehlgeschlagenes Schreiben einer Einstellung wird dem Nutzer nicht
   gemeldet** — anders als beim Bestand (ADR-0005 Punkt 6). Es geht nichts
   verloren, was nicht in einem Tap wiederhergestellt wäre; eine Meldung in
   `--color-danger` dafür wäre Lärm. Der Fehlschlag darf die App nicht
   abbrechen.
7. **Die Voreinstellung muss ein Kriterium sein, das für jeden Ort definiert
   ist** — also Bezeichnung oder Zuletzt geändert, nie Gesamtnote und nie
   eine Einzelachse. Sonst begrüßt ein frisch installierter Bestand den
   Nutzer mit der Gruppe „ohne Bewertung". Welches der beiden es ist, ist
   eine Produktentscheidung und beim `product-owner` angemeldet; die
   Sortierlogik ist über (Kriterium, Richtung) parametrisiert und setzt
   nirgends voraus, dass es genau eine mögliche Voreinstellung gibt.
8. **Sortieren ist eine reine Ableitung** in `src/shared/lib/` (ADR-0008): Es
   liest den Bestand, schreibt nichts, verändert `geaendertAm` nicht und
   mutiert das Array des Stores nicht, sondern liefert ein neues.
9. **Die Gruppe „ohne Wert" ist Teil des Ergebnisses der Sortierfunktion,
   keine zweite Auswertung in der Ansicht.** Die Funktion liefert die
   Partition (Orte mit Wert / Orte ohne Wert für dieses Kriterium) mit.
   Andernfalls müsste die Ansicht die Regel „0 ist ein Wert, `null` nicht"
   ein zweites Mal formulieren — genau dort entstünde der Fehler, den
   ADR-0007 verhindern soll.
10. **Gleichstand wird deterministisch aufgelöst**: zuerst das gewählte
    Kriterium, dann Bezeichnung über `Intl.Collator('de')`, dann die ID.
    Ohne festen Sekundärschlüssel hinge die Reihenfolge gleicher Werte an der
    Lesereihenfolge aus IndexedDB — also an zufälligen UUIDs.

## Konsequenzen

- Positiv: -004 findet den Platz für Filter und Verknüpfung vor und muss die
  Zuständigkeit nicht neu verhandeln; „Filter, Verknüpfung und Sortierung
  wirken gleichzeitig" ist dann eine Ableitung über einen Zustand statt eine
  Abstimmung zwischen zwei Stores.
- Positiv: Der Widerspruch zwischen den Lese-Regeln ist einmal entschieden
  und nicht in jedem Paket erneut auszulegen.
- Negativ/Trade-off: `useOrteStore` trägt Domänendaten **und** Ansichtszustand.
  Das ist die Folge davon, dass es nur einen Besitzer je Datensatz gibt
  (ADR-0008); die Alternative wäre ein globaler Ansichts-Store, den
  `code-conventions.md` ausschließt. Wächst der Store unangenehm, ist die
  Trennlinie „Bestand / Ansicht" innerhalb des Contexts zu ziehen, nicht ein
  zweiter Besitzer einzuführen.
- Negativ/Trade-off: Punkt 5 ist eine echte Ausnahme von einer sonst
  ausnahmslosen Regel. Sie ist deshalb an den Object Store gebunden und nicht
  an eine Einschätzung im Einzelfall — `einstellungen` ja, alles andere nein.
- Betrifft künftig: **-004** legt `orte.tagfilter` nach denselben Regeln an.
  **-009** exportiert `einstellungen` weiterhin nicht und fasst sie beim
  Import nicht an (ADR-0006). **-012** verändert nur die Darstellung der
  Liste, nicht ihren Ansichtszustand.

## Alternativen (kurz)

- **Eigener Store je Context für dessen Ansichtszustand** (`tags` hält den
  Filter) — verworfen: Die gefilterte und sortierte Liste müsste dann aus
  zwei Stores zusammengeführt werden, und die zusammenführende Stelle läge in
  einem der beiden Features — genau der Feature-zu-Feature-Import, den
  ADR-0008 ausschließt.
- **Globaler Ansichts-Store** — verworfen: `code-conventions.md` schließt
  einen globalen App-Store aus, und er wäre ein dritter Besitzer neben
  `orte` und `medien`.
- **Anzeigeeinstellungen wie Bestandsdaten behandeln** (kein Ersatzwert,
  Migrationskette) — verworfen: ADR-0006 hat das bereits abgewogen; es würde
  jede neue Einstellung mit Schema-Version, Migrationsschritt und Fixture
  belasten.
- **Gleichstand ungelöst lassen und auf die Stabilität von `Array#sort`
  bauen** — verworfen: Stabil bezogen auf die Eingangsreihenfolge, und die
  ist die UUID-Reihenfolge aus IndexedDB. Für den Nutzer sähe das zufällig
  aus, wäre aber reproduzierbar zufällig — die unangenehmste Sorte Fehler.

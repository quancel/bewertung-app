# ADR-0016: Bilder — eigener Object Store ohne Rückverweis im Ort, Verkleinerung beim Hinzufügen, Einbindung ins Ortsdetail

- **Status**: accepted
- **Datum**: 2026-09-10
- **Bounded Context(s)**: `medien`, `orte`, `datensicherung`, `app-shell`
- **task_id**: `PO-2026-09-07-005`

## Kontext

`medien` ist der erste Context mit **eigenem** Object Store und der erste mit
Binärdaten. Vorentschieden ist bereits viel: `bilder` als eigener Store mit
Index auf `ortId`, Blobs nativ statt Base64, Kaskade beim Löschen eines Ortes
(ADR-0004 Punkt 6/8), `QuotaExceededError` als unterscheidbares Ergebnis
(ADR-0005 Punkt 6, im Code als
`{ status: 'schreiben_fehlgeschlagen', grund: 'speicher_voll' }` in
`src/persistence/orte-repository.ts`), Breitenlogik am Container (ADR-0012).

Offen sind drei Dinge, an denen -005 sonst raten müsste: ob der Ort-Datensatz
seine Bilder **kennt**, wie die Formatversion eine Sammlung erfasst, die gar
nicht im Ort-Datensatz liegt, und wie ein Baustein mit **eigenem** Store in
eine Ansicht kommt, die `orte` gehört — ADR-0013 Punkt 3 schließt das für
`bewertungen` und `tags` ausdrücklich aus.

## Entscheidung

1. **Der Ort-Datensatz bekommt kein Bildfeld — auch keine Liste von
   Bild-IDs.** Die Zuordnung existiert genau einmal, als `ortId` im
   Bild-Datensatz, ausgewertet über den Index. Eine Liste im Ort wäre eine
   zweite Wahrheit und würde jedes Hinzufügen und Löschen eines Bildes zu
   einem Schreibvorgang auf dem Ort machen — gegen dieselbe Begründung, mit
   der ADR-0004 Punkt 6 die Blobs aus dem Ort heraushält.
2. **Die Reihenfolge im Raster ist ein Feld des Bild-Datensatzes**
   (`hinzugefuegtAm`), nicht die Einfügereihenfolge des Stores. Ein
   Bild-Datensatz trägt: `id` (`crypto.randomUUID()`), `ortId`,
   `hinzugefuegtAm`, `mimeTyp`, `breite`, `hoehe` und den `blob`. Breite und
   Höhe werden beim Verkleinern ohnehin ermittelt und ersparen dem Raster,
   jedes Bild erst zu dekodieren.
3. **Zwei Versionen, getrennt erhöht** (ADR-0004 Punkt 2/3):
   `IDB_STRUKTUR_VERSION` 1 → 2 (neuer Store plus Index, `upgrade()` schreibt
   weiterhin keinen Inhalt um) **und** `SCHEMA_VERSION` 3 → 4 mit Schritt
   `migrations/004-bilder.ts` und Fixture `__fixtures__/v4-bestand.json`.
   Beide Erhöhungen gehören in dieses Paket, dürfen aber nirgends
   gleichgesetzt werden.
4. **`RohBestand` bekommt `bilder`, und zwar als optionales Feld.** Der
   Bestand ist ab v4 `meta` + `orte` + `bilder`; `src/persistence/init.ts`
   setzt ihn entsprechend zusammen und schreibt ihn in **einer** Transaktion
   über alle drei Stores zurück. Das Feld muss optional deklariert werden
   (`bilder?: unknown[]`): Die veröffentlichten Schritte `002-bewertungen.ts`
   und `003-tags.ts` deklarieren ihre Ein- und Ausgangsform lokal als
   `{ schemaVersion, orte }` und wären bei einem Pflichtfeld nicht mehr auf
   `Migrationsschritt` zuweisbar — und ADR-0003 Punkt 4 verbietet, sie
   nachträglich anzupassen. Nach dem Durchlauf der Kette ist das Feld immer
   gesetzt, weil Schritt 004 es aktiv auf `[]` setzt (dieselbe Begründung wie
   `tags: []` in Schritt 003: „keine Bilder" ist vorhanden, nicht abwesend —
   kein `?? []` beim Lesen, ADR-0005).
5. **Die Migrationskette sieht Metadaten, nie Binärinhalt.** Ein
   Migrationsschritt ist eine reine Funktion (ADR-0003 Punkt 3) und darf einen
   Blob weiterreichen, aber nicht dekodieren, umkodieren oder auf seine Größe
   prüfen. Damit bleibt der Schritt in Node testbar und der Bestand
   migrierbar, ohne dass Bilddaten durch den Arbeitsspeicher wandern.
   **Im Fixture** wird der Binärteil eines Bild-Datensatzes als kurzer
   Base64-String abgelegt, den der Test vor dem Kettenlauf in einen `Blob`
   umwandelt — Base64 ist ein Behelf der Testdatei, nie eine Form, in der ein
   Bild gespeichert oder exportiert wird (ADR-0004 Punkt 6).
6. **Verkleinert wird beim Hinzufügen, im Client, und nur wenn nötig.**
   Ablauf je Datei einzeln (kein Alles-oder-nichts über eine Mehrfachauswahl):
   `createImageBitmap(datei, { imageOrientation: 'from-image' })` →
   Zielmaße bestimmen → auf ein `OffscreenCanvas` zeichnen →
   `convertToBlob()`. `imageOrientation: 'from-image'` ist nicht optional:
   Ohne sie landen Hochformat-Aufnahmen vom Telefon gedreht im Bestand, und
   das Original, an dem man es korrigieren könnte, ist dann bereits verworfen.
   Ist die lange Kante der Vorlage bereits ≤ 2000px, wird die Datei
   **unverändert** übernommen statt neu kodiert — Neukodieren ohne
   Größenänderung kostet Qualität und Rechenzeit und gewinnt nichts.
7. **Speichermangel wird gemeldet, nicht vorhergesagt.** Es gibt keine
   Vorabprüfung über `navigator.storage.estimate()`; maßgeblich ist der
   tatsächlich fehlgeschlagene Schreibvorgang, der als
   `grund: 'speicher_voll'` zurückkommt — derselbe unterscheidbare Fall, den
   `orte-repository.ts` heute schon liefert. `estimate()` liefert absichtlich
   grob gerundete Werte und wäre entweder zu früh alarmierend oder zu spät.
   Ein gescheitertes Bild hinterlässt keinen halben Datensatz: Schreiben und
   Sichtbarwerden im Raster sind dieselbe Reihenfolge, nicht zwei.
8. **Die Kaskade wird erweitert, nicht dupliziert.** `loescheOrt(id)` in
   `src/persistence/orte-repository.ts` löscht ab -005 in **einer**
   Transaktion über `orte` und `bilder` den Ort und alle Bilder mit dieser
   `ortId` (ADR-0004 Punkt 8). Es entsteht keine zweite Löschstelle in
   `bilder-repository.ts` und keine im `medien`-Store.
9. **`medien` bekommt einen eigenen Pinia-Store und importiert nichts aus
   `features/orte/`.** Er hält die Bilder je `ortId`, kennt den Ort selbst
   nicht und liest Typen ausschließlich über `persistence/schema.ts`. Das ist
   die Bedingung, unter der Punkt 10 zyklenfrei bleibt.
10. **`Ortebereich.vue` (`orte`) darf den Bilderbereich aus `medien`
    importieren, obwohl dieser einen Store anfasst.** ADR-0013 Punkt 3
    schließt genau das für Komponenten aus, die **den `orte`-Store** anfassen
    — begründet allein mit dem Import-Zyklus, den das erzeugen würde. Der
    Bilderbereich fasst seinen **eigenen** Store an und importiert nichts aus
    `orte` (Punkt 9); der Zyklus, den ADR-0013 verhindert, entsteht hier
    nicht. `medien` exportiert dafür **genau einen** solchen Baustein
    (`features/medien/components/Bilderbereich.vue`, Prop `ortId`); alles
    weitere darunter (Raster, Kachel, Speichermangel-Banner) bleibt
    store-frei. Die Erlaubnis ist an Punkt 9 gebunden und endet, sobald
    `medien` etwas aus `orte` importiert.
11. **Objekt-URLs werden freigegeben.** Ein Blob wird für die Anzeige über
    `URL.createObjectURL` eingebunden und beim Entfernen der Kachel bzw. beim
    Verlassen des Ortes mit `URL.revokeObjectURL` wieder freigegeben. Ohne das
    wächst der Speicherbedarf bei jedem Ortswechsel — in einer App, die
    ausdrücklich unbegrenzt viele Bilder erlaubt, ist das kein Randfall.

## Konsequenzen

- Positiv: Autosave am Ort bleibt billig — ein Feldwechsel schreibt weiterhin
  einen kleinen Datensatz ohne jeden Bildbezug (ADR-0005).
- Positiv: Punkt 4/5 machen den Bestand ab v4 vollständig durch dieselbe Kette
  migrierbar, ohne dass ein Migrationsschritt Binärdaten anfasst — die
  Voraussetzung dafür, dass -009 keinen zweiten Pfad braucht (ADR-0003
  Punkt 7).
- Negativ/Trade-off: Punkt 10 macht ADR-0013 Punkt 3 erklärungsbedürftig. Die
  Regel dort bleibt für `bewertungen` und `tags` unverändert gültig; sie war
  nie eine Regel gegen Stores, sondern eine gegen Zyklen.
  `code-conventions.md` gab sie bisher zu weit wieder („importiert die
  Komponente **einen** Store") — die Zeile wird mit diesem ADR auf den
  ADR-Wortlaut zurückgeführt.
- Negativ/Trade-off: Die Verkleinerung läuft auf dem Hauptthread. Bei
  mehreren großen Dateien ist das spürbar; die `design_notes` sehen dafür
  einen Platzhalterzustand vor. Ein Web Worker ist nachrüstbar, ohne dass
  sich Datenformat oder Store ändern — er wird nicht vorsorglich gebaut.
- Betrifft künftig: **-009** exportiert und importiert `orte` **und**
  `bilder` und stößt nach dem Import beide Stores zum Neuladen an (ADR-0017).
  **-007** wird bei der Abnahme von -005 erneut geprüft: sein Kriterium
  „nach einem Versionswechsel sind auch die Bilder unverändert vorhanden"
  war zu seiner Zeit nicht prüfbar, weil es keine Bilder gab.

## Alternativen (kurz)

- **Liste der Bild-IDs im Ort-Datensatz** — verworfen: zweite Wahrheit neben
  dem Index, und jedes Hinzufügen eines Bildes würde den Ort schreiben.
- **Bilder als Base64 im Ort-Datensatz** — verworfen: ADR-0004 Punkt 6; ~33 %
  Aufschlag und ein vollständiges Zurückschreiben aller Fotos bei jedem
  Feldwechsel.
- **Eigener Object Store, aber Migration der Bilder ausgelassen** —
  verworfen: Der Bestand wäre dann nur teilweise versioniert, und eine
  Exportdatei aus -009 könnte ihre Bilder nicht mehr eindeutig einem Format
  zuordnen.
- **Vorabprüfung des freien Speichers über `navigator.storage.estimate()`** —
  verworfen: absichtlich grob gerundet; erzeugt entweder falschen Alarm oder
  meldet zu spät. Der echte Fehlschlag ist bereits als Ergebnis vorhanden.
- **`medien`-Store in `orte` anbinden und ein store-freies Raster
  importieren** — verworfen: verlegt die Logik eines Contexts in die Ansicht
  eines anderen und verstößt gegen die Einbahnstraße für Zustand und Logik
  (context-map.md), statt sie einzuhalten.
- **Bilderbereich nach `src/shared/ui/`** — verworfen: genau ein Nutzer;
  `shared/ui/` ist keine Umgehung der Import-Richtung (ADR-0013 Punkt 6).

# Persistenz und Formatversion (ADR-0003/0004)

> Themendatei von `.claude/context/code-conventions.md` (Abschnitt „Persistenz
> und Formatversion" mit „Migrationsschritte" und „Lesen und Schreiben").
> Single-Writer: `architekt`. Maßgeblich ist dieser Wortlaut samt Ausnahmen,
> nicht die Kurzzeile im Register.

## Formatversion und Speicher

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

## Migrationsschritte

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

## Lesen und Schreiben (ADR-0005)

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
- **Dasselbe Muster für die eigenen Gewichte** (ADR-0037): Das Gate sind
  reine Funktionen in `features/orte/lib/gewichtung.ts` (klemmen 0–10,
  runden, die letzte zählende Achse bleibt auf 1). Einziger Schreibpfad ist
  `useOrteStore.setzeEigenesGewicht(achse, roh)`, über ihn laufen Regler und
  Zahlenfeld. `eigeneGewichte` ist additiv in `OrteGewichtung`, gelesen
  über `liesOrteGewichtung()`. Ungültiges fällt auf die Erstbelegung
  zurück.
- **Freitext mit Zeichenobergrenze und ohne Zeilenumbruch** (erstmals
  Anfangsnotiz, PO-2026-09-27-002; UI-Seite: `design-conventions.md`
  „Kurztextfeld mit Zeichenobergrenze"). Die Regel ist **eine** reine
  Funktion in `features/<context>/lib/`: Läufe von Zeilenumbruchzeichen
  werden zu einem Leerzeichen, dann wird auf die Grenze gekürzt, ohne ein
  Surrogatpaar zu zerschneiden. Leer oder nur Leerraum wird zu `null`.
  „Zeichen" ist die UTF-16-Codeeinheit (`String.length`), also dieselbe
  Zählung wie bei `maxlength` und beim Zähler. Das **Gate sitzt im
  Store-Setter** des besitzenden Contexts. Das Feld ist per Typ aus
  `aktualisiereFeld` ausgenommen, damit es keinen zweiten Pfad ohne Gate
  gibt (Struktur statt Konvention). `maxlength` ist Komfort und nicht das
  Gate. Die Komponente ruft dieselbe Funktion auf, um das DOM nachzuziehen,
  schreibt aber nur zurück, wenn sich der Text dadurch ändert (Caret, IME).
  Der Import übernimmt den Wert unverändert, ohne Normalisierung und ohne
  Kürzung. Ein Datenstand ohne das Feld (ältere Container-Version) bekommt
  `null`.
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
- **Der Schreibweg eines inline bearbeiteten Datensatzes schickt `put()` ohne
  Task-Grenze ab und committet danach ausdrücklich** (ADR-0031 Punkt 2,
  `tx.commit()` mit Laufzeitprüfung). Er läuft auch aus `pagehide` heraus;
  ohne `commit()` braucht der Auto-Commit einen Rückweg ins Dokument, den es
  beim Entladen nicht mehr gibt. Vor dem `put()` steht deshalb kein `await`
  auf etwas anderes als die gecachte Verbindung. Zugesichert ist das
  Ankommen trotzdem nur, solange das Dokument weiterlebt.
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
  Context-Präfix (`orte.sortierung`, `orte.tagfilter`, `orte.gewichtung`).
  Eine Wertform wird additiv erweitert. Die Prüffunktion akzeptiert den
  älteren Stand und füllt fehlende Teile mit der Voreinstellung. Fehlt eine,
  gilt die Voreinstellung — ohne Meldung; ein fehlgeschlagenes Schreiben
  bricht nichts ab.
- **Export/Import**: Bestand als Einheit in `persistence/bestand-repository.ts`
  (lesen, ersetzen, ergänzen — je eine Transaktion, ausdrückliches Ergebnis).
  Ein-/Auspacken in `features/datensicherung/lib/`, **`fflate` nur dort**.
  `persistence/` kennt kein Dateiformat, `datensicherung` kein IndexedDB.

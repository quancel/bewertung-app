# ADR-0017: Export-/Import-Container, Zusammenführungsregeln und der Bereich Daten

- **Status**: accepted
- **Datum**: 2026-09-10
- **Bounded Context(s)**: `datensicherung`, `orte`, `medien`, `app-shell`
- **task_id**: `PO-2026-09-07-009`

## Kontext

Die Sicherung liegt beim Nutzer (ADR-0001), und ADR-0003 sagt zu, dass
**jede je erzeugte Exportdatei dauerhaft lesbar** bleibt. Die erste
Exportdatei entsteht mit diesem Paket — es ist damit der letzte Zeitpunkt, zu
dem das Dateiformat noch frei wählbar ist. Danach ist jede Entscheidung hier
für immer mitzuschleppen.

Zu klären ist, wie „eine Datei inklusive Bilder" aussieht (Bilder sind
Binärdaten in unbegrenzter Zahl, ADR-0004/ADR-0016), wie „Ergänzen" zwei
Bestände zusammenführt, und wo der neue Bereich „Daten" hängt — er ist der
erste Bereich, der nach dem Einfrieren des Adressraums (ADR-0010/0011) eine
Adresse ergänzt.

## Entscheidung

1. **Die Exportdatei ist ein ZIP-Container** mit `bestand.json` an der Wurzel
   und je Bild einem Eintrag `bilder/<bildId>`. Gepackt wird mit `fflate`
   (klein, abhängigkeitsfrei); die Bildeinträge werden **ohne Kompression**
   abgelegt (`level: 0`) — sie sind bereits komprimiert, und ein zweiter
   Durchgang kostet nur Rechenzeit.
2. **Kein Base64.** Der naheliegende Weg — eine JSON-Datei mit
   eingebetteten Bildern — ist verworfen: Er bläht die Sicherung um rund ein
   Drittel auf und zwingt Export wie Import, den **gesamten** Bestand als
   einen einzigen JS-String im Arbeitsspeicher zu halten. Bei einer Sammlung
   aus einigen hundert 2000px-Fotos ist das der Moment, in dem die Sicherung
   auf genau dem Telefon scheitert, für das sie gedacht ist. „Eine Datei"
   bleibt gewahrt: Ein ZIP ist eine Datei.
3. **`bestand.json` trägt zwei Kennzeichen und keine dritte Versionszahl**:
   `formatKennung: 'bewertung-app-bestand'` und `schemaVersion` — dieselbe
   Zahl wie im Gerätespeicher, mit derselben Bedeutung (ADR-0003 Punkt 1).
   Es gibt keine eigene Container-Version: Ein späterer Containerwechsel ist
   an der Struktur erkennbar, eine zweite Zahl daneben wäre genau die
   Versionsmatrix, die ADR-0003 verworfen hat.
4. **Die Datei läuft durch dieselbe Migrationskette wie der
   Gerätespeicher** (ADR-0003 Punkt 7). Reihenfolge beim Import, ohne
   Abkürzung: entpacken → `bestand.json` lesen und prüfen → Bildeinträge zu
   `Blob`s zusammensetzen → daraus einen `RohBestand`
   (`{ schemaVersion, orte, bilder }`) bauen, der **formgleich** mit dem des
   Gerätespeichers ist → `wendeMigrationsketteAn` → erst danach schreiben.
   Die Kette sieht nie einen Dateinamen und nie einen Pfad; ein
   Migrationsschritt bleibt eine reine Funktion (ADR-0016 Punkt 5).
5. **Vor dem ersten Schreibzugriff steht das vollständige Ergebnis fest.**
   Fehlender oder falscher `formatKennung`, kaputtes ZIP, unlesbares JSON,
   fehlendes `schemaVersion`, ein Bildeintrag ohne Metadatensatz (oder
   umgekehrt) → Abbruch **ohne** jeden Schreibvorgang. Eine zu neue
   `schemaVersion` ist ein eigener, unterscheidbarer Ausgang neben
   „nicht lesbar" — die beiden tragen im UI verschiedene Texte, also auch im
   Ergebnis der Persistenzschicht verschiedene Fälle.
6. **„Ersetzen" leert `orte` und `bilder` in einer Transaktion** und schreibt
   den importierten Bestand samt `meta.schemaVersion` darin. Der Store
   `einstellungen` wird **nicht** angefasst — er gehört nicht zum Bestand,
   wird nicht exportiert und darf durch einen Import nicht verschwinden
   (ADR-0006). Sortierung und UND/ODER-Verknüpfung überleben einen Import.
7. **„Ergänzen" führt über die UUIDs zusammen** (ADR-0004 Punkt 7). Bei
   gleicher Ort-ID in Datei und Bestand gilt: **der bestehende Ort bleibt
   unverändert, der Ort aus der Datei wird übersprungen** — „Ergänzen"
   verspricht ausdrücklich „bestehende Orte bleiben", und nur diese Lesart
   macht die Aktion frei von Datenverlust. Die Bilder eines übersprungenen
   Ortes werden mit übersprungen; es entsteht kein Bild ohne Ort.
   **Die gemeldete Anzahl ist die Zahl der tatsächlich übernommenen Orte**,
   nicht die Zahl der Orte in der Datei.
8. **Der Bestand wird in `src/persistence/` geschrieben, der Container in
   `features/datensicherung/` gepackt.** Neu entsteht
   `src/persistence/bestand-repository.ts` mit dem vollständigen Bestand als
   Einheit (lesen, ersetzen, ergänzen — je in einer Transaktion, als
   ausdrückliches Ergebnis). Das Ein- und Auspacken des ZIP liegt in
   `features/datensicherung/lib/`; `fflate` wird **nur** dort importiert.
   Damit bleibt `persistence/` frei von Kenntnis über das Dateiformat, und
   `datensicherung` frei von Kenntnis über IndexedDB.
9. **`datensicherung` darf `orte` und `medien` zum Neuladen anstoßen — nur
   das.** Der Import verändert den Gerätespeicher unter den bereits geladenen
   Stores hinweg; `useOrteStore` lädt heute wegen seines `istGeladen`-Riegels
   kein zweites Mal (`sicherstellenGeladen`). Beide Stores bekommen deshalb
   im öffentlichen API ein ausdrückliches Neuladen, das `datensicherung` nach
   einem erfolgreichen Import aufruft. Das ist eine **neue
   Context-Beziehung**, bewusst schmal: eine Einbahnstraße, ein Aufruf, keine
   Rückrichtung, kein gemeinsamer Zustand, kein Import von `datensicherung`
   in `orte` oder `medien`. Ein voller Seitenreload wäre die Alternative — er
   ist durch das Kriterium „ohne Neuladen der Seite erkennbar" ausgeschlossen.
10. **Der Bereich Daten bringt seine Adresse selbst mit**: eine flache Route
    `/daten` (Name `daten`) als Eintrag **vor** der Sammelroute in
    `src/app/router/routes.ts`, dazu ein angehängter — nicht eingefügter —
    Eintrag im Bereichsregister von `Bereichsnavigation.vue` (ADR-0010
    Punkt „-006 und -009 hängen ihren Bereichseintrag in dieselbe
    Navigationsebene"). Der Bereich ist **einspaltig** und benutzt
    `MasterDetail.vue` nicht (ADR-0011). Der Service Worker aus ADR-0015 wird
    dafür nicht angefasst: Sein `navigateFallback` kennt keine Routenliste.

## Konsequenzen

- Positiv: Die Sicherung bleibt in Größe und Speicherbedarf nahe am
  Rohbestand; das Format ist mit jedem Packprogramm inspizierbar, was bei
  einer Datei, die der Nutzer allein verwahrt, mehr wert ist als ein
  kompaktes Eigenformat.
- Positiv: Punkt 4 hält die Zusage aus ADR-0003 Punkt 7 wörtlich ein — es gibt
  genau eine Migrationskette, und die Fixtures v1/v2/v3 (und ab -005 v4)
  decken Gerätespeicher und Exportdatei zugleich ab.
- Negativ/Trade-off: Eine Laufzeitabhängigkeit (`fflate`) mehr, und der
  Container ist ab der ersten ausgelieferten Version unkündbar — eine spätere
  Umstellung müsste den ZIP-Weg zum Lesen dauerhaft behalten (ADR-0003).
- Negativ/Trade-off: Punkt 7 lässt einen Nutzer, der einen Ort auf beiden
  Geräten geändert hat, ohne Zusammenführung stehen — die Datei verliert. Das
  ist gewollt: Zusammenführen je Feld wäre Sync, und Sync ist ein
  ausdrückliches Nicht-Ziel (ADR-0001). „Ersetzen" bleibt der Weg, wenn die
  Datei gewinnen soll.
- Negativ/Trade-off: Punkt 9 durchbricht die bisher ausnahmslose Regel
  „Features importieren einander nicht" ein zweites Mal (nach ADR-0013). Sie
  ist auf das Neuladen begrenzt und in `code-conventions.md` und
  `context-map.md` mitgeführt.
- Betrifft künftig: **-006** hängt seinen Bereichseintrag nach demselben
  Muster an. **Jedes** Paket, das `SCHEMA_VERSION` erhöht, erweitert damit
  automatisch auch das Exportformat und muss prüfen, ob sein neuer Anteil
  binär ist — dann gehört er als eigener ZIP-Eintrag daneben, nicht in
  `bestand.json`.

## Alternativen (kurz)

- **Eine JSON-Datei mit Base64-Bildern** — verworfen: rund ein Drittel
  Aufschlag und der gesamte Bestand als ein String im Arbeitsspeicher, genau
  dann, wenn er am größten ist.
- **Zwei Dateien (JSON plus Bilderarchiv)** — verworfen: Die
  Nutzerentscheidung vom 2026-09-07 nennt ausdrücklich **eine** Datei; zwei
  Dateien gehen beim Verwahren auseinander.
- **Eigenes Binärformat mit selbstgebautem Rahmen** — verworfen: Wir wären
  für immer der einzige Leser einer Datei, die der Nutzer allein aufbewahrt.
- **Bei gleicher Ort-ID die Datei gewinnen lassen** — verworfen: „Ergänzen"
  würde dann still Bestehendes überschreiben, obwohl die Aktion im UI das
  Gegenteil zusagt; für „Datei gewinnt" gibt es „Ersetzen".
- **Bei gleicher Ort-ID eine neue ID vergeben und beides behalten** —
  verworfen: erzeugt beim Import der eigenen Sicherung lautlos den doppelten
  Bestand — der wahrscheinlichste Fehlbedienungsfall überhaupt.
- **Seitenreload nach dem Import statt Punkt 9** — verworfen: Das Kriterium
  fordert die Bestätigung ohne Neuladen, und ein Reload direkt nach einem
  Schreibvorgang ist der unangenehmste Zeitpunkt dafür.

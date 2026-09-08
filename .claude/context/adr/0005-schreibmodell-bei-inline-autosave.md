# ADR-0005: Schreibmodell bei Inline-Autosave — vollständiger Datensatz aus dem Speicher, ohne Entprellung

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `orte`, `bewertungen`, `tags`, `medien`, `app-shell`
- **task_id**: `PO-2026-09-07-001`

## Kontext

Die Design-Vorgabe für PO-2026-09-07-001 kennt keinen Bearbeiten-Modus: Felder
sind inline editierbar, gespeichert wird beim Verlassen des Feldes, es gibt
keine sichtbare Erfolgsmeldung (design-conventions.md, Zustand „Erfolg").
Damit ist der Schreibvorgang **unsichtbar** — der Nutzer hat keinen Anhalt,
ob etwas angekommen ist, und keine zweite Chance. Gleichzeitig gibt es keinen
Server, der einen verlorenen Schreibvorgang später nachholen könnte
(ADR-0001). Drei Situationen entscheiden deshalb über Datenverlust:
schnelle Feldwechsel hintereinander, das Verlassen der Detailansicht und das
Schließen von Tab oder Browser während des Tippens.

## Entscheidung

1. **Der Pinia-Store ist die Wahrheit im Arbeitsspeicher.** Persistiert wird
   der **vollständige, aktuelle** Ort-Datensatz aus dem Store — nie ein
   Lesen-Ändern-Zurückschreiben gegen die Datenbank. Damit trägt jeder
   Schreibvorgang bereits alle bis dahin geänderten Felder, und ein
   überholender Schreibvorgang kann keinen früheren zurückdrehen.
2. **Keine Entprellung vor dem Schreiben.** Der Schreibvorgang wird im
   auslösenden Ereignis angestoßen, nicht nach einer Wartezeit. Ein
   Entprell-Fenster ist genau das Zeitfenster, in dem ein Tab-Schluss die
   Eingabe verliert.
3. **Schreibvorgänge je Ort-ID werden serialisiert.** Läuft für eine ID
   bereits ein Schreibvorgang, wird der nächste angehängt; sind mehrere
   angestaut, wird nur der jeweils letzte Stand geschrieben. Nebenläufige
   Schreibvorgänge auf denselben Datensatz gibt es nicht.
4. **Ein Ort wird in genau einer Transaktion geschrieben.** Es gibt keinen
   Zustand, in dem ein Ort halb geschrieben in der Datenbank steht.
5. **Vier Auslösepunkte, alle gleichwertig:**
   - Verlassen des Feldes (Text) bzw. Wertänderung (Zahl/Auswahl),
   - Verlassen der Route (Navigation weg von der Detailansicht),
   - `visibilitychange` auf `hidden`,
   - `pagehide`.

   Die letzten drei sind keine Zusatzsicherung, sondern der Normalfall für
   „Tab geschlossen, ohne vorher irgendwohin zu klicken": `blur` ist dort
   nicht verlässlich, `visibilitychange`/`pagehide` sind es.
6. **Ein fehlgeschlagener Schreibvorgang ist sichtbar.** Die
   Persistenzschicht gibt Schreibfehler als ausdrückliches Ergebnis zurück,
   mit unterscheidbarem Fall „Speicher voll" (`QuotaExceededError`); sie
   werden nicht verschluckt und nicht nur protokolliert. Angezeigt werden sie
   nach design-conventions.md, Zustand „Fehler" (ruhige, nicht-modale
   Inline-Meldung in `--color-danger`). Die Regel „Autosave hat keine
   sichtbare Bestätigung" gilt für den **Erfolg**, nicht für den Fehlschlag —
   ein stiller Fehlschlag wäre unbemerkter Datenverlust.
7. **Kein Warteschlangen- oder Sync-Zustand im UI.** Punkt 6 meldet einen
   fehlgeschlagenen lokalen Schreibvorgang, kein Aufschieben. Es gibt nichts,
   das später erneut versucht wird (ADR-0001).

## Konsequenzen

- Positiv: Schnelle Feldwechsel sind unkritisch, weil jeder Schreibvorgang
  den vollen aktuellen Stand trägt.
- Positiv: Der einzige Weg, eine Eingabe zu verlieren, ist ein Tab-Schluss
  im selben Moment, in dem die Transaktion läuft — nicht das Fehlen eines
  Auslösers.
- Negativ/Trade-off: Es wird mehr geschrieben als nötig (ganzer Datensatz je
  Feldwechsel). Das ist tragbar, weil Ort-Datensätze klein sind und
  Binärdaten nach ADR-0004 gar nicht darin liegen.
- Negativ/Trade-off: Punkt 1 macht **mehrere gleichzeitig geöffnete Tabs**
  zum bewusst hingenommenen Risiko: Der Store eines Tabs kennt Änderungen des
  anderen nicht und überschreibt sie beim nächsten vollständigen
  Schreibvorgang still. **Dagegen wird nichts unternommen — vom Nutzer am
  2026-09-08 so entschieden**, weil der Mechanismus sonst nirgends gebraucht
  würde und die Lage (ein Nutzer, ein Gerät, kein Sync) sie selten macht.
  Wird das später anders entschieden, ist der Ort der Änderung die
  Persistenzschicht (Benachrichtigung über `BroadcastChannel`), nicht die
  Features; eine Datenmigration braucht es dafür nicht.
- Betrifft künftig: **-002** (Achsen, Kommentare), **-004** (Tags) und
  **-005** (Bilder) schreiben über denselben Weg und führen keine eigenen
  Auslöser, keine Entprellung und keinen eigenen Fehlerpfad ein. **-007**
  darf keinen erzwungenen Reload auslösen — die Design-Vorgabe dort nennt
  genau diesen Grund bereits. **-012** öffnet Liste und Detail gleichzeitig;
  der Auslösepunkt „Verlassen der Route" entfällt dort teilweise, die
  übrigen drei bleiben unverändert gültig.

## Alternativen (kurz)

- **Entprelltes Speichern (z. B. 500 ms nach der letzten Eingabe)** —
  verworfen: spart Schreibvorgänge, die nicht knapp sind, und erkauft das mit
  einem Zeitfenster für Datenverlust.
- **Lesen-Ändern-Zurückschreiben je Feld** — verworfen: erzeugt genau die
  Wettlaufsituation bei schnellen Feldwechseln, die Punkt 1 ausschließt.
- **Ein einzelnes Feld statt des ganzen Datensatzes schreiben** — verworfen:
  IndexedDB kennt keine Teilaktualisierung eines Datensatzes; es liefe auf
  Lesen-Ändern-Zurückschreiben hinaus.
- **Explizite Speichern-Schaltfläche** — verworfen: widerspricht den
  `design_notes` von -001 und der Setzung „keine Zustandsmaschine, keine
  Entwurfsstufen".
- **`beforeunload` als Auslöser** — verworfen: erzwingt in mehreren Browsern
  einen Bestätigungsdialog beim Verlassen und ist für asynchrone
  Schreibvorgänge unzuverlässiger als `pagehide`/`visibilitychange`.

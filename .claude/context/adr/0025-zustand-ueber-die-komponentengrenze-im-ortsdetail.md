# ADR-0025: Zustand über die Komponentengrenze im Ortsdetail — Ortssuche meldet ihren wirksamen Zustand, die Sichtbarkeit rastet an der Ort-ID ein

- **Status**: accepted
- **Datum**: 2026-09-12
- **Bounded Context(s)**: `orte`
- **task_id**: `PO-2026-09-12-005`

## Kontext

PO-2026-09-12-005 macht die Koordinatenfelder zum Notnagel: sichtbar, sobald
eine Koordinate hinterlegt ist **oder** die Ortssuche in einem ihrer drei
erfolglosen Zustände steht **oder** der Nutzer den Reveal-Button gedrückt
hat. Der letzte Auslöser ist neu, die ersten beiden existieren bereits — aber
an zwei verschiedenen Orten:

- `breite`/`laenge` liegen im Ort-Datensatz, den `useOrteStore` besitzt
  (ADR-0008); die View liest sie ohnehin.
- Der Suchzustand liegt **in** `features/orte/components/Ortssuche.vue`. Die
  Komponente ist präsentational, kennt keinen Store und meldet heute
  ausschließlich einen übernommenen Treffer per Emit (ADR-0013 Punkt 3,
  ADR-0020 Punkt 1).

Der `ux-ui-designer` hat das ausdrücklich offen gelassen: „Wie genau
Ortssuche.vue diesen kombinierten Zustand nach außen meldet, ist Sache von
Architekt/Frontend-Lead."

Dazu kommt ein Randfall, den `design-conventions.md` („Bedingt sichtbare
Formularabschnitte") bereits benennt und den Kriterium 9 des Pakets prüfbar
macht: Ab `lg` wechselt die Detailspalte von Ort A direkt zu Ort B, **ohne
zu schließen** (ADR-0011). `Ortebereich.vue` ist für beide Adressen dieselbe
Komponenteninstanz — ein Wechsel ist dort ein Update, kein Unmount (siehe
Modulkommentar der Datei, `onBeforeRouteUpdate`). Alles, was als gewöhnlicher
`ref` in der View oder als Instanzzustand in `Ortssuche.vue` liegt, überlebt
diesen Wechsel: der eingetippte Suchtext, der letzte Suchzustand und ein
aufgeklappter Abschnitt von Ort A würden bei Ort B weitergelten.

Die naheliegenden Antworten sind beide falsch: Der Zustand in einen Store zu
heben widerspricht der Vorgabe (kein Schlüssel in `einstellungen`, keine
Persistenz, ADR-0006/0009); ihn bei jedem `ortId`-Wechsel per Watcher
zurückzusetzen ist eine Sonderbehandlung, die genau dann ausfällt, wenn
jemand später einen zweiten Zustand danebenstellt und den Reset vergisst.

## Entscheidung

1. **`Ortssuche.vue` bleibt präsentational und bekommt keinen Store.**
   Sie meldet ihren Zustand zusätzlich per **Emit** nach außen — der übliche
   Rückweg einer Komponente (`code-conventions.md`), derselbe wie beim
   übernommenen Treffer.
2. **Gemeldet wird der *wirksame*, also der tatsächlich angezeigte
   Hinweiszustand**, nicht der rohe Client-Zustand und nicht ein
   vorverdichteter Wahrheitswert. Die Unterscheidung ist dieselbe wie in
   ADR-0020 Punkt 4 (Treffer · keine Treffer · kein Netz ·
   Fehler/Zeitüberschreitung, dazu „lädt"/„inaktiv"). Ein Wahrheitswert
   „erfolglos" wäre eine zweite, redundante Kodierung derselben Information
   und könnte von dem abweichen, was der Nutzer liest; -003 rendert genau
   diese vier Zustände sichtbar, -004 prüft sie im Rauchtest. Welcher der
   Zustände die Felder einblendet, entscheidet die View.
3. **Die Sichtbarkeit ist eine einrastende Kennung, die die Ort-ID trägt.**
   In `Ortebereich.vue` liegt genau **ein** Zustand — die ID des Ortes, für
   den der Abschnitt aufgeklappt ist (`null`, solange keiner). Jeder der drei
   Auslöser setzt sie auf die aktuelle `ortId`; sichtbar ist der Abschnitt,
   wenn die Kennung mit der geöffneten `ortId` übereinstimmt **oder** für
   diesen Ort eine Koordinate hinterlegt ist (`breite !== null ||
   laenge !== null`, geprüft gegen `null`, nicht gegen den Wahrheitswert —
   `0` ist eine gültige Koordinate, ADR-0020 Punkt 6).
   Daraus folgt beides ohne Zusatzregel: „einmal sichtbar bleibt sichtbar"
   (die Kennung wird nie zurückgenommen) und „bei Ort B gilt nur dessen
   eigener Zustand" (die Kennung von Ort A stimmt dort nicht überein).
   **Kein Watcher, kein Reset, keine Sonderbehandlung des Wechsels.**
4. **Dasselbe gilt für jeden weiteren Zustand, der diese Komponentengrenze
   verlässt**: Er trägt die Ort-ID, zu der er gehört, und gilt nur bei
   Übereinstimmung. Ein Zustand ohne diese Bindung ist im Ortsdetail ein
   Fehler, kein Stilfrage.
5. **Instanzzustand wird durch Remount frisch, nicht durch Zurücksetzen.**
   `Ortssuche.vue` wird mit `:key` auf der `ortId` eingebunden. Damit gehen
   Eingabetext, laufende Anfrage, Unterdrückung und Client-Zustand beim
   Wechsel Ort A → Ort B strukturell verloren, statt einzeln zurückgesetzt zu
   werden — „im Suchfeld steht keine Eingabe von Ort A" ist dann keine
   Prüfung, sondern eine Eigenschaft. Der `AbortController` und
   `onBeforeUnmount` aus ADR-0020 Punkt 3 räumen dabei wie bisher auf.
   Die Quelle des Keys ist `route.params.ortId`; es entsteht **kein** zweiter
   Auswahl-Zustand (ADR-0011 Punkt 4).
6. **Kein Store, keine Persistenz, keine Formatänderung.** Der aufgeklappte
   Zustand ist ausdrücklich **keine** Anzeigeeinstellung nach ADR-0006/0009:
   kein Schlüssel im Object Store `einstellungen`, keine `model/ansicht.ts`,
   kein Eintrag in `code-conventions.md` unter „Neue Anzeigeeinstellung".
   `breite`/`laenge` existieren seit PO-2026-09-07-001; `SCHEMA_VERSION`
   bleibt unverändert, kein Migrationsschritt, kein Fixture.
7. **`karte` bleibt unberührt.** Keine Positionsübernahme per Kartentipp,
   kein Import in beide Richtungen (ADR-0018/0019).

## Konsequenzen

- Positiv: Der Randfall aus Kriterium 9 kann nicht auftreten, statt
  repariert zu werden. Wer später einen weiteren bedingt sichtbaren
  Abschnitt baut, erbt die Regel (Punkt 4) und nicht die Reparatur.
- Positiv: `Ortssuche.vue` bleibt store-frei und damit nach ADR-0013 Punkt 3
  von einer `orte`-View importierbar — die Erlaubnis hängt genau daran.
- Positiv: Die Ausgabe der Komponente (vier unterscheidbare Zustände) ist
  dieselbe Information, die -003 anzeigt und -004 prüft. Es gibt keine
  zweite Wahrheit über „läuft die Suche gerade ins Leere".
- Negativ/Trade-off: Der Key auf `Ortssuche.vue` verwirft beim Ortswechsel
  auch eine bereits getippte, noch nicht übernommene Suche. Das ist gewollt —
  eine Suche gehört zu dem Ort, für den sie getippt wurde.
- Negativ/Trade-off: Der Emit macht aus einer rein nach innen gerichteten
  Komponente eine mit zwei Ausgängen. Solange der zweite den **angezeigten**
  Zustand meldet (Punkt 2), ist er trotzdem am Modul prüfbar und nicht an
  einer Absicht.
- Betrifft künftig: Jeder weitere Zustand im Ortsdetail, der eine
  Komponentengrenze überquert oder einen Ortswechsel überdauern könnte.

## Alternativen (kurz)

- **Suchzustand in `useOrteStore`** — verworfen: Er ist flüchtiger
  Ansichtszustand einer einzelnen Komponente, kein Ort-Datenfeld; er machte
  `Ortssuche.vue` store-abhängig und damit nach ADR-0013 Punkt 3 nicht mehr
  importierbar. Gleiches Argument wie ADR-0021 Punkt 5 für den Netzzustand.
- **Eigener Schlüssel im Store `einstellungen`** — verworfen und im Paket
  ausdrücklich ausgeschlossen: Der Zustand soll das Schließen des Ortes gerade
  **nicht** überdauern (ADR-0006/0009).
- **`watch(ortId, …)` setzt Sichtbarkeit und Sucheingabe zurück** —
  verworfen: funktioniert, solange jemand daran denkt. Der Befund, der dieses
  Paket ausgelöst hat, ist genau ein vergessener Fall.
- **Die Koordinatenfelder samt Ortssuche in eine eigene Komponente ziehen und
  diese keyen** — verworfen für dieses Paket: Zwischen Ortssuche und den
  Koordinatenfeldern steht das Feld „Adresse". Eine gemeinsame Komponente
  ordnete das Formular um — eine UI-Entscheidung, die dem `ux-ui-designer`
  gehört und die in den `design_notes` nicht steht.
- **`v-if` auf dem ganzen Detailblock mit `:key="ortId"`** — verworfen:
  hängt bei jedem Ortswechsel auch Bilderbereich, Tag-Eingabe und die
  Fokusführung aus (ADR-0011, ADR-0016) und macht aus einem
  Sichtbarkeitsproblem ein Lebenszyklusproblem.

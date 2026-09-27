# ADR-0030: Unbestätigte Eingabe über die Komponentengrenze — die View holt sie über eine exponierte Methode ab, bevor sie persistiert (Erweiterung von ADR-0013 Punkt 3, Anwendung von ADR-0005 Punkt 5 und ADR-0025 Punkt 4/5)

- **Status**: accepted (Punkt 4/8 präzisiert durch ADR-0035: bei mehreren
  Entwurfsbesitzern alle abholen, einmal schreiben)
- **Datum**: 2026-09-26
- **Bounded Context(s)**: `tags`, `orte`, `bewertungen`
- **task_id**: `PO-2026-09-26-001`

## Kontext

Live-Befund: `TagEingabe.vue` übernahm einen Tag nur über Enter, jedes andere
Verlassen verwarf den Text. Die Nutzerentscheidung vom 2026-09-26 bindet
**alle vier** Auslöser aus ADR-0005 Punkt 5 auch an das Tag-Feld. Drei davon
(Route verlassen, `visibilitychange`→`hidden`, `pagehide`) leben in
`Ortebereich.vue` (`useAutosaveBeimVerlassen`, `onBeforeRouteUpdate`,
`onBeforeRouteLeave`) — der unbestätigte Text aber liegt als Instanzzustand
**in** der präsentationalen Komponente, die nach ADR-0013 Punkt 3 weder Store
noch Router kennt. Props rein, Emits raus reicht dafür nicht: Ein Emit
entsteht nur, wenn die Komponente selbst einen Anlass sieht, und für diese
drei Auslöser sieht sie keinen. Der `ux-ui-designer` hat die Anbindung
ausdrücklich offen gelassen.

## Entscheidung

1. **Ein Commit-Weg in der Komponente.** Enter, Klick auf einen Vorschlag,
   Feld verlassen und die externe Übernahme laufen durch **dieselbe** interne
   Funktion und enden im **bestehenden** Emit `tag-hinzugefuegt`. Kein zweites
   Emit für „automatisch übernommen", kein eigener Schreibweg. Trimmen/Leer
   bleibt dort, Identität und Kanonisierung bleiben im Store
   (`fuegeTagHinzu`, ADR-0014 Punkt 3).
2. **„Feld verlassen" ist ein Fokuswechsel innerhalb des Dokuments, intern
   behandelt.** Gemeint ist: der Fokus verlässt den Feldbereich (Eingabe +
   Vorschlagsliste) — `focusout` mit `relatedTarget`-Containment wie in
   `useSchliesseBeiAussenaktion.ts`, nicht `@blur` am `<input>` (sonst
   committet schon das Tabben in die eigene Vorschlagsliste). **Verliert das
   Dokument selbst den Fokus** (Tab-, App-, Fensterwechsel), ist das **kein**
   Verlassen des Feldes: Der Fokus kehrt danach dorthin zurück, und den
   Commit übernimmt `visibilitychange`/`pagehide`. Beobachtbarer Grund: Im
   Page Lifecycle geht eine Seite von *active* über *passive* nach *hidden* —
   der Fokusverlust (`blur`) kommt **vor** `visibilitychange`. Committete er,
   wäre das Feld beim Tab-Wechsel schon leer, und die vom Nutzer
   entschiedene Rückkehr-Markierung könnte in Chromium nie erscheinen.
   Verbindlich ist diese Eigenschaft; das Mittel (z. B. `document.hasFocus()`
   im Handler) verifiziert der Lead.
3. **Die drei externen Auslöser erreichen die Komponente über genau eine
   exponierte Methode**: `defineExpose({ uebernimmOffeneEingabe(anlass) })`,
   **synchron**, `anlass` ∈ {`'hintergrund'`, `'verlassen'`}. Sie übernimmt
   den **rohen** getippten Text über den Weg aus Punkt 1 — nie eine per
   Pfeiltaste nur markierte Vorschlagszeile — und ist bei leerem Feld ein
   No-op. ADR-0013 Punkt 3 bleibt erfüllt: Die Komponente importiert weder
   Store noch Router, die Import-Richtung (View → Komponente) ist
   unverändert, ein Zyklus kann nicht entstehen. **Erweitert** wird nur der
   Vertrag „Props rein, Emits raus" um diese eine Art imperativer
   Aufforderung: „gib deinen unbestätigten Stand ab". Weitere exponierte
   Methoden (Zustand setzen, lesen, fokussieren …) deckt dieses ADR nicht.
4. **Die View orchestriert; die Komponente registriert keinen eigenen
   Commit-Listener auf `document`/`window`.** In `Ortebereich.vue` ruft
   **jeder** der drei Auslöser zuerst `uebernimmOffeneEingabe(…)` und
   persistiert **danach** — über **eine** Hilfsfunktion, nicht an drei
   Stellen einzeln nachgebaut. `useAutosaveBeimVerlassen` meldet dafür, welcher
   Auslöser feuerte. Beobachtbarer Grund: Eine per `:key` neu gemountete
   Komponente registriert ihren Listener **nach** der View. Feuert der
   View-Listener zuerst, läuft ein Schreibvorgang ohne den Tag, der mit dem
   Tag hängt in der Warteschlange (ADR-0005 Punkt 3) — bei `pagehide` oder
   einem vom Betriebssystem beendeten Tab ist er verloren. Mit der
   Reihenfolge „erst abholen, dann schreiben" trägt bereits der erste
   Schreibvorgang den Tag.
5. **Der Zielort ist gebunden, nicht nachgeschlagen** (ADR-0025 Punkt 4 auf
   Emits angewandt). Die View bindet den Handler mit der Ort-ID des
   gerenderten Ortes (`ort.id`) und persistiert **diese** ID, nicht die
   reaktive `ortId`. Damit landet Text von Ort A an Ort A, auch wenn ein
   Emit die Navigation überholt oder beim Aushängen der alten Instanz
   eintrifft.
6. **Instanzzustand wird durch Remount frisch** (ADR-0025 Punkt 5, jetzt auch
   für `TagEingabe`): `:key` auf der `ortId`. Der Commit aus Punkt 4 läuft im
   Route-Guard und damit **vor** dem Remount; Ort B beginnt strukturell leer.
7. **Der Anlass steuert nur die Darstellung.** `'hintergrund'` (ausschließlich
   `visibilitychange`→`hidden`) setzt die Rückkehr-Markierung aus
   `design-conventions.md`; `'verlassen'` (Route, `pagehide`) und Feld
   verlassen setzen keine. Die Markierung ist Instanzzustand, wird über den
   **normalisierten Schlüssel** (`normalisiereTagSchluessel`,
   `shared/lib/tagfilter.ts`) der Pille zugeordnet — die sichtbare Pille
   trägt die kanonische Schreibweise des Bestands, nicht zwingend die
   getippte — und nur gesetzt, wenn der Tag an diesem Ort **neu** war. Die
   Rückkehr (`visible`) darf die Komponente selbst beobachten — **nur** für
   die Darstellung, nie für einen Commit.
8. **Jede weitere präsentationale Komponente im Ortsdetail, die einen
   unbestätigten Eingabewert lokal hält, folgt demselben Muster** (Punkte
   3–6). Bekannter Kandidat nach Code-Lesung: `Bewertungsachse.vue`
   (Kommentarentwurf und Zahlenfeld committen nur auf `blur`/`change`, kein
   `:key`). Nicht Teil von PO-2026-09-26-001.
9. **Verifikation** (ADR-0023/0027): Der Emit-Vertrag der Komponente (Punkte
   1–3, 7) ist eine Component-Spec. Das Zusammenspiel View ↔ Auslöser ↔
   Speicher ist eine Rauchtest-Zusicherung — „Tag überlebt Neuladen" ohne
   Enter, mit Fokus im Feld und nach Ortswechsel ab `lg` —, rot-nachgewiesen
   gegen den Stand vor der Korrektur (ADR-0027 Punkt 8). Die Reihenfolge
   `blur`/`visibilitychange` bei einem echten Tab-Wechsel ist
   engine-abhängig und auf WebKit nur manuell prüfbar.

## Konsequenzen

- Positiv: Ein Auslöser, den die View kennt, kann den Text nicht mehr
  verwerfen, und die Reihenfolge „erst abholen, dann schreiben" steht an einer
  Stelle, nicht an drei.
- Positiv: `TagEingabe.vue` bleibt nach ADR-0013 Punkt 3 importierbar; wer
  prüfen will, ob sie store-/routerfrei ist, prüft weiterhin ihre Imports.
- Negativ/Trade-off: Die View hält eine Template-Ref auf eine Komponente eines
  fremden Contexts und ruft sie imperativ auf — eine engere Kopplung als ein
  Emit. Vergisst ein künftiger vierter Auslöser den Aufruf, fällt das nur im
  Rauchtest auf, nicht im Typecheck.
- Negativ/Trade-off: Wechselt der Nutzer am Desktop nur das Fenster (Seite
  bleibt sichtbar), bleibt der Text unbestätigt im fokussierten Feld stehen,
  bis er zurückkehrt oder ein anderer Auslöser greift. Das ist gewollt
  (Punkt 2), kein Verlust.
- Betrifft künftig: `frontend-lead` bei jedem Baustein im Ortsdetail mit
  lokalem Entwurf; `architekt` beim Einordnen eines Pakets an
  `Bewertungsachse.vue` (Punkt 8).

## Alternativen (kurz)

- **Die Komponente registriert `visibilitychange`/`pagehide` selbst** —
  verworfen: Listener-Reihenfolge nach Remount (Punkt 4) erzeugt einen
  Schreibvorgang ohne Tag vor dem mit Tag, und „Route verlassen" kann sie
  ohnehin nicht sehen.
- **Commit in `onBeforeUnmount`** — verworfen: Beim Schließen unterhalb `lg`
  ist `ortId` dann schon `null`, beim Wechsel ab `lg` schon Ort B; es deckt
  weder `visibilitychange` noch Neuladen ab.
- **Entwurfstext per `v-model` in die View heben** — verworfen: Der Entwurf
  wäre View-Zustand ohne Ort-Bindung (ADR-0025 Punkt 4), der Remount löschte
  ihn nicht mehr, und Enter bzw. Vorschlag committeten in der Komponente,
  die übrigen Auslöser in der View — zwei Commit-Wege.
- **Zähler-Prop als „Signal", auf den die Komponente per `watch` reagiert** —
  verworfen: Ein Watcher läuft nach dem nächsten Tick, der Guard bzw.
  `pagehide`-Handler persistiert aber synchron; ein Ereignis als Prop zu
  kodieren ist zudem schwerer zu lesen als ein Aufruf.
- **`provide`/`inject`-Register für „offene Eingaben"** — verworfen für einen
  Nutzer: Der Injection-Key müsste in `shared/` liegen, Indirektion ohne
  Gegenwert. Wiedervorlage, sobald Punkt 8 einen zweiten Nutzer bringt.
- **Jeder `blur` committet, auch der Fokusverlust des Dokuments** — verworfen:
  macht die Rückkehr-Markierung in Chromium strukturell unerreichbar
  (Punkt 2).

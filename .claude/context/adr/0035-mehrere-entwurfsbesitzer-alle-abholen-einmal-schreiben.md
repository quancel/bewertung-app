# ADR-0035: Mehrere Entwurfsbesitzer im Ortsdetail — alle abholen, einmal schreiben; `Bewertungsachse.vue` als zweiter Nutzer von ADR-0030 (Präzisierung von ADR-0030 Punkt 4/8)

- **Status**: accepted
- **Datum**: 2026-09-27
- **Bounded Context(s)**: `orte`, `bewertungen`, `tags`
- **task_id**: `PO-2026-09-27-004`

## Kontext

ADR-0030 Punkt 8 nennt `Bewertungsachse.vue` als Kandidaten. Mit PO-2026-09-27-004
hält das Ortsdetail erstmals **mehrere** unbestätigte Entwürfe gleichzeitig:
den Tag-Text und je Achse Zahl und Kommentar, also bis zu neun. ADR-0030
Punkt 4 („erst abholen, dann schreiben") wurde für genau einen Besitzer
geschrieben. Bei mehreren Besitzern reicht das nicht. Die Emit-Handler der
View persistieren nämlich sofort (`aufTagHinzugefuegt`,
`aufAchsenwertGeaendert`, `aufAchsenkommentarGeaendert`). `persistiereOrt`
liest den Datensatz beim Aufruf, und `aktualisiereAchse`/`fuegeTagHinzu`
ersetzen ihn unveränderlich. Der **erste** `put()` trägt dann nur den zuerst
abgeholten Entwurf. Die weiteren warten in der Warteschlange je ID (ADR-0005
Punkt 3) und laufen über eine Task-Grenze, wo die Härtung aus ADR-0031 Punkt 2
nicht greift. Beobachtbar ist das so: Beim `pagehide` mit Tag-Text und
Achsenkommentar zeichnet der erste `put()` den Tag auf, den Kommentar aber
nicht. Dazu kommt: Die vier Achsen haben kein `:key`. Hat Ort B denselben
Wert wie Ort A (z. B. beide Kommentare `null`), feuert `watch(props.kommentar)`
nicht, und der Entwurf von A bleibt im Feld von B stehen.

## Entscheidung

1. **Alle abholen, dann genau einmal schreiben.** Die eine
   Orchestrierungsfunktion in `Ortebereich.vue` (ADR-0030 Punkt 4) ruft bei
   jedem externen Auslöser (Route verlassen, `visibilitychange`→`hidden`,
   `pagehide`) **alle** Entwurfsbesitzer des gerenderten Ortes auf: die
   Tag-Eingabe und alle vier Achsen. Danach persistiert sie **genau einmal**.
   Während dieses synchronen Abholens aktualisieren die Emit-Handler nur den
   Store und stoßen **keinen** eigenen Schreibvorgang an. Außerhalb des
   Abholens persistieren sie wie bisher sofort (Feld verlassen, Enter,
   Vorschlag). Das Mittel (z. B. ein nicht-reaktives Flag, per
   `try/finally` zurückgesetzt) wählt der Lead. Verbindlich ist die
   Eigenschaft: Der erste `put()` nach einem externen Auslöser trägt
   **jeden** vorher offenen Entwurf.
2. **Eine exponierte Methode je Achsen-Instanz, nicht zwei.**
   `defineExpose({ uebernimmOffeneEingabe })`, synchron, **ohne** `anlass`.
   Der Anlass steuert nach ADR-0030 Punkt 7 nur die Rückkehr-Markierung, und
   die gibt es an der Achse nicht (`design-conventions.md`, „Bewertungsachse:
   Commit ohne Enter/Blur-Ersatz"). Die Methode läuft durch die
   **bestehenden** Commit-Funktionen für Zahl und Kommentar (ADR-0030
   Punkt 1). Jede endet in ihrem bestehenden Emit (`wert-geaendert` bzw.
   `kommentar-geaendert`). Es gibt keinen dritten Emit und keinen
   gemeinsamen Patch. Ein Aufruf holt damit beide Entwürfe der Achse ab, und
   Punkt 1 legt beide in denselben `put()`.
3. **Zurücksetzen ist kein Commit-Weg.** Die Methode ruft nie
   `aufZuruecksetzen` auf. Ein geleertes Zahlenfeld wird über den
   Zahlen-Commit zu `wert: null`. Der Kommentar bleibt dabei unberührt, weil
   `wert-geaendert` im Store nur `{ wert }` patcht (ADR-0007 Punkt 2).
4. **Idempotent gegen den zuletzt übernommenen Stand, nicht gegen die Props.**
   Mehrere Auslöser können im selben Tick feuern, bevor die Props neu
   gerendert sind: Route-Guard und das `blur` beim Aushängen,
   `visibilitychange` und `pagehide`. Ein zweiter Aufruf ohne neue Eingabe
   löst deshalb **kein** Emit aus. Sonst setzt `aktualisiereAchse`
   `geaendertAm` neu, obwohl sich nichts geändert hat, und die Sortierung
   „Zuletzt geändert" verschiebt sich.
5. **`:key="ortId ?? undefined"` auf allen vier Achsen-Instanzen** (ADR-0030
   Punkt 6, ADR-0025 Punkt 5). Das Abholen aus Punkt 1 läuft im Route-Guard,
   also **vor** dem Remount. Der Entwurf von A kann deshalb nicht in B
   landen. Die `watch`-Synchronisierung von `props.wert`/`props.kommentar`
   **bleibt**. Sie wird weiter gebraucht für Prop-Änderungen am selben Ort
   (Normalisierung nach dem Commit, `ladeNeu` nach einem Import). Mit dem
   `:key` ist sie aber nicht mehr der Mechanismus für den Ortswechsel.
   `kommentarOffen` beginnt dadurch je Ort frisch. Ein Ort ohne Kommentar
   zeigt wieder „Kommentar hinzufügen", wie es design_notes PO-2026-09-07-002
   verlangt. Bisher blieb das Feld vom vorigen Ort aufgeklappt.
6. **Ort-Bindung der Achsen-Handler** (ADR-0030 Punkt 5): `ort.id` des
   gerenderten Ortes wird im Template gebunden, nicht `ortId.value` im
   Handler.
7. **„Feld verlassen" bleibt an der Achse `@blur`/`@change`.** Die Ausnahme
   aus ADR-0030 Punkt 2 (der Fokusverlust des Dokuments ist kein Verlassen)
   existiert nur wegen der Rückkehr-Markierung. Ohne Markierung ist ein
   Commit beim Fensterwechsel wegen Punkt 4 harmlos.
8. **Refs auf die Achsen** hält die View als eine Sammlung, die nach
   `AchsenName` geschlüsselt ist (Funktions-Ref, analog `setZeilenRef`). Die
   Orchestrierung iteriert darüber, statt vier Aufrufe von Hand zu
   schreiben. Die Reihenfolge ist wegen Punkt 1 bedeutungslos.

## Konsequenzen

- Positiv: Die Eigenschaft aus ADR-0031 Punkt 6 (b1) gilt für jeden Entwurf,
  nicht nur für den Tag. Ein einziger `put()` ohne ausstehenden Vorgänger
  bleibt im gehärteten Pfad aus ADR-0031 Punkt 2.
- Positiv: Ein künftiger Entwurfsbesitzer braucht nur einen Eintrag in der
  Orchestrierung.
- Negativ/Trade-off: Die Emit-Handler haben jetzt zwei Modi (sofort
  persistieren oder nur Store). Vergisst ein neuer Handler die Unterdrückung,
  bleibt der Wert korrekt, aber der erste `put()` ist unvollständig. Das fängt
  nur die Rauchtest-Zusicherung „erster `put()` trägt alle Entwürfe". Der
  Typecheck fängt es nicht.
- Negativ/Trade-off: Die View hält jetzt fünf imperative Refs auf fremde
  Komponenten.
- Betrifft künftig: `frontend-lead` bei jedem weiteren Entwurfsbesitzer im
  Ortsdetail; `architekt` beim Einordnen (Punkt 1 als `constraint`).

## Alternativen (kurz)

- **Zwei exponierte Methoden je Achse (Zahl, Kommentar)** — verworfen: Das
  verdoppelt die Aufrufstellen. Einen Kommentar ohne die Zahl abzuholen ist
  nie richtig. code-conventions.md und ADR-0030 Punkt 3 sehen „genau eine
  Methode" vor.
- **Die Methode gibt die Werte zurück, statt zu emittieren** — verworfen:
  Das wäre ein zweiter Commit-Weg neben dem Emit (ADR-0030 Punkt 1).
- **Entprellung/Zusammenfassen in `persistiereOrt` (Microtask)** —
  verworfen: ADR-0005 schließt Entprellung aus, und für den `blur`-Pfad
  bringt sie nichts.
- **`provide`/`inject`-Register für offene Eingaben** (Wiedervorlage aus
  ADR-0030) — erneut zurückgestellt. Alle Besitzer sind direkte Kinder
  desselben View-Templates, Template-Refs reichen. Wiedervorlage, sobald ein
  Entwurfsbesitzer tiefer verschachtelt liegt als das View-Template.
- **Kein `:key`, nur die Watcher** — verworfen: Bei gleichem Wert an A und B
  feuern sie nicht (siehe Kontext).

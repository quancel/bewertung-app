# ADR-0023: Verifikationsebenen — was Vitest prüft, was der Rauchtest prüft, und warum kein Browser-Test-Runner dazukommt

- **Status**: accepted
- **Datum**: 2026-09-12
- **Bounded Context(s)**: `app-shell`, `orte`, `medien`, `datensicherung` (projektweit)
- **task_id**: `PO-2026-09-12-001` (Anlass), gilt ab `PO-2026-09-12-004` für den erweiterten Rauchtest

## Kontext

PO-2026-09-12-001 meldet den schwersten Befund des Projekts: Ein angelegter
Ort landet nicht in IndexedDB, die App meldet „Speichern ist
fehlgeschlagen", nach dem Neuladen ist er weg — auf einem iPhone
(Safari/WebKit), reproduzierbar in echter Nutzung.

Gleichzeitig sind 224 Unit-Tests grün. Der `product-owner` hat die Naht
benannt, an der das auseinanderfällt:

- `src/features/orte/stores/orte.store.spec.ts` ersetzt
  `persistence/orte-repository` per `vi.mock` **vollständig**. Der Store wird
  damit gegen eine Attrappe geprüft, nie gegen das echte Modul.
- `src/persistence/orte-repository.spec.ts` prüft das Repository gegen
  `fake-indexeddb`, aber mit selbst gebauten Datensätzen — nie mit einem
  Wert, wie ihn der Store tatsächlich übergibt.
- Der Pfad **Store → echtes Repository → echte IndexedDB** ist von keinem der
  224 Tests berührt.

Dazu kommt eine Eigenschaft von `fake-indexeddb`, die leicht für
Gleichwertigkeit gehalten wird: Es bildet den **strukturierten Klon** in
JavaScript nach, statt den des Browsers zu benutzen. Werte, die eine echte
IndexedDB nicht klonen kann, gehen dort durch. Ein grüner Test gegen
`fake-indexeddb` belegt deshalb, dass die *Logik* stimmt — nicht, dass im
Browser tatsächlich geschrieben wird.

Die Frage ist also nicht „welcher Test hat gefehlt", sondern **welche Ebene
diese Fehlerklasse überhaupt fangen kann**. Ohne Entscheidung rät jedes
Paket neu, und der naheliegende Reflex („dann eben jsdom und
`@vue/test-utils` einführen") löst das Problem nicht: Auch jsdom hat keinen
Browser-Klon und keine echte IndexedDB.

## Entscheidung

1. **Drei Ebenen, jede mit einer Zuständigkeit, keine Ebene als Ersatz einer
   anderen:**
   - **Vitest** (`environment: 'node'` + `fake-indexeddb/auto`): reine
     Logik, Migrationsketten, Repository-Verträge, Store-Verhalten. Antwortet
     auf „passt der Code zusammen".
   - **Rauchtest** (`npm run smoke`, echter Produktions-Build, echte
     Browser-Engine): die Zusicherungen aus
     `.claude/agent-team/rules/VERIFICATION.md`. Antwortet auf „ist das
     Ergebnis benutzbar" — und als einzige Ebene auf „schreibt der Browser
     die Daten wirklich".
   - **Abnahme** (`product-owner`): fachliche Kriterien am Code.
2. **Ein grüner Test gegen `fake-indexeddb` ist kein Beleg, dass im Browser
   geschrieben wird.** Jede Zusicherung der Form „Daten überleben ein
   Neuladen" gehört deshalb in den **Rauchtest**, nicht in Vitest. Konkret ab
   -001: Ort anlegen → neu laden → Ort muss vorhanden sein, sonst Exit-Code 1.
3. **Die Naht Store → Repository wird nicht vollständig wegmockt.** Je Store
   bleibt mindestens ein Test, der das **echte** Repository benutzt (gegen
   `fake-indexeddb`) und den Wert übergibt, den der Store im Betrieb auch
   übergibt. Das fängt Vertragsfehler; Punkt 2 bleibt trotzdem nötig, weil
   diese Ebene den Browser-Klon nicht nachstellt. Vorhandene Mock-Tests
   bleiben — sie werden ergänzt, nicht ersetzt.
4. **Kein zweiter Test-Runner, kein jsdom, kein Browser-Mode in dieser
   Runde.** `environment: 'node'` bleibt. Eine Frage, die eine echte
   Browser-Engine braucht, wird im Rauchtest beantwortet, nicht durch eine
   dritte Simulationsschicht. Component-Test-Infrastruktur
   (`@vue/test-utils`) entsteht weiterhin erst, wenn ein Paket sie fachlich
   braucht (CLAUDE.md) — dieses ADR ist kein Auftrag dazu.
5. **Der Rauchtest läuft über eine Engine-Liste, nicht fest gegen
   `chromium`.** Eine nicht installierte Engine wird behandelt wie ein
   fehlendes Playwright: übersprungen, Exit-Code 0, und im Bericht
   ausdrücklich als **ungeprüft** benannt (Nutzerentscheidung 2026-09-12:
   Playwright bleibt optional, Überspringen endet mit 0). Die Skip-Mechanik
   selbst wird dabei nicht umgebaut — sie gilt nur zusätzlich je Engine.
   Grund: -001 ist auf WebKit aufgefallen und nur dort sicher nachweisbar;
   eine fest verdrahtete Engine macht „grün" zu einer Aussage über genau
   einen Browser, ohne das zu sagen.
6. **Ein Prüfwerkzeug, das einen bekannten, bereits geschnittenen Befund
   meldet, wird nicht abgeschwächt.** Der mit -004 erweiterte Rauchtest
   meldet Befund 2 (-002) und Befund 3 (-003), solange diese Pakete nicht
   gebaut sind. Rot ist dort das **erwartete** Ergebnis und kein Grund, eine
   Zusicherung zu lockern, einen Fall auszunehmen oder das Paket
   zurückzuhalten. Abschlusskriterium für -004 ist deshalb nicht „Exit-Code
   0", sondern „meldet genau die beiden bekannten Befunde und sonst nichts".
7. **Ausnahmen von einer Zusicherung sind begründet und benannt.** Die
   Verdeckungsprüfung nimmt die aktiv bediente Auswahlliste aus (Entscheidung
   `ux-ui-designer`, -003): Eine Überlagerung, die der Nutzer gerade selbst
   geöffnet hat und die sich durch Tap außerhalb schließt, ist kein Befund.
   Ausnahmen stehen als benannte Bedingung im Skript, nie als Liste
   einzelner Element-IDs.

## Konsequenzen

- Positiv: Die Fehlerklasse „grün in Node, kaputt im Browser" hat ab jetzt
  eine zuständige Ebene. -001 liefert die erste Zusicherung dieser Art, -004
  baut sie aus.
- Positiv: Die Kostenfrage ist entschieden, bevor sie in jedem Paket neu
  aufkommt — kein zweiter Runner, keine dritte Simulationsschicht.
- Negativ/Trade-off: Der Rauchtest wird länger und teurer, und er ist die
  einzige Ebene, die diese Fehler fängt — fehlt Playwright, bleiben sie
  ungeprüft. Genau deshalb verlangt Punkt 5, dass das im Bericht steht,
  statt als „erfolgreich" durchzugehen.
- Negativ/Trade-off: Punkt 6 heißt, dass `npm run smoke` zwischen -004 und
  -002/-003 rot ist. Das ist beabsichtigt; wer in diesem Fenster einen
  grünen Lauf braucht, hat die falsche Erwartung an ein Prüfwerkzeug.
- Betrifft künftig: Jedes Paket, das Daten schreibt, prüft Punkt 2/3, bevor
  es sich auf grüne Unit-Tests verlässt. Jedes Paket, das eine neue Ansicht
  oder einen neuen Zustand baut, trägt ihn in die zentralen Listen oben in
  `scripts/smoke.mjs` ein.

## Alternativen (kurz)

- **jsdom + `@vue/test-utils` einführen und dort prüfen** — verworfen: jsdom
  bringt weder eine echte IndexedDB noch den Browser-Klon mit. Es hätte
  denselben Fehler durchgelassen und dafür eine dauerhafte
  Infrastruktur-Last erzeugt.
- **`fake-indexeddb` durch einen strengeren Klon-Vorprüfer ersetzen** —
  verworfen als *Ersatz*: Das schärft eine Simulation nach, deren Abweichung
  man erst kennt, nachdem sie einmal geschadet hat. Als Ergänzung innerhalb
  von Punkt 3 zulässig, aber nie als Grund, Punkt 2 wegzulassen.
- **Die Zusicherung als manuellen Prüfschritt in die Abnahme legen** —
  verworfen: Ein Datenverlust, der nur auffällt, wenn jemand daran denkt, ist
  genau der Fall, den dieses Projekt schon hatte.
- **Den Rauchtest zur Pflichtabhängigkeit machen (Playwright installieren,
  Exit 1 ohne)** — verworfen durch Nutzerentscheidung 2026-09-12.
- **-004 erst nach -002/-003 bauen, damit der Rauchtest nie rot ist** —
  verworfen: Dann gäbe es keinen Nachweis, dass die neuen Zusicherungen die
  beiden realen Befunde überhaupt fangen. Die freigegebene Reihenfolge stellt
  den Nachweis bewusst vor die Korrektur.

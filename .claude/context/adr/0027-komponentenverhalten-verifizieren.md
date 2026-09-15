# ADR-0027: Komponentenverhalten verifizieren — `@vue/test-utils` + jsdom als datei-lokales Opt-in, sichtbare Bedienelemente im Rauchtest (Erweiterung von ADR-0023 Punkt 4)

- **Status**: accepted (Punkt 5 am 2026-09-15 korrigiert — siehe „Korrektur",
  der dort zuerst vorgeschriebene Prüfweg funktioniert nicht)
- **Datum**: 2026-09-14
- **Bounded Context(s)**: `bewertungen`, `orte`, `app-shell` (projektweit)
- **task_id**: `PO-2026-09-13-001` (Anlass, richtet die Infrastruktur ein),
  gilt ab sofort für jedes Paket mit Komponentenverhalten;
  `PO-2026-09-13-002` ist der erste Nachnutzer

## Kontext

Zwei Korrekturpakete am selben Bedienelement verlangen je eine automatisierte
Absicherung, die **gegen den Vor-Korrektur-Stand nachweislich fehlschlägt**:

- **-001**: `Bewertungsachse.vue` schreibt im `input`-Handler des Reglers nur
  den lokalen Textzustand `eingabe` und emittiert **nicht**
  (`aufReglerTippen`, Zeile 79–81). Erst `change` (`aufReglerCommit`)
  emittiert. Daraus entsteht der beobachtete Zustand: im Zahlenfeld steht
  eine 7, während dieselbe Achse darunter „Noch nicht bewertet" zeigt und der
  Zurücksetzen-Knopf fehlt — der Prop `wert` ist noch `null`. Das ist ein
  **Emit-Vertrag einer Komponente**: ein `input`-Ereignis, ein Emit.
- **-002**: Der Thumb ist bei `wert === null` per `opacity: 0` auf den
  Pseudo-Elementen ausgeblendet (`.bewertungsachse__regler--leer::-webkit-slider-thumb`).
  Zugesichert werden muss „an jeder Achse ist ohne Vorbedienung ein
  greifbares Bedienelement erkennbar", bei 320/390/1280px.

Keine der drei Ebenen aus ADR-0023 trägt heute eine der beiden Zusicherungen:

- **Vitest** kann die Komponente nicht mounten — es gibt keine
  Component-Test-Infrastruktur (`@vue/test-utils` fehlt, `environment: 'node'`).
  Die Regel, die -001 verletzt, lässt sich auch nicht wie
  `rundenUndKlemmen` in eine reine Funktion auslagern: Gegenstand ist der
  Handler-zu-Emit-Weg selbst, nicht eine Rechenregel.
- **Der Rauchtest** kann -002 heute nicht sehen: `pruefeVerdeckung` liest
  `getComputedStyle(el).opacity` am `<input type="range">` selbst (das ist
  `1`) und trifft mit `elementFromPoint` in der Reglermitte den Regler
  selbst. Ein unsichtbarer Pseudo-Element-Thumb erzeugt keinen Befund.
- ADR-0023 Punkt 4 hat `@vue/test-utils` **nicht verboten**, sondern nur
  festgehalten, dass es als Antwort auf die *IndexedDB-Klon*-Fehlerklasse
  untauglich ist und „erst entsteht, wenn ein Paket es fachlich braucht —
  dieses ADR ist kein Auftrag dazu". Dieses Paket ist dieser Fall, und die
  Entscheidung wird hier getroffen statt in jedem Paket neu geraten.

## Entscheidung

1. **Die Zuständigkeit wird je Zusicherung entschieden, nicht je Paket.**
   - **Emit-/Zustandsvertrag einer Komponente** (was löst welches Emit aus,
     welcher Prop-Wechsel welche Anzeige) → **Vitest mit
     `@vue/test-utils`**. Er ist engine-unabhängig und in Node vollständig
     beweisbar.
   - **„Ist das Bedienelement für einen Menschen da und greifbar"**
     (Sichtbarkeit, Trefferfläche, Verdeckung, Überlauf) → **Rauchtest**.
     Pseudo-Elemente, `accent-color` und berechnete Trefferflächen existieren
     nur in einer echten Engine.
   - Keine Ebene ersetzt die andere; ADR-0023 Punkt 1–3 und 5–7 gelten
     unverändert weiter.
2. **Component-Test-Infrastruktur: `@vue/test-utils` + `jsdom`, beide als
   `devDependency`.** Kein zweiter Test-Runner, kein Browser-Mode, kein
   happy-dom — Vitest bleibt der einzige Runner (ADR-0023 Punkt 4 bleibt in
   diesem Punkt in Kraft). jsdom statt happy-dom, weil es die vollständigere
   und im Ökosystem länger belegte Nachbildung ist; die Wahl ist an genau
   einer Stelle umkehrbar (siehe Punkt 3).
3. **Die Umgebung wird datei-lokal gewählt, nicht global umgestellt.**
   `vitest.config.ts` behält `environment: 'node'` als Vorgabe; eine
   Komponenten-Spec setzt in Zeile 1 den Docblock
   `// @vitest-environment jsdom`. Grund: Die über 200 vorhandenen Tests
   prüfen Persistenz und Stores gegen `fake-indexeddb` in Node — eine globale
   Umstellung änderte deren Laufumgebung als Nebenwirkung eines
   UI-Korrekturpakets. Wer den Docblock vergisst, bekommt einen Fehler beim
   Mounten, keinen stillen Falschbefund.
4. **Was ein Component-Test in jsdom **nicht** beweist, wird nicht mit ihm
   zugesichert.** jsdom hat kein Layout, keine Pseudo-Element-Styles, keine
   echte IndexedDB und keinen Browser-Klon. Verboten sind deshalb
   ausdrücklich: Sichtbarkeits-, Trefferflächen- und Verdeckungsaussagen,
   Aussagen über `accent-color` oder `::-webkit-slider-thumb`, und jede
   Zusicherung der Form „Daten überleben ein Neuladen" (die bleibt beim
   Rauchtest, ADR-0023 Punkt 2). Ein Component-Test, der nur prüft, dass ein
   Klassenname gesetzt wird, ist zulässig — als Vertrag über das Template,
   nicht als Beleg dafür, dass man etwas sieht.
5. **Der Rauchtest bekommt eine Zusicherung „Bedienelemente sind greifbar",
   formuliert als Eigenschaft.** Für jedes `<input type="range">` in einer
   geöffneten Ansicht gilt: sein Thumb ist nicht durch `opacity: 0`,
   `visibility: hidden` oder eine Größe unter der Mindest-Trefferfläche
   unbedienbar gemacht, und das Element selbst erfüllt die
   44×44px-Trefferfläche. Geprüft wird die **Bauform**, nicht eine Liste von
   IDs oder Klassennamen (ADR-0023 Punkt 7) — ein Nachfolger, der die
   Unterscheidung anders löst als über `accent-color`, bleibt damit
   zugesichert.

   **Der Prüfweg ist das Chrome DevTools Protocol, nicht
   `getComputedStyle`.** `getComputedStyle(el, '::-webkit-slider-thumb')` aus
   Seiten-JavaScript liefert **nicht** den Autoren-Stil des Thumbs, sondern
   die UA-Vorgabe — die Zusicherung wäre damit dauerhaft grün (Nachweis und
   Vorgeschichte unter „Korrektur"). Verbindlich ist stattdessen: den
   UA-Schattenbaum des `<input>` über `DOM.getDocument({ pierce: true })`
   einlesen, den Thumb-Knoten über seine **tatsächlich matchenden CSS-Regeln**
   identifizieren (`CSS.getMatchedStylesForNode`, Selektortext enthält
   `-webkit-slider-thumb` — nicht über einen internen `id`-Namen, der
   versionsabhängig ist) und den Wert dort mit
   `CSS.getComputedStyleForNode` lesen. Umgesetzt in
   `pruefeReglerGreifbarkeit()` in `scripts/smoke.mjs`; der Grund steht als
   Kommentar an der Funktion, damit ihn niemand für Umständlichkeit hält und
   „vereinfacht".

   **Jede künftige Zusicherung über ein UA-Pseudo-Element** (`::-webkit-*`
   an `range`, `file`, `search`, `progress`, …) nimmt diesen Weg — oder weist
   vorher gegen einen Stand nach, in dem die Eigenschaft **verletzt** ist,
   dass ihr Prüfweg dort rot wird (Punkt 8).
6. **Die Grenze dieser Zusicherung steht im Bericht, nicht nur im Kopf des
   Autors** (Konsequenz aus ADR-0023 Punkt 5): Der Rauchtest fährt Chromium.
   `::-webkit-slider-thumb` ist dort **angewandt** (nur über die öffentliche
   `getComputedStyle`-API nicht **auslesbar**, siehe Punkt 5) und deckt
   dieselbe Pseudo-Element-Familie ab, die auch WebKit benutzt — für den konkreten
   Befund aus -002 (`opacity: 0` auf genau diesem Pseudo-Element) ist der
   Chromium-Lauf deshalb ein tragfähiger Nachweis. **Ungeprüft bleiben**
   `::-moz-range-thumb` (in Chromium nicht vorhanden) und das eigentliche
   Touch-Verhalten von WebKit beim Tippen auf die Reglerbahn. Das
   Akzeptanzkriterium „gilt auf Touch (iOS/Safari, ~390px)" ist damit **nur
   manuell prüfbar** und bleibt bei der Abnahme offen, bis der Nutzer am
   Gerät bestätigt hat.
7. **Ein Paket, das Komponentenverhalten ändert, erweitert die
   Component-Specs — es ersetzt keine vorhandene Ebene.** Die Naht
   View ↔ Store (`Ortebereich.vue` → `useOrteStore`) bleibt Sache der
   Store-Tests nach ADR-0023 Punkt 3; ein Component-Test mountet die
   **präsentationale** Komponente mit Props und liest Emits, er bindet keinen
   Store an. Das hält die Testebene an derselben Grenze wie ADR-0013 Punkt 3
   den Code.
8. **Eine neue Zusicherung gilt erst als eingerichtet, wenn sie gegen einen
   Stand, der die Eigenschaft verletzt, nachweislich rot wird** — und der
   Nachweis steht im Bericht des Leads. Das ist keine Fleißaufgabe, sondern
   die einzige Absicherung gegen den Fehlermodus aus „Korrektur": ein
   Prüfweg, der die Eigenschaft gar nicht erreicht, ist von einem erfüllten
   Kriterium nicht zu unterscheiden. Gibt es keinen solchen Stand in der
   Historie, erzeugt der Lead ihn als Wegwerf-Änderung. Trägt ein
   vorgeschriebener Prüfweg diesen Nachweis nicht, wird **er** korrigiert,
   nicht die Zusicherung abgeschwächt (ADR-0023 Punkt 6).

## Korrektur (2026-09-15) — Punkt 5 schrieb einen nicht funktionierenden Prüfweg vor

Ursprünglich stand in Punkt 5: „Geprüft wird über
`getComputedStyle(el, '::-webkit-slider-thumb')`". **Das funktioniert nicht.**
Der `frontend-lead` hat es beim Umsetzen von PO-2026-09-13-002 festgestellt,
der `product-owner` bei der Abnahme bestätigt: In der hier verfügbaren
Chromium-Version (141, Playwright 1.56.1) liefert dieser Aufruf aus
Seiten-JavaScript durchgängig die **UA-Vorgabe** (`opacity: '1'`, Breite/Höhe
identisch zum äußeren `<input>`) statt des Autoren-Stils. Vermutlich eine
Einschränkung dieser Blink-Version bei der Style-Auflösung von
UA-Shadow-Pseudoelementen über die öffentliche API.

Zweifach nachgewiesen:
- **Isolierter Repro**: eine Regel setzt `opacity: 0` auf
  `::-webkit-slider-thumb`, `getComputedStyle` meldet trotzdem `1`.
- **Gegen den echten Vor-Korrektur-Stand dieses Projekts**: mit der in der
  ADR vorgeschriebenen Methode wäre der Rauchtest **nicht rot geworden**,
  obwohl der Thumb per `.bewertungsachse__regler--leer::-webkit-slider-thumb
  { opacity: 0 }` sichtbar ausgeblendet war — also genau der Befund, für den
  diese Zusicherung geschnitten wurde.

Der **normative Kern von Punkt 5 ist unberührt**: Zuständigkeit Rauchtest,
Eigenschaft statt ID-/Klassenliste (ADR-0023 Punkt 7), dieselben
Grenzwerte. Falsch war allein das benannte Werkzeug; deshalb kein
`superseded by` und kein neues ADR, sondern dieselbe Bauform wie bei der
Korrektur von ADR-0011 Punkt 4. Der CDP-Weg ist gegen denselben
Vor-Korrektur-Stand als **rot** verifiziert.

**Warum das hier so ausführlich steht**: Der Schaden wäre nicht ein einmalig
falscher Test gewesen, sondern eine Zusicherung, die **nie rot wird** — sie
sieht in jedem Lauf aus wie ein erfülltes Kriterium. `getComputedStyle` ist
der kürzere, bekanntere und beim Lesen naheliegendere Weg; ohne diesen
Abschnitt wechselt der nächste Autor beim „Aufräumen" von `scripts/smoke.mjs`
zurück und merkt nichts davon. Punkt 8 ist die verallgemeinerte Lehre.

## Konsequenzen

- Positiv: -001 bekommt einen Nachweis, der gegen den Vor-Korrektur-Stand
  rot ist, ohne dass eine ganze Browser-Testschicht entsteht: ein `input`
  auf dem Regler, ein Emit mit dem Wert.
- Positiv: -002 bekommt eine Zusicherung, die die Eigenschaft prüft
  („greifbar") statt der heutigen Umsetzung („`accent-color` gesetzt").
- Positiv: Die Frage „dürfen wir jetzt jsdom" ist einmal beantwortet, mit
  einer ausdrücklichen Liste dessen, was dort **nicht** hingehört (Punkt 4) —
  ohne diese Liste wandern Sichtbarkeitsaussagen erfahrungsgemäß in die
  billigste Ebene.
- Negativ/Trade-off: Zwei zusätzliche `devDependencies` und eine zweite
  Testumgebung im selben Runner. Der Preis ist bewusst klein gehalten:
  Opt-in je Datei, Vorgabe bleibt `node`.
- Negativ/Trade-off: jsdom simuliert. Punkt 4 zieht die Grenze, aber sie muss
  bei jedem neuen Component-Test aktiv gezogen werden — die Simulation sagt
  nicht selbst, wo sie aufhört. Das ist dieselbe Fehlerklasse wie bei
  `fake-indexeddb` (ADR-0023), nur an einer anderen Naht.
- Negativ/Trade-off: Der Rauchtest wird erneut länger.
- Betrifft künftig: Jedes Paket mit Komponentenverhalten prüft zuerst, ob
  seine Regel als **reine Funktion** in `lib/` testbar ist (billigste Ebene,
  Vorbild `rundenUndKlemmen.ts`); erst wenn der Gegenstand der Handler- oder
  Emit-Weg selbst ist, entsteht eine Component-Spec. CLAUDE.md, Abschnitt
  „Build, Test, Lint", wird von -001 entsprechend fortgeschrieben.

## Alternativen (kurz)

- **Nur Rauchtest, kein `@vue/test-utils`** — verworfen: Der Emit-Vertrag aus
  -001 wäre nur über eine echte Bedienung im Browser prüfbar, also über die
  teuerste und langsamste Ebene, und der Nachweis hinge an einer Engine, die
  laut ADR-0023 Punkt 5 nicht die des Nutzers ist.
- **Nur Component-Tests, kein neuer Rauchtest-Check** — verworfen: jsdom
  wertet Pseudo-Element-Styles nicht aus. Ein Test, der prüft, dass die
  Klasse `--leer` gesetzt ist, wäre gegen den Vor-Korrektur-Stand **grün** —
  dort ist die Klasse ja gerade richtig gesetzt, falsch ist ihre Wirkung.
- **Globale Umstellung auf `environment: 'jsdom'`** — verworfen: ändert die
  Laufumgebung aller Persistenz- und Store-Tests als Nebenwirkung. Die
  Fehlerklasse „Prüfumgebung unbemerkt gewechselt" hat dieses Projekt in
  -001 (Korrekturrunde 09-12) schon einmal teuer bezahlt.
- **`environmentMatchGlobs` / getrennte Vitest-Projekte** — verworfen für
  jetzt: mehr Konfiguration als der Docblock, gleicher Effekt bei einer
  Handvoll Dateien. Die naheliegende Rückfallposition, sobald
  Component-Specs zur Regel statt zur Ausnahme werden.
- **happy-dom statt jsdom** — verworfen: schneller, aber lückenhafter; bei
  einer Simulation ist Vollständigkeit das wertvollere Merkmal.
- **Screenshot-Vergleich für „Thumb sichtbar"** — verworfen: bindet die
  Zusicherung an Pixel und damit an Schriftrendering und Plattform; die
  Eigenschaft ist über berechnete Stile direkt und stabil abfragbar.

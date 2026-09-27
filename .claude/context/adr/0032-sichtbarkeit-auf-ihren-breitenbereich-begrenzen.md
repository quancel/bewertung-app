# ADR-0032: Breitenabhängige Sichtbarkeit wird auf ihren Breitenbereich begrenzt, nicht überschrieben (Präzisierung von ADR-0011 Punkt 5 und ADR-0028 Punkt 2)

- **Status**: accepted. Punkt 7 hat der Nutzer am 2026-09-27 bestätigt
  (siehe „Nutzerentscheidung zu Punkt 7"). Es gibt keinen Vorbehalt mehr.
- **Datum**: 2026-09-27
- **Bounded Context(s)**: `app-shell`, `orte`
- **task_id**: `PO-2026-09-26-002`

## Kontext

Ab `lg` zeigt `shared/ui/MasterDetail.vue` bei offenem Detail **keine**
Listen-Spalte, obwohl ADR-0011 Punkt 2/6 und der Kommentar der Komponente
das Gegenteil zusagen. Die Ausblendregel
`.master-detail--detail-offen .master-detail__liste { display: none }`
(`MasterDetail.vue:58-60`) steht ohne Bedingung, also auch ab `lg`. Die
Gegenregel im `@media (min-width: 1024px)`-Block (`:81-83`) hat nur eine
Klasse, ist damit weniger spezifisch und verliert. Die Detail-Spalte landet
dann als einziges Grid-Element in der ~400px-Spur der Liste. Die Regel
„ohne Detail ist die Detail-Spalte unterhalb `lg` aus" (`:54-56`) funktioniert
nur zufällig: gleiche Spezifität, der `@media`-Block steht später in der Datei.

Das Muster dahinter ist verbreitet: Mobile-first wird ausgeblendet, und ab
`lg` hebt eine Regel das wieder auf. Ob das Aufheben greift, hängt an
Spezifität und Reihenfolge, also an etwas, das beim Lesen einer einzelnen
Regel nicht sichtbar ist. Sobald eine Zustandsklasse dazukommt, kippt das
Ergebnis still. Keine Zusicherung hat es gefangen: Der Rauchtest prüft
„nichts verdeckt, nichts ragt heraus", und eine fehlende Spalte verdeckt
nichts. Der Nutzer hat für die Korrektur ausdrücklich vorgegeben, dass sie
nicht über Spezifität oder Reihenfolge laufen darf.

## Entscheidung

1. **Eine Sichtbarkeitsregel, die nur in einem Breitenbereich gelten soll,
   steht in einem Block, der nur in diesem Bereich gilt.** Außerhalb davon
   gibt es sie nicht, sie wird also auch nicht überschrieben. „Sichtbarkeit"
   heißt hier: `display: none` und alles andere, was ein Element aus dem
   Layout nimmt. Für jedes Element, jede Breite und jeden Zustand
   darf höchstens **eine** Sichtbarkeitsregel zutreffen. Das Ergebnis hängt
   dann weder an Spezifität noch an der Reihenfolge der Regeln.
2. **Der Gegenbereich ist die wörtliche Negation derselben Bedingung:**
   `@media not all and (min-width: 1024px) /* --breakpoint-lg */` neben
   `@media (min-width: 1024px) /* --breakpoint-lg */`. Beide Blöcke decken
   jede Breite ab, und keine liegt in beiden, auch bei gebrochenen
   CSS-Breiten (Zoom, Geräte-Pixelverhältnis). **Nicht zulässig:**
   `max-width: 1023px`, weil es eine Lücke zwischen 1023 und 1024px gibt, in
   der keiner der beiden Blöcke gilt. Ebenfalls nicht zulässig ist die
   Bereichssyntax `(width < 1024px)`: WebKit kann sie erst ab Safari 16.4.
   Auf älteren iPhones trifft die Bedingung dann still nie zu, und das in
   einer Engine, die kein Automatismus prüft (ADR-0023 Punkt 5, ADR-0029).
   Ob der Build (Minifier) die Bedingung unverändert oder in eine
   gleichwertige lückenlose Form überführt, **prüft der Lead im
   Build-Ergebnis**. Dieses ADR schreibt die Eigenschaft vor, nicht das
   Werkzeugverhalten.
3. **„An genau einer Stelle" (ADR-0011 Punkt 5) und „ein `@media`-Block je
   Datei mit wörtlich derselben Bedingung" (ADR-0028 Punkt 2)** sind erfüllt,
   wenn eine Bedingung und ihre wörtliche Negation in **derselben Datei**
   stehen. Das Paar gilt als eine Stelle. Weiterhin verboten sind eine zweite
   Zahl, eine abweichende Bedingung und eine zweite Datei, die denselben
   Umschalter auswertet.
4. **Innerhalb eines Bereichs sind zustandsabhängige Sichtbarkeitsregeln
   disjunkt, nicht überschreibend.** Ihre Selektoren können im selben Zustand
   nie auf dasselbe Element zutreffen. Mögliche Formen sind zwei einander
   ausschließende Zustandsklassen oder die Negation der Zustandsklasse. Die
   Form wählt der Lead. Kein `!important`, kein Selektor, dessen einziger
   Zweck höhere Spezifität ist, keine Cascade Layers als Ordnungsmittel.
5. **Geltungsbereich.** Die Regel gilt ab sofort für `MasterDetail.vue`
   (PO-2026-09-26-002) und für jede neue oder geänderte breitenabhängige
   Sichtbarkeit. **Nicht** gemeint sind Layoutwerte, die mobile-first
   überschrieben werden (Abstände, Richtung, Positionierung in
   `Bereichsnavigation.vue`, `AppRahmen.vue`, `Toast.vue`). Geht dort ein
   Override verloren, entsteht Überlappung oder Überstand, und genau das
   meldet der Rauchtest. Eine verlorene *Ausblendung* oder *Einblendung*
   meldet er nicht.
6. **Verifikation:** Die Spaltensichtbarkeit von Master-Detail ist eine harte
   Rauchtest-Zusicherung. Sie ist als **Eigenschaft** formuliert (ADR-0023
   Punkt 7), gilt je Breite aus `BREITEN` und läuft auf jeder Ansicht, auf der
   der Baustein gerendert ist. Die Erwartung ergibt sich allein aus der Breite
   und daraus, ob die Adresse eine Detailadresse ist. Der Detailinhalt spielt
   keine Rolle. Die Zusicherung ist erst eingerichtet, wenn sie gegen den
   Stand vor der Korrektur rot wird (ADR-0027 Punkt 8).
7. **Grenze (vom Nutzer am 2026-09-27 bestätigt):**
   Die Struktur sichert beim Breitenwechsel „kein Aus-/Einhängen" zu:
   Komponentenzustand, Fokusziel und DOM-Identität bleiben erhalten.
   **Kriterium 6 von PO-2026-09-26-002** („Scroll-Position der Listen-Spalte
   bleibt bei einem Breitenwechsel über 1024px erhalten") bezieht sich
   **nur auf einen einzelnen Wechsel**, nicht auf einen Hin- und Rückweg.
   Den **Scroll-Versatz der Listen-Spalte über einen Hin- und Rückweg**
   (`lg` → unterhalb → `lg`) sichert die Struktur **nicht** zu. Unterhalb
   `lg` ist die Spalte weder sichtbar noch Scroll-Container, und keine
   Plattform sagt zu, dass ein Versatz das überlebt. Der Lead prüft den Fall
   einmal in Chromium und meldet das Ergebnis („erhalten"/„verloren") im
   Handoff. Das ist eine Beobachtung, **keine Zusicherung**: Sie kommt nicht
   als harte Rauchtest-Prüfung dazu, und ein „verloren" macht das Paket
   nicht unfertig. Geht der Versatz verloren, wird er **nicht** per
   JavaScript gerettet: kein `matchMedia`, kein `ResizeObserver`, kein
   gemerkter und wiederhergestellter `scrollTop` (ADR-0028 Punkt 4).

## Nutzerentscheidung zu Punkt 7

- **Datum**: 2026-09-27 (Rückfrage aus dem Einordnen von PO-2026-09-26-002)
- **Frage**: Gilt Kriterium 6 (Scroll-Position der Listen-Spalte bleibt bei
  einem Breitenwechsel über 1024px erhalten) auch für einen Hin- und Rückweg
  (breit → schmal → wieder breit)?
- **Entscheidung**: „Nein, nur einfacher Wechsel". Das ist die empfohlene
  Option, und auf ihr war Punkt 7 bereits formuliert.
- **Folge**: Punkt 7 gilt wie oben geschrieben, verbindlich und nicht mehr
  vorläufig. Einen Abschnitt „Revision" gibt es deshalb nicht. Soll der
  Hin- und Rückweg später doch zugesichert werden, braucht das eine neue
  Nutzerentscheidung und ein neues ADR. Der Grund: Die Zusicherung ginge nur
  über JavaScript, das den Versatz rettet, und das weicht von ADR-0028
  Punkt 4 ab.

## Konsequenzen

- Positiv: Die Zweispaltigkeit ab `lg` ist unabhängig von `detailOffen` und
  vom Detailinhalt. Das folgt aus der Struktur und nicht daraus, dass zwei
  Regeln in der richtigen Reihenfolge stehen. Eine künftige dritte
  Zustandsklasse kann sie nicht mehr still aushebeln.
- Positiv: Die Zusicherung aus Punkt 6 schließt die Lücke „was sichtbar sein
  soll, ist sichtbar" für den einen Baustein, an dem sie gefehlt hat.
- Positiv für PO-2026-09-26-003: Die beiden Spalten-Elemente bleiben die
  Scroll-Container ab `lg`, an derselben Stelle und mit derselben Identität.
  -003 findet eine stabile Detail-Spalte vor, deren Versatz es zurücksetzen
  kann. Wie `Ortebereich.vue` sie erreicht, ohne die Interna des Bausteins zu
  kennen, entscheidet das Einordnen von -003, nicht dieses ADR.
- Negativ/Trade-off: `MasterDetail.vue` bekommt einen zweiten `@media`-Block.
  Das ist die nach Punkt 3 zulässige Negation, keine sechste Stelle mit
  `1024px` im Sinne von ADR-0028.
- Negativ/Trade-off: `Ortebereich.vue` schaltet „Zurück", „×" und „Fertig"
  weiterhin über den reihenfolgeabhängigen Override: eine Klasse, dieselbe
  Spezifität, der `@media`-Block steht später. Das ist bewusst akzeptiert und
  in `code-conventions.md` unter „Abweichungen" eingetragen. Diese Stellen
  hängen nicht an einer Zustandsklasse, und `pruefeAbschlussKombination` deckt
  sie hart ab. Umgestellt werden sie, sobald der Chrome-Block dieser Datei aus
  eigenem Grund angefasst wird.
- Betrifft künftig: jeden Lead, der eine Ein-/Ausblendung an `lg` bindet;
  den `architekt` beim Anreichern der `constraints`.

## Alternativen (kurz)

- **Ab `lg` eine gleich spezifische oder spezifischere Gegenregel**
  (`.master-detail--detail-offen .master-detail__liste { display: block }` im
  `@media`-Block) — verworfen: Das ist derselbe Mechanismus, der den Fehler
  erzeugt hat, nur einmal passend gemacht. Die nächste Zustandsklasse
  reproduziert ihn. Außerdem Nutzervorgabe.
- **`!important` im `lg`-Block** — verworfen: Nutzervorgabe, und es verschiebt
  das Problem in den nächsten Override.
- **`max-width: 1023px` / `1023.98px` als Gegenbereich** — verworfen: eine
  Lücke bzw. ein Näherungswert an der Grenze. Dazu käme eine zweite Zahl, die
  bei einer Änderung des Breakpoints mitgezogen werden muss.
- **Bereichssyntax `(width < 1024px)`** — verworfen: nicht in Safari < 16.4,
  und in der ungeprüften Engine fiele es still aus.
- **`v-show`/`v-if` auf einem JS-Breakpoint** — verworfen: ADR-0011 Punkt 5,
  ADR-0028 Punkt 4. `v-show` setzt zudem einen Inline-Stil, gegen den nur
  `!important` hilft.
- **Cascade Layers (`@layer`) zum Ordnen** — verworfen: Die Abhängigkeit von
  der Reihenfolge bliebe, nur ausdrücklicher formuliert. Dafür käme ein
  weiterer CSS-Mechanismus ins Projekt.

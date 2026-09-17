# ADR-0029: Engine-abhängige **Darstellung** — Chromium bleibt die einzige geprüfte Engine, und was eine Sichtbarkeits-Zusicherung dann tragen muss (Bestätigung und Erweiterung von ADR-0023 Punkt 5)

- **Status**: accepted
- **Datum**: 2026-09-16
- **Bounded Context(s)**: `app-shell`, `bewertungen` (projektweit)
- **task_id**: `PO-2026-09-16-002` (Anlass), Befund aus `PO-2026-09-16-001`

## Kontext

Der Nutzer hat am 2026-09-16 live auf einem iPhone (iOS Safari) geprüft: Der
Commit-Pfad aus PO-2026-09-13-001 funktioniert, die **Sichtbarkeits**-Korrektur
aus PO-2026-09-13-002 nicht. Ursache, vom `product-owner` verifiziert:
`accent-color` tönt bei `<input type="range">` in WebKit im Wesentlichen die
**gefüllte Bahn** links vom Thumb, nicht den Thumb selbst. Bei Position 0 —
das gilt für `null` **und** für eine bewusst gesetzte 0 — ist diese Fläche
null Pixel breit. Es gibt nichts zu färben, der Thumb bleibt ununterscheidbar.

Das ist der **dritte** Befund dieses Projekts, der an einer Engine hängt, die
kein Automatismus fährt — und der erste, bei dem nicht das *Verhalten*,
sondern die *Darstellung* auseinanderfällt:

1. `DataCloneError` beim Schreiben in IndexedDB (PO-2026-09-12-001) — Ursache
   engine-**un**abhängig, der Chromium-Lauf war deshalb ein vollwertiger
   Nachweis (ADR-0023 Punkt 5, erster Spiegelstrich).
2. Touch-Verhalten von WebKit beim Tippen auf die Reglerbahn — als ungeprüft
   benannt (ADR-0027 Punkt 6).
3. **Neu**: eine CSS-Eigenschaft greift in Chromium anders als in WebKit.

Entscheidend ist, was die vorhandene Zusicherung dabei getan hat.
`pruefeReglerGreifbarkeit()` (`scripts/smoke.mjs`) ist mit ADR-0027 sauber
eingerichtet worden, inklusive Rot-Nachweis gegen den Vor-Korrektur-Stand
(ADR-0027 Punkt 8) und mit dem korrigierten CDP-Prüfweg (ADR-0027 Punkt 5).
Sie war gegen den auf iOS **defekten** Stand trotzdem grün — zu Recht: Sie
sichert „der Thumb ist nicht durch `opacity`, `visibility` oder Größe
unbedienbar gemacht", und genau das war er nicht. Kaputt war eine andere
Eigenschaft („der Thumb hebt sich von seiner Umgebung ab"), in einer anderen
Engine.

Eine korrekt gebaute, korrekt rot-nachgewiesene Zusicherung sichert also
weiterhin nur die Eigenschaft, die sie prüft — nicht die, die brechen wird.
Ohne festgehaltene Entscheidung liest der nächste Lead „Regler-Greifbarkeit
ist zugesichert" und schließt daraus mehr, als dort steht.

## Entscheidung

1. **ADR-0023 Punkt 5 gilt unverändert: Der Rauchtest fährt genau eine Engine,
   Chromium.** Am 2026-09-16 erneut vom Nutzer bestätigt, in Kenntnis dieses
   Befundes. **Ausdrücklich abgelehnt** — und damit kein offener Punkt, den ein
   späteres Paket „nachbessern" darf: eine zweite Engine im Rauchtest, gleich
   ob verpflichtend oder optional-übersprungen. Ebenso unberührt: Playwright
   bleibt keine Projekt-Abhängigkeit, `npm run smoke` läuft nicht in CI.
   Der Nachweis auf WebKit ist und bleibt der manuelle Test des Nutzers am
   eigenen Gerät nach dem Deploy.
2. **Der blinde Fleck umfasst ab jetzt ausdrücklich auch die Darstellung.**
   ADR-0023 Punkt 5 unterschied zwei Fälle (Ursache engine-unabhängig →
   Chromium-Lauf ist Nachweis; Ursache WebKit-spezifisch → ist er nicht).
   Der zweite Fall wurde bisher als *Verhaltens*frage gelesen. Er gilt
   gleichermaßen für jede Zusicherung über **gerenderte Erscheinung**:
   Pseudo-Element-Stile (`::-webkit-*`, `::-moz-*`), `appearance`,
   `accent-color`, native Bedienelement-Darstellung. Für diese Klasse ist ein
   grüner Chromium-Lauf **kein** Nachweis — und, anders als bei einer
   fehlenden Prüfung, sieht er wie einer aus.
3. **Was `pruefeReglerGreifbarkeit()` prüft, steht ausgeschrieben** — in der
   Funktion selbst und in `code-conventions.md`, nicht nur hier:
   - **Geprüft**: das `<input type="range">` erfüllt 44×44px; der
     Thumb-Knoten im UA-Schattenbaum existiert und ist nicht durch
     `opacity: 0`, `visibility: hidden` oder eine Größe < 4px unbedienbar
     gemacht. Gelesen über CDP, nie über `getComputedStyle` (ADR-0027 P5).
   - **Nicht geprüft**: Kontrast oder Farbe des Thumbs gegen seine Umgebung ·
     ob eine Autoren-Regel auf dem Thumb in der Ziel-Engine überhaupt
     **greift** · `::-moz-range-thumb` (in Chromium nicht vorhanden) ·
     jede Darstellung in WebKit.
   Die zweite Liste ist der Punkt: Sie ist nicht die Restmenge, sondern genau
   der Bereich, in dem die letzten beiden Befunde lagen.
4. **Der Rauchtest sagt seine Grenze im Lauf selbst**, nicht nur im Kopf des
   Autors und nicht nur im Fehlerfall: Ein **erfolgreicher** Lauf weist
   Zusicherungen über engine-abhängige Darstellung ausdrücklich als „auf
   WebKit ungeprüft" aus. Begründung ist die Asymmetrie aus Punkt 2 — die
   bestehende Skip-Ausgabe für fehlendes Playwright deckt sie nicht ab, denn
   sie greift nur, wenn gar nichts läuft. Formuliert wird die **Eigenschaft**
   („Zusicherungen über engine-abhängige Darstellung"), nicht eine Liste von
   Funktions- oder Klassennamen (ADR-0023 Punkt 7).
5. **Eine Sichtbarkeits-Zusicherung darf nicht an einer einzelnen Eigenschaft
   hängen, deren Ausfallpfad der bekannt defekte Zustand ist.** Wer eine
   Darstellungsregel für die ungeprüfte Engine schreibt, benennt den
   Ausfallpfad — und prüft ihn gegen den **realen Befund**, nicht gegen eine
   plausible Annahme. Der Anlassfall steht als Warnung: Die Begründung „fällt
   unsere Regel aus, zeigt die Engine ihren nativen, von sich aus sichtbaren
   Thumb" ist plausibel und in diesem Projekt **widerlegt** — der native
   iOS-Thumb bei Position 0 auf heller Fläche ist genau der Zustand, den der
   Nutzer als „nicht erkennbar" gemeldet hat. Ein Ausfallpfad, der in den
   gemeldeten Fehler zurückführt, ist keine Degradation, sondern derselbe
   Fehler mit einem anderen Namen.
6. **Ein offener technischer Punkt wird als solcher festgehalten, statt
   stillschweigend in eine Richtung entschieden zu werden.** Offen ist beim
   Schreiben dieses ADR: ob eine Autoren-Regel auf `::-webkit-slider-thumb`
   mit `-webkit-appearance: none` in Blink/WebKit auch dann greift, wenn das
   `<input>` selbst **kein** `appearance: none` trägt. In dieser Umgebung ist
   das nicht verifizierbar: Es gibt keinen WebKit-Lauf (Punkt 1), und der
   Chromium-Befund beantwortet die Frage für WebKit nicht (Punkt 2). Der
   Entscheidungsweg läuft über `design-conventions.md` (Single-Writer
   `ux-ui-designer`), **nicht** über eine stille Abweichung des Leads im Code
   und nicht über eine Abschwächung der Zusicherung (ADR-0023 Punkt 6).
   Stellt ein Lead beim Umsetzen fest, dass eine vorgeschriebene Bauform in
   einer Engine nicht greift, ist das ein `blocked` an den `architekt`.

   **Nachtrag 2026-09-17 — der offene Punkt ist erledigt, aber nicht
   beantwortet.** Die siebte Runde in `design-conventions.md` hat die Frage
   nicht geklärt, sondern **umgangen**: Der Nutzer wurde genau zu dieser
   Abwägung befragt und hat die sichere Variante gewählt, deshalb steht
   `appearance: none` seither auf **beidem** — dem Thumb-Pseudo-Element
   *und* dem `<input>` selbst (`Bewertungsachse.vue`, abgenommen mit
   PO-2026-09-16-001). Damit zeichnet der Regler Bahn und Thumb vollständig
   selbst, und es kommt auf die Antwort nicht mehr an. Ob die reine
   Pseudo-Element-Variante in WebKit gereicht hätte, bleibt **unbeantwortet**
   und ist für dieses Projekt gegenstandslos. Dieser Punkt ist damit eine
   historische Feststellung und **kein laufender Tracker** — wer hier nach
   offener Arbeit sucht, findet keine.

## Konsequenzen

- Positiv: Der teuerste Fehlermodus dieses Projekts — „grün, aber nie rot"
  (ADR-0027 „Korrektur") — bekommt seine zweite Ausprägung benannt: nicht der
  Prüfweg ist falsch, sondern die Reichweite der Zusicherung wird
  überschätzt. Beides sieht im Lauf identisch aus.
- Positiv: Der Bericht eines Leads kann die Frage „worauf stützt sich das
  Häkchen" ab jetzt aus dem Lauf beantworten, statt aus dem Gedächtnis.
- Negativ/Trade-off, unverändert und bewusst getragen: **Die Engine, in der
  die App tatsächlich benutzt wird, prüft kein Automatismus.** Ein vierter
  WebKit-Befund fällt wieder erst in echter Nutzung auf. Dieses ADR
  verkleinert den blinden Fleck nicht, es macht ihn sichtbar — das war die
  Entscheidung des Nutzers, kein Versehen.
- Negativ/Trade-off: Ein Lauf, der seine eigenen Grenzen mitdruckt, wird
  gesprächiger. Der Preis ist gering gegenüber einem „Rauchtest erfolgreich",
  das für mehr gehalten wird, als es sagt.
- Betrifft künftig: Jedes Paket, dessen Ergebnis eine **Darstellung** in der
  ungeprüften Engine ist, benennt im Handoff, welche Kriterien nur manuell
  prüfbar sind (ADR-0023 Punkt 5), und liefert nach Punkt 5 einen
  Ausfallpfad, der nicht in den gemeldeten Fehler zurückführt.

## Alternativen (kurz)

- **Zweite Engine (WebKit) im Rauchtest, verpflichtend oder optional
  übersprungen** — verworfen durch **Nutzerentscheidung 2026-09-16**, in
  Kenntnis des dritten Befundes. Es bleibt bei der Begründung aus ADR-0023:
  kein zweiter Browser-Download in jeder Umgebung, Playwright bleibt keine
  Projekt-Abhängigkeit. Dies ist die naheliegende Rückfallposition und damit
  zugleich die Alternative, die **nicht** nebenbei nachgerüstet wird.
- **Screenshot-/Pixelvergleich als Kontrastnachweis** — verworfen, gleiche
  Begründung wie in ADR-0027 („Alternativen"): bindet die Zusicherung an
  Rendering-Details, und in Chromium gemessene Pixel sagen über WebKit
  ohnehin nichts.
- **Kontrastberechnung des Thumbs in Chromium ergänzen und als Nachweis
  werten** — verworfen als *Nachweis*: Sie belegt Chromium. Als zusätzliche
  Prüfung zulässig, aber nie als Antwort auf ein Kriterium, das eine andere
  Engine nennt.
- **Nur `CLAUDE.md` ergänzen statt eines ADR** — verworfen: Der Lead liest
  vor der `done`-Meldung ADR und `code-conventions.md`; eine Entscheidung mit
  abgelehnter Alternative gehört dorthin, wo die abgelehnte Alternative nicht
  als offene Option missverstanden wird.

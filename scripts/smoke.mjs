/**
 * Rauchtest gegen den Produktions-Build — die fünf Zusicherungen aus
 * `.claude/agent-team/rules/VERIFICATION.md`.
 *
 * Er ersetzt weder Unit-Tests noch die Abnahme. Er fängt die eine Klasse,
 * die beiden davor entgeht: „sieht im Code richtig aus, funktioniert aber
 * nicht". Zwei reale Fehler dieses Projekts sind genau so durch alle
 * Prüfungen gekommen —
 *
 *   - jedes Icon war ein farbiger Kasten, weil ein unquotiertes `url()`
 *     mit einer Data-URI voller Hochkommata ungültig ist und der Browser
 *     die Deklaration verwirft (→ Zusicherung 4);
 *   - das Feld „Adresse" war ohne Netz nicht anklickbar, weil die
 *     Hinweisfläche der Ortssuche vollflächig darüber lag
 *     (→ Zusicherung 5).
 *
 * Beide sind hier als Zusicherung abgebildet, nicht als Einzelfall-Test:
 * geprüft wird die Eigenschaft, nicht die Stelle.
 *
 * Ab PO-2026-09-12-001 (ADR-0023) kommt eine dritte Zusicherung dazu: Ein
 * angelegter Ort übersteht ein Neuladen. Der Befund dahinter — ein
 * reaktives Store-Objekt (Vue-`Proxy`) ist nicht strukturiert klonbar und
 * eine echte IndexedDB lehnt `put()` deshalb synchron mit
 * `DataCloneError` ab — ist NICHT in Vitest prüfbar: `fake-indexeddb`
 * bildet den strukturierten Klon in JavaScript nach und lässt genau den
 * Wert durch, den eine echte Browser-Engine ablehnt. Nur eine echte Engine
 * (hier Chromium) kann das zusichern.
 *
 * Ab PO-2026-09-12-004 (ADR-0023 Punkt 6/7) kommen zwei weitere Lücken
 * dazu, die genau dieser Rauchtest bis dahin selbst hatte:
 *
 *   - Es wurde nur EINE Breite geprüft (1280×900) — ein Telefon kam darin
 *     nicht vor. Jetzt läuft jede Ansicht zusätzlich bei 320px und 390px
 *     CSS-Breite (`BREITEN` unten), mit denselben Zusicherungen.
 *   - `pruefeVerdeckung()` überspringt ein Element STILL, sobald sein
 *     Prüfpunkt außerhalb des sichtbaren Bereichs liegt
 *     (`elementFromPoint` liefert dann `null`). Eine aus dem Bildschirm
 *     ragende Zeile war damit grundsätzlich unauffindbar — nicht nur wegen
 *     der fehlenden Telefonbreite. Das ist jetzt selbst ein Befund (siehe
 *     `pruefeVerdeckung`), und eine eigene Zusicherung „nichts ragt aus
 *     dem Bildschirm" (`pruefeUeberlauf`) prüft die Eigenschaft zusätzlich
 *     unabhängig von einem konkreten Bedienelement.
 *
 * Dazu läuft die Verdeckungsprüfung im Ortsdetail jetzt in ALLEN VIER
 * Hinweiszuständen der Ortssuche (`ORTSSUCHE_ZUSTAENDE` unten) — vorher nur
 * offline. Die vier Zustände entstehen über Request-Interception auf
 * `photon.komoot.io`, NIE über einen echten Aufruf (ADR-0020 Punkt 3:
 * Sparsamkeit gegenüber einem Dienst ohne Rate-Zusage). Eine aktiv
 * bediente Auswahlliste (Trefferliste der Ortssuche, Tag-Vorschlagsliste)
 * darf dabei weiterhin überlagern — das ist kein Befund, siehe
 * `istOffeneAuswahlliste()`.
 *
 * WICHTIG (ADR-0023 Punkt 6, Nutzerentscheidung 2026-09-12): Solange
 * PO-2026-09-12-002 (Koordinatenzeile) und PO-2026-09-12-003 (überlagernde
 * Hinweisfläche) nicht gebaut sind, meldet dieser Rauchtest ihre Befunde zu
 * Recht — das ist das erwartete Ergebnis, keine Abschwächung.
 *
 * Ab PO-2026-09-13-001 (ADR-0027 Punkt 5/6) kommt eine Zusicherung dazu, die
 * ausschließlich der Rauchtest tragen kann: `aufReglerTippen` schrieb im
 * Vor-Korrektur-Stand nur den lokalen Textzustand `eingabe` und emittierte
 * nie — ein Zahlenfeld zeigte dadurch bereits eine Zahl, während dieselbe
 * Achse darunter weiter „Noch nicht bewertet" zeigte (fehlender
 * Zurücksetzen-Knopf/Platzhaltertext), solange der Regler gedrückt gehalten
 * wurde. Ein KLICK allein wäre dafür kein Nachweis: Chromium feuert dabei
 * `input` UND `change`, und `change` committete schon vor der Korrektur —
 * gegen den Vor-Korrektur-Stand wäre eine klickbasierte Prüfung grün und
 * damit wertlos. `pruefeReglerCommitWaehrendZiehens()` hält deshalb die
 * Maustaste über `mouse.down()`/`mouse.move()` gedrückt und prüft die
 * Invariante VOR `mouse.up()`.
 *
 * Ab PO-2026-09-13-002 (ADR-0027 Punkt 5, korrigiert — siehe
 * `pruefeReglerGreifbarkeit()` selbst) kommt eine zweite, unabhängige
 * Zusicherung dazu: Der Thumb eines Reglers war im Zustand `null` per
 * `opacity: 0` auf dem Pseudo-Element vollständig ausgeblendet — ein Nutzer
 * fand den Regler einer frisch angelegten Achse deshalb „nicht existent".
 * `pruefeReglerGreifbarkeit()` prüft das als Eigenschaft, nicht über eine
 * Prüfung auf `accent-color` (Implementierungsdetail) — gelesen über das
 * Chrome DevTools Protocol, NIE über
 * `getComputedStyle(el, '::-webkit-slider-thumb')` aus Seiten-JavaScript:
 * Das liefert in Chromium die UA-Vorgabe statt des Autoren-Stils (ADR-0027
 * Punkt 5, korrigiert). Was die Funktion deckt, steht ausgeschrieben in
 * ihrem eigenen Kommentar (ADR-0029 Punkt 3, deckungsgleich mit
 * `code-conventions.md`). *Nicht geprüft*: Kontrast/Farbe des Thumbs gegen
 * seine Umgebung · ob eine Autoren-Regel auf dem Thumb in der Ziel-Engine
 * überhaupt greift · `::-moz-range-thumb` · jede Darstellung in WebKit ·
 * WebKit-Touchverhalten.
 *
 * Ab PO-2026-09-13-003 (ADR-0028) kommt eine dritte, unabhängige
 * Zusicherung dazu: Der neue Abschluss-Knopf „Fertig" und das vorhandene
 * „×" (Master-Detail, ab `lg`) ersetzen einander über dieselbe
 * `@media`-Bedingung wie „Zurück" — `pruefeAbschlussKombination()` prüft je
 * Breite genau die vorgesehene Kombination, nicht nur „Fertig" isoliert.
 *
 * Ab PO-2026-09-26-001 (ADR-0030) kommen vier weitere Zusicherungen dazu
 * (`pruefeTagUeberlebtNeuladen()`, nur bei 1280px): Ein Tag im Tag-Feld
 * committet auch OHNE Enter — (a) Tab statt Enter verlässt das Feld, der Tag
 * übersteht ein Neuladen UND ist danach über die Filterleiste filterbar (der
 * zweite, vom Nutzer gemeldete Teil des Fehlers); (b1) der Text bleibt im
 * FOKUSSIERTEN Feld stehen, `pagehide` wird am WEITERLEBENDEN Dokument
 * ausgelöst (kein echtes Entladen) — der erste dadurch angestoßene `put()`
 * trägt bereits den Tag, und die Pille übersteht ein anschließendes echtes
 * Neuladen (HART, prüft ADR-0030 Punkt 4); (c) ein Ortswechsel ab `lg`
 * ausschließlich über den Browserverlauf (`goBack`/`goForward`, nie über
 * einen Klick, der selbst schon einen Commit auslösen würde) lässt
 * unbestätigten Text nicht im falschen Feld landen und committet ihn beim
 * vorherigen Ort. Rot-Nachweis gegen den Stand davor: Dort committete
 * ausschließlich Enter.
 *
 * Ab PO-2026-09-26-001/ADR-0031 (Rückläufer nach Fall (b) oben) kommt eine
 * fünfte, GEMELDETE, aber NICHT harte Zusicherung dazu (b2, benannte
 * Ausnahme zu ADR-0023 Punkt 2/7, analog zu „auf WebKit ungeprüft"
 * ADR-0029): Text im fokussierten Feld, ECHTES `seite.reload()`. Kein
 * Mechanismus im Rahmen von ADR-0001/0004 sichert zu, dass ein erst beim
 * Entladen angestoßener Schreibvorgang abschließt — dieser Fall bleibt
 * deshalb ohne Einfluss auf `process.exitCode`, wird aber bei jedem Lauf
 * als „erhalten"/„verloren" ausgegeben (Warnsystem dafür, ob die Härtung in
 * `orte-repository.ts`, `tx.commit()`, in Chromium überhaupt trägt).
 *
 * Ab PO-2026-09-26-002 (ADR-0032) kommt eine harte Zusicherung dazu:
 * `MasterDetail.vue` zeigte die Listen-Spalte bei offener Detailansicht ab
 * `lg` nicht — eine unbedingte Ausblendregel gewann dort per höherer
 * Spezifität gegen die schwächere Gegenregel im `@media`-Block, unabhängig
 * von Reihenfolge und Zustandsklasse. `pruefeMasterDetailSpalten()` läuft
 * für JEDE Ansicht, auf der die Wurzel `.master-detail` im DOM ist (benannte
 * Bedingung, keine Ansichtsnamen-Liste): Ab `lg` müssen beide Spalten
 * gleichzeitig sichtbar, überlappungsfrei und randbündig sein, das Fenster
 * darf nicht scrollen; unterhalb `lg` bleibt nur die dem `detailOffen`-Zustand
 * entsprechende Spalte sichtbar. Dafür kommt eine neue Ansicht dazu
 * (`ortsdetail-unbekannte-id`: eine Detailadresse mit NICHT AUFLÖSENDER ID
 * bei nicht leerem Bestand — anders als die bestehende `adresse-ohne-ziel`,
 * die als Sammelroute standalone rendert, ohne `MasterDetail`), und ein
 * einmaliger Nachweis bei 1280px für den Tag-Filter-Leerzustand bei
 * ausgewähltem Ort (`pruefeTagFilterLeerBeiAusgewaehltemOrt()`). Die vorher
 * nötige Umgehung `klickeOrtHinzufuegenTrotzListenSpaltenBug()` entfällt: Die
 * Listen-Spalte samt ihrem „Ort hinzufügen"-Button ist ab `lg` neben einem
 * offenen Detail jetzt regulär sichtbar und klickbar.
 *
 * Ab PO-2026-09-26-003 (ADR-0033, Korrektur zu ADR-0011 Punkt 6) kommt eine
 * weitere harte Zusicherung dazu: `MasterDetail.vue` scrollt ab `lg` selbst,
 * das `scrollBehavior` des Routers wirkt nur auf das Fenster und erreichte
 * die Detail-Spalte deshalb nie — bei A→B blieb sie auf dem Scroll-Stand von
 * A stehen. `pruefeScrollVersatzUndFokusBeiOrtswechsel()` prüft für JEDE
 * Breite aus `BREITEN` mit `width >= 1024`: Nach A→B, einmal per Klick auf
 * die Listenzeile und einmal ausschließlich über den Browserverlauf, hat der
 * Scroll-Container der Detail-Spalte den Versatz 0 und der Fokus liegt auf
 * „Detailansicht schließen" — mit der Vorbedingung, dass bei A tatsächlich
 * ein Versatz > 0 erreicht wurde (sonst wäre „ist 0" kein Beleg). Zusätzlich
 * hart in derselben Funktion: ein erneuter Klick auf die bereits
 * hervorgehobene Zeile setzt den Versatz NICHT zurück, und die Listen-Spalte
 * behält beim Klick-Wechsel ihren eigenen Versatz.
 *
 * Ab PO-2026-09-27-001 (design-conventions.md „Mehrzeilige Textfelder
 * wachsen mit dem Inhalt") kommt eine harte Zusicherung dazu, die nur eine
 * echte Engine tragen kann: JEDES sichtbare `<textarea>` zeigt seinen Inhalt
 * vollständig, ohne internes Scrollen und ohne manuellen Anfasser
 * (`pruefeMehrzeiligeTextfelder()`, benannte Bedingung — jedes `<textarea>`,
 * keine Klassen-/Ansichtsliste, deckt das Anfangsnotiz-Feld aus
 * PO-2026-09-27-002 automatisch mit ab, sobald es entsteht). Geprüft für
 * DREI WEGE OHNE Tippen in derselben Seitenlebensdauer, die gemessen wird
 * (Treiberaktion und Messgröße getrennt, learnings.md): (1) Mount — die neue
 * Ansicht `ortsdetail-langer-kommentar` legt lange Kommentare an allen vier
 * Achsen an, committet sie und lädt neu, bevor irgendetwas gemessen wird,
 * bei allen drei `BREITEN`; (2) Ortswechsel ab lg PER KLICK von einem Ort mit
 * langem Kommentar zu einem mit einzeiligem (`pruefeMehrzeiligesFeldBeiOrtswechsel()`,
 * seit PO-2026-09-27-004 mit dem dort ergänzten `:key` ein Neumount, s.
 * dessen eigenen Kommentar); (3) eine reine Breitenänderung 1280→390 ohne
 * jede Texteingabe (`pruefeMehrzeiligesFeldBeiBreitenwechsel()`). Die
 * Umsetzung selbst (`shared/composables/useMitwachsendesTextfeld.ts`) muss in
 * jedem unterstützten Browser wirken, nicht nur in Chromium — dieser
 * Rauchtest kann das nur für Chromium belegen (ADR-0023 Punkt 5), WebKit/
 * Firefox bleiben nur manuell prüfbar.
 *
 * Ab PO-2026-09-27-004 (ADR-0035, „mehrere Entwurfsbesitzer: alle abholen,
 * einmal schreiben") kommen vier weitere HARTE Zusicherungen dazu
 * (`pruefeBewertungsachseUeberlebtNeuladen()`, nur bei 1280px, dasselbe
 * Vier-Auslöser-Muster wie bei der Tag-Eingabe oben, jetzt für Zahl UND
 * Kommentar der vier `Bewertungsachse`-Instanzen): (a) Kommentar und Zahl
 * per TAB verlassen überstehen ein Neuladen, ein geleertes Zahlenfeld kommt
 * als „nicht bewertet" zurück, nicht als 0; (b1) DREI gleichzeitig offene
 * Entwürfe — Tag-Text, Kommentar einer Achse, Zahlenwert einer ANDEREN
 * Achse —, `pagehide` am WEITERLEBENDEN Dokument: der ERSTE `put()` trägt
 * bereits alle drei (der eigentliche Nachweis für ADR-0035 Punkt 1, „alle
 * abholen, einmal schreiben"); (c) Ortswechsel ab lg AUSSCHLIESSLICH über
 * den Browserverlauf lässt Kommentar- UND Zahlen-Entwurf bei A, B zeigt
 * danach seine eigenen Werte — geprüft mit einem an A UND B VORAB
 * IDENTISCHEN Kommentar, dem Beleg dafür, dass der Fix über das neue
 * `:key` läuft (ADR-0035 Punkt 5), nicht über einen Watcher, der bei
 * gleichem Wert nicht feuert; (d) sowohl das Schließen `/orte/:a`→`/orte`
 * als auch `visibilitychange`→`hidden` übernehmen beide gleichzeitig
 * offenen Entwürfe. GEMELDET, nicht hart (analog Fall b2 oben): ein ECHTES
 * `seite.reload()` mit Fokus im Kommentarfeld — dieselbe, bereits für Tags
 * dokumentierte, strukturelle Grenze (ADR-0031) gilt für jedes Feld im
 * Ortsdetail.
 *
 * Ab PO-2026-09-27-002 (die Anfangsnotiz, ein neues 100-Zeichen-Kurztextfeld
 * ohne Zeilenumbruch, design-conventions.md „Kurztextfeld mit
 * Zeichenobergrenze") kommen fünf weitere Zusicherungen dazu, davon vier
 * HART (`pruefeAnfangsnotizUeberlebtNeuladen()`, nur bei 1280px): (1) Die
 * Anfangsnotiz übersteht ein Neuladen nach jedem der vier Auslöser aus
 * ADR-0005 Punkt 5 — Feld verlassen, `/orte/:a`→`/orte` (Schließen),
 * `/orte/:a`→`/orte/:b` (Klick auf eine andere Zeile), `visibilitychange`→
 * `hidden` und `pagehide` am WEITERLEBENDEN Dokument (dort zusätzlich HART
 * geprüft: der ERSTE `put()` trägt die Notiz bereits). Anders als bei
 * Tags/Bewertungsachse (ADR-0030/ADR-0035) braucht das KEINE
 * `uebernimmOffeneEingabe`-Orchestrierung: Die Anfangsnotiz hat keinen
 * lokalen Entwurf, jede Eingabe geht sofort über den Store-Setter in den
 * Arbeitsspeicher, und `persistiereOrt` schreibt bei jedem der vier Auslöser
 * ohnehin den vollständigen Datensatz — die Notiz reist "kostenlos" mit. (2)
 * Ab lg landet unbestätigter Text beim Wechsel A→B AUSSCHLIESSLICH über den
 * Browserverlauf (`goBack`/`goForward`, nie Klick) bei A, das Feld zeigt
 * danach B — ohne eigenen `:key` an `AnfangsnotizFeld`, weil die rein aus
 * `ort.anfangsnotiz` gespeiste `:wert`-Prop nach dem Wechsel automatisch den
 * neuen Wert zeigt. (3) Eine 100-Zeichen-Notiz (auch als leerzeichenloses
 * Wort) ist im Feld selbst bei 320px vollständig sichtbar — läuft über die
 * bereits generische `pruefeMehrzeiligeTextfelder()`-Zusicherung aus
 * PO-2026-09-27-001 mit, die neue Ansicht `ortsdetail-lange-anfangsnotiz`
 * liefert dafür nur die Daten. (4) Dieselbe Notiz steht in der Ortsliste bei
 * 320/390/1280px vollständig da, ohne Kürzung, während `pruefeUeberlauf()`
 * läuft — die neue Ansicht `ortsliste-lange-anfangsnotiz` liefert wieder nur
 * die Daten, `Ortszeile.vue`s neue `overflow-wrap: anywhere`-Regel trägt den
 * Rest. (5) Die Verdeckungsprüfung im Ortsdetail läuft zusätzlich mit
 * FOKUSSIERTEM Anfangsnotiz-Feld und sichtbarem Zähler
 * ("{aktuell}/100") — der Zähler steht im normalen Textfluss, verdeckt also
 * nichts. GEMELDET, nicht hart (analog Fall b2 oben, dieselbe strukturelle
 * Grenze ADR-0031): ein ECHTES `seite.reload()` mit Fokus im Anfangsnotiz-Feld.
 *
 * Ab PO-2026-09-27-003 (ADR-0034, Zonenfarben + Hervorhebungs-Schatten der
 * Ortsliste, plus Design-Antwort-Roundtrip zur Kopfzeile) kommen zwei neue
 * Ansichten und zwei neue harte Zusicherungen dazu:
 *
 *   - `ortsliste-zonen` (`bereiteOrtslisteZonenVor()`): alle fünf Zonen, ein
 *     Wert unter der untersten Zonengrenze, die Gruppe „ohne Wert", alle
 *     vier Hervorhebungs-Kombinationen (keine/schwach/stark/beide) und eine
 *     Zonenzeile mit deutlich längerer Bezeichnung als sonst üblich.
 *   - `ortsliste-legende` (`oeffneZonenLegende()`): das offene
 *     Legenden-Sheet. Dafür bekommt `pruefeVerdeckung()` eine neue, benannte
 *     Ausnahme: Elemente HINTER einem offenen modalen Dialog
 *     (`aria-modal="true"`, strukturell für jedes `Sheet.vue`) sind kein
 *     Befund — der Backdrop deckt den ganzen Bildschirm ab, ohne den Rest
 *     der Seite `aria-hidden` zu setzen, jedes dahinterliegende
 *     Bedienelement träfe sonst fälschlich als „verdeckt".
 *   - HART, nur bei 1280px (`pruefeAusgewaehlteZeileSchattenUndName()`, läuft
 *     auf `ortsliste-zonen` weiter): Die ausgewählte Zeile trägt in JEDER
 *     Hervorhebungs-Kombination weiterhin den inset-3px-Auswahlkante-Layer im
 *     BERECHNETEN `box-shadow` (design-conventions.md „Kombination mit der
 *     Auswahlkante" — zwei `box-shadow`-Regeln würden sich sonst ersetzen
 *     statt ergänzen), und die Accessible Name jeder Zeile (Rolle `link`)
 *     enthält den erwarteten Screenreader-Text der Hervorhebung.
 *   - HART, auf JEDER Ansicht/Breite (`pruefeButtonTextUmbruch()`, Empfehlung
 *     der Design-Antwort, hier umgesetzt statt nur gemeldet): Sichtbarer
 *     Button-Text bricht innerhalb seines Buttons nie um — der Fehler, der
 *     zur Korrektur der Kopfzeile führte (Button brach bei 320px auf zwei
 *     Zeilen um, statt dass die Kopfzeile selbst zweizeilig wurde — kein
 *     horizontaler Überlauf, deshalb vom bisherigen Rauchtest nicht
 *     gefangen), jetzt als Eigenschaft geprüft, nicht nur an dieser einen
 *     Stelle. `.ortebereich__kopf` wird dafür selbst zum `@container`
 *     (ADR-0012, analog `.werkzeugleiste`): unterhalb 360px Containerbreite
 *     (320px/390px Viewport fallen beide darunter) zeigt die Kopfzeile mit
 *     `ZonenLegende` zwei Zeilen — Zeile 1 unverändert `<h1>` + Legende,
 *     Zeile 2 ausschließlich „Ort hinzufügen", rechtsbündig UND kompakt
 *     (CSS-Grid statt eines erzwungenen Flex-Umbruchs, s.
 *     `Ortebereich.vue`s Style-Kommentar zur Begründung).
 *
 * Rückläufer zu PO-2026-09-27-003 (ADR-0011, Nachtrag zu Punkt 6,
 * 2026-09-28) kommt eine weitere harte Zusicherung dazu, deterministisch statt
 * vom zufällig angesammelten Bestand eines Laufs abhängig (der ursprüngliche
 * Befund traf zufällig erst `ortsliste-legende`, weil dort zum ersten Mal
 * genug hohe Zeilen im Bestand lagen — s. `.master-detail__liste`/
 * `.master-detail__detail` in `MasterDetail.vue`). `pruefeSpaltenAbgeschlossenerScrollBereich()`
 * legt dafür einen EIGENEN Bestand an (genug Füll-Orte, damit der
 * Listen-Inhalt die Spalte überragt, plus ein alphabetisch später Ort mit
 * Geschmack ≥ 9 — erzeugt den Screenreader-Hinweis
 * `.ortszeile__sr-hervorhebung` tief in der Liste) und prüft für JEDE Breite
 * aus `BREITEN` mit `width >= 1024` und BEIDE `detailOffen`-Zustände: Weder
 * das Fenster noch eine der beiden Spalten selbst wird höher als das
 * Ansichtsfenster. Die Vorbedingung ist Teil der Zusicherung (Listen-Inhalt
 * höher als die Spalte UND ein absolut positioniertes Element im
 * Spalteninhalt unterhalb der sichtbaren Spaltenhöhe) — ohne sie wäre „das
 * Fenster scrollt nicht" kein Beleg für eine wirksame Abschottung, sondern
 * nur dafür, dass nie genug Inhalt vorlag.
 *
 * Aufruf: `npm run smoke` (baut vorher). Bildschirmfotos landen in
 * `.smoke/`, das Verzeichnis ist ignoriert.
 */
import { spawn } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import process from 'node:process'
// `vite.config.ts` ist die einzige Quelle für den GitHub-Pages-Unterpfad
// (`BASE`) — `vite preview` liefert genau darunter aus, nicht unter `/`.
// Node (≥ 22.18, Type Stripping standardmäßig an) importiert die `.ts`-Datei
// direkt, ohne eigene Typ-Syntax zur Laufzeit; `scripts/verify-precache.mjs`
// nutzt denselben Weg. Ändert sich `BASE` dort, ziehen beide Skripte
// automatisch mit, ohne eine dritte Stelle zum Nachpflegen.
import viteConfig from '../vite.config.ts'

const PORT = 4173
// `viteConfig.base` endet auf `/` (z. B. `/bewertung-app/`), jeder Eintrag
// in `ANSICHTEN[].pfad` beginnt selbst mit `/` (z. B. `/orte`) — den
// abschließenden Schrägstrich hier abschneiden, sonst verdoppelt er sich
// bei jedem `BASIS + pfad` unten.
const BASE_PATH = viteConfig.base.replace(/\/$/, '')
const BASIS = `http://localhost:${PORT}${BASE_PATH}`
const FOTOS = '.smoke'

/** Geprüfte Breiten (ADR-0012: ein Prüfparameter des Skripts, keine
 *  Layout-Entscheidung — aus diesem Paket entsteht keine Breakpoint- oder
 *  Viewport-Logik im Anwendungscode). Mindestens 320px und 390px CSS-Breite
 *  kommen mit PO-2026-09-12-004 dazu; 1280×900 bleibt die bisherige
 *  Referenzbreite. Neue Breite gebraucht? Hier eintragen. */
const BREITEN = [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'telefon-320', width: 320, height: 700 },
  { name: 'telefon-390', width: 390, height: 844 },
]

/** Die Ansichten, die der Rauchtest öffnet. `vorbereiten` schafft den
 *  Zustand, den die Ansicht zum Zeigen braucht — ohne Ort gibt es keine
 *  Detailansicht und keinen Marker. */
const ANSICHTEN = [
  { name: 'ortsliste', pfad: '/orte' },
  { name: 'ortsdetail', pfad: '/orte', vorbereiten: legeOrtAnUndOeffneIhn },
  // PO-2026-09-12-005 (ADR-0025), Kriterium 11: der neue Sichtbarkeitszustand
  // des Koordinaten-Notnagels läuft durch dieselben Zusicherungen wie jede
  // andere Ansicht (Verdeckung, Überlauf, CSS-Ressourcen) — ausgelöst über
  // den Reveal-Button, nie über einen echten Photon-Aufruf.
  { name: 'ortsdetail-koordinaten-sichtbar', pfad: '/orte', vorbereiten: legeOrtAnUndOeffneIhnMitKoordinatenReveal },
  { name: 'kartenansicht', pfad: '/orte?ansicht=karte' },
  { name: 'datenbereich', pfad: '/daten' },
  { name: 'adresse-ohne-ziel', pfad: '/gibtesnicht' },
  // PO-2026-09-26-002 (ADR-0032 Punkt 6): deckt die Detailadresse mit
  // NICHT AUFLÖSENDER ID ab — anders als `adresse-ohne-ziel` oben (die
  // Sammelroute `/:pfad(.*)*` rendert `AdresseOhneZiel.vue` STANDALONE, ohne
  // `Ortebereich.vue`/`MasterDetail`). Hier bleibt die Route `ort-detail`,
  // `Ortebereich.vue` zeigt `unbekannt` INNERHALB der Detail-Spalte, die
  // Listen-Spalte bleibt daneben sichtbar (Bestand nicht leer).
  { name: 'ortsdetail-unbekannte-id', pfad: '/orte', vorbereiten: legeOrtAnUndOeffneUnbekannteId },
  // PO-2026-09-27-001: Mount-Weg OHNE Tippen für „Mehrzeilige Textfelder
  // wachsen mit dem Inhalt" — die Kommentare wurden beim Vorbereiten
  // committet und die Seite danach neu geladen; die Messung hier läuft auf
  // einer frischen Seitenlebensdauer ohne weitere Eingabe (Treiberaktion und
  // Messgröße getrennt, s. `legeOrtAnUndOeffneIhnMitLangenKommentaren`).
  { name: 'ortsdetail-langer-kommentar', pfad: '/orte', vorbereiten: legeOrtAnUndOeffneIhnMitLangenKommentaren },
  // PO-2026-09-27-002, Kriterium 3: 100-Zeichen-Anfangsnotiz (leerzeichenloses
  // Wort) im Feld selbst — Detail bleibt offen, `pruefeMehrzeiligeTextfelder()`
  // deckt das bereits generisch ab (benannte Bedingung „jedes sichtbare
  // <textarea>"), diese Ansicht liefert nur die Daten dafür.
  { name: 'ortsdetail-lange-anfangsnotiz', pfad: '/orte', vorbereiten: legeOrtAnUndOeffneIhnMitLangerAnfangsnotiz },
  // PO-2026-09-27-002, Kriterium 4: dieselbe lange Anfangsnotiz, aber in der
  // LISTENZEILE (Detail wieder geschlossen) — bei jeder Breite sichtbar,
  // `pruefeUeberlauf()` deckt „nichts ragt aus dem Bildschirm" bereits
  // generisch ab.
  { name: 'ortsliste-lange-anfangsnotiz', pfad: '/orte', vorbereiten: legeOrtAnUndZeigeIhnInDerListeMitLangerAnfangsnotiz },
  // PO-2026-09-27-003 (ADR-0034): alle fünf Zonen, ein Wert unter 8, die
  // Gruppe „ohne Wert", alle vier Hervorhebungs-Kombinationen und eine
  // Zonenzeile mit langer Bezeichnung — s. `bereiteOrtslisteZonenVor`.
  { name: 'ortsliste-zonen', pfad: '/orte', vorbereiten: bereiteOrtslisteZonenVor },
  // PO-2026-09-27-003, Kriterium „Legende": das offene Legenden-Sheet selbst
  // — deckt zusätzlich `pruefeVerdeckung()`s neue Ausnahme für Elemente
  // hinter einem offenen modalen Dialog ab (der Rest der Seite liegt unter
  // dem `.sheet-backdrop` und wäre sonst fälschlich „verdeckt").
  { name: 'ortsliste-legende', pfad: '/orte', vorbereiten: oeffneZonenLegende },
  // PO-2026-11-24-007: die ZWEITE Listen-Kopfzeile mit Legenden-Auslöser — der
  // Null-Treffer-Zustand (Tag-Filter UND ohne Treffer, Detail geschlossen). Er
  // rendert die Kopfzeile eigenständig, außerhalb von `.master-detail`.
  // `aufraeumen` setzt den Filter zurück (er bliebe sonst für spätere Ansichten aktiv).
  { name: 'ortsliste-keine-treffer', pfad: '/orte', vorbereiten: bereiteOrtslisteKeineTrefferVor, aufraeumen: setzeTagFilterZurueck },
  // PO-2026-11-24-006: die geöffnete Bildvorschau (Vollbild-Dialog) mit drei
  // Bildern, hoch und quer, auf frischer Seite — läuft durch Verdeckung,
  // Überlauf und Button-Umbruch wie jede Ansicht. Die harten Zusicherungen
  // (Blättern, Wischen, Esc, Zurück) stehen in `pruefeBildvorschau`.
  { name: 'bildvorschau', pfad: '/orte', vorbereiten: oeffneBildvorschau },
  // PO-2026-11-24-001 (ADR-0037): die drei Einstiege der Gewichtung, je mit
  // dem LÄNGSTEN Szenarionamen („Fokus Preis-Leistung"), damit Umbruch und
  // Überlauf bei 320px greifen. `aufraeumen` setzt die persistierte Wahl
  // danach auf Ausgewogen zurück (sie bliebe sonst für den Rest des Laufs
  // aktiv und verschöbe Noten/Zonen späterer Ansichten).
  { name: 'ortsliste-gewichtung-hinweis', pfad: '/orte', vorbereiten: zeigeGewichtungHinweis, aufraeumen: setzeGewichtungZurueck },
  { name: 'ortsdetail-gewichtung', pfad: '/orte', vorbereiten: zeigeGewichtungImDetail, aufraeumen: setzeGewichtungZurueck },
  { name: 'gewichtung-sheet', pfad: '/orte', vorbereiten: oeffneGewichtungSheet, aufraeumen: setzeGewichtungZurueck },
  // PO-2026-11-24-002: das Sheet mit offenem Block „Eigene" im WIDERSPRÜCHLICHSTEN
  // Zustand — eine Achse „zählt nicht", die letzte trägt „100 % · muss zählen",
  // dazu die Statuszeile nach einem abgefangenen Versuch. `aufraeumen` stellt
  // auch die eigenen Gewichte auf 1:1:1:1 zurück (sie sind persistiert und
  // bleiben sonst für spätere „Eigene"-Läufe bei anderen Breiten stehen).
  { name: 'gewichtung-eigene', pfad: '/orte', vorbereiten: oeffneEigeneGewichte, aufraeumen: setzeGewichtungZurueck },
  // PO-2026-11-24-004: die Karte mit DICHTEN Markern — Namensetiketten, die
  // einander überlappen (Kollisionsausblendung), sehr lange Namen (gekürzt),
  // eine „10,0" im Kreis und ein Ort ohne Note (nur Punkt). Zuletzt, weil der
  // Bestand Koordinaten trägt und früheren Ansichten sonst Marker beigemischt
  // wären. `eigenerKontext`: Die Ansicht läuft in einem frischen Browser-Kontext
  // (eigene IndexedDB) statt auf der gemeinsamen Seite — acht zusätzliche Orte
  // verlängerten dort die Liste so, dass die Ortssuche-Zustände eine unter der
  // sticky Werkzeugleiste weggescrollte Zeile als „verdeckt" meldeten.
  { name: 'karten-marker', pfad: '/orte', vorbereiten: bereiteKartenMarkerVor, eigenerKontext: true },
  // PO-2026-11-24-005: die Schnellansicht in JEDEM ihrer drei Zustände, mit langen
  // Kommentaren, einer 100-Zeichen-Anfangsnotiz, Tags und sechs Bildern
  // (Bildstreifen läuft über). Je Ansicht ein frischer Browser-Kontext
  // (`eigenerKontext`): Der Bestand trägt Koordinaten und gehört keiner anderen
  // Ansicht. Die harten Zusicherungen stehen in `pruefeSchnellansicht`.
  { name: 'schnellansicht-eingeklappt', pfad: '/orte', vorbereiten: bereiteSchnellansichtVor('eingeklappt'), eigenerKontext: true },
  { name: 'schnellansicht-halb', pfad: '/orte', vorbereiten: bereiteSchnellansichtVor('halb'), eigenerKontext: true },
  { name: 'schnellansicht-voll', pfad: '/orte', vorbereiten: bereiteSchnellansichtVor('voll'), eigenerKontext: true },
]

/** Photon-Endpunkt, NUR zum Abfangen (Request-Interception) — es wird
 *  niemals eine echte Anfrage dorthin durchgelassen (ADR-0020 Punkt 3,
 *  Sparsamkeit gegenüber einem Dienst ohne Rate-Zusage). Die vier
 *  unterscheidbaren Hinweiszustände der Ortssuche entstehen ausschließlich
 *  über die Antwort, die dieses Skript selbst liefert. */
const PHOTON_MUSTER = 'https://photon.komoot.io/**'

/** Die vier Hinweiszustände der Ortssuche (`features/orte/lib/geocoding.ts`),
 *  über Request-Interception erzeugt statt über einen echten Photon-Aufruf.
 *  `wartenMs` ist die Zeit nach dem Tippen, zu der der jeweilige Zustand
 *  sicher aktiv ist (Debounce 300ms + client-eigene Ladezustand-Schwelle
 *  400ms, siehe `geocoding.ts`) — bei „laedt" bewusst VOR der (verzögerten)
 *  Antwort, damit der Zwischenzustand selbst geprüft wird. */
const ORTSSUCHE_ZUSTAENDE = [
  {
    name: 'laedt',
    suchtext: 'Ladezustand-Rauchtest',
    async einrichten(seite) {
      // Die verzögerte Antwort kann nach dem Weiterschalten zum nächsten
      // Zustand ankommen (der Client bricht die alte Anfrage beim Tippen
      // der nächsten selbst ab, ADR-0020 Punkt 3) — `route.fulfill()`
      // wirft dann "Route is already handled", was hier bewusst
      // verschluckt wird: der Zustand selbst wurde längst geprüft.
      await seite.route(PHOTON_MUSTER, async (route) => {
        await new Promise((fertig) => setTimeout(fertig, 1600))
        await route
          .fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features: [] }) })
          .catch(() => {})
      })
    },
    wartenMs: 750,
  },
  {
    name: 'keine_treffer',
    suchtext: 'KeineTrefferRauchtest',
    async einrichten(seite) {
      await seite.route(PHOTON_MUSTER, (route) =>
        route
          .fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features: [] }) })
          .catch(() => {}))
    },
    wartenMs: 1000,
  },
  {
    name: 'fehler',
    suchtext: 'FehlerRauchtest',
    async einrichten(seite) {
      await seite.route(PHOTON_MUSTER, (route) => route.fulfill({ status: 500, body: 'Rauchtest-Fehler' }).catch(() => {}))
    },
    wartenMs: 1000,
  },
  {
    name: 'kein_netz',
    // Kein Tippen nötig: `zeigeKeinNetzHinweis` in Ortssuche.vue hängt
    // ausschließlich am Online-Status, nicht an einer Eingabe.
    suchtext: null,
    async einrichten(seite) {
      await seite.context().setOffline(true)
    },
    async aufraeumen(seite) {
      await seite.context().setOffline(false)
    },
    wartenMs: 500,
  },
]

/** Playwright ist bewusst KEINE Projekt-Abhängigkeit — es zieht einen
 *  Browser nach sich, den CI und Entwicklungsumgebungen meist schon
 *  mitbringen. Gefunden wird es dort, wo es üblicherweise liegt; fehlt es,
 *  sagt der Rauchtest das und endet mit 0, statt einen Build rot zu
 *  färben, der nichts dafür kann. */
async function ladePlaywright() {
  const require = createRequire(import.meta.url)
  const kandidaten = [
    'playwright',
    '/opt/node22/lib/node_modules/playwright/index.mjs',
    '/usr/lib/node_modules/playwright/index.mjs',
  ]
  for (const kandidat of kandidaten) {
    try {
      const modul = await import(kandidat.startsWith('/') ? kandidat : require.resolve(kandidat))
      // Ein CommonJS-Treffer (`require.resolve('playwright')`) liefert die
      // Exporte nur unter `default`, ein ESM-Treffer als benannte Exporte.
      return modul.chromium ? modul : (modul.default ?? null)
    } catch {
      /* nächster Kandidat */
    }
  }
  return null
}

/** `detached: true` legt eine eigene Prozessgruppe an. Ohne sie trifft
 *  `kill` nur `npx`, und der eigentliche `vite`-Prozess lebt weiter — der
 *  Rauchtest laeuft dann durch, endet aber nie. */
function starteVorschau() {
  return spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    detached: true,
  })
}

function beendeVorschau(server) {
  if (!server?.pid) return
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {
    /* Gruppe schon beendet */
  }
}

async function warteAufServer() {
  for (let versuch = 0; versuch < 60; versuch += 1) {
    try {
      // `BASIS` selbst (ohne Endschrägstrich) liefert unter dem
      // GitHub-Pages-Unterpfad einen echten 404 (geprüft), kein Redirect —
      // der Health-Check braucht deshalb den Schrägstrich, den `BASIS +
      // pfad` unten bewusst nicht hat.
      const antwort = await fetch(`${BASIS}/`)
      if (antwort.ok) return true
    } catch {
      /* noch nicht da */
    }
    await new Promise((fertig) => setTimeout(fertig, 500))
  }
  return false
}

async function legeOrtAnUndOeffneIhn(seite, bezeichnung = 'Rauchtest-Ort') {
  // Exakter Name statt der früheren Regex `/hinzuf|anlegen/i` (PO-2026-09-26-002):
  // Seit der Korrektur der Master-Detail-Spaltensichtbarkeit (ADR-0032) ist die
  // Listen-Spalte ab lg neben einem offenen Detail sichtbar, und deren „Ort
  // hinzufügen"-Button steht damit gleichzeitig mit weiteren Elementen im DOM,
  // auf die die Regex ebenfalls passen könnte (z. B. „Bild hinzufügen").
  await seite.getByRole('button', { name: 'Ort hinzufügen', exact: true }).first().click()
  await seite.waitForTimeout(300)
  // `#ort-anlegen-bezeichnung` statt eines allgemeinen
  // `input[type="text"]:visible`-Locators: Ist bereits ein anderer Ort
  // geöffnet (Fall c, `pruefeTagBleibtBeimOrtswechselAmRichtigenOrt` legt
  // einen zweiten Ort an, während der erste offen bleibt), zählen dessen
  // eigene Textfelder (Bezeichnung/Adresse/Tag) für Playwrights `:visible`
  // ebenfalls als sichtbar, obwohl das Sheet sie überlagert — `.first()`
  // träfe dann fälschlich eines davon statt des Sheet-Felds.
  await seite.locator('#ort-anlegen-bezeichnung').fill(bezeichnung)
  await seite.keyboard.press('Enter')
  await seite.waitForTimeout(700)
}

/** PO-2026-09-12-005 (ADR-0025), Kriterium 11: öffnet einen frischen Ort
 *  (ohne Koordinaten, ohne Suche) und klickt den Reveal-Button „Koordinaten
 *  von Hand eintragen" — der einzige Weg, den Sichtbarkeitszustand ohne
 *  echten Photon-Aufruf oder Offline-Simulation zu erzeugen. */
async function legeOrtAnUndOeffneIhnMitKoordinatenReveal(seite) {
  await legeOrtAnUndOeffneIhn(seite)
  await seite.getByRole('button', { name: 'Koordinaten von Hand eintragen' }).click()
  await seite.waitForTimeout(300)
}

/** PO-2026-09-26-002 (ADR-0032 Punkt 6): legt zuerst einen echten Ort an,
 *  damit der Bestand beim Öffnen der unbekannten ID nicht leer ist (die
 *  Listen-Spalte zeigt dadurch tatsächlichen Inhalt statt nur ihres Kopfes),
 *  öffnet danach eine garantiert nicht existierende Detailadresse. */
async function legeOrtAnUndOeffneUnbekannteId(seite) {
  await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Unbekannte-Detailadresse')
  await seite.goto(BASIS + '/orte/rauchtest-existiert-nicht', { waitUntil: 'networkidle' })
}

/** Langer Kommentartext für PO-2026-09-27-001 — bewusst deutlich länger als
 *  zwei Zeilen bei jeder geprüften Breite (auch 1280px). */
const LANGER_KOMMENTAR =
  'Dies ist ein sehr langer Kommentartext für den Rauchtest, der bewusst deutlich mehr als zwei Zeilen im Feld belegen soll, damit die automatische Höhenberechnung nachweislich ohne internes Scrollen den kompletten Inhalt zeigt, auch bei einer schmalen Fensterbreite von 320 Pixeln und ganz ohne manuelles Vergrößern durch die Person, die den Ort bewertet.'

/** Zusätzlich eine Zeichenfolge OHNE Leerzeichen (Kriterium „lange
 *  Zeichenfolge ohne Leerzeichen bricht um") — an der ersten Achse, damit
 *  `pruefeUeberlauf()`/`pruefeMehrzeiligeTextfelder()` einen echten
 *  Umbruch-Fall sehen, nicht nur normalen Fließtext. */
const LANGE_ZEICHENFOLGE_OHNE_LEERZEICHEN =
  'https://beispiel-rauchtest.test/ein-sehr-langer-pfad-ohne-leerzeichen-der-in-jedem-feld-umbrechen-muss-1234567890abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz'

/**
 * PO-2026-09-27-001, Weg (1) — Mount OHNE Tippen: legt einen Ort mit langen
 * Kommentaren an ALLEN VIER Achsen an (die erste zusätzlich mit einer
 * leerzeichenlosen Zeichenfolge), committet sie regulär (Tab verlässt das
 * Feld, löst `@blur` aus) und lädt danach NEU. Die eigentliche Messung
 * (Aufrufer) findet erst NACH diesem Neuladen statt — Treiberaktion
 * (Tippen) und Messgröße (Höhe ohne weitere Eingabe) bleiben damit getrennt
 * (learnings.md): Ohne das Neuladen würde nur der `input`-Weg geprüft, nicht
 * der Mount-Weg.
 */
async function legeOrtAnUndOeffneIhnMitLangenKommentaren(seite) {
  await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Langer-Kommentar')

  const achsen = await seite.locator('.bewertungsachse').all()
  for (let i = 0; i < achsen.length; i += 1) {
    const achse = achsen[i]
    await achse.getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    const text = i === 0 ? `${LANGE_ZEICHENFOLGE_OHNE_LEERZEICHEN} ${LANGER_KOMMENTAR}` : LANGER_KOMMENTAR
    await achse.locator('.bewertungsachse__kommentar-feld').fill(text)
    await seite.keyboard.press('Tab') // verlässt das Feld, löst @blur/Commit aus
    await seite.waitForTimeout(150)
  }
  await seite.waitForTimeout(400)

  await seite.reload({ waitUntil: 'networkidle' })
  await seite.waitForTimeout(500)
}

/** Ein 100-Zeichen-„Wort" ohne Leerzeichen für die Anfangsnotiz
 *  (PO-2026-09-27-002) — bewusst LÄNGER als die Zeichenobergrenze (100), damit
 *  dieselbe Aktion gleichzeitig die Kürzung UND den leerzeichenlosen
 *  Umbruch-Fall abdeckt: `normalisiereAnfangsnotiz()` kürzt sie beim Tippen
 *  auf genau 100 Zeichen. */
const LANGE_ANFANGSNOTIZ_OHNE_LEERZEICHEN =
  'RauchtestAnfangsnotizOhneLeerzeichenDieDeutlichLaengerAlsEinhundertZeichenIstUndAufGenauEinhundertZeichenGekuerztWerdenMussOhneEinSurrogatpaarZuZerschneidenXYZ'

/**
 * PO-2026-09-27-002, Weg (1) — Mount OHNE Tippen (analog
 * `legeOrtAnUndOeffneIhnMitLangenKommentaren`): legt einen Ort mit einer
 * 100-Zeichen-Anfangsnotiz (leerzeichenloses Wort) an, committet sie regulär
 * (Tab verlässt das Feld) und lädt danach NEU — die eigentliche Messung
 * (Aufrufer, `pruefeMehrzeiligeTextfelder()`) findet erst NACH diesem
 * Neuladen statt.
 */
async function legeOrtAnUndOeffneIhnMitLangerAnfangsnotiz(seite) {
  await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Lange-Anfangsnotiz')
  await seite.locator('#ortsdetail-anfangsnotiz').fill(LANGE_ANFANGSNOTIZ_OHNE_LEERZEICHEN)
  await seite.keyboard.press('Tab') // verlässt das Feld, löst @blur/persistiereJetzt aus
  await seite.waitForTimeout(300)

  await seite.reload({ waitUntil: 'networkidle' })
  await seite.waitForTimeout(500)
}

/**
 * PO-2026-09-27-002, Kriterium „In der Ortsliste steht eine 100-Zeichen-Notiz
 * … vollständig da": dieselbe lange Anfangsnotiz wie oben, aber die
 * Detailansicht wird danach wieder GESCHLOSSEN (`/orte`), damit auch
 * UNTERHALB `lg` (wo eine offene Detailansicht die Listen-Spalte verdeckt)
 * die Listenzeile selbst sichtbar ist und `pruefeUeberlauf()`/
 * `pruefeVerdeckung()` sie erfassen.
 */
async function legeOrtAnUndZeigeIhnInDerListeMitLangerAnfangsnotiz(seite) {
  await legeOrtAnUndOeffneIhnMitLangerAnfangsnotiz(seite)
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  await seite.waitForTimeout(300)
}

/** Setzt alle vier Bewertungsachsen des GERADE GEÖFFNETEN Orts (Reihenfolge
 *  im DOM: Ambiente, Zeit, Geschmack, Preis-Leistung, `Ortebereich.vue`) auf
 *  die übergebenen Werte — committet jede Achse einzeln über Tab (verlässt
 *  das Feld, löst `@blur`/den Commit aus, wie `legeOrtAnUndOeffneIhnMitLangenKommentaren`). */
async function setzeAlleAchsenwerte(seite, werte) {
  const achsen = await seite.locator('.bewertungsachse').all()
  for (let i = 0; i < achsen.length; i += 1) {
    await achsen[i].locator('input[type="number"]').fill(String(werte[i]))
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(100)
  }
}

/**
 * PO-2026-09-27-003 (ADR-0034), Nachweis für die Zonenfarben +
 * Hervorhebungs-Schatten der Ortsliste: legt für jede der fünf Zonen einen
 * Ort mit passender Gesamtnote an. Die Zonengrenzen 8,5/9,5 liegen zwischen
 * den elf ganzzahligen Achsenwerten (ADR-0007 Punkt 7, ein einzelner Regler
 * kann keine 8,5 einstellen) — erreicht wird das über den UNGEWICHTETEN
 * Mittelwert zweier unterschiedlicher Achsenwerte (`shared/lib/gesamtnote.ts`),
 * nicht über einen einzelnen Achsenwert. Dazu ein Ort ganz ohne Bewertung
 * (Gruppe „ohne Wert") und ein Ort mit einem Wert unter der untersten
 * Zonengrenze (kein Rahmen, keine Farbe). Von den vier Hervorhebungs-
 * Zuständen ergeben sich „keine" (Zone 8), „stark" (Zone 8,5: Geschmack 8,
 * Preis-Leistung 9) und „beide" (Zone 9/9,5/10: beide Achsen ≥ 9) bereits
 * aus den Zonen-Orten selbst — „schwach" (Geschmack ≥ 9, Preis-Leistung < 9)
 * bekommt einen eigenen, zonenlosen Ort. Eine der Zonen-Bezeichnungen ist
 * bewusst deutlich länger als üblich (Kriterium „eine Zonenzeile mit langer
 * Bezeichnung").
 *
 * Sortiert am Ende auf „Gesamtnote" um (`Werkzeugleiste.vue`s Sortier-Sheet):
 * Ohne ein Kriterium mit echtem Wertevergleich (Gesamtnote oder Einzelachse)
 * zeigt keine Zeile ihren Wert-Slot und damit auch keine Zonenfarbe
 * (`Ortszeile.vue`, `achsenWert`/`gesamtnote`-Zweige), und die Gruppe „ohne
 * Wert" bliebe leer (`shared/lib/sortierung.ts`).
 */
async function bereiteOrtslisteZonenVor(seite) {
  const zonenOrte = [
    { bezeichnung: 'Rauchtest-Zone-8', achsen: [8, 8, 8, 8] },
    { bezeichnung: 'Rauchtest-Zone-8-5', achsen: [8, 9, 8, 9] },
    {
      bezeichnung: 'Rauchtest-Zone-9-Mit-Einer-Deutlich-Laengeren-Bezeichnung-Als-Sonst-In-Dieser-Liste-Ueblich',
      achsen: [9, 9, 9, 9],
    },
    { bezeichnung: 'Rauchtest-Zone-9-5', achsen: [9, 10, 9, 10] },
    { bezeichnung: 'Rauchtest-Zone-10', achsen: [10, 10, 10, 10] },
    { bezeichnung: 'Rauchtest-Zone-Schwach', achsen: [5, 5, 9, 5] },
    { bezeichnung: 'Rauchtest-Zone-Unter-8', achsen: [7, 7, 7, 7] },
  ]

  for (const ort of zonenOrte) {
    await legeOrtAnUndOeffneIhn(seite, ort.bezeichnung)
    await setzeAlleAchsenwerte(seite, ort.achsen)
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await seite.waitForTimeout(200)
  }

  // Gruppe „ohne Wert": ein Ort ganz ohne Bewertung.
  await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Zone-Ohne-Wert')
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  await seite.waitForTimeout(200)

  await seite.locator('.werkzeugleiste__chip').click()
  await seite.waitForTimeout(200)
  await seite.locator('.sortier-sheet__eintrag', { hasText: 'Gesamtnote' }).click()
  await seite.waitForTimeout(300)
}

/**
 * PO-2026-09-27-003, Kriterium „Legende": öffnet das Zonenlegende-Sheet über
 * den Text-Button „Legende" in der Kopfzeile — kein echter Ortsbestand nötig, die
 * Legende erklärt sich unabhängig davon.
 *
 * Setzt zuerst die Sortierung auf „Bezeichnung" zurück: `bereiteOrtslisteZonenVor`
 * (läuft als `vorbereiten` der VORHERGEHENDEN Ansicht in derselben
 * Seitensitzung) hinterlässt „Gesamtnote" als PERSISTIERTE Einstellung
 * (`orte.store.ts`, `schreibeEinstellung`) — ohne Reset bliebe sie für den
 * Rest des Laufs aktiv und verschöbe in `pruefeOrtssucheZustaende()` (läuft
 * auf DERSELBEN Seite weiter) die am höchsten bewertete Zonen-Zeile an den
 * Listenanfang, direkt unter die sticky Werkzeugleiste — ein Fehlbefund
 * (keine echte Verdeckung), nachgewiesen gegen den Stand ohne diesen Reset:
 * `desktop-1280/ortsdetail (Ortssuche: …)` meldete dort fälschlich eine
 * verdeckte `.ortszeile--hervorhebung-beide`. Der Zonen-Bestand samt „ohne
 * Wert"-Gruppe ist zu diesem Zeitpunkt bereits im Bildschirmfoto von
 * `ortsliste-zonen` festgehalten — die Legende selbst braucht keine
 * bestimmte Sortierung.
 */
async function oeffneZonenLegende(seite) {
  await seite.locator('.werkzeugleiste__chip').click()
  await seite.waitForTimeout(200)
  await seite.locator('.sortier-sheet__eintrag', { hasText: 'Bezeichnung' }).click()
  await seite.waitForTimeout(200)

  await seite.locator('.zonen-legende__knopf').click()
  await seite.waitForTimeout(300)
}

/**
 * PO-2026-11-24-007: erzeugt den Null-Treffer-Zustand der Liste (`zeigeNurGefiltertLeer`,
 * Detail geschlossen): zwei Orte mit je eigenem Tag, Tag-Filter UND auf beide —
 * kein Ort trägt beide Tags. Dieser Zweig hat eine eigene Kopfzeile (mit
 * Legenden-Auslöser) neben der der Master-Detail-Liste.
 */
async function bereiteOrtslisteKeineTrefferVor(seite) {
  for (const kennung of ['a', 'b']) {
    await legeOrtAnUndOeffneIhn(seite, `Rauchtest-Keine-Treffer-${kennung.toUpperCase()}`)
    await seite.locator('.tag-eingabe__feld').fill(`k${kennung}`)
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(300)
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await seite.waitForTimeout(200)
  }
  await seite.locator('.tag-filterleiste__segment', { hasText: 'UND' }).click()
  await seite.locator('.tag-filterleiste__pill', { hasText: /^\s*ka\s*$/ }).click()
  await seite.locator('.tag-filterleiste__pill', { hasText: /^\s*kb\s*$/ }).click()
  await seite.waitForTimeout(300)
}

async function setzeTagFilterZurueck(seite) {
  const knopf = seite.locator('.tag-filterleiste__zuruecksetzen')
  if ((await knopf.count()) > 0) await knopf.click()
  await seite.waitForTimeout(200)
}

/** PO-2026-11-24-006: drei echte PNGs (hoch, quer, hoch) — im Browser über
 *  ein Canvas erzeugt, damit der Rauchtest keine Binärdateien mitführt. Jedes
 *  Bild hat eine eigene Farbe und eine Randmarkierung, damit „vollständig,
 *  nicht beschnitten" am Seitenverhältnis des gerenderten Elements messbar
 *  ist. */
async function erzeugeTestbilder(seite, formate) {
  const base64 = await seite.evaluate(async (liste) => {
    const farben = ['#c0392b', '#2980b9', '#27ae60']
    const ergebnis = []
    for (const [i, [w, h]] of liste.entries()) {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = farben[i % farben.length]
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 8
      ctx.strokeRect(4, 4, w - 8, h - 8)
      ergebnis.push(canvas.toDataURL('image/png').split(',')[1])
    }
    return ergebnis
  }, formate)
  return base64.map((daten, i) => ({
    name: `rauchtest-bild-${i + 1}.png`,
    mimeType: 'image/png',
    buffer: Buffer.from(daten, 'base64'),
  }))
}

const BILDVORSCHAU_FORMATE = [
  [300, 600],
  [600, 300],
  [300, 600],
]

/** Legt einen Ort mit den übergebenen Bildern an und wartet auf alle Kacheln.
 *  Treiberaktion — die Messgröße (Dialog) wird erst danach erzeugt. */
async function legeOrtMitBildernAn(seite, bezeichnung, formate) {
  await legeOrtAnUndOeffneIhn(seite, bezeichnung)
  const dateien = await erzeugeTestbilder(seite, formate)
  await seite.locator('input[type="file"]').setInputFiles(dateien)
  await seite.locator('.bildkachel').nth(formate.length - 1).waitFor({ state: 'visible', timeout: 10000 })
  await seite.waitForTimeout(300)
}

async function oeffneBildvorschau(seite) {
  await legeOrtMitBildernAn(seite, 'Rauchtest-Bildvorschau', BILDVORSCHAU_FORMATE)
  await seite.locator('.bildkachel__oeffnen').first().scrollIntoViewIfNeeded()
  await seite.locator('.bildkachel__oeffnen').first().click()
  await seite.getByRole('dialog', { name: 'Bildvorschau' }).waitFor({ state: 'visible' })
  await seite.waitForTimeout(400)
}

/**
 * PO-2026-11-24-001: wählt ein Gewichtungs-Szenario über Einstieg 1 (Zeile
 * „Gewichtung: {Name}" im Sortier-Sheet). Treiberaktion — die Messgröße
 * (Noten, Reihenfolge, Zonen) wird erst danach gelesen. Setzt eine sichtbare
 * Werkzeugleiste voraus (Bestand nicht leer, Liste sichtbar).
 */
async function oeffneGewichtungSheetUeberSortierSheet(seite) {
  await seite.locator('.werkzeugleiste__chip').click()
  await seite.waitForTimeout(200)
  await seite.locator('.sortier-sheet__eintrag', { hasText: 'Gewichtung:' }).click()
  const dialog = seite.getByRole('dialog', { name: 'Gewichtung der Gesamtnote' })
  await dialog.waitFor({ state: 'visible' })
  await seite.waitForTimeout(300)
  return dialog
}

async function waehleGewichtungUeberSortierSheet(seite, name) {
  const dialog = await oeffneGewichtungSheetUeberSortierSheet(seite)
  await dialog.locator('.gewichtung-sheet__name', { hasText: name }).click()
  // Feste Szenarien schließen das Sheet (240ms Übergang).
  await dialog.waitFor({ state: 'detached', timeout: 5000 })
  await seite.waitForTimeout(300)
}

const GEWICHT_ACHSEN = ['ambiente', 'zeit', 'geschmack', 'preisLeistung']

/** Das Zahlenfeld einer Achse im Block „Eigene" (Wert wie der Store ihn kennt). */
function gewichtFeld(dialog, achse) {
  return dialog.locator(`#gewichtung-eigene-${achse}-zahl`)
}

/** Setzt die Gewichte über die Zahlenfelder. `fill` löst genau ein `input`
 *  aus — das ist die „eine Bedienung" (kein Enter, kein Feldwechsel). */
async function setzeEigeneGewichteUeberZahlenfelder(seite, dialog, werte) {
  for (const [achse, wert] of Object.entries(werte)) {
    await gewichtFeld(dialog, achse).fill(String(wert))
    await seite.waitForTimeout(80)
  }
}

/** Stellt sicher, dass es mindestens einen Ort gibt (Werkzeugleiste sichtbar). */
async function stelleOrtSicher(seite) {
  if ((await seite.locator('.werkzeugleiste').count()) > 0) return
  await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Gewichtung-Basis')
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  await seite.waitForTimeout(300)
}

async function zeigeGewichtungHinweis(seite) {
  await stelleOrtSicher(seite)
  await waehleGewichtungUeberSortierSheet(seite, 'Fokus Preis-Leistung')
}

async function zeigeGewichtungImDetail(seite) {
  await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Gewichtung-Detail')
  await seite.locator('.ortsdetail__gewichtung-knopf').click()
  const dialog = seite.getByRole('dialog', { name: 'Gewichtung der Gesamtnote' })
  await dialog.waitFor({ state: 'visible' })
  await seite.waitForTimeout(300)
  await dialog.locator('.gewichtung-sheet__name', { hasText: 'Fokus Preis-Leistung' }).click()
  await dialog.waitFor({ state: 'detached', timeout: 5000 })
  // Treiberaktion und Messgröße getrennt: Playwrights Klick auf den Button
  // scrollt das Fenster selbst — Elemente, die dadurch hinter die feste
  // Kopfzeile des Details rutschen, wären ein Fehlbefund der
  // Verdeckungsprüfung (keine echte Verdeckung). Gemessen wird deshalb in
  // der Ausgangslage der übrigen Ansichten: ganz oben.
  await seite.evaluate(() => window.scrollTo(0, 0))
  await seite.waitForTimeout(300)
}

async function oeffneGewichtungSheet(seite) {
  await stelleOrtSicher(seite)
  await waehleGewichtungUeberSortierSheet(seite, 'Fokus Geschmack')
  // Einstieg 3: die Hinweiszeile über der Liste.
  await seite.locator('.gewichtung-hinweis').getByRole('button', { name: 'Ändern' }).click()
  await seite.getByRole('dialog', { name: 'Gewichtung der Gesamtnote' }).waitFor({ state: 'visible' })
  await seite.waitForTimeout(400)
}

async function oeffneEigeneGewichte(seite) {
  await stelleOrtSicher(seite)
  const dialog = await oeffneGewichtungSheetUeberSortierSheet(seite)
  await dialog.locator('.gewichtung-sheet__name', { hasText: 'Eigene' }).click()
  await seite.waitForTimeout(400)
  // Eine Achse „zählt nicht", die letzte wird zur einzigen über 0 („muss
  // zählen"), ein Versuch auf 0 zeigt die Statuszeile.
  await setzeEigeneGewichteUeberZahlenfelder(seite, dialog, { zeit: 0, geschmack: 0, preisLeistung: 0 })
  await gewichtFeld(dialog, 'ambiente').fill('0')
  await seite.waitForTimeout(300)
}

/** Setzt die persistierte Gewichtung auf Ausgewogen zurück (code-conventions.md
 *  „Ansichten teilen Einstellungen"). */
async function setzeGewichtungZurueck(seite) {
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  await seite.waitForTimeout(300)
  // Seit PO-2026-11-24-002 auch die EIGENEN Gewichte: Sie überstehen die Wahl
  // eines festen Szenarios (das ist Absicht) und würden sonst für die nächste
  // „Eigene"-Vorbereitung bei einer anderen Breite stehen bleiben. Erst auf
  // 1:1:1:1 (jeder Schritt ist ein gültiger Zustand, kein „muss zählen"),
  // dann Ausgewogen.
  const dialog = await oeffneGewichtungSheetUeberSortierSheet(seite)
  await dialog.locator('.gewichtung-sheet__name', { hasText: 'Eigene' }).click()
  await seite.waitForTimeout(300)
  await setzeEigeneGewichteUeberZahlenfelder(seite, dialog, { ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 1 })
  await dialog.locator('.gewichtung-sheet__name', { hasText: 'Ausgewogen' }).click()
  await dialog.waitFor({ state: 'detached', timeout: 5000 })
  await seite.waitForTimeout(300)
}

/** Zusicherung 4: Was über CSS geladen wird, ist aufgelöst. Ein `.icon`
 *  mit `mask-image: none` und gesetzter Hintergrundfarbe ist ein farbiger
 *  Kasten — im DOM vorhanden, im Test „sichtbar", für den Nutzer kaputt. */
function pruefeCssRessourcen() {
  const kaputt = []
  for (const el of document.querySelectorAll('.icon')) {
    const maske = getComputedStyle(el).maskImage
    if (maske === 'none' || maske === '') {
      kaputt.push(el.className + ' → mask-image: ' + (maske || '(leer)'))
    }
  }
  return kaputt
}

/**
 * Zusicherung 5: Kein Bedienelement ist verdeckt.
 *
 * PO-2026-09-12-004 (ADR-0023 Punkt 6/7) ändert drei Dinge gegenüber der
 * ursprünglichen Fassung:
 *
 * 1. Geprüft werden Mittelpunkt UND die vier Kantenmitten statt nur des
 *    Mittelpunkts. Eine Überlagerung, die nur einen Rand trifft (z. B. eine
 *    knapp zu kurze Hinweisfläche, die den oberen Rand des nächsten Felds
 *    streift), bliebe am Mittelpunkt unentdeckt. Kantenmitten statt Ecken,
 *    weil `border-radius` an echten Ecken Randpixel abrundet und dort
 *    fälschlich „nichts" träfe.
 * 2. Liegt ein Prüfpunkt jenseits der Viewport-BREITE, ist das jetzt selbst
 *    ein Befund statt eines stillen `continue` bei `elementFromPoint ===
 *    null` — eine aus dem Bildschirm ragende Zeile war sonst grundsätzlich
 *    unauffindbar, nicht nur bei falscher Breite (Befund 2,
 *    PO-2026-09-12-002). Jenseits der Viewport-HÖHE ist dagegen normales
 *    Scrollen (die Seite darf länger sein als der Bildschirm) und bleibt
 *    kein Befund — nur dieser eine Prüfpunkt liefert dann keine Aussage,
 *    ein anderer Prüfpunkt desselben Elements entscheidet. Ein Element, das
 *    komplett außerhalb des Ansichtsfensters liegt (z. B. das
 *    Skip-Link-Muster, das erst bei Tastaturfokus einblendet), wird
 *    weiterhin gar nicht erst geprüft — das ist kein Überlauf-Bug, sondern
 *    Absicht, und wird durch den bestehenden Sichtbarkeits-Vorfilter
 *    ausgeschlossen (siehe unten, jetzt auch für die Breite).
 * 3. Eine aktiv bediente Auswahlliste (Trefferliste der Ortssuche,
 *    Tag-Vorschlagsliste — design-conventions.md „Vorschlagsliste
 *    (Autocomplete)", PO-2026-09-12-003) darf das nachfolgende Feld
 *    überlagern; das ist kein Befund. Erkannt wird die BAUFORM
 *    (`istOffeneAuswahlliste`), nie eine Datei-ID oder ein Klassenname.
 * 4. Neu durch die Telefonbreiten (dieses Paket öffnet erstmals Ansichten
 *    unterhalb `--breakpoint-lg`, wo `Bereichsnavigation.vue` als fixierte
 *    Bottom-Tab-Leiste rendert statt als Nav-Rail): persistente, fixierte
 *    App-Chrome (`position: fixed`) wird ausgenommen, wenn das verdeckte
 *    Element selbst nicht ebenfalls fixiert ist (`istFixierteChrome`).
 *    Dieser Rauchtest scrollt nicht; `AppRahmen.vue` reserviert die Höhe der
 *    Leiste bereits über `padding-bottom` am Inhalt, echter Inhalt am Ende
 *    einer langen Ansicht liegt deshalb nur VOR dem Scrollen unter der
 *    Leiste — anders als eine lokale Überlagerungsfläche (Punkt 3), die im
 *    selben Scrollkontext liegt und dauerhaft überlappt.
 */
function pruefeVerdeckung() {
  function bezeichner(el) {
    if (el.id) return '#' + el.id
    const klasse = typeof el.className === 'string' ? el.className : el.getAttribute('class') || ''
    return el.tagName.toLowerCase() + (klasse ? '.' + klasse.trim().replace(/\s+/g, '.') : '')
  }

  /** Die Ausnahme steht als Bedingung, nie als Liste von IDs/Klassennamen
   *  einzelner Dateien (ADR-0023 Punkt 7) — sie gilt strukturell für jedes
   *  Vorkommen des Musters: eine absolut positionierte Fläche, die im
   *  selben Elternknoten wie ein Eingabefeld liegt UND mindestens einen
   *  anklickbaren Vorschlag enthält. Eine Fläche, die nur einen Hinweistext
   *  ohne Button zeigt (lädt/keine Treffer/Fehler), erfüllt das NICHT —
   *  das ist genau der noch offene Befund 3 (PO-2026-09-12-003).
   */
  function istOffeneAuswahlliste(element) {
    let kandidat = element
    while (kandidat && kandidat !== document.body) {
      if (getComputedStyle(kandidat).position === 'absolute') {
        const hatNachbarfeld = kandidat.parentElement?.querySelector('input') != null
        const hatVorschlagsButton = kandidat.querySelector('button') != null
        return hatNachbarfeld && hatVorschlagsButton
      }
      kandidat = kandidat.parentElement
    }
    return false
  }

  /** Persistente, fixierte App-Chrome (Bottom-Tab-Leiste/Nav-Rail,
   *  `position: fixed`, AppRahmen.vue) wird von dieser Prüfung ausgenommen,
   *  wenn das verdeckte Element selbst nicht ebenfalls fixiert ist: Dieser
   *  Rauchtest scrollt nicht, `AppRahmen.vue` reserviert die Höhe der Leiste
   *  aber bereits über `padding-bottom` am Inhalt — ob darunterliegender
   *  Inhalt beim tatsächlichen Scrollen erreichbar ist, hängt vom
   *  Scrollzustand ab, den dieser Test nicht verändert, und ist nicht
   *  dieselbe Eigenschaft wie eine lokale, absolut positionierte
   *  Überlagerungsfläche (Ortssuche/Tag-Vorschlagsliste), die IM SELBEN
   *  Scrollkontext wie das verdeckte Feld liegt und sich beim Scrollen mit
   *  ihm mitbewegt — deren Überlappung bleibt dauerhaft, diese hier nicht. */
  function istFixierteChrome(element) {
    let kandidat = element
    while (kandidat && kandidat !== document.body) {
      if (getComputedStyle(kandidat).position === 'fixed') return true
      kandidat = kandidat.parentElement
    }
    return false
  }

  /** Elemente HINTER einem offenen modalen Dialog (PO-2026-09-27-003,
   *  `ZonenLegende.vue`s Sheet, aber strukturell für jedes `Sheet.vue`):
   *  Der Backdrop (`.sheet-backdrop`, `position: fixed; inset: 0`) deckt den
   *  gesamten Bildschirm ab, ohne den Rest der Seite `aria-hidden` zu
   *  setzen — jedes dahinterliegende Bedienelement träfe sonst fälschlich
   *  als „verdeckt vom Backdrop". Geprüft wird die ARIA-Eigenschaft
   *  (`aria-modal="true"`), nicht ein Klassenname: `oben` selbst liegt
   *  entweder INNERHALB des Dialogs (Treffer im sichtbaren Panel-Bereich)
   *  oder ist ein VORFAHRE des Dialogs (der Backdrop trifft für jeden Punkt
   *  außerhalb des Panels). Ein Element, das ein anderes Element INNERHALB
   *  desselben Dialogs verdeckt, bleibt dadurch bewusst ungeprüft — kein
   *  Fall in dieser App (die vorhandenen Sheets zeigen nur statische Inhalte
   *  + einen Schließen-Button ohne eigene Überlagerungsgefahr). */
  function istHinterOffenemModalenDialog(element) {
    if (element.closest('[aria-modal="true"]')) return true
    return element.querySelector('[aria-modal="true"]') != null
  }

  /** Benannte Bedingung (ADR-0023 Punkt 7, PO-2026-11-24-005): ein Punkt, der
   *  außerhalb des SICHTBAREN Teils eines horizontalen Scroll-Streifens liegt
   *  (`overflow-x: auto|scroll` bei `overflow-y: hidden|clip`, z. B. der
   *  Bildstreifen der Schnellansicht), ist kein Prüfpunkt: Dort ist das Element
   *  nicht sichtbar, es ragt nicht aus dem Bildschirm. Spalten, die vertikal
   *  scrollen (`overflow-y: auto`), zählen NICHT — die Ausnahme betrifft nur
   *  einen Streifen, der strukturell nur horizontal scrollt. */
  function liegtAusserhalbDesSichtbarenStreifens(element, x) {
    for (let vorfahr = element.parentElement; vorfahr && vorfahr !== document.body; vorfahr = vorfahr.parentElement) {
      const stil = getComputedStyle(vorfahr)
      const horizontal = stil.overflowX === 'auto' || stil.overflowX === 'scroll'
      const vertikalZu = stil.overflowY === 'hidden' || stil.overflowY === 'clip'
      if (horizontal && vertikalZu) {
        const rahmen = vorfahr.getBoundingClientRect()
        return x < rahmen.left || x > rahmen.right
      }
    }
    return false
  }

  /** Benannte Bedingung (ADR-0023 Punkt 7, PO-2026-11-24-005): Eine NICHT modale
   *  Überlagerung (`role="dialog"` ohne `aria-modal`), die vollständig auf der
   *  Fläche des Elements sitzt (ihr Rechteck liegt innerhalb seines Rechtecks),
   *  verdeckt es nicht, sondern belegt einen Teil davon — die Schnellansicht auf
   *  der Karte: Der Kartencontainer ist fokussierbar (Leaflet) und liegt unter
   *  ihr, bleibt aber über den freien Teil bedienbar. Ein kleines Bedienelement
   *  (Marker, Button), das nur teilweise unter einer solchen Fläche liegt, enthält
   *  ihr Rechteck nie und bleibt ein Befund; für Marker steht die harte
   *  Gegen-Zusicherung in `pruefeSchnellansicht`. Die Gegenprobe am synthetischen
   *  DOM steht in `pruefeAusnahmenGegenprobe`. */
  function ueberlagerungSitztAufDemElement(element, oben) {
    const dialog = oben.closest('[role="dialog"]:not([aria-modal="true"])')
    if (!dialog || dialog.contains(element)) return false
    const d = dialog.getBoundingClientRect()
    const e = element.getBoundingClientRect()
    return d.left >= e.left - 1 && d.right <= e.right + 1 && d.top >= e.top - 1 && d.bottom <= e.bottom + 1
  }

  const verdeckt = []
  const auswahl = 'button, input, select, textarea, a[href], [role="button"], [tabindex]:not([tabindex="-1"])'
  for (const el of document.querySelectorAll(auswahl)) {
    // Absichtlich versteckte Elemente sind kein Befund: der per Button
    // ausgelöste Datei-Eingang etwa liegt als 1x1-Fläche mit `clip` und
    // `aria-hidden` irgendwo im Baum. Er SOLL verdeckt sein.
    if (el.getAttribute('tabindex') === '-1') continue
    if (el.closest('[aria-hidden="true"]')) continue
    // Benannte Ausnahme (ADR-0039 Punkt 7, PO-2026-11-24-005): ein Element in
    // einem `[inert]`-Teilbaum ist weder bedienbar noch fokussierbar (wie
    // `aria-hidden`: kein Tippziel, das etwas verdecken könnte). Weil das einen
    // echten Befund verschlucken kann, steht die harte Gegen-Zusicherung in
    // `pruefeSchnellansicht` (Marker unter der Schnellansicht sind `inert` und
    // genau die).
    if (el.closest('[inert]')) continue
    const kasten = el.getBoundingClientRect()
    if (kasten.width < 4 || kasten.height < 4) continue
    // Komplett außerhalb des Ansichtsfensters (oben/unten wie bisher, jetzt
    // auch links/rechts) ist kein Überlauf-Bug, sondern z. B. das
    // Skip-Link-Muster oder schlicht noch nicht heruntergescrollter Inhalt —
    // das ist NICHT dasselbe wie ein Element, das nur TEILWEISE herausragt
    // (Befund 2 aus -002: sichtbarer linker Rand, Rest jenseits der Breite).
    if (kasten.bottom < 0 || kasten.top > innerHeight) continue
    if (kasten.right < 0 || kasten.left > innerWidth) continue
    const stil = getComputedStyle(el)
    if (stil.visibility === 'hidden' || stil.opacity === '0') continue

    const mitteX = kasten.x + kasten.width / 2
    const mitteY = kasten.y + kasten.height / 2
    const pruefpunkte = [
      [mitteX, mitteY],
      [mitteX, kasten.top + 1],
      [mitteX, kasten.bottom - 1],
      [kasten.left + 1, mitteY],
      [kasten.right - 1, mitteY],
    ]

    for (const [x, y] of pruefpunkte) {
      if (liegtAusserhalbDesSichtbarenStreifens(el, x)) continue
      // Jenseits der Viewport-BREITE ist in dieser App nie vorgesehen
      // (ADR-0012) — anders als vertikales Scrollen (das Dokument darf
      // länger sein als der Bildschirm) ist das immer ein Befund, sofort
      // und ohne `elementFromPoint`: genau die Lücke aus Befund 2
      // (PO-2026-09-12-002), die `elementFromPoint` bisher still verschluckt
      // hat, weil der Punkt dort schlicht `null` liefert.
      if (x < 0 || x > innerWidth) {
        verdeckt.push(`${bezeichner(el)} liegt an Punkt (${Math.round(x)},${Math.round(y)}) jenseits der Viewport-Breite`)
        break
      }
      // Jenseits der Viewport-HÖHE ist dagegen normales Scrollen (eine
      // Seite darf länger sein als der Bildschirm) — kein Befund, nur
      // dieser eine Prüfpunkt liefert hier keine Aussage.
      if (y < 0 || y > innerHeight) continue
      const oben = document.elementFromPoint(x, y)
      // `null` trotz Punkt innerhalb beider Achsen (z. B. Rundung am
      // abgerundeten Rand) ist nicht zuordenbar — anderer Prüfpunkt
      // entscheidet.
      if (!oben) continue
      if (oben === el || el.contains(oben) || oben.contains(el)) continue
      if (istOffeneAuswahlliste(oben)) continue
      if (stil.position !== 'fixed' && istFixierteChrome(oben)) continue
      if (!el.closest('[aria-modal="true"]') && istHinterOffenemModalenDialog(oben)) continue
      if (ueberlagerungSitztAufDemElement(el, oben)) continue
      verdeckt.push(`${bezeichner(el)} verdeckt von ${bezeichner(oben)}`)
      break
    }
  }
  return verdeckt
}

/**
 * Neue Zusicherung ab PO-2026-09-12-004 (ADR-0023 Punkt 6): nichts ragt aus
 * dem Bildschirm. Geprüft wird die Eigenschaft über zwei Wege — ein
 * horizontal scrollbares Dokument insgesamt, und jedes einzelne Element,
 * dessen Rand über die Viewport-Breite hinausreicht. Befund 2
 * (PO-2026-09-12-002, die Koordinatenzeile ab ~390px) ist der bekannte,
 * noch nicht behobene Fall.
 */
function pruefeUeberlauf() {
  function bezeichner(el) {
    if (el.id) return '#' + el.id
    const klasse = typeof el.className === 'string' ? el.className : el.getAttribute('class') || ''
    return el.tagName.toLowerCase() + (klasse ? '.' + klasse.trim().replace(/\s+/g, '.') : '')
  }

  const befunde = []
  const breite = document.documentElement.clientWidth

  if (document.documentElement.scrollWidth > breite + 1) {
    befunde.push(
      `Dokument ist horizontal scrollbar: Inhalt ${document.documentElement.scrollWidth}px breit, Ansichtsfenster ${breite}px`,
    )
  }

  /** Benannte Bedingung (ADR-0023 Punkt 7, PO-2026-11-24-004): Das Element wird
   *  von seinem nächsten Vorfahren mit `overflow-x: hidden|clip` horizontal
   *  abgeschnitten, und dieser Vorfahr liegt selbst vollständig im Bildschirm —
   *  der Überstand ist dann nie sichtbar. Das trifft strukturell jede
   *  Kachelfläche einer Karte (Leaflet-Kacheln ragen über den Container hinaus
   *  und werden von ihm abgeschnitten), keine Klassen-/ID-Liste. Ein Element,
   *  das aus einem NICHT abschneidenden Container ragt (die Koordinatenzeile aus
   *  PO-2026-09-12-002), bleibt ein Befund. */
  function wirdSichtbarAbgeschnitten(el) {
    for (let vorfahr = el.parentElement; vorfahr && vorfahr !== document.body; vorfahr = vorfahr.parentElement) {
      const stil = getComputedStyle(vorfahr)
      const ueberlaufX = stil.overflowX
      // PO-2026-11-24-005: ein reiner Horizontal-Scroller (`overflow-x: auto|scroll`
      // bei `overflow-y: hidden|clip`, der Bildstreifen der Schnellansicht)
      // schneidet sichtbar ab wie `hidden`; ein vertikal scrollender Container
      // (`overflow-y: auto`, die Master-Detail-Spalten) gehört bewusst NICHT dazu.
      const horizontalerStreifen =
        (ueberlaufX === 'auto' || ueberlaufX === 'scroll') && (stil.overflowY === 'hidden' || stil.overflowY === 'clip')
      if (ueberlaufX === 'hidden' || ueberlaufX === 'clip' || horizontalerStreifen) {
        const rahmen = vorfahr.getBoundingClientRect()
        // Der sichtbare Teil ist der Schnitt ALLER Abschneider: liegt einer vollständig im
        // Bildschirm, ist der Überstand nie zu sehen — auch wenn ein näherer Abschneider
        // (die Bildkachel mit `overflow: hidden`) selbst im Streifen herausragt.
        if (rahmen.left >= -1 && rahmen.right <= breite + 1) return true
      }
    }
    return false
  }

  for (const el of document.querySelectorAll('body *')) {
    if (el.getAttribute('tabindex') === '-1') continue
    if (el.closest('[aria-hidden="true"]')) continue
    const stil = getComputedStyle(el)
    if (stil.visibility === 'hidden' || stil.opacity === '0' || stil.display === 'none') continue
    const kasten = el.getBoundingClientRect()
    if (kasten.width < 4 || kasten.height < 4) continue
    if (wirdSichtbarAbgeschnitten(el)) continue
    // Komplett außerhalb (z. B. das Skip-Link-Muster, das erst bei Fokus
    // einblendet) ist kein Überlauf-Befund — nur ein Element, das
    // TEILWEISE sichtbar ist und darüber hinaus ragt, zählt (genau die
    // Eigenschaft „ragt aus dem Bildschirm", nicht „ist gerade unsichtbar").
    if (kasten.right <= 0 || kasten.left >= breite) continue
    if (kasten.right > breite + 1) {
      befunde.push(`${bezeichner(el)} ragt ${Math.round(kasten.right - breite)}px über den rechten Bildschirmrand hinaus`)
    } else if (kasten.left < -1) {
      befunde.push(`${bezeichner(el)} ragt ${Math.round(-kasten.left)}px über den linken Bildschirmrand hinaus`)
    }
  }
  return befunde
}

/**
 * Zusicherung ab PO-2026-09-27-001 (design-conventions.md „Mehrzeilige
 * Textfelder wachsen mit dem Inhalt"): JEDES sichtbare `<textarea>` zeigt
 * seinen Inhalt vollständig, ohne internes Scrollen und ohne manuellen
 * Anfasser — benannte Bedingung (jedes `<textarea>` im DOM), keine Klassen-
 * oder Ansichtsliste. Das Anfangsnotiz-Feld aus PO-2026-09-27-002 läuft
 * dadurch automatisch mit, sobald es entsteht.
 *
 * Läuft in `pruefeAnsichtenBeiBreite()` für jede Ansicht/Breite mit — deckt
 * damit bereits Weg (1) (Mount, inkl. der neuen Ansicht
 * `ortsdetail-langer-kommentar`, bei allen drei `BREITEN`) ab, wird aber auch
 * von den eigenständigen Funktionen für Weg (2) (Ortswechsel) und Weg (3)
 * (Breitenwechsel) unten erneut aufgerufen.
 */
function pruefeMehrzeiligeTextfelder() {
  function bezeichner(el) {
    if (el.id) return '#' + el.id
    const klasse = typeof el.className === 'string' ? el.className : el.getAttribute('class') || ''
    return el.tagName.toLowerCase() + (klasse ? '.' + klasse.trim().replace(/\s+/g, '.') : '')
  }

  const befunde = []
  for (const feld of document.querySelectorAll('textarea')) {
    const kasten = feld.getBoundingClientRect()
    const stil = getComputedStyle(feld)
    if (kasten.width === 0 || kasten.height === 0) continue
    if (stil.visibility === 'hidden' || stil.display === 'none') continue

    if (stil.resize !== 'none') {
      befunde.push(`${bezeichner(feld)}: resize ist "${stil.resize}", erwartet "none" (kein manueller Anfasser)`)
    }
    if (feld.scrollHeight > feld.clientHeight + 1) {
      befunde.push(
        `${bezeichner(feld)}: Inhalt ist abgeschnitten (scrollHeight ${feld.scrollHeight}px > clientHeight ${feld.clientHeight}px)`,
      )
    }
    if (kasten.right > innerWidth + 1) {
      befunde.push(`${bezeichner(feld)}: ragt ${Math.round(kasten.right - innerWidth)}px über den rechten Bildschirmrand hinaus`)
    }
  }
  return befunde
}

/**
 * Empfehlung der Design-Antwort (Roundtrip PO-2026-09-27-003, design-
 * conventions.md „Legende" -> „Korrektur" -> „Ausdrücklich verworfen:
 * Icon-only-Variante"): kein Muss, hier trotzdem umgesetzt, weil sie exakt
 * den vom Nutzer gemeldeten Fehler als EIGENSCHAFT abbildet (der „Ort
 * hinzufügen"-Button brach bei 320px intern auf zwei Zeilen um, statt dass
 * der Umbruch die Kopfzeile traf — kein horizontaler Überlauf, deshalb vom
 * bisherigen Rauchtest nicht gefangen) statt nur an dieser einen Stelle:
 * Sichtbarer Button-Text bricht innerhalb SEINES Buttons nie um — benannte
 * Bedingung (jeder Button mit direktem Text-Kindknoten), keine Klassen-
 * oder Ansichtsliste, damit ein künftiges viertes Kopfzeilen-Element (oder
 * jeder andere Button der App) denselben Fehler nicht wieder unbemerkt
 * einschleust. Geprüft über `Range.getClientRects()` auf dem Textknoten:
 * mehr als ein Rect heißt, der Text belegt mehr als eine Zeile.
 */
function pruefeButtonTextUmbruch() {
  function bezeichner(el) {
    if (el.id) return '#' + el.id
    const klasse = typeof el.className === 'string' ? el.className : el.getAttribute('class') || ''
    return el.tagName.toLowerCase() + (klasse ? '.' + klasse.trim().replace(/\s+/g, '.') : '')
  }

  const befunde = []
  for (const button of document.querySelectorAll('button')) {
    const stil = getComputedStyle(button)
    if (stil.visibility === 'hidden' || stil.display === 'none') continue
    const kasten = button.getBoundingClientRect()
    if (kasten.width === 0 || kasten.height === 0) continue

    for (const kind of button.childNodes) {
      if (kind.nodeType !== Node.TEXT_NODE) continue
      const text = kind.textContent.trim()
      if (!text) continue
      const bereich = document.createRange()
      bereich.selectNodeContents(kind)
      const zeilen = bereich.getClientRects().length
      if (zeilen > 1) {
        befunde.push(`${bezeichner(button)}: Text "${text}" bricht intern auf ${zeilen} Zeilen um`)
      }
    }
  }
  return befunde
}

/**
 * Zusicherung ab PO-2026-09-13-002 (ADR-0027 Punkt 5, ADR-0023 Punkt 7):
 * jeder Regler ist für einen Menschen greifbar — unabhängig davon, ob seine
 * Achse bereits einen Wert hat. Formuliert als EIGENSCHAFT, nicht als
 * Prüfung auf `accent-color` (die konkrete Umsetzung der Farbunterscheidung
 * ist Implementierungsdetail, ADR-0023 Punkt 7): der Thumb ist nicht durch
 * `opacity: 0`/`visibility: hidden` unbedienbar gemacht — der Vor-Korrektur-
 * Stand blendete ihn bei `null` per `.bewertungsachse__regler--leer::
 * -webkit-slider-thumb { opacity: 0 }` vollständig aus — und das Element
 * selbst erfüllt die 44×44px-Mindesttrefferfläche (design-conventions.md
 * „Barrierefreiheit").
 *
 * ABWEICHUNG vom in ADR-0027 Punkt 5/6 genannten Weg — geprüft und mit
 * dieser Chromium-Version (141, Playwright 1.56) nicht tragfähig, deshalb
 * hier korrigiert, nicht nur übernommen: `getComputedStyle(el,
 * '::-webkit-slider-thumb')` aus Seiten-JavaScript liefert in dieser
 * Chromium-Version NICHT den tatsächlichen Autoren-Stil des Thumbs, sondern
 * durchgängig die UA-Vorgabe (`opacity: '1'`, Breite/Höhe identisch zum
 * äußeren `<input>`) — nachgewiesen durch einen isolierten Repro-Fall
 * (`opacity: 0` in einer Regel, `getComputedStyle` meldet trotzdem `1`) UND
 * gegen den Vor-Korrektur-Stand dieses Projekts (meldete `opacity: '1'`,
 * obwohl `.bewertungsachse__regler--leer::-webkit-slider-thumb { opacity: 0
 * }` aktiv war — der Rauchtest wäre mit dieser Methode NICHT rot geworden).
 * Vermutlich eine Einschränkung dieser Blink-Version bei der
 * Style-Auflösung von UA-Shadow-Pseudoelementen über die öffentliche
 * `getComputedStyle`-API.
 *
 * Funktionierender Ersatz, gleiche Eigenschaft, kein Screenshot/Pixel-
 * Vergleich (der bleibt laut ADR-0027 „Alternativen" verworfen): über das
 * Chrome DevTools Protocol NUR den UA-Shadow-Baum des `<input>` einlesen
 * (`DOM.getDocument({ pierce: true })`, dort landet er als echter Kind-
 * Knoten) und den Thumb-Knoten über seine TATSÄCHLICH matchenden CSS-Regeln
 * identifizieren (`CSS.getMatchedStylesForNode`, Selektortext enthält
 * `-webkit-slider-thumb`) statt über einen internen `id`-Namen, der
 * versionsabhängig sein könnte. Auf genau diesem Knoten liefert
 * `CSS.getComputedStyleForNode` den echten, autoren-überschriebenen Wert
 * (verifiziert: meldet dort korrekt `opacity: '0'`).
 */
async function pruefeReglerGreifbarkeit(seite, kontext) {
  const befunde = []
  const client = await seite.context().newCDPSession(seite)
  try {
    await client.send('DOM.enable')
    await client.send('CSS.enable')
    const { root } = await client.send('DOM.getDocument', { pierce: true, depth: -1 })

    function attributWert(knoten, name) {
      const attrs = knoten.attributes || []
      for (let i = 0; i < attrs.length; i += 2) {
        if (attrs[i] === name) return attrs[i + 1]
      }
      return undefined
    }

    function sammle(knoten, filter, liste) {
      if (filter(knoten)) liste.push(knoten)
      for (const kind of knoten.children || []) sammle(kind, filter, liste)
      for (const wurzel of knoten.shadowRoots || []) sammle(wurzel, filter, liste)
      return liste
    }

    const rangeInputs = sammle(
      root,
      (knoten) => knoten.nodeName === 'INPUT' && (attributWert(knoten, 'type') || '').toLowerCase() === 'range',
      [],
    )

    for (const inputKnoten of rangeInputs) {
      const bezeichner = attributWert(inputKnoten, 'id')
        ? '#' + attributWert(inputKnoten, 'id')
        : attributWert(inputKnoten, 'aria-label')
          ? `input[type="range"][aria-label="${attributWert(inputKnoten, 'aria-label')}"]`
          : 'input[type="range"]'

      try {
        const { model } = await client.send('DOM.getBoxModel', { nodeId: inputKnoten.nodeId })
        const breite = Math.abs(model.border[2] - model.border[0])
        const hoehe = Math.abs(model.border[5] - model.border[1])
        if (breite < 44 || hoehe < 44) {
          befunde.push(`${kontext} ${bezeichner}: Trefferfläche ${Math.round(breite)}×${Math.round(hoehe)}px unter 44×44px`)
        }
      } catch {
        befunde.push(`${kontext} ${bezeichner}: Trefferfläche nicht ermittelbar (kein Boxmodell)`)
      }

      const divsImSchatten = sammle(inputKnoten, (knoten) => knoten.nodeName === 'DIV', [])
      let thumbKnoten = null
      for (const div of divsImSchatten) {
        const { matchedCSSRules } = await client.send('CSS.getMatchedStylesForNode', { nodeId: div.nodeId })
        const selektoren = (matchedCSSRules || []).map((r) => r.rule.selectorList.text).join(' ')
        if (selektoren.includes('-webkit-slider-thumb')) {
          thumbKnoten = div
          break
        }
      }
      if (!thumbKnoten) {
        befunde.push(`${kontext} ${bezeichner}: Thumb-Knoten im UA-Schattenbaum nicht gefunden`)
        continue
      }

      const { computedStyle } = await client.send('CSS.getComputedStyleForNode', { nodeId: thumbKnoten.nodeId })
      const wertVon = (name) => computedStyle.find((eintrag) => eintrag.name === name)?.value
      if (wertVon('opacity') === '0') {
        befunde.push(`${kontext} ${bezeichner}: Thumb hat opacity: 0 — unbedienbar`)
      }
      if (wertVon('visibility') === 'hidden') {
        befunde.push(`${kontext} ${bezeichner}: Thumb hat visibility: hidden — unbedienbar`)
      }
      const thumbBreite = parseFloat(wertVon('width'))
      const thumbHoehe = parseFloat(wertVon('height'))
      if (Number.isFinite(thumbBreite) && Number.isFinite(thumbHoehe) && (thumbBreite < 4 || thumbHoehe < 4)) {
        befunde.push(`${kontext} ${bezeichner}: Thumb-Größe ${thumbBreite}×${thumbHoehe}px zu klein zum Bedienen`)
      }
    }
  } finally {
    await client.detach().catch(() => {})
  }
  return befunde
}

/**
 * Zusicherung ab PO-2026-09-13-003 (ADR-0028): auf der Ansicht `ortsdetail`
 * ist je Breite genau die vorgesehene Kombination der einander ersetzenden
 * Wege vorhanden — unterhalb `lg` „Zurück" und „Fertig", kein „×"; ab `lg`
 * „×", weder „Zurück" noch „Fertig". „Vorhanden" heißt sichtbar UND
 * fokussierbar UND im Accessibility-Baum benannt (Handoff-Wortlaut) — dafür
 * `getByRole('button', { name })`, das dieselbe Namensberechnung wie die
 * Accessibility-Engine des Browsers nutzt, plus ein tatsächlicher
 * Fokusversuch (nicht nur eine CSS-Vermutung: sowohl `display: none` als
 * auch `tabindex="-1"` verhindern beide, dass das Element danach
 * `document.activeElement` wird).
 *
 * `1024` wörtlich wie im `@media`-Block selbst (ADR-0012 Punkt 5,
 * ADR-0028) — dieselbe Bedingung, keine Ableitung aus einem Token.
 */
async function pruefeAbschlussKombination(seite, breite, befunde) {
  async function vorhanden(name) {
    const el = seite.getByRole('button', { name, exact: true })
    if ((await el.count()) === 0) return false
    if (!(await el.first().isVisible())) return false
    await el.first().focus()
    return el.first().evaluate((knoten) => document.activeElement === knoten)
  }

  const zurueck = await vorhanden('Zurück')
  const fertig = await vorhanden('Fertig')
  const schliessen = await vorhanden('Detailansicht schließen')

  const unterhalbLg = breite.width < 1024 /* --breakpoint-lg */
  if (unterhalbLg) {
    if (!zurueck) befunde.push(`${breite.name}/ortsdetail: "Zurück" nicht vorhanden (sichtbar/fokussierbar/benannt) — erwartet unterhalb lg`)
    if (!fertig) befunde.push(`${breite.name}/ortsdetail: "Fertig" nicht vorhanden (sichtbar/fokussierbar/benannt) — erwartet unterhalb lg`)
    if (schliessen) befunde.push(`${breite.name}/ortsdetail: "×" (Detailansicht schließen) vorhanden — sollte unterhalb lg nicht vorhanden sein`)
  } else {
    if (!schliessen) befunde.push(`${breite.name}/ortsdetail: "×" (Detailansicht schließen) nicht vorhanden (sichtbar/fokussierbar/benannt) — erwartet ab lg`)
    if (zurueck) befunde.push(`${breite.name}/ortsdetail: "Zurück" vorhanden — sollte ab lg nicht vorhanden sein`)
    if (fertig) befunde.push(`${breite.name}/ortsdetail: "Fertig" vorhanden — sollte ab lg nicht vorhanden sein`)
  }
}

/**
 * Zusicherung ab PO-2026-09-26-002 (ADR-0032 Punkt 6, Korrektur der
 * Master-Detail-Spaltensichtbarkeit): läuft aus `pruefeAnsichtenBeiBreite`
 * für JEDE Ansicht, auf der die Wurzel `.master-detail` im DOM ist (benannte
 * Bedingung, keine Liste von Ansichtsnamen) — formuliert als EIGENSCHAFT
 * (ADR-0023 Punkt 7). Die Erwartung ergibt sich ausschließlich aus der
 * Breite und aus `detailOffen` (gelesen über die Zustandsklasse
 * `.master-detail--detail-offen`, ADR-0011 Punkt 4: die einzige Quelle der
 * Auswahl) — nie aus dem Detailinhalt.
 *
 * `1024` wörtlich, mit demselben `--breakpoint-lg`-Kommentar wie im
 * `@media`-Block der Komponente selbst (ADR-0012 Punkt 5, ADR-0028, jetzt
 * ADR-0032 Punkt 2/3).
 *
 * Ab lg: beide Spalten gerendert (`display` ≠ `none`, Breite/Höhe > 0);
 * rechte Kante Liste ≤ linke Kante Detail (keine Überlappung); rechte Kante
 * Detail reicht bis zur rechten Kante der Wurzel (Toleranz ≤ 1px); das
 * Fenster selbst scrollt nicht. Auf einer Detailadresse zusätzlich: Button
 * „Ort hinzufügen" sichtbar, eine ggf. vorhandene Zeile mit
 * `aria-current="true"` bleibt sichtbar (design-conventions.md
 * „Auswahl-Hervorhebung").
 *
 * Unterhalb lg: auf einer Detailadresse ist die Listen-Spalte `display:
 * none`, die Detail-Spalte sichtbar; sonst umgekehrt.
 */
async function pruefeMasterDetailSpalten(seite, breite, kontext, befunde) {
  const ergebnis = await seite.evaluate(() => {
    const wurzel = document.querySelector('.master-detail')
    if (!wurzel) return null
    function box(el) {
      if (!el) return { sichtbar: false, kasten: null }
      const stil = getComputedStyle(el)
      const kasten = el.getBoundingClientRect()
      return {
        sichtbar: stil.display !== 'none' && kasten.width > 0 && kasten.height > 0,
        kasten: { top: kasten.top, left: kasten.left, right: kasten.right, bottom: kasten.bottom },
      }
    }
    return {
      detailOffen: wurzel.classList.contains('master-detail--detail-offen'),
      liste: box(wurzel.querySelector('.master-detail__liste')),
      detail: box(wurzel.querySelector('.master-detail__detail')),
      wurzelRight: wurzel.getBoundingClientRect().right,
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
    }
  })
  // Keine Master-Detail-Wurzel auf dieser Ansicht — nichts zu prüfen
  // (benannte Bedingung, s. Aufrufer, kein Fall in dieser Funktion selbst).
  if (!ergebnis) return

  const abLg = breite.width >= 1024 /* --breakpoint-lg */
  if (abLg) {
    if (!ergebnis.liste.sichtbar) befunde.push(`${kontext}: Listen-Spalte ist ab lg nicht sichtbar (Master-Detail)`)
    if (!ergebnis.detail.sichtbar) befunde.push(`${kontext}: Detail-Spalte ist ab lg nicht sichtbar (Master-Detail)`)
    if (ergebnis.liste.sichtbar && ergebnis.detail.sichtbar) {
      if (ergebnis.liste.kasten.right > ergebnis.detail.kasten.left + 1) {
        befunde.push(
          `${kontext}: Listen-Spalte (rechte Kante ${Math.round(ergebnis.liste.kasten.right)}px) überlappt die Detail-Spalte (linke Kante ${Math.round(ergebnis.detail.kasten.left)}px)`,
        )
      }
      if (Math.abs(ergebnis.detail.kasten.right - ergebnis.wurzelRight) > 1) {
        befunde.push(
          `${kontext}: Detail-Spalte reicht nicht bis zur rechten Kante der Wurzel (Detail: ${Math.round(ergebnis.detail.kasten.right)}px, Wurzel: ${Math.round(ergebnis.wurzelRight)}px)`,
        )
      }
    }
    if (ergebnis.scrollHeight > ergebnis.innerHeight + 1) {
      befunde.push(`${kontext}: Fenster scrollt ab lg (Dokument ${ergebnis.scrollHeight}px, Ansichtsfenster ${ergebnis.innerHeight}px)`)
    }
    if (ergebnis.detailOffen) {
      const hinzufuegen = seite.getByRole('button', { name: 'Ort hinzufügen', exact: true })
      if ((await hinzufuegen.count()) === 0 || !(await hinzufuegen.first().isVisible())) {
        befunde.push(`${kontext}: Button "Ort hinzufügen" ist ab lg bei offener Detailansicht nicht sichtbar`)
      }
      const ausgewaehlteZeile = seite.locator('[aria-current="true"]')
      if ((await ausgewaehlteZeile.count()) > 0 && !(await ausgewaehlteZeile.first().isVisible())) {
        befunde.push(`${kontext}: Zeile mit aria-current="true" ist ab lg bei offener Detailansicht nicht sichtbar`)
      }
    }
  } else if (ergebnis.detailOffen) {
    if (ergebnis.liste.sichtbar) befunde.push(`${kontext}: Listen-Spalte ist unterhalb lg bei offener Detailansicht sichtbar`)
    if (!ergebnis.detail.sichtbar) befunde.push(`${kontext}: Detail-Spalte ist unterhalb lg bei offener Detailansicht nicht sichtbar`)
  } else {
    if (!ergebnis.liste.sichtbar) befunde.push(`${kontext}: Listen-Spalte ist unterhalb lg ohne offene Detailansicht nicht sichtbar`)
    if (ergebnis.detail.sichtbar) befunde.push(`${kontext}: Detail-Spalte ist unterhalb lg ohne offene Detailansicht sichtbar`)
  }
}

/**
 * Nachweis für den Tag-Filter-Leerzustand bei ausgewähltem Ort
 * (PO-2026-09-26-002, Kriterium 1 — laut Handoff optional als eigene
 * ANSICHTEN-Ansicht, hier als einmaliger Lauf bei 1280px mit Bildschirmfoto):
 * Ort B bleibt offen (Master-Detail bleibt zweispaltig), während der aktive
 * UND-Filter zweier sich ausschließender Tags null Treffer liefert — die
 * Listen-Spalte zeigt `.ortebereich__keine-treffer` statt der `<ul>`. Der
 * Klick auf „Ort hinzufügen" trifft direkt über `locator.click()`, während A
 * noch offen ist — vor der Korrektur nur über den inzwischen entfernten
 * Workaround möglich (siehe `pruefeTagBleibtBeimOrtswechselAmRichtigenOrt`).
 */
async function pruefeTagFilterLeerBeiAusgewaehltemOrt(seite, befunde) {
  const breite = { name: 'desktop-1280', width: 1280 }
  // Try/catch um die gesamte Funktion, aus demselben Grund wie bei
  // `pruefeTagBleibtBeimOrtswechselAmRichtigenOrt`: ein Abbruch soll als
  // Befund im gesammelten Bericht erscheinen, nicht den ganzen Lauf beenden.
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Tagfilter-A')
    await seite.locator('.tag-eingabe__feld').fill('rauchtest-tagfilter-a')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(300)

    await seite.getByRole('button', { name: 'Ort hinzufügen', exact: true }).click()
    await seite.waitForTimeout(300)
    await seite.locator('#ort-anlegen-bezeichnung').fill('Rauchtest-Tagfilter-B')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(700)

    await seite.locator('.tag-eingabe__feld').fill('rauchtest-tagfilter-b')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(300)

    await seite.locator('.tag-filterleiste__segment', { hasText: 'UND' }).click()
    await seite.locator('.tag-filterleiste__pill', { hasText: 'rauchtest-tagfilter-a' }).click()
    await seite.locator('.tag-filterleiste__pill', { hasText: 'rauchtest-tagfilter-b' }).click()
    await seite.waitForTimeout(300)

    await pruefeMasterDetailSpalten(seite, breite, `${breite.name}/ortsdetail-tagfilter-leer`, befunde)

    const keineTrefferSichtbar = await seite
      .locator('.ortebereich__keine-treffer')
      .isVisible()
      .catch(() => false)
    if (!keineTrefferSichtbar) {
      befunde.push(
        'ortsdetail-tagfilter-leer: Leerzustand ".ortebereich__keine-treffer" nicht sichtbar, obwohl der UND-Filter beider Tags 0 Treffer liefert',
      )
    }

    await seite.screenshot({ path: `${FOTOS}/${breite.name}-ortsdetail-tagfilter-leer.png` })
    console.log(
      `  ${breite.name}/ortsdetail-tagfilter-leer — geprüft (Master-Detail bleibt zweispaltig bei Tag-Filter-Leerzustand), Bildschirmfoto in ${FOTOS}/${breite.name}-ortsdetail-tagfilter-leer.png`,
    )
  } catch (fehler) {
    befunde.push(`ortsdetail-tagfilter-leer: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/** Escaped die regex-relevanten Zeichen eines Strings — nur für den
 *  Namensvergleich unten, kein allgemeines Hilfsmittel. */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Neue harte Zusicherung (Nachpflege PO-2026-09-27-003, design-conventions.md
 * „Kombination mit der Auswahlkante"): Die ausgewählte Zeile behält ihre
 * 3px-Auswahlkante (`inset 3px 0 0 ...`) im BERECHNETEN `box-shadow`, in
 * JEDER Hervorhebungs-Kombination — zwei `box-shadow`-Regeln auf demselben
 * Element würden sich sonst ERSETZEN statt ergänzen (CSS kennt pro Element
 * nur einen wirksamen `box-shadow`-Wert), genau das Risiko, das die
 * Custom-Property-Kombination aus `Ortszeile.vue` vermeiden soll. Zusätzlich:
 * Die Accessible Name jeder geprüften Zeile (Rolle `link`, über Playwrights
 * eigene Accname-Berechnung in `getByRole`, nicht über rohen `textContent`)
 * enthält den erwarteten Screenreader-Text der Hervorhebung.
 *
 * Läuft NUR bei 1280px (Handoff-Vorgabe) auf der bereits von
 * `bereiteOrtslisteZonenVor` angelegten `ortsliste-zonen`-Ansicht weiter —
 * kein zweiter Datensatz.
 */
async function pruefeAusgewaehlteZeileSchattenUndName(seite, befunde) {
  const faelle = [
    { bezeichnung: 'Rauchtest-Zone-8', hervorhebungstext: null },
    { bezeichnung: 'Rauchtest-Zone-8-5', hervorhebungstext: 'Preis-Leistung 9,0' },
    {
      bezeichnung: 'Rauchtest-Zone-9-Mit-Einer-Deutlich-Laengeren-Bezeichnung-Als-Sonst-In-Dieser-Liste-Ueblich',
      hervorhebungstext: 'Geschmack 9,0, Preis-Leistung 9,0',
    },
    { bezeichnung: 'Rauchtest-Zone-Schwach', hervorhebungstext: 'Geschmack 9,0' },
  ]

  // Grenze nach der Bezeichnung erzwingen (Leerraum oder Textende): sonst
  // matcht z. B. „Rauchtest-Zone-8" als Teilstring auch die Zeile
  // „Rauchtest-Zone-8-5" — beide Bezeichnungen teilen ein Präfix.
  for (const fall of faelle) {
    const zeile = seite.getByRole('link', { name: new RegExp(`${escapeRegExp(fall.bezeichnung)}(\\s|$)`) })
    if ((await zeile.count()) === 0) {
      befunde.push(`ortsliste-zonen (${fall.bezeichnung}): Zeile nicht gefunden`)
      continue
    }
    await zeile.first().click()
    await seite.waitForTimeout(300)

    const ausgewaehlt = seite.locator('.ortszeile--ausgewaehlt')
    if ((await ausgewaehlt.count()) === 0) {
      befunde.push(`ortsliste-zonen (${fall.bezeichnung}): keine Zeile trägt nach dem Klick ".ortszeile--ausgewaehlt"`)
      continue
    }
    const schatten = await ausgewaehlt.first().evaluate((el) => getComputedStyle(el).boxShadow)
    if (!/inset/.test(schatten) || !/\b3px\b/.test(schatten)) {
      befunde.push(
        `ortsliste-zonen (${fall.bezeichnung}): ausgewählte Zeile hat keinen inset-3px-Layer im berechneten box-shadow ("${schatten}")`,
      )
    }

    if (fall.hervorhebungstext) {
      const namensregex = new RegExp(`${escapeRegExp(fall.bezeichnung)}(\\s|$)[\\s\\S]*${escapeRegExp(fall.hervorhebungstext)}`)
      const zeileMitName = seite.getByRole('link', { name: namensregex })
      if ((await zeileMitName.count()) === 0) {
        befunde.push(
          `ortsliste-zonen (${fall.bezeichnung}): Accessible Name (Rolle link) enthält nicht "${fall.hervorhebungstext}"`,
        )
      }
    }
  }
  await seite.screenshot({ path: `${FOTOS}/desktop-1280-ortsliste-zonen-ausgewaehlt.png` })
  console.log('  ortsliste-zonen/ausgewaehlte-zeile — Auswahlkante + Accessible Name je Hervorhebungs-Kombination geprüft')
}

/**
 * PO-2026-11-24-007, harte Zusicherung: Der Auslöser der Legende zeigt einen
 * SICHTBAREN, NICHT LEEREN Text (ein Icon ohne Text wurde vom Nutzer nicht als
 * Legende erkannt). Benannte Bedingung: JEDE Listen-Kopfzeile mit Legende
 * (`.ortebereich__kopf--mit-legende`) in der Ansicht. Geprüft wird der
 * gerenderte Text (`innerText`, nicht `aria-label`), die Trefferfläche
 * (>= 44px) und — ab `lg`, wo die Listen-Spalte 368px Inhaltsbreite hat — dass
 * die Kopfzeile einzeilig bleibt (Überschrift, Legende, „Ort hinzufügen" auf
 * einer Mittellinie). Liefert zusätzlich, welche Varianten gesehen wurden
 * (`inMasterDetail`/`standalone`), damit der Aufrufer prüfen kann, dass BEIDE
 * Kopfzeilen je Breite wirklich untersucht wurden.
 */
function pruefeLegendenAusloeser() {
  const befunde = []
  const gesehen = { inMasterDetail: 0, standalone: 0 }
  for (const kopf of document.querySelectorAll('.ortebereich__kopf--mit-legende')) {
    const kasten = kopf.getBoundingClientRect()
    if (kasten.width === 0 || kasten.height === 0) continue
    gesehen[kopf.closest('.master-detail') ? 'inMasterDetail' : 'standalone'] += 1
    const knopf = kopf.querySelector('.zonen-legende__knopf')
    if (!knopf) {
      befunde.push('Listen-Kopfzeile hat keinen Legenden-Auslöser')
      continue
    }
    const stil = getComputedStyle(knopf)
    const k = knopf.getBoundingClientRect()
    const text = knopf.innerText.trim()
    if (stil.visibility === 'hidden' || stil.display === 'none' || k.width === 0 || k.height === 0) {
      befunde.push('Legenden-Auslöser ist nicht sichtbar')
    }
    if (text === '') befunde.push('Legenden-Auslöser zeigt keinen Text (Icon ohne Beschriftung)')
    const label = (knopf.getAttribute('aria-label') || '').toLowerCase()
    if (text !== '' && !label.includes(text.toLowerCase())) {
      befunde.push(`Legenden-Auslöser: aria-label "${label}" enthält den sichtbaren Text "${text}" nicht`)
    }
    if (knopf.querySelector('svg, .icon')) befunde.push('Legenden-Auslöser enthält ein Icon (Konvention: Text ohne Icon)')
    if (k.width < 44 - 0.5 || k.height < 44 - 0.5) {
      befunde.push(`Legenden-Auslöser ist ${Math.round(k.width)}x${Math.round(k.height)}px groß (mindestens 44x44)`)
    }
    if (k.left < -0.5 || k.right > innerWidth + 0.5) befunde.push('Legenden-Auslöser ragt aus dem Bildschirm')
    if (innerWidth >= 1024) {
      const mitten = [...kopf.children].map((kind) => {
        const r = kind.getBoundingClientRect()
        return r.top + r.height / 2
      })
      if (Math.max(...mitten) - Math.min(...mitten) > 2) {
        befunde.push('Kopfzeile ist ab lg nicht einzeilig (Überschrift, Legende und „Ort hinzufügen" auf verschiedenen Zeilen)')
      }
    }
  }
  return { befunde, gesehen }
}

/**
 * PO-2026-11-24-007, harte Zusicherungen für die Zonen-Plakette und die
 * Hervorhebungs-Schatten in der Gesamtnote-Sortierung (Daten aus
 * `bereiteOrtslisteZonenVor`), als Eigenschaften je Zeile:
 *  - Eine Zone zeigt die Zahl auf einer Plakette mit Zonenfarbe als Fläche und
 *    heller Zahl (>= 4,5:1); ohne Zone ist die Fläche transparent — eine Zeile
 *    der untersten Zone (8,0) ist damit von einer Zeile ohne Zone eindeutig
 *    unterscheidbar.
 *  - Die Zeilenhöhe hängt nicht an der Zone: gleiches Padding und gleiche
 *    Höhe der Zahl mit und ohne Zone, rechte Kanten der Zahlen fluchten.
 *  - Benachbarte Zonenflächen werden streng dunkler (Graustufen-Reihenfolge).
 *  - Der Hervorhebungs-Schatten trägt einen 1px-Hairline-Layer (`0px 0px 0px 1px`)
 *    plus Schattenlayer; Zeilen ohne Hervorhebung haben keinen.
 *  - Zeilenabstand >= 8px (--space-8), damit der Schatten keine Nachbarzeile überdeckt.
 */
function pruefeZonenPlakette() {
  const befunde = []
  const zeilen = [...document.querySelectorAll('.ortszeile')].filter((zeile) => zeile.querySelector('.ortszeile__bezeichnung')?.textContent?.startsWith('Rauchtest-Zone-'))
  const rgb = (text) => (text.match(/[\d.]+/g) || []).map(Number)
  const luminanz = ([r, g, b]) => {
    const k = (v) => {
      const a = v / 255
      return a <= 0.03928 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b)
  }
  const kontrast = (a, b) => {
    const [h, d] = [Math.max(luminanz(a), luminanz(b)), Math.min(luminanz(a), luminanz(b))]
    return (h + 0.05) / (d + 0.05)
  }
  const ZONEN_ZEILEN = ['Rauchtest-Zone-8', 'Rauchtest-Zone-8-5', 'Rauchtest-Zone-9-Mit', 'Rauchtest-Zone-9-5', 'Rauchtest-Zone-10']
  const flaechen = []
  const hoehen = new Set()
  const rechteKanten = []
  const paddings = new Set()

  for (const zeile of zeilen) {
    const name = zeile.querySelector('.ortszeile__bezeichnung').textContent.trim()
    const zahl = zeile.querySelector('.ortszeile__gesamtnote-wert')
    const schatten = getComputedStyle(zeile).boxShadow
    const hervorgehoben = /ortszeile--hervorhebung-/.test(zeile.className)
    const hatHairline = /0px 0px 0px 1px/.test(schatten)
    if (hervorgehoben && !hatHairline) befunde.push(`${name}: Hervorhebung ohne 1px-Hairline im box-shadow ("${schatten}")`)
    if (hervorgehoben && schatten.split('rgba').length - 1 < 2) befunde.push(`${name}: Hervorhebung ohne zusätzlichen Schattenlayer ("${schatten}")`)
    if (!hervorgehoben && !zeile.classList.contains('ortszeile--ausgewaehlt') && hatHairline) {
      befunde.push(`${name}: Zeile ohne Hervorhebung trägt einen Hairline-Layer`)
    }
    if (!zahl) continue
    const stil = getComputedStyle(zahl)
    const flaeche = rgb(stil.backgroundColor)
    const hatFlaeche = flaeche.length >= 3 && (flaeche.length < 4 || flaeche[3] > 0)
    const hatZone = zeile.querySelector('.ortszeile__gesamtnote--zone') !== null
    const kasten = zahl.getBoundingClientRect()
    hoehen.add(Math.round(kasten.height))
    rechteKanten.push(Math.round(kasten.right))
    paddings.add(`${stil.paddingTop} ${stil.paddingRight} ${stil.paddingBottom} ${stil.paddingLeft}`)
    if (hatZone !== hatFlaeche) befunde.push(`${name}: ${hatZone ? 'Zone ohne Plakettenfläche' : 'Plakettenfläche ohne Zone'}`)
    if (hatZone) {
      const k = kontrast(rgb(stil.color).slice(0, 3), flaeche.slice(0, 3))
      if (k < 4.5) befunde.push(`${name}: Zahl auf Plakette hat nur ${k.toFixed(2)}:1 Kontrast`)
      // Längstes passendes Präfix: „Rauchtest-Zone-8" ist auch Präfix von „…-8-5".
      const index = ZONEN_ZEILEN.reduce(
        (bester, praefix, i) => (name.startsWith(praefix) && (bester < 0 || praefix.length > ZONEN_ZEILEN[bester].length) ? i : bester),
        -1,
      )
      if (index >= 0) flaechen[index] = luminanz(flaeche.slice(0, 3))
      if (stil.borderLeftWidth !== '0px') befunde.push(`${name}: Zahl trägt noch einen Rand (${stil.borderLeftWidth})`)
    }
  }
  if (flaechen.filter((wert) => wert !== undefined).length !== 5) befunde.push('nicht alle fünf Zonenzeilen gefunden')
  for (let i = 1; i < flaechen.length; i += 1) {
    if (!(flaechen[i] < flaechen[i - 1])) befunde.push(`Zone ${i + 1} ist nicht dunkler als Zone ${i} (Graustufen)`)
  }
  if (hoehen.size > 1) befunde.push(`Zahl hat je nach Zone unterschiedliche Höhen (${[...hoehen].join(', ')}px) — Zeilenhöhe springt`)
  if (paddings.size > 1) befunde.push(`Zahl hat je nach Zone unterschiedliches Padding (${[...paddings].join(' | ')})`)
  if (new Set(rechteKanten).size > 1) befunde.push(`rechte Kanten der Zahlen fluchten nicht (${[...new Set(rechteKanten)].join(', ')})`)

  const alle = [...document.querySelectorAll('.ortebereich__liste > li')]
  for (let i = 1; i < alle.length; i += 1) {
    const luecke = alle[i].getBoundingClientRect().top - alle[i - 1].getBoundingClientRect().bottom
    if (luecke < 8 - 0.5) befunde.push(`Zeilenabstand ${luecke.toFixed(1)}px < 8px (Schatten würde die Nachbarzeile überdecken)`)
  }
  return befunde
}

/**
 * PO-2026-11-24-007, nur 1280px: Bei Sortierung nach einer Einzelachse
 * (Ambiente) ist die Balkenfüllung bei einem Wert in einer Zone FLACH in
 * Zonenfarbe (= Fläche der Plakette), bei einem Wert unter 8 bleibt die
 * Tonleiter; im Ortsdetail wird KEINE Zonenfarbe sichtbar (Hook leckt nicht).
 */
async function pruefeBalkenfuellungInZonenfarbe(seite, befunde) {
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await seite.locator('.werkzeugleiste__chip').click()
    await seite.waitForTimeout(200)
    await seite.locator('.sortier-sheet__eintrag', { hasText: 'Ambiente' }).click()
    await seite.waitForTimeout(300)
    const messung = await seite.evaluate(() => {
      const zonenFarben = ['8', '8-5', '9', '9-5', '10'].map((k) => {
        const hex = getComputedStyle(document.documentElement).getPropertyValue(`--color-zone-${k}`).trim()
        const n = Number.parseInt(hex.slice(1), 16)
        return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
      })
      const zeilen = [...document.querySelectorAll('.ortszeile')]
        .filter((zeile) => zeile.querySelector('.ortszeile__bezeichnung')?.textContent?.startsWith('Rauchtest-Zone-'))
        .map((zeile) => ({
          name: zeile.querySelector('.ortszeile__bezeichnung').textContent.trim(),
          fuellung: getComputedStyle(zeile.querySelector('.intensitaetsbalken__fuellung') ?? zeile).backgroundColor,
          hatBalken: zeile.querySelector('.intensitaetsbalken__fuellung') !== null,
          flaeche: getComputedStyle(zeile.querySelector('.intensitaetsbalken__zahl') ?? zeile).backgroundColor,
        }))
      return { zonenFarben, zeilen }
    })
    const erwartetZone = ['Rauchtest-Zone-8', 'Rauchtest-Zone-8-5', 'Rauchtest-Zone-9-Mit', 'Rauchtest-Zone-9-5', 'Rauchtest-Zone-10']
    let zoneGeprueft = 0
    let ohneZoneGeprueft = 0
    for (const zeile of messung.zeilen) {
      if (!zeile.hatBalken) continue
      if (erwartetZone.some((praefix) => zeile.name.startsWith(praefix))) {
        zoneGeprueft += 1
        if (!messung.zonenFarben.includes(zeile.fuellung)) befunde.push(`ortsliste-zonen/balken: ${zeile.name}: Füllung ${zeile.fuellung} ist keine Zonenfarbe`)
        if (zeile.fuellung !== zeile.flaeche) befunde.push(`ortsliste-zonen/balken: ${zeile.name}: Füllung ${zeile.fuellung} != Plakette ${zeile.flaeche}`)
      } else {
        ohneZoneGeprueft += 1
        if (messung.zonenFarben.includes(zeile.fuellung)) befunde.push(`ortsliste-zonen/balken: ${zeile.name}: Wert unter 8 hat Zonenfüllung`)
        if (!/^rgba\(0, 0, 0, 0\)$|^transparent$/.test(zeile.flaeche)) befunde.push(`ortsliste-zonen/balken: ${zeile.name}: Wert unter 8 hat eine Plakettenfläche`)
      }
    }
    if (zoneGeprueft !== 5 || ohneZoneGeprueft < 1) {
      befunde.push(`ortsliste-zonen/balken: Vorbedingung verfehlt (${zoneGeprueft} Zonenzeilen, ${ohneZoneGeprueft} ohne Zone)`)
    }

    // Außerhalb der Ortsliste: der Balken im Ortsdetail trägt keine Zonenfarbe.
    await seite.getByRole('link', { name: /Rauchtest-Zone-8(\s|$)/ }).first().click()
    await seite.waitForTimeout(300)
    const detail = await seite.evaluate(() => {
      const zonenFarben = ['8', '8-5', '9', '9-5', '10'].map((k) => {
        const hex = getComputedStyle(document.documentElement).getPropertyValue(`--color-zone-${k}`).trim()
        const n = Number.parseInt(hex.slice(1), 16)
        return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
      })
      const fuellungen = [...document.querySelectorAll('.bewertungsachse .intensitaetsbalken__fuellung')].map((el) => getComputedStyle(el).backgroundColor)
      return { zonenFarben, fuellungen }
    })
    if (detail.fuellungen.length === 0) befunde.push('ortsdetail/balken: Vorbedingung verfehlt (kein Intensitätsbalken im Ortsdetail gefunden)')
    for (const farbe of detail.fuellungen) {
      if (detail.zonenFarben.includes(farbe)) befunde.push(`ortsdetail/balken: Balken im Ortsdetail trägt Zonenfarbe ${farbe}`)
    }

    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await seite.locator('.werkzeugleiste__chip').click()
    await seite.waitForTimeout(200)
    await seite.locator('.sortier-sheet__eintrag', { hasText: 'Gesamtnote' }).click()
    await seite.waitForTimeout(300)
    console.log('  ortsliste-zonen/balken — Balkenfüllung in Zonenfarbe (Einzelachse), Ortsdetail ohne Zonenfarbe geprüft')
  } catch (fehler) {
    befunde.push(`ortsliste-zonen/balken: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Nachtrag ADR-0011 P6 (2026-09-28, Rückläufer PO-2026-09-27-003): Ab lg ist
 * jede Master-Detail-Spalte ein ABGESCHLOSSENER Scroll-Bereich — deterministisch
 * geprüft, statt vom zufällig angesammelten Bestand eines Laufs abzuhängen
 * (der ursprüngliche Befund traf zufällig erst `ortsliste-legende`, weil erst
 * dort genug hohe Zeilen im Bestand lagen).
 *
 * Läuft für JEDE Breite aus `BREITEN` mit `width >= 1024` und für BEIDE
 * `detailOffen`-Zustände (Aufrufer filtert `BREITEN`, s. `main()`): Weder
 * `document.documentElement.scrollHeight` noch eine der beiden Spalten selbst
 * darf `innerHeight` (+1px Toleranz) übersteigen — das Fenster darf ab lg
 * grundsätzlich nicht scrollen (ADR-0011 Punkt 6).
 *
 * Vorbedingung ist TEIL der Zusicherung (analog ADR-0033 Punkt 7): Ohne
 * (1) Listen-Spalten-INHALT höher als die Spalte selbst UND (2) mindestens
 * ein absolut positioniertes Element im Spalteninhalt unterhalb der
 * sichtbaren Spaltenhöhe wäre "scrollt nicht" kein Beleg für eine wirksame
 * Abschottung, sondern nur dafür, dass nie genug Inhalt vorlag. Beide werden
 * hier selbst hergestellt, als benannte Bedingung (kein Bezug auf eine
 * bestimmte Klasse/Datei): genügend Füll-Orte, damit die Liste die Spalte
 * überragt, plus ein alphabetisch SPÄTER Ort mit Geschmack ≥ 9 bei der
 * Sortier-VOREINSTELLUNG „Bezeichnung" (ORTE_SORTIERUNG_VOREINSTELLUNG,
 * `features/orte/model/ansicht.ts`) — das erzeugt einen Screenreader-Hinweis
 * (`bestimmeHervorhebung`), der irgendein absolut positioniertes Element im
 * Spalteninhalt weit unten in der Liste plaziert. Kein Sortierwechsel nötig:
 * die Voreinstellung genügt, damit diese Funktion keine gespeicherte
 * Einstellung verändert zurücklässt.
 *
 * Läuft auf einer FRISCHEN Seite mit eigenem Bestand (wie
 * `pruefeScrollVersatzUndFokusBeiOrtswechsel`) — die Treiberaktion (Orte
 * anlegen, Detail öffnen) berührt die Messgröße selbst nicht: Weder das
 * Anlegen noch ein Klick auf eine Zeile setzt `scrollTop`/`scrollHeight`
 * händisch.
 *
 * Try/catch um die gesamte Funktion (wie
 * `pruefeTagFilterLeerBeiAusgewaehltemOrt`): ein Abbruch erscheint als
 * Befund im gesammelten Bericht, statt den ganzen Lauf zu beenden.
 */
async function pruefeSpaltenAbgeschlossenerScrollBereich(seite, breite, befunde) {
  const kontext = `${breite.name}/spalten-abgeschlossener-scroll-bereich`

  async function messeSpalten() {
    return seite.evaluate(() => {
      function box(el) {
        if (!el) return null
        const rect = el.getBoundingClientRect()
        return { top: rect.top, bottom: rect.bottom, height: rect.height, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight }
      }
      const liste = document.querySelector('.master-detail__liste')
      const detail = document.querySelector('.master-detail__detail')

      // Vorbedingung (2): mindestens ein absolut positioniertes Element IM
      // INHALT einer Spalte, dessen untere Kante unterhalb der sichtbaren
      // Spaltenhöhe liegt.
      let absolutUnterhalbSpalte = false
      for (const spalte of [liste, detail]) {
        if (!spalte) continue
        const spalteRect = spalte.getBoundingClientRect()
        for (const el of spalte.querySelectorAll('*')) {
          if (getComputedStyle(el).position !== 'absolute') continue
          if (el.getBoundingClientRect().bottom > spalteRect.bottom + 1) {
            absolutUnterhalbSpalte = true
            break
          }
        }
        if (absolutUnterhalbSpalte) break
      }

      return {
        liste: box(liste),
        detail: box(detail),
        innerHeight: window.innerHeight,
        documentScrollHeight: document.documentElement.scrollHeight,
        absolutUnterhalbSpalte,
      }
    })
  }

  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    // Füll-Orte: alphabetisch VOR dem Randfall-Ort, genug für Inhalt > Spalte.
    for (let i = 0; i < 16; i += 1) {
      await legeOrtAnUndOeffneIhn(seite, `Rauchtest-Scroll-Aaa-Fueller-${String(i).padStart(2, '0')}`)
    }
    // Alphabetisch SPÄTER Ort mit Geschmack ≥ 9 — erzeugt den
    // Screenreader-Hinweis (`.ortszeile__sr-hervorhebung`) tief in der Liste.
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Scroll-Zzz-Randfall')
    await setzeAlleAchsenwerte(seite, [5, 5, 9, 5])
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await seite.waitForTimeout(300)

    // --- Zustand 1: detailOffen = false ---------------------------------
    const zustandGeschlossen = await messeSpalten()
    pruefeSpaltenMesswerte(zustandGeschlossen, `${kontext} (Detail geschlossen)`, befunde)

    // --- Zustand 2: detailOffen = true -----------------------------------
    // Geöffnet wird NICHT der Randfall-Ort selbst, sondern der ERSTE
    // Füll-Ort (oben in der alphabetisch sortierten Liste): `Ortebereich.vue`
    // scrollt die ausgewählte Zeile beim Öffnen absichtlich in Sicht
    // (`scrolleZeileInSicht`, ADR-0033 Punkt 4/7) — für eine bereits
    // sichtbare Zeile ist das ein No-op, für den Randfall-Ort selbst hätte es
    // ihn samt seinem Hervorhebungs-Hinweis sichtbar gemacht und damit genau
    // die Vorbedingung (Element unterhalb der sichtbaren Spaltenhöhe)
    // zunichtegemacht, die diese Funktion prüfen soll. Direkt per `goto` auf
    // die Detailadresse statt `.click()`: Ein Klick ließe Playwright das Ziel
    // zusätzlich selbst ins Sichtfeld scrollen, bevor überhaupt gemessen wird.
    const zielHref = await seite
      .locator('.ortszeile', { hasText: 'Rauchtest-Scroll-Aaa-Fueller-00' })
      .getAttribute('href')
    if (!zielHref) {
      befunde.push(`${kontext} (Detail offen): Zeile "Rauchtest-Scroll-Aaa-Fueller-00" nicht gefunden — Href fehlt`)
    } else {
      // `zielHref` trägt bereits den vollen Pfad INKLUSIVE `BASE_PATH`
      // (RouterLink rendert unter `createWebHistory(import.meta.env.BASE_URL)`
      // absolut, ADR-0001) — anders als die relativen `ANSICHTEN[].pfad` oben
      // NICHT mit `BASIS` verketten, sonst verdoppelt sich der Unterpfad.
      await seite.goto(`http://localhost:${PORT}${zielHref}`, { waitUntil: 'networkidle' })
      await seite.waitForTimeout(400)
      const zustandOffen = await messeSpalten()
      pruefeSpaltenMesswerte(zustandOffen, `${kontext} (Detail offen)`, befunde)
    }

    await seite.screenshot({ path: `${FOTOS}/${breite.name}-spalten-abgeschlossener-scroll-bereich.png` })
    console.log(`  ${kontext} — geprüft (beide detailOffen-Zustände)`)
  } catch (fehler) {
    befunde.push(`${kontext}: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/** Wertet einen Messwert-Satz aus `pruefeSpaltenAbgeschlossenerScrollBereich`
 *  aus — getrennt, damit beide Zustände (offen/geschlossen) dieselbe Prüfung
 *  durchlaufen. Vorbedingung zuerst (s. Funktionskommentar oben): ohne sie
 *  ist ein grünes Ergebnis kein Beleg. */
function pruefeSpaltenMesswerte(messwerte, kontext, befunde) {
  if (!messwerte.liste) {
    befunde.push(`${kontext}: Vorbedingung nicht prüfbar — Listen-Spalte nicht gefunden`)
    return
  }
  const inhaltHoeherAlsSpalte = messwerte.liste.scrollHeight > messwerte.liste.clientHeight + 1
  if (!inhaltHoeherAlsSpalte) {
    befunde.push(
      `${kontext}: Vorbedingung nicht erreicht — Inhalt der Listen-Spalte (${messwerte.liste.scrollHeight}px) ist nicht höher als die Spalte selbst (${messwerte.liste.clientHeight}px)`,
    )
  }
  if (!messwerte.absolutUnterhalbSpalte) {
    befunde.push(`${kontext}: Vorbedingung nicht erreicht — kein absolut positioniertes Element im Spalteninhalt unterhalb der sichtbaren Spaltenhöhe gefunden`)
  }
  if (!inhaltHoeherAlsSpalte || !messwerte.absolutUnterhalbSpalte) return

  if (messwerte.documentScrollHeight > messwerte.innerHeight + 1) {
    befunde.push(`${kontext}: Fenster scrollt ab lg (Dokument ${messwerte.documentScrollHeight}px, Ansichtsfenster ${messwerte.innerHeight}px)`)
  }
  for (const [name, box] of [['Listen-Spalte', messwerte.liste], ['Detail-Spalte', messwerte.detail]]) {
    if (box && box.height > messwerte.innerHeight + 1) {
      befunde.push(`${kontext}: ${name} ist höher (${box.height}px) als das Ansichtsfenster (${messwerte.innerHeight}px)`)
    }
  }
}

/**
 * PO-2026-11-24-006 (ADR-0036): harte Zusicherungen der Bildvorschau, je
 * Breite aus BREITEN, auf frischer Seite mit Touch-Emulation (`hasTouch`).
 * Geprüft wird die EIGENSCHAFT, nicht eine Stelle:
 *  - Öffnen legt genau EINEN Verlaufseintrag an, Blättern keinen;
 *  - das Bild ist vollständig sichtbar (Seitenverhältnis des gerenderten
 *    Elements = natürliches, liegt im Ansichtsfenster, schneidet keinen
 *    Button) — hoch UND quer;
 *  - Pfeiltaste und Wischgeste (CDP-Touch) wechseln das Bild, ein kurzer,
 *    langsamer Wisch und ein Tipp nicht; an den Enden kein Umbruch
 *    (`aria-disabled`);
 *  - Fokus beim Öffnen auf „×", Tab bleibt im Dialog;
 *  - Esc schließt, der Fokus liegt auf der Kachel des ZULETZT gezeigten
 *    Bildes, der Ort bleibt offen, der eigene Eintrag ist wieder weg;
 *  - System-Zurück schließt nur den Dialog (Adresse = Ortsdetail), ein
 *    Vorwärts/Neuladen darauf öffnet nie;
 *  - Öffnen/Schließen verschiebt den Scroll-Stand nicht (ADR-0036 Punkt 3);
 *  - bei einem Bild keine Blätter-Bedienung und kein Zähler.
 * Vorbedingungen sind Teil der Zusicherung: ohne dass tatsächlich geblättert
 * wurde, wäre „Fokus auf zuletzt gezeigter Kachel" kein Beleg.
 */
async function pruefeBildvorschau(browser, breite, befunde) {
  const kontext = `${breite.name}/bildvorschau`
  const ctx = await browser.newContext({
    viewport: { width: breite.width, height: breite.height },
    hasTouch: true,
  })
  const seite = await ctx.newPage()
  seite.on('pageerror', (f) => befunde.push(`${kontext}: Laufzeitfehler: ${f.message}`))
  seite.on('console', (n) => {
    if (n.type() === 'error' && !n.location()?.url?.includes('photon.komoot.io')) {
      befunde.push(`${kontext}: Konsole: ${n.text().slice(0, 160)}`)
    }
  })
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtMitBildernAn(seite, 'Rauchtest-Bildvorschau-Hart', BILDVORSCHAU_FORMATE)
    const dialog = seite.getByRole('dialog', { name: 'Bildvorschau' })
    const kacheln = seite.locator('.bildkachel__oeffnen')
    const zaehler = () => dialog.locator('.bildvorschau__zaehler').innerText()
    const pfadVorher = await seite.evaluate(() => location.pathname + location.search)

    /** Scroll-Stand der Detail-Spalte bzw. des Fensters (nächster
     *  scrollbarer Vorfahr der Bilder, sonst das Fenster). */
    const scrollStand = () =>
      seite.evaluate(() => {
        let el = document.querySelector('.bilderbereich')?.parentElement
        while (el && !['auto', 'scroll'].includes(getComputedStyle(el).overflowY)) el = el.parentElement
        return { container: el ? el.scrollTop : null, fenster: window.scrollY }
      })

    // Treiberaktion (Messgröße unberührt): Kachel 1 in Sicht bringen.
    await kacheln.first().scrollIntoViewIfNeeded()
    const standVorher = await scrollStand()
    const verlaufVorher = await seite.evaluate(() => history.length)

    // Per Tastatur geöffnet (Fokus ohne Scrollen + Enter): ein Playwright-
    // `click()` würde selbst scrollen, wenn die Kachel unter der festen
    // Bottom-Tab-Leiste liegt, und die Messgröße „Scroll-Stand" verfälschen
    // (Treiberaktion und Messgröße getrennt). Zugleich der Nachweis „per
    // Enter zu öffnen".
    await kacheln.first().evaluate((el) => el.focus({ preventScroll: true }))
    await seite.keyboard.press('Enter')
    await dialog.waitFor({ state: 'visible' })
    await seite.waitForTimeout(400)

    // Verlauf: genau EIN Eintrag, Adresse unverändert.
    const verlaufOffen = await seite.evaluate(() => history.length)
    if (verlaufOffen !== verlaufVorher + 1) {
      befunde.push(`${kontext}: Öffnen legt ${verlaufOffen - verlaufVorher} Verlaufseinträge an statt genau einen`)
    }
    const pfadOffen = await seite.evaluate(() => location.pathname + location.search)
    if (pfadOffen !== pfadVorher) befunde.push(`${kontext}: Öffnen ändert die Adresse (${pfadVorher} → ${pfadOffen})`)

    // Der Hintergrund bleibt stehen: der Router setzt beim Öffnen keinen
    // Scroll (ADR-0036 Punkt 3: scrollBehavior bei gleicher fullPath).
    const standOffen = await scrollStand()
    if (standOffen.container !== standVorher.container || standOffen.fenster !== standVorher.fenster) {
      befunde.push(`${kontext}: Öffnen verschiebt den Scroll-Stand dahinter (${JSON.stringify(standVorher)} → ${JSON.stringify(standOffen)})`)
    }

    // Fokus beim Öffnen auf „×".
    const fokusName = () => seite.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName)
    if ((await fokusName()) !== 'Vorschau schließen') befunde.push(`${kontext}: Fokus liegt beim Öffnen nicht auf „Vorschau schließen"`)
    if ((await zaehler()) !== '1 von 3') befunde.push(`${kontext}: Zähler zeigt beim Öffnen „${await zaehler()}" statt „1 von 3"`)

    // Vollständig sichtbar, nicht verdeckt — für jedes der drei Bilder.
    const messeBild = () =>
      seite.evaluate(() => {
        const bild = document.querySelector('.bildvorschau__bild')
        if (!bild) return null
        const r = bild.getBoundingClientRect()
        const knoepfe = [...document.querySelectorAll('.bildvorschau button')].map((b) => b.getBoundingClientRect())
        const schneidet = knoepfe.some((k) => r.left < k.right && r.right > k.left && r.top < k.bottom && r.bottom > k.top)
        return {
          w: r.width, h: r.height, links: r.left, rechts: r.right, oben: r.top, unten: r.bottom,
          nw: bild.naturalWidth, nh: bild.naturalHeight, schneidet,
          fw: window.innerWidth, fh: window.innerHeight,
          objectFit: getComputedStyle(bild).objectFit,
        }
      })
    for (let i = 0; i < 3; i++) {
      const m = await messeBild()
      const hochOderQuer = BILDVORSCHAU_FORMATE[i][1] > BILDVORSCHAU_FORMATE[i][0] ? 'hoch' : 'quer'
      if (!m || m.nw === 0) {
        befunde.push(`${kontext}: Bild ${i + 1} (${hochOderQuer}) ist nicht geladen`)
      } else {
        const sollVerhaeltnis = m.nw / m.nh
        const istVerhaeltnis = m.w / m.h
        const beschnittenDurchBox = Math.abs(istVerhaeltnis - sollVerhaeltnis) / sollVerhaeltnis > 0.03 && m.objectFit !== 'contain'
        if (beschnittenDurchBox) befunde.push(`${kontext}: Bild ${i + 1} (${hochOderQuer}) wird verzerrt/beschnitten dargestellt`)
        if (m.links < -0.5 || m.oben < -0.5 || m.rechts > m.fw + 0.5 || m.unten > m.fh + 0.5) {
          befunde.push(`${kontext}: Bild ${i + 1} (${hochOderQuer}) ragt aus dem Ansichtsfenster`)
        }
        if (m.schneidet) befunde.push(`${kontext}: Bild ${i + 1} (${hochOderQuer}) wird von einem Bedienelement überdeckt`)
        if (m.w < 40 || m.h < 40) befunde.push(`${kontext}: Bild ${i + 1} (${hochOderQuer}) ist praktisch nicht sichtbar (${Math.round(m.w)}×${Math.round(m.h)})`)
      }
      if (i < 2) {
        await seite.keyboard.press('ArrowRight')
        await seite.waitForTimeout(150)
      }
    }
    await seite.screenshot({ path: `${FOTOS}/${kontext.replace('/', '-')}-bild3.png` })
    // Zurück auf 1: Pfeiltaste links, Enden ohne Umbruch.
    await seite.keyboard.press('ArrowRight') // am Ende: kein Umbruch
    await seite.waitForTimeout(150)
    if ((await zaehler()) !== '3 von 3') befunde.push(`${kontext}: Pfeil rechts am letzten Bild bricht um oder wechselt („${await zaehler()}")`)
    const weiterZu = await dialog.getByRole('button', { name: 'Nächstes Bild' }).getAttribute('aria-disabled')
    if (weiterZu !== 'true') befunde.push(`${kontext}: „Nächstes Bild" ist am letzten Bild nicht aria-disabled`)
    await seite.keyboard.press('ArrowLeft')
    await seite.keyboard.press('ArrowLeft')
    await seite.keyboard.press('ArrowLeft') // am Anfang: kein Umbruch
    await seite.waitForTimeout(150)
    if ((await zaehler()) !== '1 von 3') befunde.push(`${kontext}: Pfeiltasten links gelangen nicht (ohne Umbruch) zu „1 von 3" („${await zaehler()}")`)
    const zurueckZu = await dialog.getByRole('button', { name: 'Vorheriges Bild' }).getAttribute('aria-disabled')
    if (zurueckZu !== 'true') befunde.push(`${kontext}: „Vorheriges Bild" ist am ersten Bild nicht aria-disabled`)

    // Pfeil-Buttons per Klick.
    await dialog.getByRole('button', { name: 'Nächstes Bild' }).click()
    if ((await zaehler()) !== '2 von 3') befunde.push(`${kontext}: Klick auf „Nächstes Bild" wechselt nicht zu „2 von 3"`)
    await dialog.getByRole('button', { name: 'Vorheriges Bild' }).click()

    // Wischgeste per CDP-Touch (echte Pointer Events mit pointerType touch).
    const cdp = await ctx.newCDPSession(seite)
    const flaeche = await seite.locator('.bildvorschau__flaeche').boundingBox()
    const y = flaeche.y + flaeche.height / 2
    const xStart = flaeche.x + flaeche.width * 0.75
    async function wische(vonX, bisX, haltMs) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vonX, y }] })
      const schritte = 4
      for (let k = 1; k <= schritte; k++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: vonX + ((bisX - vonX) * k) / schritte, y }] })
      }
      await seite.waitForTimeout(haltMs)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await seite.waitForTimeout(250)
    }
    const hist = await seite.evaluate(() => history.length)
    await wische(xStart, xStart - 120, 20)
    if ((await zaehler()) !== '2 von 3') befunde.push(`${kontext}: Wischen nach links wechselt nicht zum nächsten Bild („${await zaehler()}")`)
    await wische(xStart - 120, xStart, 20)
    if ((await zaehler()) !== '1 von 3') befunde.push(`${kontext}: Wischen nach rechts wechselt nicht zum vorherigen Bild („${await zaehler()}")`)
    // Kurzer, langsamer Wisch (20px in >400ms) darf nicht blättern.
    await wische(xStart, xStart - 20, 450)
    if ((await zaehler()) !== '1 von 3') befunde.push(`${kontext}: ein kurzer, langsamer Wisch blättert („${await zaehler()}")`)
    // Blättern erzeugt keine Verlaufseinträge.
    await seite.keyboard.press('ArrowRight')
    await seite.waitForTimeout(150)
    if ((await seite.evaluate(() => history.length)) !== hist) befunde.push(`${kontext}: Blättern (Taste/Pfeil/Wischen) erzeugt Verlaufseinträge`)
    await cdp.detach()

    // Tab bleibt im Dialog: vier Schritte vorwärts und rückwärts.
    const imDialog = () => seite.evaluate(() => !!document.activeElement?.closest('.bildvorschau'))
    await dialog.getByRole('button', { name: 'Vorschau schließen' }).focus()
    for (let k = 0; k < 4; k++) {
      await seite.keyboard.press('Tab')
      if (!(await imDialog())) { befunde.push(`${kontext}: Tab verlässt den Dialog (Schritt ${k + 1})`); break }
    }
    await dialog.getByRole('button', { name: 'Vorschau schließen' }).focus()
    await seite.keyboard.press('Shift+Tab')
    if (!(await imDialog())) befunde.push(`${kontext}: Shift+Tab verlässt den Dialog`)

    // Esc schließt; Vorbedingung: wir stehen auf Bild 2 (zuletzt gezeigt).
    await seite.keyboard.press('Escape')
    await dialog.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
    await seite.waitForTimeout(400)
    if ((await dialog.count()) > 0) befunde.push(`${kontext}: Esc schließt die Vorschau nicht`)
    const fokusKachel = await seite.evaluate(() => {
      const el = document.activeElement
      const alle = [...document.querySelectorAll('.bildkachel__oeffnen')]
      return alle.indexOf(el)
    })
    if (fokusKachel !== 1) befunde.push(`${kontext}: nach Esc liegt der Fokus nicht auf der Kachel des zuletzt gezeigten Bildes (Index ${fokusKachel}, erwartet 1)`)
    const pfadNachEsc = await seite.evaluate(() => location.pathname + location.search)
    if (pfadNachEsc !== pfadVorher) befunde.push(`${kontext}: nach Esc ist die Adresse ${pfadNachEsc} statt ${pfadVorher}`)
    const standNachEsc = await scrollStand()
    if (standNachEsc.container !== standVorher.container || standNachEsc.fenster !== standVorher.fenster) {
      befunde.push(`${kontext}: Öffnen+Schließen verschiebt den Scroll-Stand (${JSON.stringify(standVorher)} → ${JSON.stringify(standNachEsc)})`)
    }
    // Der eigene Eintrag ist wieder weg: ein Zurück verlässt das Ortsdetail.
    await seite.goBack()
    await seite.waitForTimeout(500)
    if ((await dialog.count()) > 0) befunde.push(`${kontext}: nach Esc führt Zurück erneut in eine Vorschau`)
    const pfadNachZurueck = await seite.evaluate(() => location.pathname + location.search)
    if (pfadNachZurueck === pfadVorher) befunde.push(`${kontext}: nach Esc bleibt ein Verlaufseintrag mit der Adresse des Ortsdetails zurück`)
    await seite.goForward()
    await seite.waitForTimeout(500)
    if ((await dialog.count()) > 0) befunde.push(`${kontext}: Vorwärts auf den Ort öffnet eine Vorschau`)

    // Schließen per „×" (Tipp): gleicher Weg wie Esc.
    await kacheln.nth(2).scrollIntoViewIfNeeded()
    await kacheln.nth(2).click()
    await dialog.waitFor({ state: 'visible' })
    await dialog.getByRole('button', { name: 'Vorschau schließen' }).click()
    await dialog.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
    await seite.waitForTimeout(400)
    if ((await dialog.count()) > 0) befunde.push(`${kontext}: „×" schließt die Vorschau nicht`)
    if ((await seite.evaluate(() => [...document.querySelectorAll('.bildkachel__oeffnen')].indexOf(document.activeElement))) !== 2) {
      befunde.push(`${kontext}: nach „×" liegt der Fokus nicht auf der Kachel des gezeigten Bildes`)
    }

    // System-Zurück schließt nur den Dialog: Adresse bleibt das Ortsdetail.
    await kacheln.nth(1).scrollIntoViewIfNeeded()
    const standZurueckVorher = await scrollStand()
    await kacheln.nth(1).evaluate((el) => el.focus({ preventScroll: true }))
    await seite.keyboard.press('Enter')
    await dialog.waitFor({ state: 'visible' })
    await seite.waitForTimeout(300)
    await seite.keyboard.press('ArrowRight') // geblättert → Bild 3 ist zuletzt gezeigt
    await seite.waitForTimeout(150)
    await seite.goBack()
    await seite.waitForTimeout(500)
    if ((await dialog.count()) > 0) befunde.push(`${kontext}: System-Zurück schließt die Vorschau nicht`)
    const pfadNachSystemZurueck = await seite.evaluate(() => location.pathname + location.search)
    if (pfadNachSystemZurueck !== pfadVorher) befunde.push(`${kontext}: System-Zurück verlässt das Ortsdetail (${pfadNachSystemZurueck} statt ${pfadVorher})`)
    if ((await seite.evaluate(() => [...document.querySelectorAll('.bildkachel__oeffnen')].indexOf(document.activeElement))) !== 2) {
      befunde.push(`${kontext}: nach System-Zurück liegt der Fokus nicht auf der Kachel des zuletzt gezeigten Bildes`)
    }
    const standZurueckNachher = await scrollStand()
    if (standZurueckNachher.container !== standZurueckVorher.container || standZurueckNachher.fenster !== standZurueckVorher.fenster) {
      befunde.push(`${kontext}: System-Zurück verschiebt den Scroll-Stand (${JSON.stringify(standZurueckVorher)} → ${JSON.stringify(standZurueckNachher)})`)
    }
    // Vorwärts auf den markierten Eintrag und Neuladen darauf öffnen nie.
    await seite.goForward()
    await seite.waitForTimeout(500)
    if ((await dialog.count()) > 0) befunde.push(`${kontext}: Vorwärts auf den markierten Eintrag öffnet die Vorschau`)
    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    if ((await dialog.count()) > 0) befunde.push(`${kontext}: Neuladen auf dem markierten Eintrag öffnet die Vorschau`)

    // Ein Bild: keine Blätter-Bedienung, kein Zähler.
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtMitBildernAn(seite, 'Rauchtest-Bildvorschau-Einzelbild', [[600, 300]])
    await seite.locator('.bildkachel__oeffnen').first().click()
    await dialog.waitFor({ state: 'visible' })
    await seite.waitForTimeout(300)
    if ((await dialog.locator('.bildvorschau__zaehler').count()) > 0 || (await dialog.getByRole('button', { name: /Bild$/ }).count()) > 0) {
      befunde.push(`${kontext}: bei nur einem Bild gibt es Zähler oder Pfeil-Buttons`)
    }
    await seite.keyboard.press('Escape')
    await seite.waitForTimeout(400)
    console.log(`  ${kontext} — Bildvorschau geprüft`)
  } finally {
    await ctx.close()
  }
}


/**
 * PO-2026-11-24-001 (ADR-0037), harte Zusicherung — nur bei 1280px, eigener
 * Bestand auf frischer Seite: Die Wahl eines Gewichtungs-Szenarios wirkt
 * SOFORT (ohne Neuladen) und nach einem Neuladen auf Liste, Detail,
 * Sortierung nach Gesamtnote (inkl. Gruppen) und Zonenfarbe — überall
 * derselbe Wert je Ort. Eigenschaften, nicht Stellen:
 *
 *   - Prüfbeispiel: Fokus Geschmack, Geschmack 10, Ambiente 6, Rest nicht
 *     bewertet -> „8,7" (Ausgewogen: „8,0"); Ort B bleibt bei „8,5". Die
 *     Reihenfolge B vor A (Ausgewogen) kippt zu A vor B (Fokus Geschmack) —
 *     das ist die VORBEDINGUNG, dass „die Sortierung folgt" nicht schon an
 *     einer unveränderten Reihenfolge scheitert oder zufällig stimmt.
 *   - Zone und angezeigter Wert gehören zusammen: jede Zeile mit angezeigtem
 *     Wert >= 8,0 trägt eine Zone, keine mit < 8,0 (Kriterium „nie ein
 *     angezeigter Wert >= 8,0 ohne Zone"), und A trägt bei „8,7" die Zone
 *     8,5 (`--color-zone-8-5`), bei „8,0" die Zone 8.
 *   - Das Detail zeigt dieselbe Zahl wie die Zeile und nennt im Text-Button
 *     das aktive Szenario; die Hinweiszeile steht nur bei Abweichung.
 *   - Der Hervorhebungs-Schatten (Geschmack >= 9 an A) bleibt unberührt.
 *   - Alle drei Einstiege öffnen dasselbe Sheet, die aktive Zeile trägt
 *     `aria-pressed="true"`.
 * Ein Wechsel zurück auf Ausgewogen stellt die alte Ausgabe wieder her.
 */
async function pruefeGewichtungWirktUeberallUndUeberstehtNeuladen(browser, befunde) {
  const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const lese = () =>
    seite.evaluate(() =>
      [...document.querySelectorAll('.ortszeile')]
        .map((zeile) => ({
          name: zeile.querySelector('.ortszeile__bezeichnung')?.textContent?.trim() ?? '',
          wert: zeile.querySelector('.ortszeile__gesamtnote-wert')?.textContent?.trim() ?? null,
          zone: zeile.querySelector('.ortszeile__gesamtnote')?.classList.contains('ortszeile__gesamtnote--zone') ?? false,
          stil: zeile.querySelector('.ortszeile__gesamtnote')?.getAttribute('style') ?? '',
          schwach: zeile.classList.contains('ortszeile--hervorhebung-schwach'),
        }))
        .filter((zeile) => zeile.name.startsWith('Gewicht-')),
    )
  const pruefe = async (label, erwartet) => {
    const zeilen = await lese()
    const namen = zeilen.map((zeile) => zeile.name)
    if (namen.join(',') !== erwartet.reihenfolge.join(',')) {
      befunde.push(`gewichtung-${label}: Reihenfolge ${namen.join(', ')} statt ${erwartet.reihenfolge.join(', ')}`)
    }
    for (const [name, wert] of Object.entries(erwartet.werte)) {
      const zeile = zeilen.find((eintrag) => eintrag.name === name)
      if (!zeile || zeile.wert !== wert) {
        befunde.push(`gewichtung-${label}: ${name} zeigt "${zeile?.wert}" statt "${wert}"`)
      }
    }
    for (const zeile of zeilen) {
      if (zeile.wert === null) continue
      const angezeigt = Number(zeile.wert.replace(',', '.'))
      if (angezeigt >= 8 && !zeile.zone) befunde.push(`gewichtung-${label}: ${zeile.name} zeigt "${zeile.wert}" ohne Zone`)
      if (angezeigt < 8 && zeile.zone) befunde.push(`gewichtung-${label}: ${zeile.name} zeigt "${zeile.wert}" mit Zone`)
    }
    const a = zeilen.find((eintrag) => eintrag.name === 'Gewicht-A')
    if (!a || !a.stil.includes(erwartet.zonenTokenA)) {
      befunde.push(`gewichtung-${label}: Gewicht-A trägt nicht die Zone ${erwartet.zonenTokenA} (Stil "${a?.stil}")`)
    }
    if (!a?.schwach) befunde.push(`gewichtung-${label}: der Hervorhebungs-Schatten (Geschmack 10) von Gewicht-A fehlt`)
    const hinweis = await seite.locator('.gewichtung-hinweis').count()
    if (erwartet.hinweis === null && hinweis !== 0) befunde.push(`gewichtung-${label}: Hinweiszeile sichtbar, obwohl Ausgewogen`)
    if (erwartet.hinweis !== null) {
      const text = hinweis > 0 ? await seite.locator('.gewichtung-hinweis').innerText() : ''
      if (!text.includes(erwartet.hinweis)) befunde.push(`gewichtung-${label}: Hinweiszeile "${text}" nennt nicht „${erwartet.hinweis}"`)
    }
    // Detail: dieselbe Zahl wie die Zeile, Text-Button nennt das Szenario.
    await seite.locator('.ortszeile', { hasText: 'Gewicht-A' }).click()
    await seite.waitForTimeout(300)
    const detailWert = (await seite.locator('.ortsdetail__gesamtnote-wert').innerText()).trim()
    if (detailWert !== erwartet.werte['Gewicht-A']) {
      befunde.push(`gewichtung-${label}: Detail zeigt "${detailWert}", die Zeile "${erwartet.werte['Gewicht-A']}"`)
    }
    const knopf = (await seite.locator('.ortsdetail__gewichtung-knopf').innerText()).trim()
    if (knopf !== `Gewichtung: ${erwartet.name}`) {
      befunde.push(`gewichtung-${label}: Detail-Button "${knopf}" statt "Gewichtung: ${erwartet.name}"`)
    }
  }
  const sortiereNachGesamtnote = async () => {
    await seite.locator('.werkzeugleiste__chip').click()
    await seite.waitForTimeout(200)
    await seite.locator('.sortier-sheet__eintrag', { hasText: 'Gesamtnote' }).click()
    await seite.waitForTimeout(300)
  }
  const AUSGEWOGEN = {
    name: 'Ausgewogen',
    hinweis: null,
    reihenfolge: ['Gewicht-B', 'Gewicht-A', 'Gewicht-D', 'Gewicht-C'],
    werte: { 'Gewicht-B': '8,5', 'Gewicht-A': '8,0', 'Gewicht-D': '7,0' },
    zonenTokenA: '--color-zone-8)',
  }
  const FOKUS_GESCHMACK = {
    name: 'Fokus Geschmack',
    hinweis: 'Fokus Geschmack',
    reihenfolge: ['Gewicht-A', 'Gewicht-B', 'Gewicht-D', 'Gewicht-C'],
    werte: { 'Gewicht-A': '8,7', 'Gewicht-B': '8,5', 'Gewicht-D': '7,0' },
    zonenTokenA: '--color-zone-8-5',
  }
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    const bestand = [
      { bezeichnung: 'Gewicht-A', achsen: { 0: 6, 2: 10 } },
      { bezeichnung: 'Gewicht-B', achsen: { 0: 9, 1: 8 } },
      { bezeichnung: 'Gewicht-C', achsen: {} },
      { bezeichnung: 'Gewicht-D', achsen: { 1: 7 } },
    ]
    for (const ort of bestand) {
      await legeOrtAnUndOeffneIhn(seite, ort.bezeichnung)
      for (const [index, wert] of Object.entries(ort.achsen)) {
        await seite.locator('.bewertungsachse').nth(Number(index)).locator('input[type="number"]').fill(String(wert))
        await seite.keyboard.press('Tab')
        await seite.waitForTimeout(100)
      }
      await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
      await seite.waitForTimeout(200)
    }
    await sortiereNachGesamtnote()

    // Vorbedingung: Ausgewogen = B vor A.
    await pruefe('ausgewogen', AUSGEWOGEN)

    // Sofort, ohne Neuladen (Einstieg 1).
    await waehleGewichtungUeberSortierSheet(seite, 'Fokus Geschmack')
    await pruefe('sofort', FOKUS_GESCHMACK)

    // Übersteht Neuladen.
    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    await pruefe('nach-neuladen', FOKUS_GESCHMACK)

    // Einstieg 2 (Text-Button im Detail): offenes Sheet, aktive Zeile per aria-pressed.
    await seite.locator('.ortsdetail__gewichtung-knopf').click()
    const dialog = seite.getByRole('dialog', { name: 'Gewichtung der Gesamtnote' })
    await dialog.waitFor({ state: 'visible' })
    await seite.waitForTimeout(300)
    const aktive = await dialog.locator('.gewichtung-sheet__eintrag[aria-pressed="true"]').allInnerTexts()
    if (aktive.length !== 1 || !aktive[0].includes('Fokus Geschmack')) {
      befunde.push(`gewichtung-einstieg-detail: aktive Zeile (aria-pressed) ist "${aktive.join(' | ')}" statt „Fokus Geschmack"`)
    }
    await dialog.locator('.gewichtung-sheet__name', { hasText: 'Ausgewogen' }).click()
    await dialog.waitFor({ state: 'detached', timeout: 5000 })
    await seite.waitForTimeout(300)
    await seite.locator('[aria-label="Detailansicht schließen"]').click()
    await seite.waitForTimeout(300)
    await pruefe('zurueck-auf-ausgewogen', AUSGEWOGEN)

    // Einstieg 3 (Hinweiszeile): erscheint bei Abweichung, öffnet dasselbe Sheet.
    await waehleGewichtungUeberSortierSheet(seite, 'Fokus Zeit')
    await seite.locator('.gewichtung-hinweis').getByRole('button', { name: 'Ändern' }).click()
    await dialog.waitFor({ state: 'visible' })
    await seite.waitForTimeout(300)
    await dialog.locator('.gewichtung-sheet__name', { hasText: 'Ausgewogen' }).click()
    await dialog.waitFor({ state: 'detached', timeout: 5000 })
    await seite.waitForTimeout(300)
    if ((await seite.locator('.gewichtung-hinweis').count()) !== 0) {
      befunde.push('gewichtung-einstieg-hinweis: Hinweiszeile steht nach der Rückkehr zu Ausgewogen weiter da')
    }
  } catch (fehler) {
    befunde.push(`gewichtung: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
  await seite.close()
}

/**
 * Liest die Ortsliste als Folge von Zeilen und Gruppenüberschriften — nur Orte,
 * deren Bezeichnung mit `praefix` beginnt, plus ALLE Überschriften.
 */
async function leseOrtslisteMitGruppen(seite, praefix) {
  return seite.evaluate((vorsatz) => {
    const eintraege = []
    for (const li of document.querySelectorAll('.ortebereich__liste > li')) {
      if (li.classList.contains('ortebereich__ohne-wert-ueberschrift')) {
        eintraege.push({ ueberschrift: li.textContent.trim() })
        continue
      }
      const name = li.querySelector('.ortszeile__bezeichnung')?.textContent?.trim() ?? ''
      if (!name.startsWith(vorsatz)) continue
      const gesamtnote = li.querySelector('.ortszeile__gesamtnote')
      eintraege.push({
        name,
        wert: li.querySelector('.ortszeile__gesamtnote-wert')?.textContent?.trim() ?? null,
        zone: gesamtnote?.classList.contains('ortszeile__gesamtnote--zone') ?? false,
        stil: gesamtnote?.getAttribute('style') ?? '',
      })
    }
    return eintraege
  }, praefix)
}

/** Kurzschrift für Vergleiche: „Name=Wert", „Name=–" ohne Zahl, „# Überschrift". */
function beschreibeListe(eintraege) {
  return eintraege
    .map((e) => (e.ueberschrift !== undefined ? `# ${e.ueberschrift}` : `${e.name}=${e.wert ?? '–'}${e.zone ? ' (Zone)' : ''}`))
    .join(' | ')
}

/**
 * PO-2026-11-24-002 (ADR-0037), harte Zusicherung — nur bei 1280px, eigener
 * Bestand auf frischer Seite (eigener Browser-Kontext, damit frische
 * IndexedDB): „Eigene" Gewichte.
 *
 *   - 0-Gewicht nimmt die Achse samt Wert aus der Rechnung; ein Ort, dessen
 *     bewertete Achsen ALLE Gewicht 0 haben, zeigt KEINE Zahl und keine Zone,
 *     steht in einer EIGENEN Endgruppe „ohne Gesamtnote bei dieser Gewichtung"
 *     NACH der Gruppe „ohne Bewertung" (die Vorbedingung, dass es beide Gruppen
 *     gibt, steht in der Messgröße selbst), und das Detail sagt „Keine
 *     Gesamtnote bei dieser Gewichtung" statt „Noch nicht bewertet".
 *   - Grenzfall 159/20 = 7,95: zeigt „8,0" UND trägt die Zone 8 (Anzeige und
 *     Zone lesen beide `zehntel`, ADR-0037 Punkt 5) — der Fehlerfall, der ADR-0037
 *     begründet („8,0" ohne Zonenfarbe).
 *   - Die eigenen Gewichte überstehen ein Neuladen UND den Wechsel auf ein festes
 *     Szenario und zurück.
 *   - Gate (jeder Eingabepfad): „99" im Zahlenfeld wird 10; die letzte Achse
 *     über 0 lässt sich nicht auf 0 setzen — die Zeile sagt „muss zählen", der
 *     Regler hat min=1, die Statuszeile (role=status) steht, bis eine andere
 *     Änderung sie zurücknimmt; ein geleertes Zahlenfeld kehrt beim Verlassen
 *     zum bisherigen Wert zurück.
 */
async function pruefeEigeneGewichteUndEndgruppen(browser, befunde) {
  const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const dialog = seite.getByRole('dialog', { name: 'Gewichtung der Gesamtnote' })
  const erwarte = (label, ist, soll) => {
    if (ist !== soll) befunde.push(`gewichtung-eigene-${label}: "${ist}" statt "${soll}"`)
  }
  const oeffneSheet = async () => {
    await oeffneGewichtungSheetUeberSortierSheet(seite)
  }
  const schliesseSheet = async () => {
    await seite.keyboard.press('Escape')
    await dialog.waitFor({ state: 'detached', timeout: 5000 })
    await seite.waitForTimeout(300)
  }
  const pruefeListe = async (label, soll) => erwarte(label, beschreibeListe(await leseOrtslisteMitGruppen(seite, 'Eig-')), soll)
  const feldWerte = async () => {
    const werte = []
    for (const achse of GEWICHT_ACHSEN) werte.push(await gewichtFeld(dialog, achse).inputValue())
    return werte.join('/')
  }
  const detailText = async () => (await seite.locator('.ortsdetail__gesamtnote').innerText()).replace(/\s+/g, ' ').trim()
  const oeffneDetail = async (name) => {
    await seite.locator('.ortszeile', { hasText: name }).click()
    await seite.waitForTimeout(300)
  }
  const schliesseDetail = async () => {
    await seite.locator('[aria-label="Detailansicht schließen"]').click()
    await seite.waitForTimeout(300)
  }

  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    const bestand = [
      { bezeichnung: 'Eig-Ziel', achsen: { 0: 8, 1: 7, 2: 8 } },
      { bezeichnung: 'Eig-NurAmbiente', achsen: { 0: 6 } },
      { bezeichnung: 'Eig-Leer', achsen: {} },
    ]
    for (const ort of bestand) {
      await legeOrtAnUndOeffneIhn(seite, ort.bezeichnung)
      for (const [index, wert] of Object.entries(ort.achsen)) {
        await seite.locator('.bewertungsachse').nth(Number(index)).locator('input[type="number"]').fill(String(wert))
        await seite.keyboard.press('Tab')
        await seite.waitForTimeout(100)
      }
      await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
      await seite.waitForTimeout(200)
    }
    await seite.locator('.werkzeugleiste__chip').click()
    await seite.waitForTimeout(200)
    await seite.locator('.sortier-sheet__eintrag', { hasText: 'Gesamtnote' }).click()
    await seite.waitForTimeout(300)

    // 1) Erstbelegung 1:1:1:1: (8+7+8)/3 = 7,67 -> „7,7"; beide Zustände ohne Note
    //    stehen in EINER Gruppe, solange kein Gewicht 0 ist.
    await oeffneSheet()
    await dialog.locator('.gewichtung-sheet__name', { hasText: 'Eigene' }).click()
    await seite.waitForTimeout(400)
    erwarte('erstbelegung', await feldWerte(), '1/1/1/1')
    erwarte('erstbelegung-sheet-bleibt-offen', String(await dialog.isVisible()), 'true')
    erwarte(
      'erstbelegung-aktive-zeile',
      (await dialog.locator('.gewichtung-sheet__eintrag[aria-pressed="true"]').allInnerTexts()).map((t) => t.split('\n')[0]).join('|'),
      'Eigene',
    )
    await pruefeListe('erstbelegung', 'Eig-Ziel=7,7 | Eig-NurAmbiente=6,0 | # 1 Ort ohne Bewertung in Gesamtnote | Eig-Leer=–')

    // 2) Grenzfall 159/20: Ambiente 9, Zeit 1, Geschmack 10, Preis-Leistung 1;
    //    Preis-Leistung ist bei Eig-Ziel nicht bewertet und fällt samt Gewicht heraus.
    await setzeEigeneGewichteUeberZahlenfelder(seite, dialog, { ambiente: 9, zeit: 1, geschmack: 10, preisLeistung: 1 })
    await seite.waitForTimeout(200)
    {
      const liste = await leseOrtslisteMitGruppen(seite, 'Eig-')
      const ziel = liste.find((e) => e.name === 'Eig-Ziel')
      erwarte('grenzfall-159-20-wert', ziel?.wert ?? null, '8,0')
      if (!ziel?.zone || !ziel.stil.includes('--color-zone-8)')) {
        befunde.push(`gewichtung-eigene-grenzfall-159-20: Eig-Ziel zeigt "${ziel?.wert}" ohne Zone 8 (Stil "${ziel?.stil}", Zone: ${ziel?.zone})`)
      }
    }
    await schliesseSheet()
    await oeffneDetail('Eig-Ziel')
    erwarte('grenzfall-detail', await detailText(), '8,0 Ø aus 3 von 4 Achsen')
    erwarte('detail-button', (await seite.locator('.ortsdetail__gewichtung-knopf').innerText()).trim(), 'Gewichtung: Eigene')
    await schliesseDetail()
    {
      const hinweis = await seite.locator('.gewichtung-hinweis').count()
      const text = hinweis > 0 ? await seite.locator('.gewichtung-hinweis').innerText() : ''
      if (!text.includes('Eigene')) befunde.push(`gewichtung-eigene-hinweiszeile: "${text}" nennt nicht „Eigene"`)
    }

    // 3) Gewicht 0 an Ambiente: Eig-NurAmbiente hat NUR noch Achsen mit Gewicht 0.
    await oeffneSheet()
    await gewichtFeld(dialog, 'ambiente').fill('0')
    await seite.waitForTimeout(200)
    erwarte('ambiente-null-anteil', (await dialog.locator('.gewicht-zeile__anteil[data-achse="ambiente"]').innerText()).trim(), 'zählt nicht')
    await schliesseSheet()
    await pruefeListe(
      'endgruppen',
      'Eig-Ziel=7,9 | # 1 Ort ohne Bewertung in Gesamtnote | Eig-Leer=–' +
        ' | # 1 Ort ohne Gesamtnote bei dieser Gewichtung | Eig-NurAmbiente=–',
    )
    await oeffneDetail('Eig-NurAmbiente')
    erwarte(
      'endgruppe-detail',
      await detailText(),
      'Keine Gesamtnote bei dieser Gewichtung Die bewerteten Achsen zählen mit Gewicht 0.',
    )
    erwarte('endgruppe-detail-ohne-zahl', String(await seite.locator('.ortsdetail__gesamtnote-wert').count()), '0')
    await schliesseDetail()
    await oeffneDetail('Eig-Leer')
    erwarte('unbewertet-detail', await detailText(), 'Noch nicht bewertet')
    await schliesseDetail()

    // 4) Überlebt Neuladen.
    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    await pruefeListe(
      'nach-neuladen',
      'Eig-Ziel=7,9 | # 1 Ort ohne Bewertung in Gesamtnote | Eig-Leer=–' +
        ' | # 1 Ort ohne Gesamtnote bei dieser Gewichtung | Eig-NurAmbiente=–',
    )
    await oeffneSheet()
    erwarte('nach-neuladen-felder', await feldWerte(), '0/1/10/1')

    // 5) Fokus Zeit: Eig-NurAmbiente hat wieder eine Zahl, die Endgruppe entfällt;
    //    die eigenen Gewichte bleiben stehen.
    await dialog.locator('.gewichtung-sheet__name', { hasText: 'Fokus Zeit' }).click()
    await dialog.waitFor({ state: 'detached', timeout: 5000 })
    await seite.waitForTimeout(300)
    {
      const liste = await leseOrtslisteMitGruppen(seite, 'Eig-')
      if (liste.some((e) => e.ueberschrift?.includes('ohne Gesamtnote bei dieser Gewichtung'))) {
        befunde.push('gewichtung-eigene-feste-szenarien: die Endgruppe steht auch bei Fokus Zeit (leere Gruppe muss entfallen)')
      }
      const nurAmbiente = liste.find((e) => e.name === 'Eig-NurAmbiente')
      if (!nurAmbiente || nurAmbiente.wert !== '6,0') {
        befunde.push(`gewichtung-eigene-feste-szenarien: Eig-NurAmbiente zeigt "${nurAmbiente?.wert}" statt "6,0" bei Fokus Zeit`)
      }
    }
    await oeffneSheet()
    await dialog.locator('.gewichtung-sheet__name', { hasText: 'Eigene' }).click()
    await seite.waitForTimeout(400)
    erwarte('zurueck-auf-eigene-felder', await feldWerte(), '0/1/10/1')

    // 6) Gate. (a) „99" wird 10, (b) leer + Verlassen kehrt zurück, (c) die letzte
    //    Achse über 0.
    await gewichtFeld(dialog, 'preisLeistung').fill('99')
    await seite.waitForTimeout(150)
    erwarte('gate-klemmt', await gewichtFeld(dialog, 'preisLeistung').inputValue(), '10')
    await gewichtFeld(dialog, 'zeit').fill('')
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(150)
    erwarte('gate-leer-kehrt-zurueck', await gewichtFeld(dialog, 'zeit').inputValue(), '1')

    await setzeEigeneGewichteUeberZahlenfelder(seite, dialog, { zeit: 0, preisLeistung: 0 })
    // Nur Geschmack (10) zählt noch.
    const zeileGeschmack = dialog.locator('.gewicht-zeile').nth(2)
    erwarte('letzte-zeile-text', (await zeileGeschmack.locator('.gewicht-zeile__anteil').innerText()).trim(), '100 % · muss zählen')
    erwarte('letzte-regler-min', (await zeileGeschmack.locator('input[type="range"]').getAttribute('min')) ?? '', '1')
    erwarte('status-ohne-versuch', (await dialog.locator('[role="status"]').innerText()).trim(), '')
    await gewichtFeld(dialog, 'geschmack').fill('0')
    await seite.waitForTimeout(200)
    erwarte('letzte-bleibt-auf-1', await gewichtFeld(dialog, 'geschmack').inputValue(), '1')
    erwarte('status-nach-versuch', (await dialog.locator('[role="status"]').innerText()).trim(), 'Mindestens eine Achse muss zählen.')
    // Der Regler-Pfad läuft durch dasselbe Gate UND zeigt die Statuszeile bei
    // JEDEM Versuch (design-conventions.md „Letztes Gewicht über 0"; bei min=1
    // feuert am Minimum kein `input`, der Versuch wird an der Geste erkannt).
    // Vorbedingung je Versuch: Geschmack ist die letzte zählende Achse (Zeile
    // „muss zählen", min=1), die Statuszeile ist VORHER leer und der Regler
    // steht auf 1 — sonst wäre „erscheint" kein Beleg für den Versuch.
    const reglerGeschmack = zeileGeschmack.locator('input[type="range"]')
    const statusText = async () => (await dialog.locator('[role="status"]').innerText()).trim()
    const bringeAufEinsOhneHinweis = async (name, taste) => {
      await gewichtFeld(dialog, 'geschmack').fill('2')
      await seite.waitForTimeout(150)
      await reglerGeschmack.focus()
      await seite.keyboard.press(taste)
      await seite.waitForTimeout(150)
      erwarte(`${name}-vorbedingung-wert`, await gewichtFeld(dialog, 'geschmack').inputValue(), '1')
      erwarte(`${name}-vorbedingung-status-leer`, await statusText(), '')
      erwarte(`${name}-vorbedingung-letzte`, (await zeileGeschmack.locator('.gewicht-zeile__anteil').innerText()).trim(), '100 % · muss zählen')
    }
    for (const taste of ['Home', 'ArrowLeft']) {
      await bringeAufEinsOhneHinweis(`regler-${taste}`, taste)
      await seite.keyboard.press(taste)
      await seite.waitForTimeout(150)
      erwarte(`letzte-regler-${taste}-wert`, await gewichtFeld(dialog, 'geschmack').inputValue(), '1')
      erwarte(`letzte-regler-${taste}-status`, await statusText(), 'Mindestens eine Achse muss zählen.')
    }
    {
      // Ziehen nach links über das Minimum hinaus, Status geprüft VOR dem Loslassen.
      await bringeAufEinsOhneHinweis('regler-ziehen', 'Home')
      const kasten = await reglerGeschmack.boundingBox()
      if (!kasten) throw new Error('Regler der letzten Achse hat keine Box')
      const y = kasten.y + kasten.height / 2
      await seite.mouse.move(kasten.x + 12, y)
      await seite.mouse.down()
      await seite.mouse.move(kasten.x - 40, y, { steps: 8 })
      await seite.waitForTimeout(150)
      erwarte('letzte-regler-ziehen-status-waehrend', await statusText(), 'Mindestens eine Achse muss zählen.')
      await seite.mouse.up()
      erwarte('letzte-regler-ziehen-wert', await gewichtFeld(dialog, 'geschmack').inputValue(), '1')
    }
    // Die nächste Änderung nimmt die Statuszeile zurück (kein Timer).
    await gewichtFeld(dialog, 'ambiente').fill('3')
    await seite.waitForTimeout(200)
    erwarte('status-zurueckgenommen', (await dialog.locator('[role="status"]').innerText()).trim(), '')
    await gewichtFeld(dialog, 'geschmack').fill('0')
    await seite.waitForTimeout(200)
    erwarte('zweite-achse-erlaubt-null', await gewichtFeld(dialog, 'geschmack').inputValue(), '0')
    erwarte('status-bleibt-leer', (await dialog.locator('[role="status"]').innerText()).trim(), '')
  } catch (fehler) {
    befunde.push(`gewichtung-eigene: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
  await seite.close()
}

/**
 * PO-2026-11-24-002 (ADR-0027 Punkt 5, analog `pruefeReglerCommitWaehrendZiehens`):
 * Während eines GEDRÜCKT GEHALTENEN Ziehens an einem Gewichtsregler hat der
 * Wert bereits gewirkt — dasselbe Gewicht im Zahlenfeld, passender Anteil, und
 * die Gesamtnote in der Liste dahinter hat sich geändert. Geprüft VOR
 * `mouse.up()`, denn ein Klick feuert `input` UND `change`; ein Regler, der
 * erst auf `change` committet, wäre mit einer klickbasierten Prüfung grün.
 * Vorbedingung in der Messgröße: das Ziehen hat den Regler tatsächlich bewegt.
 */
async function pruefeGewichtsreglerCommitWaehrendZiehens(browser, befunde) {
  const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const dialog = seite.getByRole('dialog', { name: 'Gewichtung der Gesamtnote' })
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Zieh-Ort')
    await seite.locator('.bewertungsachse').nth(0).locator('input[type="number"]').fill('10')
    await seite.keyboard.press('Tab')
    await seite.locator('.bewertungsachse').nth(1).locator('input[type="number"]').fill('0')
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(150)
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await seite.waitForTimeout(200)

    await oeffneGewichtungSheetUeberSortierSheet(seite)
    await dialog.locator('.gewichtung-sheet__name', { hasText: 'Eigene' }).click()
    await seite.waitForTimeout(400)
    const notePro = () => seite.locator('.ortszeile__gesamtnote-wert').first().innerText()
    const vorher = (await notePro()).trim()

    // Die Zeile „Zeit": (10 x 1 + 0 x Gewicht) / (1 + Gewicht) fällt mit dem Gewicht.
    const regler = dialog.locator('.gewicht-zeile').nth(1).locator('input[type="range"]')
    await regler.scrollIntoViewIfNeeded()
    const kasten = await regler.boundingBox()
    if (!kasten) {
      befunde.push('gewichtung-regler-commit-waehrend-ziehens: Regler der Zeile „Zeit" nicht gefunden')
      await seite.close()
      return
    }
    const y = kasten.y + kasten.height / 2
    await seite.mouse.move(kasten.x + kasten.width * 0.5, y)
    await seite.mouse.down()
    await seite.mouse.move(kasten.x + kasten.width * 0.85, y, { steps: 8 })

    // VOR mouse.up() gelesen.
    const waehrendZiehens = await seite.evaluate(() => {
      const zeile = document.querySelectorAll('.gewicht-zeile')[1]
      const reglerWert = zeile.querySelector('input[type="range"]').value
      const zahlenfeld = zeile.querySelector('input[type="number"]').value
      const anteil = zeile.querySelector('.gewicht-zeile__anteil').textContent.trim()
      // Summe über die REGLER (nicht die Zahlenfelder): sie ist die Wahrheit des Ziehens.
      const summe = [...document.querySelectorAll('.gewicht-zeile input[type="range"]')].reduce((s, f) => s + Number(f.value), 0)
      return { reglerWert, zahlenfeld, anteil, summe }
    })
    const noteWaehrendZiehens = (await notePro()).trim()
    await seite.mouse.up()

    if (waehrendZiehens.reglerWert === '1') {
      befunde.push('gewichtung-regler-commit-waehrend-ziehens: Vorbedingung verfehlt — das Ziehen hat den Regler nicht bewegt')
    }
    if (waehrendZiehens.zahlenfeld !== waehrendZiehens.reglerWert) {
      befunde.push(`gewichtung-regler-commit-waehrend-ziehens: Regler steht auf ${waehrendZiehens.reglerWert}, das Zahlenfeld zeigt "${waehrendZiehens.zahlenfeld}"`)
    }
    const erwarteterAnteil = `${Math.round((100 * Number(waehrendZiehens.reglerWert)) / waehrendZiehens.summe)} %`
    if (waehrendZiehens.anteil !== erwarteterAnteil) {
      befunde.push(`gewichtung-regler-commit-waehrend-ziehens: Anteil "${waehrendZiehens.anteil}" statt "${erwarteterAnteil}" während des Ziehens`)
    }
    if (noteWaehrendZiehens === vorher) {
      befunde.push(`gewichtung-regler-commit-waehrend-ziehens: die Gesamtnote in der Liste bleibt während des Ziehens bei "${vorher}"`)
    }
    // Greifbarkeit der Gewichtsregler läuft über die benannte Bedingung
    // „Ansicht enthält einen Regler" in `pruefeAnsichtenBeiBreite`.
    console.log('  gewichtung-regler-commit-waehrend-ziehens — geprüft (gedrücktes Ziehen, vor mouse.up)')
  } catch (fehler) {
    befunde.push(`gewichtung-regler-commit-waehrend-ziehens: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
  await seite.close()
}

/**
 * Zusicherungen ab PO-2026-11-24-003 (ADR-0038): der Kartenausschnitt bleibt
 * über die Lebensdauer der JS-Laufzeit erhalten — und nur über sie.
 *
 * Gemessen wird die Lage der Marker relativ zum Kartencontainer (Pixel), nicht
 * die Leaflet-Instanz (sie ist von außen nicht erreichbar): Mitte und Zoom
 * bestimmen die Bildschirmpositionen aller Marker eindeutig. Auch Marker
 * außerhalb des Ansichtsfensters liegen im DOM (Leaflet entfernt sie nicht).
 * TOLERANZ: `KARTENAUSSCHNITT_TOLERANZ_PX` je Koordinatenachse und Marker —
 * Rundung der Pixel-Transformationen, kein sichtbarer Versatz.
 *
 * Treiberaktion und Messgröße getrennt: Der Ausschnitt wird mit Mausrad und
 * Ziehen auf der Kartenfläche gesetzt (Treiber), gemessen werden die
 * Markerpositionen nach dem Rückweg (Messgröße). Vorbedingung ist Teil der
 * Zusicherung: (1) der gesetzte Ausschnitt weicht um mehr als
 * `KARTENAUSSCHNITT_MINDESTABWEICHUNG_PX` vom eingepassten ab, (2) der
 * Kartencontainer ist nach dem Rückweg ein NEUER DOM-Knoten (die Karte wurde
 * tatsächlich neu aufgebaut, nicht nur weitergezeigt), (3) im Filterfall
 * liegt der Marker des Filters nachweislich außerhalb des gemerkten Ausschnitts.
 * Geprüft werden Rückwege über „Detailansicht schließen", goBack aus dem
 * Detail, Liste -> Karte und Karte -> /daten -> goBack, danach ein echtes
 * `reload()` (eingepasster Startausschnitt, nichts persistiert) und der
 * Filterfall (gemerkter Ausschnitt ohne sichtbaren Marker -> einpassen).
 * Eigener Bestand auf frischer Seite (Namen „Ka-…", Tags „ka"/„kb").
 */
const KARTENAUSSCHNITT_TOLERANZ_PX = 2
const KARTENAUSSCHNITT_MINDESTABWEICHUNG_PX = 20

async function legeKartenOrtAn(seite, bezeichnung, tag, breite, laenge) {
  await legeOrtAnUndOeffneIhn(seite, bezeichnung)
  await seite.locator('.tag-eingabe__feld').fill(tag)
  await seite.keyboard.press('Enter')
  await seite.waitForTimeout(300)
  await seite.getByRole('button', { name: 'Koordinaten von Hand eintragen' }).click()
  await seite.locator('#ortsdetail-breite').fill(String(breite))
  await seite.locator('#ortsdetail-laenge').fill(String(laenge))
  await seite.keyboard.press('Tab')
  await seite.waitForTimeout(400)
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
}

function leseMarkerLage(seite) {
  return seite.evaluate(() => {
    const container = document.querySelector('.karte-container')
    if (!container) return null
    const rahmen = container.getBoundingClientRect()
    const marker = [...document.querySelectorAll('.karte-marker')]
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          name: el.getAttribute('aria-label') ?? '',
          x: r.left + r.width / 2 - rahmen.left,
          y: r.top + r.height / 2 - rahmen.top,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    return { breite: rahmen.width, hoehe: rahmen.height, marker }
  })
}

function maxAbweichung(a, b) {
  if (!a || !b || a.marker.length !== b.marker.length) return Infinity
  let max = 0
  for (const [i, m] of a.marker.entries()) {
    if (m.name !== b.marker[i].name) return Infinity
    max = Math.max(max, Math.abs(m.x - b.marker[i].x), Math.abs(m.y - b.marker[i].y))
  }
  return max
}

function liegtImContainer(lage, marker) {
  return marker.x >= 0 && marker.x <= lage.breite && marker.y >= 0 && marker.y <= lage.hoehe
}

async function warteAufKartenmarker(seite, anzahl) {
  await seite.waitForFunction((n) => document.querySelectorAll('.karte-marker').length === n, anzahl, { timeout: 10000 })
  await seite.waitForTimeout(900)
}

/** Marker per Fokus (ohne Scrollen) + Enter aktivieren: öffnet seit
 *  PO-2026-11-24-005 die Schnellansicht (nicht mehr das Detail). Treiberaktion;
 *  wartet, bis die Schnellansicht samt Verschieben der Karte (240ms) zur Ruhe kam. */
async function oeffneMarkerSchnellansicht(seite, name) {
  await seite.evaluate((n) => {
    document.querySelector(`.karte-marker[aria-label^="${n}"]`)?.focus({ preventScroll: true })
  }, name)
  await seite.keyboard.press('Enter')
  await seite.getByRole('dialog', { name: new RegExp(`^Schnellansicht: ${escapeRegExp(name)}`) }).waitFor({ state: 'visible', timeout: 10000 })
  await seite.waitForTimeout(700)
}

/** Schnellansicht über ihr „×" schließen (Treiberaktion). */
async function schliesseSchnellansicht(seite) {
  await seite.getByRole('button', { name: 'Schnellansicht schließen' }).click()
  await seite.locator('.schnellansicht').waitFor({ state: 'detached', timeout: 10000 })
  await seite.waitForTimeout(300)
}

/** Detail eines Markers über Schnellansicht -> „Bearbeiten" öffnen. Liefert die
 *  Markerlage VOR dem Klick, also nach dem Verschieben der Karte durch das Öffnen —
 *  das ist der Ausschnitt, der „zuletzt zu sehen war" (ADR-0038 Punkt 3) und nach
 *  dem Rückweg wieder dastehen muss. */
async function fokussiereUndOeffneMarker(seite, name) {
  await oeffneMarkerSchnellansicht(seite, name)
  const lage = await leseMarkerLage(seite)
  await seite.getByRole('button', { name: 'Bearbeiten', exact: true }).click()
  await seite.waitForURL(/\/orte\/[^/?]+/, { timeout: 10000 })
  await seite.waitForTimeout(500)
  return lage
}

/** Der eine Weg zurück je Breite (pruefeAbschlussKombination): ab lg „Detailansicht
 *  schließen", darunter „Zurück". */
function schliesseDetailAnsicht(seite) {
  return seite
    .locator('[aria-label="Detailansicht schließen"]:visible, button:visible:has-text("Zurück")')
    .first()
    .click()
}

async function pruefeKartenausschnittBleibtErhalten(browser, breite, befunde) {
  const kontext = `${breite.name}/kartenausschnitt`
  const seite = await browser.newPage({ viewport: { width: breite.width, height: breite.height } })
  seite.on('pageerror', (fehler) => befunde.push(`${kontext}: Laufzeitfehler: ${fehler.message}`))
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeKartenOrtAn(seite, 'Ka-A', 'ka', 52.52, 13.405)
    await legeKartenOrtAn(seite, 'Ka-B', 'ka', 48.137, 11.575)
    await legeKartenOrtAn(seite, 'Ka-C', 'kb', 37.98, 23.73)

    await seite.goto(BASIS + '/orte?ansicht=karte', { waitUntil: 'networkidle' })
    await warteAufKartenmarker(seite, 3)
    const eingepasst = await leseMarkerLage(seite)

    // --- Treiber: Ausschnitt mit Mausrad (heraus) und Ziehen abweichend setzen
    const mitteX = eingepasst.breite / 2
    const container = await seite.locator('.karte-container').boundingBox()
    await seite.mouse.move(container.x + mitteX, container.y + eingepasst.hoehe / 2)
    await seite.mouse.wheel(0, 60)
    await seite.waitForTimeout(900)
    await seite.mouse.move(container.x + mitteX, container.y + eingepasst.hoehe / 2)
    await seite.mouse.down()
    await seite.mouse.move(container.x + mitteX + 30, container.y + eingepasst.hoehe / 2 + 20, { steps: 8 })
    await seite.mouse.up()
    await seite.waitForTimeout(700)
    const gesetzt = await leseMarkerLage(seite)

    const abweichung = maxAbweichung(eingepasst, gesetzt)
    if (!(abweichung > KARTENAUSSCHNITT_MINDESTABWEICHUNG_PX)) {
      befunde.push(`${kontext}: Vorbedingung nicht erreicht — der gesetzte Ausschnitt weicht nur um ${abweichung}px vom eingepassten ab`)
      return
    }
    if (!gesetzt.marker.some((m) => liegtImContainer(gesetzt, m))) {
      befunde.push(`${kontext}: Vorbedingung nicht erreicht — kein Marker im gesetzten Ausschnitt`)
      return
    }

    const markiere = () => seite.evaluate(() => { document.querySelector('.karte-container').dataset.rauchtestAlt = '1' })
    // Erwartet wird nicht mehr der Stand von `gesetzt`, sondern der Ausschnitt, der
    // nach dem Öffnen der Schnellansicht zu sehen war (PO-2026-11-24-005: das
    // Öffnen verschiebt die Karte minimal, wenn der Marker darunter läge) — das
    // ist der Stand, der „zuletzt zu sehen war" und wiederhergestellt werden muss.
    let erwartet = gesetzt
    const pruefeNachRueckweg = async (weg) => {
      await warteAufKartenmarker(seite, 3)
      const neuAufgebaut = await seite.evaluate(() => document.querySelector('.karte-container')?.dataset.rauchtestAlt === undefined)
      if (!neuAufgebaut) befunde.push(`${kontext}: ${weg} — Vorbedingung nicht erreicht, die Karte wurde nicht neu aufgebaut`)
      const lage = await leseMarkerLage(seite)
      const ab = maxAbweichung(erwartet, lage)
      if (!(ab <= KARTENAUSSCHNITT_TOLERANZ_PX)) {
        const eingep = maxAbweichung(eingepasst, lage)
        befunde.push(`${kontext}: ${weg} — Ausschnitt nicht wiederhergestellt (Abweichung ${ab === Infinity ? 'unvergleichbar' : ab.toFixed(1) + 'px'} > ${KARTENAUSSCHNITT_TOLERANZ_PX}px${eingep <= KARTENAUSSCHNITT_TOLERANZ_PX ? ', stattdessen eingepasst' : ''})`)
      }
    }

    // Rückweg 1: Detail über Marker + „Bearbeiten" öffnen, über „Detailansicht schließen" zurück
    await markiere()
    erwartet = await fokussiereUndOeffneMarker(seite, 'Ka-A')
    await schliesseDetailAnsicht(seite)
    await pruefeNachRueckweg('Schließen')
    await schliesseSchnellansicht(seite)

    // Rückweg 2: Detail, dann Browser-Zurück
    await markiere()
    erwartet = await fokussiereUndOeffneMarker(seite, 'Ka-B')
    await seite.goBack({ waitUntil: 'networkidle' })
    await pruefeNachRueckweg('goBack aus dem Detail')
    await schliesseSchnellansicht(seite)

    // Rückweg 3: Liste und zurück zur Karte
    await markiere()
    await seite.locator('.werkzeugleiste__ansicht-umschalten:visible').first().click()
    await seite.locator('.ortszeile').first().waitFor({ state: 'visible', timeout: 10000 })
    await seite.locator('.werkzeugleiste__ansicht-umschalten:visible').first().click()
    await pruefeNachRueckweg('Liste → Karte')

    // Rückweg 4: über /daten (die Bereichsansicht wird dabei ausgehängt)
    await markiere()
    // Echter Klick (Playwright prüft, dass nichts den Link überdeckt): Bei 320px
    // lag die Leaflet-Quellenangabe über der festen Tab-Leiste und fing den Klick
    // ab — `.karte-wrapper` bildet dafür jetzt einen eigenen Stapelkontext.
    await seite.locator('a:visible', { hasText: /^\s*Daten\s*$/ }).first().click({ timeout: 5000 })
    await seite.waitForURL(/\/daten/, { timeout: 10000 })
    await seite.goBack({ waitUntil: 'networkidle' })
    await pruefeNachRueckweg('Karte → Daten → goBack')

    await seite.screenshot({ path: `${FOTOS}/${breite.name}-kartenausschnitt-wiederhergestellt.png` })

    // Neuladen: Sitzung = JS-Lebensdauer, der Startausschnitt ist wieder der eingepasste
    await seite.reload({ waitUntil: 'networkidle' })
    await warteAufKartenmarker(seite, 3)
    const nachNeuladen = await leseMarkerLage(seite)
    const abNeuladen = maxAbweichung(eingepasst, nachNeuladen)
    if (!(abNeuladen <= KARTENAUSSCHNITT_TOLERANZ_PX)) {
      befunde.push(`${kontext}: nach dem Neuladen ist der Ausschnitt nicht der eingepasste Startausschnitt (Abweichung ${abNeuladen === Infinity ? 'unvergleichbar' : abNeuladen.toFixed(1) + 'px'})`)
    }

    // Filterfall: auf Ka-A hineinzoomen, bis Ka-C außerhalb liegt; Filter „kb"
    // in der Liste; zurück zur Karte -> eingepasst auf Ka-C
    const a = nachNeuladen.marker.find((m) => m.name.startsWith('Ka-A'))
    const c = () => leseMarkerLage(seite).then((l) => ({ l, c: l.marker.find((m) => m.name.startsWith('Ka-C')) }))
    const cont = await seite.locator('.karte-container').boundingBox()
    await seite.mouse.move(cont.x + a.x, cont.y + a.y)
    let zustand = await c()
    for (let i = 0; i < 4 && liegtImContainer(zustand.l, zustand.c); i += 1) {
      await seite.mouse.wheel(0, -240)
      await seite.waitForTimeout(900)
      zustand = await c()
    }
    if (liegtImContainer(zustand.l, zustand.c)) {
      befunde.push(`${kontext}: Filterfall — Vorbedingung nicht erreicht, Ka-C liegt trotz Heranzoomen im Ausschnitt`)
      return
    }
    if (!zustand.l.marker.some((m) => m.name.startsWith('Ka-A') && liegtImContainer(zustand.l, m))) {
      befunde.push(`${kontext}: Filterfall — Vorbedingung nicht erreicht, Ka-A liegt nicht im gemerkten Ausschnitt`)
      return
    }
    await markiere()
    await seite.locator('.werkzeugleiste__ansicht-umschalten:visible').first().click()
    await seite.locator('.ortszeile').first().waitFor({ state: 'visible', timeout: 10000 })
    await seite.locator('.tag-filterleiste__pill', { hasText: /^\s*kb\s*$/ }).click()
    await seite.waitForTimeout(300)
    await seite.locator('.werkzeugleiste__ansicht-umschalten:visible').first().click()
    await warteAufKartenmarker(seite, 1)
    const gefiltert = await leseMarkerLage(seite)
    const neu = await seite.evaluate(() => document.querySelector('.karte-container')?.dataset.rauchtestAlt === undefined)
    if (!neu) befunde.push(`${kontext}: Filterfall — Vorbedingung nicht erreicht, die Karte wurde nicht neu aufgebaut`)
    const nurC = gefiltert.marker[0]
    if (!nurC || !liegtImContainer(gefiltert, nurC)) {
      befunde.push(`${kontext}: Filterfall — der einzige gefilterte Marker liegt nicht im Ausschnitt (kein Einpassen)`)
    } else if (
      Math.abs(nurC.x - gefiltert.breite / 2) > KARTENAUSSCHNITT_TOLERANZ_PX ||
      Math.abs(nurC.y - gefiltert.hoehe / 2) > KARTENAUSSCHNITT_TOLERANZ_PX
    ) {
      befunde.push(`${kontext}: Filterfall — der gefilterte Marker liegt nicht in der Mitte des eingepassten Ausschnitts`)
    }
    await seite.screenshot({ path: `${FOTOS}/${breite.name}-kartenausschnitt-filter-eingepasst.png` })

    // Filteränderung IN der Kartenansicht passt wie bisher neu ein: Der Filter
    // wird hier wieder abgewählt, die zwei zusätzlichen Marker (Berlin, München
    // — bei dem eingepassten Zoom 14 auf Athen nicht im Ausschnitt) müssen
    // danach alle im Ausschnitt liegen.
    await seite.locator('.tag-filterleiste__pill', { hasText: /^\s*kb\s*$/ }).click()
    await warteAufKartenmarker(seite, 3)
    const entfiltert = await leseMarkerLage(seite)
    if (!entfiltert.marker.every((m) => liegtImContainer(entfiltert, m))) {
      befunde.push(`${kontext}: Filteränderung in der Kartenansicht — nicht alle Marker liegen danach im Ausschnitt (kein Neu-Einpassen)`)
    }
    console.log(`  ${kontext} — geprüft (vier Rückwege, Neuladen, Filterfall), Bildschirmfotos in ${FOTOS}/`)
  } catch (fehler) {
    befunde.push(`${kontext}: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  } finally {
    await seite.close()
  }
}

/**
 * PO-2026-11-24-004: Bestand für die Karten-Marker. Zwei Reihen auf einem
 * Breitengrad im Abstand von 0,0006° Länge — bei Zoom 17 sind das 56px, also
 * KEINE sich überlappenden Trefferflächen (44px), aber einander überlappende
 * Namensetiketten (120px). Reihe B liegt 0,0009° südlich (≈137px bei Zoom 17).
 *   Hoch / Niedrig  — alle Achsen 9 bzw. 5: Note unabhängig vom Szenario
 *   Zehn            — „10,0" muss in den Kreis passen
 *   Lang            — Name weit über 120px (wird gekürzt), nur Ambiente 8
 *   Nur-Zeit        — nur Zeit 7: bei Eigene (nur Ambiente zählt) „ohne Gewicht"
 *   Ohne            — keine Bewertung: Punkt ohne Zahl
 *   Aenderung/Gegen — Aenderung 8,0 (Ausgewogen) bzw. 8,7 (Fokus Geschmack),
 *                     Gegen konstant 8,5: der Vorrang kippt mit dem Szenario
 * Achsenindizes: 0 Ambiente, 1 Zeit, 2 Geschmack, 3 Preis-Leistung.
 */
const KARTE_MARKER_LAENGE0 = 13.405
const KARTE_MARKER_SCHRITT = 0.0006
const KARTE_MARKER_BESTAND = [
  { bezeichnung: 'Mk-Paar-Hoch-Mit-Einem-Sehr-Langen-Namen-Fuer-Die-Kuerzung', achsen: { 0: 9, 1: 9, 2: 9, 3: 9 }, reihe: 'A', k: 0 },
  { bezeichnung: 'Mk-Paar-Niedrig-Mit-Einem-Sehr-Langen-Namen-Fuer-Die-Kuerzung', achsen: { 0: 5, 1: 5, 2: 5, 3: 5 }, reihe: 'A', k: 1 },
  { bezeichnung: 'Mk-Zehn', achsen: { 0: 10, 1: 10, 2: 10, 3: 10 }, reihe: 'A', k: 4 },
  { bezeichnung: 'Mk-Lang-Mit-Einer-Bezeichnung-Die-Deutlich-Ueber-Zweihundertvierzig-Pixel-Hinausreicht', achsen: { 0: 8 }, reihe: 'A', k: 2 },
  { bezeichnung: 'Mk-Nur-Zeit', achsen: { 1: 7 }, reihe: 'A', k: 3 },
  { bezeichnung: 'Mk-Ohne', achsen: {}, reihe: 'B', k: 0.5 },
  { bezeichnung: 'Mk-Aenderung', achsen: { 0: 6, 2: 10 }, reihe: 'B', k: 2.5 },
  { bezeichnung: 'Mk-Gegen', achsen: { 0: 9, 1: 8 }, reihe: 'B', k: 3.5 },
]
const KARTE_MARKER_PAAR_HOCH = 'Mk-Paar-Hoch'
const KARTE_MARKER_PAAR_NIEDRIG = 'Mk-Paar-Niedrig'
/** Zielabstand der beiden Paar-Marker in px (Zoom 17 = 56px). */
const KARTE_MARKER_ABSTAND = { min: 48, max: 70 }
/** Etikettbreite im Normalzustand = Token `--karte-marker-etikett`. */
const KARTE_MARKER_ETIKETT_BREITE = 120

async function legeKartenMarkerBestandAn(seite) {
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  if ((await seite.locator('.ortszeile', { hasText: KARTE_MARKER_PAAR_HOCH }).count()) > 0) return
  for (const ort of KARTE_MARKER_BESTAND) {
    await legeOrtAnUndOeffneIhn(seite, ort.bezeichnung)
    for (const [index, wert] of Object.entries(ort.achsen)) {
      await seite.locator('.bewertungsachse').nth(Number(index)).locator('input[type="number"]').fill(String(wert))
      await seite.keyboard.press('Tab')
      await seite.waitForTimeout(100)
    }
    await seite.getByRole('button', { name: 'Koordinaten von Hand eintragen' }).click()
    await seite.locator('#ortsdetail-breite').fill(ort.reihe === 'A' ? '52.52' : '52.5191')
    await seite.locator('#ortsdetail-laenge').fill((KARTE_MARKER_LAENGE0 + ort.k * KARTE_MARKER_SCHRITT).toFixed(5))
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(400)
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await seite.waitForTimeout(150)
  }
}

/** Liest alle Marker mit allem, was die Zusicherungen brauchen. Rechtecke in
 *  Fensterkoordinaten (gleiches System für Etikett und Körper). */
function leseKartenMarker(seite) {
  return seite.evaluate(() => {
    const rechteck = (el) => {
      const b = el.getBoundingClientRect()
      return { links: b.left, oben: b.top, rechts: b.right, unten: b.bottom }
    }
    return [...document.querySelectorAll('.karte-marker')].map((el) => {
      const label = el.querySelector('.karte-marker__label')
      const koerper = el.querySelector('.karte-marker__koerper')
      const name = el.getAttribute('aria-label') ?? ''
      const box = el.getBoundingClientRect()
      return {
        name,
        basis: name.replace(/, (Gesamtnote |keine Gesamtnote).*$/, ''),
        text: koerper?.textContent ?? '',
        istPunkt: koerper?.classList.contains('karte-marker__punkt') ?? false,
        koerperUeberlauf: koerper ? koerper.scrollWidth > koerper.clientWidth : false,
        labelAus: label?.classList.contains('karte-marker__label--aus') ?? true,
        labelVorhanden: label != null,
        labelAriaHidden: label?.getAttribute('aria-hidden') ?? null,
        labelZeiger: label ? getComputedStyle(label).pointerEvents : null,
        labelDeckkraft: label ? getComputedStyle(label).opacity : null,
        labelGekuerzt: label ? label.scrollWidth > label.clientWidth : false,
        koerper: koerper ? rechteck(koerper) : null,
        etikett: label ? rechteck(label) : null,
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
      }
    })
  })
}

function rechteckeUeberlappen(a, b) {
  return a.links < b.rechts && b.links < a.rechts && a.oben < b.unten && b.oben < a.unten
}

/** Zusicherung: keine zwei SICHTBAREN Namen überlappen sich, und kein sichtbarer
 *  Name liegt auf Scheibe/Punkt eines anderen Markers (Eigenschaft über alle
 *  Marker, keine Namensliste). */
function pruefeKeineUeberlappung(marker, wo, befunde) {
  const sichtbar = marker.filter((m) => !m.labelAus && m.etikett)
  for (const [i, a] of sichtbar.entries()) {
    for (const b of sichtbar.slice(i + 1)) {
      if (rechteckeUeberlappen(a.etikett, b.etikett)) befunde.push(`${wo}: die Namen von „${a.basis}" und „${b.basis}" überlappen sich`)
    }
    for (const m of marker) {
      if (m !== a && m.koerper && rechteckeUeberlappen(a.etikett, m.koerper)) befunde.push(`${wo}: der Name von „${a.basis}" liegt auf Scheibe/Punkt von „${m.basis}"`)
    }
  }
}

/** Zoomt (Mausrad um die Mitte der Marker), bis der Abstand der beiden
 *  Paar-Marker im Zielbereich liegt; liefert den Abstand oder null. */
async function stelleKartenMarkerAbstandEin(seite) {
  for (let i = 0; i < 6; i += 1) {
    const marker = await leseKartenMarker(seite)
    const hoch = marker.find((m) => m.basis.startsWith(KARTE_MARKER_PAAR_HOCH))
    const niedrig = marker.find((m) => m.basis.startsWith(KARTE_MARKER_PAAR_NIEDRIG))
    if (!hoch || !niedrig) return null
    const abstand = Math.abs(hoch.x - niedrig.x)
    if (abstand >= KARTE_MARKER_ABSTAND.min && abstand <= KARTE_MARKER_ABSTAND.max) return abstand
    const mx = marker.reduce((summe, m) => summe + m.x, 0) / marker.length
    const my = marker.reduce((summe, m) => summe + m.y, 0) / marker.length
    await seite.mouse.move(mx, my)
    await seite.mouse.wheel(0, abstand > KARTE_MARKER_ABSTAND.max ? 60 : -60)
    await seite.waitForTimeout(900)
  }
  return null
}

/** Maus in eine neutrale Ecke der Kartenfläche (kein Marker, kein Bedienelement),
 *  damit :hover keinen Namen aufklappt, den die Messung dann mitmisst. */
async function parkeMausNeutral(seite) {
  const cont = await seite.locator('.karte-container').boundingBox()
  await seite.mouse.move(cont.x + cont.width / 2, cont.y + 3)
  await seite.waitForTimeout(350)
}

async function bereiteKartenMarkerVor(seite) {
  await legeKartenMarkerBestandAn(seite)
  await seite.goto(BASIS + '/orte?ansicht=karte', { waitUntil: 'networkidle' })
  await warteAufKartenmarker(seite, KARTE_MARKER_BESTAND.length)
  await stelleKartenMarkerAbstandEin(seite)
  await parkeMausNeutral(seite)
}

async function sortiereListeNachGesamtnote(seite) {
  await seite.locator('.werkzeugleiste__chip').click()
  await seite.waitForTimeout(200)
  await seite.locator('.sortier-sheet__eintrag', { hasText: 'Gesamtnote' }).click()
  await seite.waitForTimeout(300)
}

/** Wert je Ort, wie ihn die Ortszeile zeigt (Liste muss nach Gesamtnote sortiert sein). */
function leseListenNoten(seite) {
  return seite.evaluate(() =>
    [...document.querySelectorAll('.ortszeile')]
      .map((zeile) => ({
        name: zeile.querySelector('.ortszeile__bezeichnung')?.textContent?.trim() ?? '',
        wert: zeile.querySelector('.ortszeile__gesamtnote-wert')?.textContent?.trim() ?? null,
      }))
      .filter((eintrag) => eintrag.name.startsWith('Mk-')),
  )
}

/** Notentext, Punkt-statt-Zahl und zugänglicher Name jedes Markers = Wert der Ortszeile. */
function vergleicheMarkerMitListe(marker, liste, wo, befunde, ohneGewicht = []) {
  for (const eintrag of liste) {
    const m = marker.find((kandidat) => kandidat.basis === eintrag.name)
    if (!m) {
      befunde.push(`${wo}: kein Marker für „${eintrag.name}"`)
      continue
    }
    if (eintrag.wert !== null) {
      if (m.name !== `${eintrag.name}, Gesamtnote ${eintrag.wert}`) befunde.push(`${wo}: zugänglicher Name „${m.name}" statt „${eintrag.name}, Gesamtnote ${eintrag.wert}"`)
      if (m.text !== eintrag.wert || m.istPunkt) befunde.push(`${wo}: „${eintrag.name}" zeigt im Kreis „${m.text}" statt dem Wert der Ortszeile „${eintrag.wert}"`)
      if (m.koerperUeberlauf) befunde.push(`${wo}: „${m.text}" passt bei „${eintrag.name}" nicht in den Kreis`)
    } else {
      const erwartet = ohneGewicht.includes(eintrag.name)
        ? `${eintrag.name}, keine Gesamtnote bei dieser Gewichtung`
        : `${eintrag.name}, keine Gesamtnote`
      if (m.name !== erwartet) befunde.push(`${wo}: zugänglicher Name „${m.name}" statt „${erwartet}"`)
      if (!m.istPunkt || m.text !== '') befunde.push(`${wo}: „${eintrag.name}" ohne Note zeigt „${m.text}" statt eines Punkts ohne Zahl`)
    }
  }
}

/**
 * PO-2026-11-24-004, harte Zusicherungen für die Karten-Marker — je Breite aus
 * BREITEN, frische Seite, eigener Bestand (`KARTE_MARKER_BESTAND`). Eigenschaften,
 * keine Stellen:
 *   1. Notentext, Punkt-statt-Zahl und zugänglicher Name jedes Markers = der
 *      Wert der Ortszeile (derselbe Wert, ADR-0037 Punkt 7); „10,0" passt in
 *      den Kreis; ohne Gewicht heißt es „… keine Gesamtnote bei dieser Gewichtung".
 *   2. Im Ausgangsausschnitt und im verdichteten Zoom überlappen keine zwei
 *      sichtbaren Namen und kein Name liegt auf einem anderen Marker.
 *   3. Verdichtet (Paar bei Zoom 17, Vorbedingung: ihre Etiketten überlappen,
 *      ihre Körper nicht) ist der Name des höher bewerteten Orts sichtbar, der
 *      andere nicht; der Punkt des ausgeblendeten Namens bleibt antippbar;
 *      Etiketten haben pointer-events:none und aria-hidden.
 *   4. Hover und Tastaturfokus zeigen den ausgeblendeten Namen; der Fokus
 *      verschafft ihm Vorrang.
 *   5. Heranzoomen löst die Überlappung: beide Namen sichtbar.
 *   6. Ein Szenariowechsel in der geöffneten Karte (ohne Neumontage) ändert
 *      Zahlen UND Vorrang sofort, und die Zahlen bleiben gleich der Ortszeile;
 *      bei Eigene (nur Ambiente) steht der Ort nur mit Zeit ohne Zahl.
 * Nicht per Rauchtest prüfbar bis -005: der ausgewählte Marker (die Prop
 * `ausgewaehlteOrtId` setzt `Ortebereich.vue` erst mit der Schnellansicht).
 */
async function pruefeKartenMarker(browser, breite, befunde) {
  const kontext = `${breite.name}/karten-marker`
  const seite = await browser.newPage({ viewport: { width: breite.width, height: breite.height } })
  seite.on('pageerror', (fehler) => befunde.push(`${kontext}: Laufzeitfehler: ${fehler.message}`))
  const anzahl = KARTE_MARKER_BESTAND.length
  try {
    await legeKartenMarkerBestandAn(seite)
    await sortiereListeNachGesamtnote(seite)
    const liste = await leseListenNoten(seite)
    if (liste.length !== anzahl) {
      befunde.push(`${kontext}: Vorbedingung nicht erreicht — ${liste.length} statt ${anzahl} Orte in der Liste`)
      return
    }

    await seite.goto(BASIS + '/orte?ansicht=karte', { waitUntil: 'networkidle' })
    await warteAufKartenmarker(seite, anzahl)
    await parkeMausNeutral(seite)
    await seite.screenshot({ path: `${FOTOS}/${breite.name}-karten-marker-eingepasst.png` })

    // 1 + 2 (Ausgangsausschnitt)
    let marker = await leseKartenMarker(seite)
    vergleicheMarkerMitListe(marker, liste, `${kontext} (eingepasst)`, befunde)
    pruefeKeineUeberlappung(marker, `${kontext} (eingepasst)`, befunde)
    for (const m of marker) {
      if (!m.labelVorhanden || m.labelAriaHidden !== 'true') befunde.push(`${kontext}: der Name von „${m.basis}" ist nicht aria-hidden`)
      if (m.labelZeiger !== 'none') befunde.push(`${kontext}: der Name von „${m.basis}" fängt Zeigerereignisse ab (pointer-events ${m.labelZeiger})`)
    }

    // Verdichten: Paar bei Zoom 17
    const abstand = await stelleKartenMarkerAbstandEin(seite)
    await parkeMausNeutral(seite)
    if (abstand === null) {
      befunde.push(`${kontext}: Vorbedingung nicht erreicht — der Abstand des Paars ließ sich nicht auf ${KARTE_MARKER_ABSTAND.min}-${KARTE_MARKER_ABSTAND.max}px einstellen`)
      return
    }
    marker = await leseKartenMarker(seite)
    const hoch = marker.find((m) => m.basis.startsWith(KARTE_MARKER_PAAR_HOCH))
    const niedrig = marker.find((m) => m.basis.startsWith(KARTE_MARKER_PAAR_NIEDRIG))
    const lang = marker.find((m) => m.basis.startsWith('Mk-Lang'))
    if (!rechteckeUeberlappen(hoch.etikett, niedrig.etikett) || rechteckeUeberlappen(hoch.koerper, niedrig.koerper)) {
      befunde.push(`${kontext}: Vorbedingung nicht erreicht — die Etiketten des Paars überlappen nicht oder ihre Körper berühren sich`)
      return
    }
    await seite.screenshot({ path: `${FOTOS}/${breite.name}-karten-marker-verdichtet.png` })
    pruefeKeineUeberlappung(marker, `${kontext} (verdichtet)`, befunde)
    if (hoch.labelAus) befunde.push(`${kontext}: von zwei kollidierenden Namen fehlt der des höher bewerteten Orts (${hoch.basis}, 9,0)`)
    if (!niedrig.labelAus) befunde.push(`${kontext}: der Name des niedriger bewerteten Orts (${niedrig.basis}, 5,0) bleibt trotz Kollision sichtbar`)
    if (!lang.labelGekuerzt || lang.etikett.rechts - lang.etikett.links > KARTE_MARKER_ETIKETT_BREITE + 1) {
      befunde.push(`${kontext}: der lange Name von „${lang.basis}" ist nicht auf ${KARTE_MARKER_ETIKETT_BREITE}px gekürzt`)
    }
    // Ausgeblendeter Name: Punkt/Kreis bleibt sichtbar und antippbar.
    const trifft = await seite.evaluate((name) => {
      const el = [...document.querySelectorAll('.karte-marker')].find((kandidat) => (kandidat.getAttribute('aria-label') ?? '').startsWith(name))
      const k = el?.querySelector('.karte-marker__koerper')?.getBoundingClientRect()
      if (!el || !k) return null
      const oben = document.elementFromPoint(k.left + k.width / 2, k.top + k.height / 2)
      return oben?.closest('.karte-marker') === el
    }, KARTE_MARKER_PAAR_NIEDRIG)
    if (trifft !== true) befunde.push(`${kontext}: der Kreis des Orts mit ausgeblendetem Namen ist nicht antippbar (Treffer ${trifft})`)

    // 4. Hover und Fokus
    await seite.mouse.move(niedrig.x, niedrig.y)
    await seite.waitForTimeout(400)
    const hoverDeckkraft = await seite.evaluate((name) => {
      const el = [...document.querySelectorAll('.karte-marker')].find((kandidat) => (kandidat.getAttribute('aria-label') ?? '').startsWith(name))
      return el ? getComputedStyle(el.querySelector('.karte-marker__label')).opacity : null
    }, KARTE_MARKER_PAAR_NIEDRIG)
    if (hoverDeckkraft !== '1') befunde.push(`${kontext}: der ausgeblendete Name erscheint bei Hover nicht (Deckkraft ${hoverDeckkraft})`)
    await parkeMausNeutral(seite)
    await seite.evaluate((name) => {
      ;[...document.querySelectorAll('.karte-marker')].find((kandidat) => (kandidat.getAttribute('aria-label') ?? '').startsWith(name))?.focus({ preventScroll: true })
    }, KARTE_MARKER_PAAR_NIEDRIG)
    await seite.waitForTimeout(500)
    marker = await leseKartenMarker(seite)
    const nFokus = marker.find((m) => m.basis.startsWith(KARTE_MARKER_PAAR_NIEDRIG))
    const hFokus = marker.find((m) => m.basis.startsWith(KARTE_MARKER_PAAR_HOCH))
    if (nFokus.labelAus) befunde.push(`${kontext}: der Name des fokussierten Markers ist ausgeblendet`)
    if (!hFokus.labelAus) befunde.push(`${kontext}: der fokussierte Marker verdrängt den höher bewerteten Namen nicht (Vorrang Fokus)`)
    await seite.evaluate(() => document.activeElement?.blur())
    await seite.waitForTimeout(500)
    marker = await leseKartenMarker(seite)
    if (marker.find((m) => m.basis.startsWith(KARTE_MARKER_PAAR_HOCH)).labelAus) befunde.push(`${kontext}: nach dem Fokusverlust bleibt der Name des höher bewerteten Orts ausgeblendet`)

    // 6. Szenariowechsel bei geöffneter Karte (ohne Neumontage)
    await seite.evaluate(() => { document.querySelector('.karte-container').dataset.rauchtestAlt = '1' })
    const vorWechsel = marker.find((m) => m.basis === 'Mk-Aenderung')
    const gegenVor = marker.find((m) => m.basis === 'Mk-Gegen')
    if (vorWechsel.text !== '8,0' || !vorWechsel.labelAus || gegenVor.labelAus) {
      befunde.push(`${kontext}: Vorbedingung nicht erreicht — Ausgewogen: Aenderung "${vorWechsel.text}" (Name ${vorWechsel.labelAus ? 'aus' : 'an'}), Gegen Name ${gegenVor.labelAus ? 'aus' : 'an'}`)
    }
    await waehleGewichtungUeberSortierSheet(seite, 'Fokus Geschmack')
    await parkeMausNeutral(seite)
    if (await seite.evaluate(() => document.querySelector('.karte-container')?.dataset.rauchtestAlt === undefined)) {
      befunde.push(`${kontext}: Vorbedingung nicht erreicht — die Karte wurde beim Szenariowechsel neu aufgebaut`)
    }
    marker = await leseKartenMarker(seite)
    const nachWechsel = marker.find((m) => m.basis === 'Mk-Aenderung')
    const gegenNach = marker.find((m) => m.basis === 'Mk-Gegen')
    if (nachWechsel.text !== '8,7') befunde.push(`${kontext}: nach dem Szenariowechsel zeigt Aenderung "${nachWechsel.text}" statt "8,7"`)
    if (nachWechsel.labelAus || !gegenNach.labelAus) befunde.push(`${kontext}: nach dem Szenariowechsel kippt der Vorrang nicht (Aenderung 8,7 vor Gegen 8,5)`)
    pruefeKeineUeberlappung(marker, `${kontext} (Fokus Geschmack)`, befunde)

    // Zahlen = Ortszeile nach dem Wechsel: Liste ohne Neuladen über die Umschaltung.
    await seite.locator('.werkzeugleiste__ansicht-umschalten:visible').first().click()
    await seite.locator('.ortszeile').first().waitFor({ state: 'visible', timeout: 10000 })
    const listeFokus = await leseListenNoten(seite)
    await seite.locator('.werkzeugleiste__ansicht-umschalten:visible').first().click()
    await warteAufKartenmarker(seite, anzahl)
    marker = await leseKartenMarker(seite)
    vergleicheMarkerMitListe(marker, listeFokus, `${kontext} (Fokus Geschmack)`, befunde)

    // Eigene Gewichte: nur Ambiente zählt -> „Nur-Zeit" ohne Gewicht
    const dialog = await oeffneGewichtungSheetUeberSortierSheet(seite)
    await dialog.locator('.gewichtung-sheet__name', { hasText: 'Eigene' }).click()
    await seite.waitForTimeout(300)
    await setzeEigeneGewichteUeberZahlenfelder(seite, dialog, { zeit: 0, geschmack: 0, preisLeistung: 0 })
    await seite.waitForTimeout(300)
    await seite.keyboard.press('Escape')
    await seite.waitForTimeout(400)
    marker = await leseKartenMarker(seite)
    const nurZeit = marker.find((m) => m.basis === 'Mk-Nur-Zeit')
    if (!nurZeit || nurZeit.name !== 'Mk-Nur-Zeit, keine Gesamtnote bei dieser Gewichtung' || !nurZeit.istPunkt || nurZeit.text !== '') {
      befunde.push(`${kontext}: bei Eigene (nur Ambiente) steht Mk-Nur-Zeit als „${nurZeit?.name}" mit „${nurZeit?.text}" statt als Punkt „… keine Gesamtnote bei dieser Gewichtung"`)
    }
    const ohne = marker.find((m) => m.basis === 'Mk-Ohne')
    if (ohne?.name !== 'Mk-Ohne, keine Gesamtnote') befunde.push(`${kontext}: der unbewertete Ort heißt „${ohne?.name}" statt „Mk-Ohne, keine Gesamtnote"`)
    await seite.screenshot({ path: `${FOTOS}/${breite.name}-karten-marker-eigene-gewichtung.png` })

    // 5. Heranzoomen löst die Überlappung auf (Zurück auf Ausgewogen: Paar unverändert)
    const cont = await seite.locator('.karte-container').boundingBox()
    const mitte = marker.find((m) => m.basis.startsWith(KARTE_MARKER_PAAR_HOCH))
    await seite.mouse.move(Math.min(Math.max(mitte.x, cont.x + 60), cont.x + cont.width - 60), cont.y + cont.height / 2)
    for (let i = 0; i < 3; i += 1) {
      await seite.mouse.wheel(0, -60)
      await seite.waitForTimeout(900)
    }
    await parkeMausNeutral(seite)
    marker = await leseKartenMarker(seite)
    const hochZoom = marker.find((m) => m.basis.startsWith(KARTE_MARKER_PAAR_HOCH))
    const niedrigZoom = marker.find((m) => m.basis.startsWith(KARTE_MARKER_PAAR_NIEDRIG))
    const abstandZoom = Math.abs(hochZoom.x - niedrigZoom.x)
    if (!(abstandZoom > 130)) {
      befunde.push(`${kontext}: Vorbedingung nicht erreicht — nach dem Heranzoomen beträgt der Abstand des Paars nur ${abstandZoom.toFixed(0)}px`)
    } else if (hochZoom.labelAus || niedrigZoom.labelAus) {
      befunde.push(`${kontext}: nach dem Heranzoomen (Abstand ${abstandZoom.toFixed(0)}px, keine Überlappung mehr) bleibt ein Name ausgeblendet`)
    }
    pruefeKeineUeberlappung(marker, `${kontext} (herangezoomt)`, befunde)
    console.log(`  ${kontext} — geprüft (Note = Ortszeile, Kollision, Vorrang, Hover/Fokus, Szenariowechsel, Heranzoomen), Bildschirmfotos in ${FOTOS}/`)
  } catch (fehler) {
    befunde.push(`${kontext}: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  } finally {
    await seite.close()
  }
}

/** Öffnet jede Ansicht bei einer Breite und prüft die Zusicherungen 1-5
 *  (Zusicherung 2 — Laufzeitfehler — hängt an Listenern auf `seite`, die
 *  der Aufrufer vor dem Aufruf registriert). */
async function pruefeAnsichtenBeiBreite(hauptSeite, breite, befunde) {
  const legendenGesehen = { inMasterDetail: 0, standalone: 0 }
  for (const ansicht of ANSICHTEN) {
    // `eigenerKontext`: frischer Kontext statt der gemeinsamen Seite (s. ANSICHTEN).
    const seite = ansicht.eigenerKontext
      ? await (await hauptSeite.context().browser().newContext({ viewport: { width: breite.width, height: breite.height } })).newPage()
      : hauptSeite
    if (ansicht.eigenerKontext) {
      seite.on('pageerror', (fehler) => befunde.push(`${breite.name}/${ansicht.name}: Laufzeitfehler: ${fehler.message}`))
    }
    await seite.goto(BASIS + ansicht.pfad, { waitUntil: 'networkidle' })
    if (ansicht.vorbereiten) await ansicht.vorbereiten(seite)
    await seite.waitForTimeout(400)

    // Zusicherung 1 + 3: die Ansicht ist geöffnet und nicht leer.
    const textLaenge = await seite.evaluate(() => document.body.innerText.trim().length)
    if (textLaenge === 0) befunde.push(`${breite.name}/${ansicht.name}: Ansicht ist leer`)

    for (const eintrag of await seite.evaluate(pruefeCssRessourcen)) {
      befunde.push(`${breite.name}/${ansicht.name}: ${eintrag}`)
    }
    for (const eintrag of await seite.evaluate(pruefeVerdeckung)) {
      befunde.push(`${breite.name}/${ansicht.name}: ${eintrag}`)
    }
    for (const eintrag of await seite.evaluate(pruefeUeberlauf)) {
      befunde.push(`${breite.name}/${ansicht.name}: ${eintrag}`)
    }
    // PO-2026-09-27-001: läuft auf JEDER Ansicht/Breite — benannte
    // Bedingung „jedes sichtbare <textarea>", keine Ansichtsnamen-Liste.
    for (const eintrag of await seite.evaluate(pruefeMehrzeiligeTextfelder)) {
      befunde.push(`${breite.name}/${ansicht.name}: ${eintrag}`)
    }
    // Design-Antwort Roundtrip PO-2026-09-27-003 (Empfehlung, hier
    // umgesetzt): läuft auf JEDER Ansicht/Breite — benannte Bedingung
    // „jeder Button mit direktem Text-Kindknoten", keine Ansichtsliste.
    for (const eintrag of await seite.evaluate(pruefeButtonTextUmbruch)) {
      befunde.push(`${breite.name}/${ansicht.name}: ${eintrag}`)
    }
    // PO-2026-09-26-002 (ADR-0032 Punkt 6): läuft auf JEDER Ansicht, deren
    // Wurzel `.master-detail` im DOM ist — benannte Bedingung, keine Liste
    // von Ansichtsnamen.
    if ((await seite.locator('.master-detail').count()) > 0) {
      await pruefeMasterDetailSpalten(seite, breite, `${breite.name}/${ansicht.name}`, befunde)
    }
    // PO-2026-09-13-002: nur auf der Ansicht, die Regler zeigt — kein neuer
    // Sonderpfad, läuft über dieselbe BREITEN-Liste wie alles andere hier.
    // Läuft über CDP statt `seite.evaluate` (s. Kommentar an der Funktion).
    // PO-2026-11-24-002: benannte Bedingung statt Ansichtsnamen — jede Ansicht,
    // die einen `input[type="range"]` im DOM hat (auch die Gewichtsregler im
    // Sheet), läuft durch die Greifbarkeitsprüfung.
    if ((await seite.locator('input[type="range"]').count()) > 0) {
      befunde.push(...(await pruefeReglerGreifbarkeit(seite, `${breite.name}/${ansicht.name}:`)))
    }
    if (ansicht.name === 'ortsdetail') {
      // PO-2026-09-13-003: ebenfalls kein neuer Sonderpfad, läuft über
      // dieselbe bereits geöffnete Ortsdetail-Seite und dieselbe BREITEN-Liste.
      await pruefeAbschlussKombination(seite, breite, befunde)
    }
    // PO-2026-11-24-007: Legenden-Auslöser mit sichtbarem Text, benannte
    // Bedingung „Listen-Kopfzeile mit Legende" (keine Ansichtsliste). Welche
    // der beiden Kopfzeilen-Varianten je Breite wirklich untersucht wurde,
    // sammelt `legendenGesehen` (Prüfung nach der Schleife).
    {
      const legende = await seite.evaluate(pruefeLegendenAusloeser)
      legendenGesehen.inMasterDetail += legende.gesehen.inMasterDetail
      legendenGesehen.standalone += legende.gesehen.standalone
      for (const eintrag of legende.befunde) befunde.push(`${breite.name}/${ansicht.name}: ${eintrag}`)
    }
    if (ansicht.name === 'ortsliste-zonen') {
      for (const eintrag of await seite.evaluate(pruefeZonenPlakette)) {
        befunde.push(`${breite.name}/${ansicht.name}: ${eintrag}`)
      }
    }
    // PO-2026-09-27-003 (ADR-0034), nur bei 1280px (Handoff-Vorgabe): läuft
    // über denselben, bereits von `bereiteOrtslisteZonenVor` angelegten
    // Datensatz weiter, kein zweiter Durchlauf.
    if (ansicht.name === 'ortsliste-zonen' && breite.width === 1280) {
      await pruefeAusgewaehlteZeileSchattenUndName(seite, befunde)
    }

    await seite.screenshot({ path: `${FOTOS}/${breite.name}-${ansicht.name}.png` })
    console.log(`  ${breite.name}/${ansicht.name} — geöffnet, Bildschirmfoto in ${FOTOS}/${breite.name}-${ansicht.name}.png`)
    if (ansicht.name === 'ortsliste-zonen' && breite.width === 1280) {
      await pruefeBalkenfuellungInZonenfarbe(seite, befunde)
    }
    if (ansicht.aufraeumen) await ansicht.aufraeumen(seite)
    if (ansicht.eigenerKontext) await seite.context().close()
  }
  if (legendenGesehen.inMasterDetail === 0) {
    befunde.push(`${breite.name}: Listen-Kopfzeile der Master-Detail-Liste mit Legenden-Auslöser wurde nie untersucht`)
  }
  if (legendenGesehen.standalone === 0) {
    befunde.push(`${breite.name}: Kopfzeile des Null-Treffer-Zustands mit Legenden-Auslöser wurde nie untersucht`)
  }
}

/**
 * Zusicherung 5 über alle vier Hinweiszustände der Ortssuche im
 * Ortsdetail (ADR-0023 Punkt 3, PO-2026-09-12-004) — vorher nur offline.
 * Läuft je Breite auf der bereits geöffneten Ortsdetail-Seite aus
 * `pruefeAnsichtenBeiBreite` weiter, damit kein zweiter Ort angelegt werden
 * muss. Photon wird NIE wirklich aufgerufen (ADR-0020 Punkt 3) — jeder
 * Zustand entsteht über Request-Interception, siehe `ORTSSUCHE_ZUSTAENDE`.
 */
async function pruefeOrtssucheZustaende(seite, breite, befunde) {
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  await legeOrtAnUndOeffneIhn(seite)

  // PO-2026-09-27-002, Kriterium 5: Die Verdeckungsprüfung läuft zusätzlich
  // mit FOKUSSIERTEM Anfangsnotiz-Feld und damit sichtbarem Zähler
  // ("{aktuell}/100" unterhalb des Feldes) — der Zähler steht im normalen
  // Fluss (design-conventions.md), verdeckt also weder sich selbst noch die
  // nachfolgende Ortssuche. Läuft VOR den Ortssuche-Zuständen unten (die ihr
  // eigenes Feld fokussieren und die Anfangsnotiz damit zwangsläufig wieder
  // verlassen würden).
  await seite.locator('#ortsdetail-anfangsnotiz').fill('Rauchtest-Zaehler-Sichtbar')
  if ((await seite.locator('.anfangsnotiz-feld__zaehler').count()) === 0) {
    befunde.push(`${breite.name}/ortsdetail (Anfangsnotiz fokussiert): Zähler ist bei fokussiertem Feld nicht sichtbar`)
  }
  for (const eintrag of await seite.evaluate(pruefeVerdeckung)) {
    befunde.push(`${breite.name}/ortsdetail (Anfangsnotiz fokussiert, Zähler sichtbar): ${eintrag}`)
  }
  await seite.screenshot({ path: `${FOTOS}/${breite.name}-ortsdetail-anfangsnotiz-fokussiert.png` })

  for (const zustand of ORTSSUCHE_ZUSTAENDE) {
    await zustand.einrichten(seite)
    try {
      if (zustand.suchtext !== null) {
        await seite.locator('#ortssuche-feld').fill(zustand.suchtext)
      }
      await seite.waitForTimeout(zustand.wartenMs)
      for (const eintrag of await seite.evaluate(pruefeVerdeckung)) {
        befunde.push(`${breite.name}/ortsdetail (Ortssuche: ${zustand.name}): ${eintrag}`)
      }
      await seite.screenshot({ path: `${FOTOS}/${breite.name}-ortsdetail-ortssuche-${zustand.name}.png` })
    } finally {
      await zustand.aufraeumen?.(seite)
      await seite.unroute(PHOTON_MUSTER).catch(() => {})
    }
  }
  console.log(
    `  ${breite.name}/ortsdetail — Ortssuche-Zustände geprüft (${ORTSSUCHE_ZUSTAENDE.map((z) => z.name).join(', ')})`,
  )
}

/**
 * Zusicherung ab PO-2026-09-13-001 (ADR-0027 Punkt 5/6): Während eines
 * GEDRÜCKT GEHALTENEN Ziehens am Regler zeigt keine Achse gleichzeitig eine
 * Zahl im Zahlenfeld und den Zustand „nicht bewertet" (fehlender
 * Zurücksetzen-Knopf / Platzhaltertext „Noch nicht bewertet"). Formuliert
 * als Eigenschaft über alle vier Achsen, nicht als Einzelfall — geprüft
 * wird jede `.bewertungsachse` im DOM, nicht nur die gerade gezogene.
 *
 * Öffnet dafür einen frischen Ort (alle vier Achsen `null`) und zieht am
 * Regler der ersten Achse: `mouse.down()` auf der Bahn (nicht auf 0, sonst
 * bliebe der native Wert unverändert), `mouse.move()` auf eine andere
 * Position, die Invariante wird VOR `mouse.up()` geprüft — ein reiner Klick
 * wäre gegen den Vor-Korrektur-Stand grün (Chromium feuert dabei `input`
 * UND `change`, und `change` committete schon vorher).
 */
async function pruefeReglerCommitWaehrendZiehens(seite, befunde) {
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  await legeOrtAnUndOeffneIhn(seite)

  const regler = seite.locator('.bewertungsachse__regler').first()
  const kasten = await regler.boundingBox()
  if (!kasten) {
    befunde.push('regler-commit-waehrend-ziehens: Regler der ersten Achse nicht gefunden')
    return
  }

  const y = kasten.y + kasten.height / 2
  const startX = kasten.x + kasten.width * 0.5
  const zielX = kasten.x + kasten.width * 0.85

  await seite.mouse.move(startX, y)
  await seite.mouse.down()
  await seite.mouse.move(zielX, y, { steps: 8 })

  // VOR mouse.up() geprüft — genau der Zeitpunkt, an dem der Vor-Korrektur-
  // Stand die Achsen bereits auseinanderlaufen ließ.
  const befundeWaehrendZiehens = await seite.evaluate(() => {
    const gefunden = []
    for (const achse of document.querySelectorAll('.bewertungsachse')) {
      const zahlenfeld = achse.querySelector('.bewertungsachse__zahl')
      const zeigtZahl = !!zahlenfeld && zahlenfeld.value.trim() !== ''
      const zeigtPlatzhalter = achse.querySelector('.intensitaetsbalken__platzhalter') != null
      const fehltZuruecksetzen = achse.querySelector('.bewertungsachse__zuruecksetzen') == null
      if (zeigtZahl && (zeigtPlatzhalter || fehltZuruecksetzen)) {
        gefunden.push(
          `Achse zeigt "${zahlenfeld.value}" im Zahlenfeld, gleichzeitig „nicht bewertet" (Platzhalter: ${zeigtPlatzhalter}, Zurücksetzen-Knopf fehlt: ${fehltZuruecksetzen})`,
        )
      }
    }
    return gefunden
  })

  await seite.mouse.up()

  for (const befund of befundeWaehrendZiehens) {
    befunde.push(`regler-commit-waehrend-ziehens: ${befund}`)
  }
  console.log('  regler-commit-waehrend-ziehens — geprüft (gedrücktes Ziehen, vor mouse.up)')
}

/**
 * Zusicherungen ab PO-2026-09-26-001 (ADR-0030): Ein Tag committet auch ohne
 * Enter — über Feld verlassen (Tab), `pagehide` (fokussiertes Feld beim
 * Neuladen) und Route verlassen/Ortswechsel ab `lg` — und landet dabei am
 * richtigen Ort. Rot-Nachweis gegen den Stand vor PO-2026-09-26-001: Dort
 * committete ausschließlich Enter, jeder der drei Fälle unten verlor den
 * Text kommentarlos bzw. (Fall c) landete er wegen des fehlenden `:key` im
 * FALSCHEN Feld.
 *
 * Läuft NUR bei 1280px (Desktop-Referenzbreite): Fall c braucht die
 * gleichzeitig sichtbare Listen-Spalte (Master-Detail ab `lg`, ADR-0011),
 * Fall a/b sind breitenunabhängig — ein zusätzlicher Lauf je Telefonbreite
 * hätte nur die Laufzeit verdreifacht, ohne eine neue Aussage zu liefern.
 *
 * Fall (b) ist seit ADR-0031 (Rückläufer PO-2026-09-26-001) in ZWEI
 * Teile aufgeteilt, s. u.: (b1) hart, prüft die Verdrahtung (ADR-0030
 * Punkt 4) an einem WEITERLEBENDEN Dokument — dafür zuständig ist dieses
 * Paket. (b2) bleibt gemeldet, aber ohne Einfluss auf den Exit-Code — dafür
 * ist NIEMAND aus diesem Paket zuständig, das ist die vom Nutzer akzeptierte
 * Grenze aus ADR-0031 Punkt 5.
 */
async function pruefeTagUeberlebtNeuladen(browser, befunde, gemeldeteGrenzen) {
  const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  // Aufzeichnung für Fall (b1): läuft in JEDEM Dokument dieser Seite (auch
  // nach einem Neuladen — `addInitScript` wird pro Navigation neu
  // ausgeführt), umschließt `IDBObjectStore.prototype.put` VOR jedem
  // Anwendungscode, damit kein `put()` auf dem Object Store "orte"
  // unbeobachtet bleibt. Nur die Werte werden aufgezeichnet (strukturiert
  // klonbare Objekte, kein `structuredClone`-Risiko), nicht Blobs — die
  // gibt es im Object Store "orte" ohnehin nicht.
  await seite.addInitScript(() => {
    window.__putAufzeichnung = []
    const originalPut = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'orte') {
        window.__putAufzeichnung.push(JSON.parse(JSON.stringify(value)))
      }
      return originalPut.call(this, value, key)
    }
  })
  await pruefeTagOhneEnterUeberlebtNeuladenUndIstFilterbar(seite, befunde)
  await pruefeTagPagehideAmLebendenDokument(seite, befunde)
  await pruefeTagFokussiertesFeldBeimEchtenReload(seite, gemeldeteGrenzen)
  await pruefeTagBleibtBeimOrtswechselAmRichtigenOrt(seite, befunde)
  await seite.close()
}

/**
 * Fall (a) — der ursprünglich gemeldete Fehler: Tab statt Enter verlässt das
 * Feld, der Text wurde bisher stillschweigend verworfen. Prüft zusätzlich
 * den zweiten Teil der Nutzermeldung ("sind dann nicht filterbar"): Chip in
 * der Filterleiste vorhanden, ein Klick grenzt die Liste sichtbar ein.
 */
async function pruefeTagOhneEnterUeberlebtNeuladenUndIstFilterbar(seite, befunde) {
  const marker = 'rauchtest-tab-tag'
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Tag-Tab')
  await seite.locator('.tag-eingabe__feld').fill(marker)
  await seite.keyboard.press('Tab') // NICHT Enter — genau der gemeldete Fehler
  await seite.waitForTimeout(300)

  await seite.reload({ waitUntil: 'networkidle' })
  await seite.waitForTimeout(400)
  if ((await seite.locator('.tag-eingabe__pill', { hasText: marker }).count()) === 0) {
    befunde.push(`tag-ohne-enter: Pille "${marker}" fehlt am Ort nach dem Neuladen (Tab statt Enter)`)
    return
  }

  // Zweiter, TAGLOSER Ort — unabhängig vom sonstigen Datenbestand dieses
  // Laufs (der über `browser.newPage()`/`close()` hinweg nicht verlässlich
  // erhalten bleibt), damit die Filterung nachweisbar etwas AUSSCHLIESST
  // („angezeigt < gesamt", sonst zeigt die Trefferzahl nie „X von Y").
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Tag-Tab-Kontrast')

  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  const chip = seite.locator('.tag-filterleiste__pill', { hasText: marker })
  if ((await chip.count()) === 0) {
    befunde.push(`tag-ohne-enter: kein Filter-Chip "${marker}" in der Werkzeugleiste — Tag ist nicht filterbar`)
    return
  }
  await chip.click()
  await seite.waitForTimeout(200)
  const trefferzahlNachFilter = await seite.locator('.werkzeugleiste__trefferzahl-lang').first().innerText()
  if (!trefferzahlNachFilter.includes(' von ')) {
    befunde.push(`tag-ohne-enter: Klick auf Chip "${marker}" grenzt die Liste nicht sichtbar ein (Trefferzahl: "${trefferzahlNachFilter}")`)
  }
  if ((await seite.getByText('Rauchtest-Tag-Tab-Kontrast').count()) > 0) {
    befunde.push(`tag-ohne-enter: Nach Klick auf Chip "${marker}" ist der taglose Kontrast-Ort fälschlich weiterhin in der Liste`)
  }
  if ((await seite.getByText('Rauchtest-Tag-Tab', { exact: true }).count()) === 0) {
    befunde.push(`tag-ohne-enter: Nach Klick auf Chip "${marker}" ist der zugehörige Ort nicht mehr in der gefilterten Liste`)
  }
}

/**
 * Fall (b1), HART (ADR-0031 Punkt 6): Text im FOKUSSIERTEN Feld, `pagehide`
 * am WEITERLEBENDEN Dokument ausgelöst (`window.dispatchEvent`, kein
 * `seite.reload()`) — der Fokus bleibt im Feld, das Dokument wird NICHT
 * entladen. Das prüft die Verdrahtung aus ADR-0030 Punkt 4 ("erst abholen,
 * dann schreiben"), unabhängig von der in ADR-0031 benannten,
 * nicht-zusicherbaren Grenze des echten Entladens (Fall b2 unten): Zugesagt
 * ist nur, dass der Schreibvorgang ankommt, SOLANGE das Dokument danach
 * weiterlebt (ADR-0031 Punkt 1b) — das bildet dieser Test nach.
 *
 * Zusicherung: Der ERSTE `put()` auf dem Object Store `orte`, den dieser
 * `pagehide` auslöst, trägt bereits den Tag — aufgezeichnet über ein
 * `addInitScript`, das `IDBObjectStore.prototype.put` seit Dokumentstart
 * umschließt (gesetzt in `pruefeTagUeberlebtNeuladen` vor der ersten
 * Navigation). Anschließend übersteht die Pille ein ECHTES Neuladen — an
 * diesem Punkt ist der Schreibvorgang bereits abgeschlossen, das echte
 * Neuladen ist hier nur noch Kontrolle, nicht der eigentliche Auslöser.
 *
 * Rot-Nachweis (ADR-0027 Punkt 8): gegen einen Stand ohne
 * `uebernimmOffeneEingabe`-Aufruf im `pagehide`-Orchestrierungspfad hätte
 * die Aufzeichnung keinen Tag im ersten (oder gar keinen) `put()` gezeigt.
 */
async function pruefeTagPagehideAmLebendenDokument(seite, befunde) {
  const marker = 'rauchtest-pagehide-lebend'
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Tag-Pagehide')
  await seite.locator('.tag-eingabe__feld').fill(marker) // fokussiert, NICHT verlassen

  await seite.evaluate(() => {
    window.__putAufzeichnung.length = 0
  })
  await seite.evaluate(() => window.dispatchEvent(new Event('pagehide'))) // Dokument lebt weiter
  await seite.waitForTimeout(300)

  const aufzeichnung = await seite.evaluate(() => window.__putAufzeichnung)
  if (aufzeichnung.length === 0) {
    befunde.push(
      'tag-pagehide-lebend: pagehide (am weiterlebenden Dokument) hat keinen put() auf dem Object Store "orte" ausgelöst',
    )
  } else if (!(aufzeichnung[0]?.tags ?? []).includes(marker)) {
    befunde.push(
      `tag-pagehide-lebend: Der ERSTE put() nach pagehide trägt den Tag "${marker}" noch nicht (tags: ${JSON.stringify(aufzeichnung[0]?.tags)}) — „erst abholen, dann schreiben" (ADR-0030 Punkt 4) verletzt`,
    )
  }

  await seite.reload({ waitUntil: 'networkidle' })
  await seite.waitForTimeout(400)
  if ((await seite.locator('.tag-eingabe__pill', { hasText: marker }).count()) === 0) {
    befunde.push(
      `tag-pagehide-lebend: Pille "${marker}" fehlt nach dem Neuladen, obwohl das Dokument beim eigentlichen Schreiben weiterlebte`,
    )
  }
}

/**
 * Fall (b2), GEMELDET, OHNE Einfluss auf den Exit-Code (ADR-0031 Punkt 5/6—
 * benannte Ausnahme zu ADR-0023 Punkt 2/7, analog zum bestehenden „auf
 * WebKit ungeprüft"-Muster aus ADR-0029). Text bleibt im FOKUSSIERTEN Feld
 * stehen, ein ECHTES `seite.reload()` löst das entladungsbedingte
 * `pagehide` aus. Kein Mechanismus im Rahmen von ADR-0001/0004 sichert zu,
 * dass ein erst dabei angestoßener Schreibvorgang abschließt (ADR-0031
 * Punkt 1) — dieser Fall bleibt deshalb bewusst außerhalb der harten
 * Zusicherungen, er ist das Warnsystem dafür, ob die Härtung aus ADR-0031
 * Punkt 2 (`tx.commit()` in `orte-repository.ts`) in Chromium überhaupt
 * trägt, nicht ein Kriterium.
 */
async function pruefeTagFokussiertesFeldBeimEchtenReload(seite, gemeldeteGrenzen) {
  const marker = 'rauchtest-fokus-tag'
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Tag-Fokus')
  await seite.locator('.tag-eingabe__feld').fill(marker) // Fokus bleibt im Feld — kein Tab/Enter/Klick
  await seite.waitForTimeout(200)

  await seite.reload({ waitUntil: 'networkidle' })
  await seite.waitForTimeout(400)
  const erhalten = (await seite.locator('.tag-eingabe__pill', { hasText: marker }).count()) > 0
  gemeldeteGrenzen.push(
    `tag-fokussiertes-feld-echter-reload (ADR-0031, benannte Grenze, kein Kriterium): Tag "${marker}" ist nach dem echten Neuladen ${erhalten ? 'ERHALTEN geblieben' : 'VERLOREN gegangen'} — abhängig davon, ob die IndexedDB-Transaktion vor dem Entladen des Dokuments abschließen konnte.`,
  )
}

/**
 * Fall (c): Ortswechsel ab `lg` ausschließlich über den BROWSERVERLAUF
 * (`goBack`/`goForward`), NIE über einen Klick — ein Klick löste bereits
 * selbst einen `focusout` auf dem Feldbereich aus und ließe die eigentliche
 * Zusicherung (Route-Guard-Orchestrierung, ADR-0030 Punkt 4/6) unbeobachtet.
 * Die Historie wird ausschließlich VORWÄRTS aufgebaut (`/orte` -> A -> B
 * über „Ort hinzufügen", aufgerufen während A noch geöffnet ist): `pushState`
 * kappt jede vorwärts liegende Stufe, sobald zwischendurch zurücknavigiert
 * wurde, A und B wären über `goBack`/`goForward` sonst nicht beide
 * erreichbar. Der Klick auf „Ort hinzufügen" trifft seit PO-2026-09-26-002
 * (ADR-0032) direkt über `locator.click()` — die Listen-Spalte samt ihrem
 * Kopf ist ab lg neben dem offenen Detail A jetzt regulär sichtbar, der
 * frühere Umweg über ein dispatchtes Klick-Event (`display: none` verweigerte
 * `locator.click()`) ist damit entfallen.
 */
async function pruefeTagBleibtBeimOrtswechselAmRichtigenOrt(seite, befunde) {
  const markerAB = 'rauchtest-verlauf-a-b'
  const markerOrte = 'rauchtest-verlauf-a-orte'
  const tagFeld = seite.locator('.tag-eingabe__feld')

  // Try/catch um die gesamte Funktion (PO-2026-09-26-002): Der Klick auf
  // „Ort hinzufügen" setzt seit der Korrektur voraus, dass die Listen-Spalte
  // ab lg tatsächlich sichtbar ist (kein Workaround mehr, s. Kommentar oben).
  // Schlägt das fehl, soll das als BEFUND im gesammelten Bericht erscheinen
  // (`pruefeMasterDetailSpalten` hat den eigentlichen Befund an dieser
  // Stelle bereits erfasst) statt den gesamten Lauf mit einer unbehandelten
  // Ausnahme abzubrechen und den Bericht der übrigen Zusicherungen zu kosten.
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Verlauf-A') // Historie: [/orte, A]
    await seite.getByRole('button', { name: 'Ort hinzufügen', exact: true }).click()
    await seite.waitForTimeout(300)
    await seite.locator('#ort-anlegen-bezeichnung').fill('Rauchtest-Verlauf-B')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(700) // Historie: [/orte, A, B]

    await seite.goBack({ waitUntil: 'networkidle' }) // zurück zu A, rein über den Verlauf
    await seite.waitForTimeout(300)
    await tagFeld.fill(markerAB) // fokussiert, NICHT verlassen

    await seite.goForward({ waitUntil: 'networkidle' }) // A -> B, ausschließlich über den Verlauf
    await seite.waitForTimeout(300)
    const feldBWert = await tagFeld.inputValue()
    if (feldBWert !== '') {
      befunde.push(`tag-ortswechsel: Feld von Ort B ist nach A→B nicht leer ("${feldBWert}")`)
    }
    if ((await seite.locator('.tag-eingabe__pill', { hasText: markerAB }).count()) > 0) {
      befunde.push(`tag-ortswechsel: Ort B trägt fälschlich die Pille "${markerAB}" von Ort A`)
    }

    await seite.goBack({ waitUntil: 'networkidle' }) // zurück zu A, Verifikation
    await seite.waitForTimeout(300)
    if ((await seite.locator('.tag-eingabe__pill', { hasText: markerAB }).count()) === 0) {
      befunde.push(`tag-ortswechsel: Ort A trägt die Pille "${markerAB}" nach dem Wechsel zu B nicht (Commit im Route-Guard fehlgeschlagen)`)
    }

    // Zweiter Teil ("dazu A→/orte per goBack"): `/orte` und `/orte/:ortId`
    // sind dieselbe Komponente (Ortebereich.vue) — auch dieser Wechsel ist ein
    // `onBeforeRouteUpdate`, kein Leave (siehe Modul-Kommentar dort).
    await tagFeld.fill(markerOrte) // fokussiert, NICHT verlassen
    await seite.goBack({ waitUntil: 'networkidle' }) // A -> /orte
    await seite.waitForTimeout(300)

    await seite.goForward({ waitUntil: 'networkidle' }) // zurück zu A, rein zur Verifikation
    await seite.waitForTimeout(300)
    if ((await seite.locator('.tag-eingabe__pill', { hasText: markerOrte }).count()) === 0) {
      befunde.push(`tag-ortswechsel: Ort A trägt die Pille "${markerOrte}" nach dem Wechsel zu /orte (goBack) nicht`)
    }
  } catch (fehler) {
    befunde.push(`tag-ortswechsel: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Setzt mehrere Feldwerte über SYNTHETISCHE `input`-Ereignisse, OHNE die
 * Felder real zu fokussieren. Grund: Ein echter Fokuswechsel (`.fill()`/
 * `.click()` auf ein ANDERES Feld) würde das zuvor fokussierte Feld über
 * dessen EIGENES `blur`/`focusout` sofort committen — genau der bereits
 * bestehende vierte Auslöser „Feld verlassen" (ADR-0005/ADR-0030) — und
 * dadurch den zu prüfenden Zustand „mehrere GLEICHZEITIG offene,
 * unbestätigte Entwürfe" zunichtemachen, noch bevor der eigentliche externe
 * Auslöser (Route/`visibilitychange`/`pagehide`) überhaupt feuert. Ohne
 * `.focus()`/Klick ändert sich `document.activeElement` nicht, also blurt
 * auch nichts. Wo ein einzelnes Feld bewusst per „Feld verlassen" committen
 * SOLL (Fall a: Tab), bleibt `.fill()` das richtige Mittel.
 *
 * `eintraege[].feld`: `'tag'` (das Tag-Eingabefeld), `'kommentar'`/`'zahl'`
 * (das jeweilige Feld der `achsenIndex`-ten `.bewertungsachse`, 0-basiert,
 * DOM-Reihenfolge = Template-Reihenfolge ambiente/zeit/geschmack/preisLeistung).
 */
async function setzeEingabenOhneFokus(seite, eintraege) {
  await seite.evaluate((eintraege) => {
    const achsen = document.querySelectorAll('.bewertungsachse')
    for (const eintrag of eintraege) {
      let el
      if (eintrag.feld === 'tag') el = document.querySelector('.tag-eingabe__feld')
      else if (eintrag.feld === 'kommentar') el = achsen[eintrag.achsenIndex].querySelector('.bewertungsachse__kommentar-feld')
      else el = achsen[eintrag.achsenIndex].querySelector('input[type="number"]')
      el.value = eintrag.wert
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }, eintraege)
}

/**
 * Liest den Wert eines Felds, das je nach (unter Umständen defektem)
 * Anwendungsstand GAR NICHT im DOM steht (z. B. das Kommentarfeld einer
 * Achse, das nur bei `kommentar !== null` erscheint). `locator.inputValue()`
 * wartet bei einem fehlenden Element bis zum Timeout (30s) und wirft dann —
 * das würde den gesamten Lauf mit einer unbehandelten Ausnahme abbrechen und
 * den Bericht der übrigen Zusicherungen kosten (Begründung analog
 * `pruefeTagBleibtBeimOrtswechselAmRichtigenOrt`). `locator.count()` wartet
 * dagegen nicht und liefert `0`, wenn das Feld fehlt — genau das ist dann
 * selbst der Befund (der erwartete Wert kann unmöglich dort stehen).
 */
async function wertOderLeer(locator) {
  return (await locator.count()) > 0 ? await locator.inputValue() : ''
}

/**
 * Zusicherungen ab PO-2026-09-27-004 (ADR-0035): dasselbe Vier-Auslöser-Muster
 * wie `pruefeTagUeberlebtNeuladen()` oben, jetzt für die vier
 * `Bewertungsachse`-Instanzen (Zahl UND Kommentar je Achse) — nur bei 1280px
 * (Fall c/d brauchen die ab `lg` gleichzeitig sichtbare Listen-Spalte).
 * Wiederverwendet dieselbe `put()`-Aufzeichnung wie oben (neue Seite, eigenes
 * `addInitScript`).
 */
async function pruefeBewertungsachseUeberlebtNeuladen(browser, befunde, gemeldeteGrenzen) {
  const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await seite.addInitScript(() => {
    window.__putAufzeichnung = []
    const originalPut = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'orte') {
        window.__putAufzeichnung.push(JSON.parse(JSON.stringify(value)))
      }
      return originalPut.call(this, value, key)
    }
  })
  await pruefeBewertungsachseFeldVerlassenUeberlebtNeuladen(seite, befunde)
  await pruefeBewertungsachsePagehideAmLebendenDokument(seite, befunde)
  await pruefeBewertungsachseOrtswechselUeberBrowserverlauf(seite, befunde)
  await pruefeBewertungsachseSchliessenUndSichtbarkeitswechsel(seite, befunde)
  await pruefeBewertungsachseFokussiertesFeldBeimEchtenReload(seite, gemeldeteGrenzen)
  await seite.close()
}

/**
 * Fall (a): Kommentar UND Zahl per Tab verlassen (nicht Enter/Klick) —
 * beide committen über `@blur`/`@change` (unverändert seit ADR-0007/ADR-0027)
 * und überstehen ein Neuladen. Zusätzlich an einer ZWEITEN Achse: ein
 * gesetzter, dann wieder GELEERTER Zahlenwert kommt als „nicht bewertet"
 * zurück (`wert: null`), nicht als 0 — geprüft über den Platzhalter-Zustand
 * des Feldes UND `aria-valuetext="nicht bewertet"` am Regler (ADR-0007
 * Punkt 7/ADR-0035).
 */
async function pruefeBewertungsachseFeldVerlassenUeberlebtNeuladen(seite, befunde) {
  const kommentarMarker = 'rauchtest-achse-tab-kommentar'
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Achse-Tab')

    const ersteAchse = seite.locator('.bewertungsachse').first()
    await ersteAchse.locator('input[type="number"]').fill('7')
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(150)
    await ersteAchse.getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    await ersteAchse.locator('.bewertungsachse__kommentar-feld').fill(kommentarMarker)
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(150)

    // Zweite Achse: erst setzen, dann wieder leeren — muss „nicht bewertet"
    // ergeben, nicht 0.
    const zweiteAchse = seite.locator('.bewertungsachse').nth(1)
    await zweiteAchse.locator('input[type="number"]').fill('5')
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(150)
    await zweiteAchse.locator('input[type="number"]').fill('')
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(300)

    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)

    const ersteAchseNeu = seite.locator('.bewertungsachse').first()
    if ((await ersteAchseNeu.locator('input[type="number"]').inputValue()) !== '7') {
      befunde.push('bewertungsachse-feld-verlassen: Zahlenwert "7" fehlt nach dem Neuladen an der ersten Achse')
    }
    if ((await wertOderLeer(ersteAchseNeu.locator('.bewertungsachse__kommentar-feld'))) !== kommentarMarker) {
      befunde.push(`bewertungsachse-feld-verlassen: Kommentar "${kommentarMarker}" fehlt nach dem Neuladen an der ersten Achse`)
    }

    const zweiteAchseNeu = seite.locator('.bewertungsachse').nth(1)
    if ((await zweiteAchseNeu.locator('input[type="number"]').inputValue()) !== '') {
      befunde.push('bewertungsachse-feld-verlassen: geleertes Zahlenfeld ist nach dem Neuladen nicht leer (evtl. fälschlich als 0 gespeichert)')
    }
    if ((await zweiteAchseNeu.locator('input[type="range"]').getAttribute('aria-valuetext')) !== 'nicht bewertet') {
      befunde.push('bewertungsachse-feld-verlassen: geleertes Feld meldet am Regler nicht "nicht bewertet" — evtl. als 0 gespeichert')
    }
  } catch (fehler) {
    befunde.push(`bewertungsachse-feld-verlassen: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Fall (b1), HART (ADR-0035 Punkt 1): DREI gleichzeitig offene Entwürfe —
 * Tag-Text, Kommentar der ERSTEN Achse, Zahlenwert der ZWEITEN Achse —, alle
 * fokussiert und NICHT verlassen. `pagehide` wird am WEITERLEBENDEN Dokument
 * ausgelöst (kein echtes Entladen, analog `pruefeTagPagehideAmLebendenDokument`).
 * Der ERSTE `put()` danach muss bereits ALLE DREI tragen — genau die
 * Eigenschaft, die ADR-0035 Punkt 1 verlangt (mehrere Entwurfsbesitzer,
 * einmal schreiben).
 *
 * Rot-Nachweis (ADR-0027 Punkt 8, Handoff-Constraint): gegen einen Stand, in
 * dem die Emit-Handler auch WÄHREND des Abholens sofort persistieren (kein
 * `waehrendAbholenOffenerEingaben`-Guard), trägt der erste `put()` nur den
 * TAG (zuerst abgeholt) — Kommentar und Zahl fehlen, weil ihre je eigenen,
 * asynchron nachlaufenden Schreibvorgänge erst NACH dem ersten `put()`
 * ankommen.
 */
async function pruefeBewertungsachsePagehideAmLebendenDokument(seite, befunde) {
  const tagMarker = 'rauchtest-achse-pagehide-tag'
  const kommentarMarker = 'rauchtest-achse-pagehide-kommentar'
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Achse-Pagehide')

    // Kommentarfeld der ersten Achse öffnen (einmaliger, isolierter Klick,
    // betrifft noch keines der drei unten gleichzeitig offenen Felder).
    const ersteAchse = seite.locator('.bewertungsachse').first()
    await ersteAchse.getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    await seite.waitForTimeout(150)

    // Alle drei Entwürfe gleichzeitig, ÜBER `setzeEingabenOhneFokus` (s. dort,
    // warum kein `.fill()`/Klick).
    await setzeEingabenOhneFokus(seite, [
      { feld: 'tag', wert: tagMarker },
      { feld: 'kommentar', achsenIndex: 0, wert: kommentarMarker },
      { feld: 'zahl', achsenIndex: 1, wert: '8' },
    ])
    await seite.waitForTimeout(150)

    await seite.evaluate(() => {
      window.__putAufzeichnung.length = 0
    })
    await seite.evaluate(() => window.dispatchEvent(new Event('pagehide'))) // Dokument lebt weiter
    await seite.waitForTimeout(300)

    const aufzeichnung = await seite.evaluate(() => window.__putAufzeichnung)
    if (aufzeichnung.length === 0) {
      befunde.push('bewertungsachse-pagehide-lebend: pagehide (am weiterlebenden Dokument) hat keinen put() ausgelöst')
    } else {
      const erster = aufzeichnung[0]
      if (!(erster?.tags ?? []).includes(tagMarker)) {
        befunde.push(
          `bewertungsachse-pagehide-lebend: der ERSTE put() trägt den Tag "${tagMarker}" nicht (tags: ${JSON.stringify(erster?.tags)})`,
        )
      }
      if (erster?.bewertungen?.ambiente?.kommentar !== kommentarMarker) {
        befunde.push(
          `bewertungsachse-pagehide-lebend: der ERSTE put() trägt den Kommentar "${kommentarMarker}" der ersten Achse nicht (war: ${JSON.stringify(erster?.bewertungen?.ambiente?.kommentar)}) — ADR-0035 Punkt 1 verletzt`,
        )
      }
      if (erster?.bewertungen?.zeit?.wert !== 8) {
        befunde.push(
          `bewertungsachse-pagehide-lebend: der ERSTE put() trägt den Zahlenwert "8" der zweiten Achse nicht (war: ${JSON.stringify(erster?.bewertungen?.zeit?.wert)}) — ADR-0035 Punkt 1 verletzt`,
        )
      }
    }

    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    if ((await seite.locator('.tag-eingabe__pill', { hasText: tagMarker }).count()) === 0) {
      befunde.push(`bewertungsachse-pagehide-lebend: Pille "${tagMarker}" fehlt nach dem Neuladen`)
    }
    if ((await wertOderLeer(seite.locator('.bewertungsachse').first().locator('.bewertungsachse__kommentar-feld'))) !== kommentarMarker) {
      befunde.push(`bewertungsachse-pagehide-lebend: Kommentar "${kommentarMarker}" fehlt nach dem Neuladen`)
    }
    if ((await seite.locator('.bewertungsachse').nth(1).locator('input[type="number"]').inputValue()) !== '8') {
      befunde.push('bewertungsachse-pagehide-lebend: Zahlenwert "8" fehlt nach dem Neuladen')
    }
  } catch (fehler) {
    befunde.push(`bewertungsachse-pagehide-lebend: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Fall (c): Ortswechsel ab `lg` AUSSCHLIESSLICH über den Browserverlauf
 * (`goBack`/`goForward`, nie Klick — analog `pruefeTagBleibtBeimOrtswechselAmRichtigenOrt`).
 * Ort A und B tragen VOR der eigentlichen Prüfung denselben committeten
 * Kommentar an der ersten Achse (Handoff-Constraint „mindestens einmal mit
 * identischem Kommentar bei A und B") — der Beleg dafür, dass der Fix über
 * das neue `:key` läuft (ADR-0035 Punkt 5), nicht über
 * `watch(props.kommentar)`, das bei GLEICHEM Wert nicht feuert (ADR-0035,
 * Kontext). Unbestätigter Kommentar- UND Zahlen-Entwurf bei A müssen nach
 * A→B bei A bleiben, B zeigt danach seine EIGENEN Werte.
 */
async function pruefeBewertungsachseOrtswechselUeberBrowserverlauf(seite, befunde) {
  const geteilterKommentar = 'Rauchtest-Achse-Verlauf: geteilter Kommentar'
  const kommentarEntwurfBeiA = 'rauchtest-achse-verlauf-a-kommentar'
  const zahlEntwurfBeiA = '3'

  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Achse-Verlauf-A') // Historie: [/orte, A]

    const achseA = seite.locator('.bewertungsachse').first()
    await achseA.getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    await achseA.locator('.bewertungsachse__kommentar-feld').fill(geteilterKommentar)
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(200)

    await seite.getByRole('button', { name: 'Ort hinzufügen', exact: true }).first().click()
    await seite.waitForTimeout(300)
    await seite.locator('#ort-anlegen-bezeichnung').fill('Rauchtest-Achse-Verlauf-B')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(700) // Historie: [/orte, A, B]

    const achseB = seite.locator('.bewertungsachse').first()
    await achseB.getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    await achseB.locator('.bewertungsachse__kommentar-feld').fill(geteilterKommentar) // identisch zu A
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(200)

    await seite.goBack({ waitUntil: 'networkidle' }) // zurück zu A, rein über den Verlauf
    await seite.waitForTimeout(300)
    // Feld ist an A bereits offen (Kommentar committet) — neuer, unbestätigter
    // Entwurf ÜBERSCHREIBT den Text; BEIDE Felder gleichzeitig über
    // `setzeEingabenOhneFokus` (s. dort), sonst würde das Fokussieren des
    // Zahlenfelds den Kommentar über sein eigenes `blur` sofort committen.
    await setzeEingabenOhneFokus(seite, [
      { feld: 'kommentar', achsenIndex: 0, wert: kommentarEntwurfBeiA },
      { feld: 'zahl', achsenIndex: 1, wert: zahlEntwurfBeiA },
    ])
    await seite.waitForTimeout(150)

    await seite.goForward({ waitUntil: 'networkidle' }) // A -> B, ausschließlich über den Verlauf
    await seite.waitForTimeout(300)

    const kommentarWertB = await wertOderLeer(seite.locator('.bewertungsachse').first().locator('.bewertungsachse__kommentar-feld'))
    if (kommentarWertB !== geteilterKommentar) {
      befunde.push(`bewertungsachse-ortswechsel: Kommentarfeld von Ort B zeigt nach A→B nicht Bs eigenen Kommentar ("${kommentarWertB}")`)
    }
    const zahlWertB = await seite.locator('.bewertungsachse').nth(1).locator('input[type="number"]').inputValue()
    if (zahlWertB !== '') {
      befunde.push(`bewertungsachse-ortswechsel: Zahlenfeld der zweiten Achse von Ort B ist nach A→B nicht leer ("${zahlWertB}")`)
    }

    await seite.goBack({ waitUntil: 'networkidle' }) // zurück zu A, Verifikation
    await seite.waitForTimeout(300)
    const kommentarWertA = await wertOderLeer(seite.locator('.bewertungsachse').first().locator('.bewertungsachse__kommentar-feld'))
    if (kommentarWertA !== kommentarEntwurfBeiA) {
      befunde.push(
        `bewertungsachse-ortswechsel: Ort A trägt den Kommentar-Entwurf "${kommentarEntwurfBeiA}" nach dem Wechsel zu B nicht (Commit im Route-Guard fehlgeschlagen, war: "${kommentarWertA}")`,
      )
    }
    const zahlWertA = await seite.locator('.bewertungsachse').nth(1).locator('input[type="number"]').inputValue()
    if (zahlWertA !== zahlEntwurfBeiA) {
      befunde.push(`bewertungsachse-ortswechsel: Ort A trägt den Zahlen-Entwurf "${zahlEntwurfBeiA}" nach dem Wechsel zu B nicht (war: "${zahlWertA}")`)
    }
  } catch (fehler) {
    befunde.push(`bewertungsachse-ortswechsel: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Fall (d): ZWEI weitere Auslöser übernehmen beide offenen Entwürfe.
 * Teil 1 — Schließen `/orte/:a` → `/orte` (Klick auf „Detailansicht
 * schließen", ab `lg` sichtbar statt „Zurück", `onBeforeRouteUpdate` bleibt
 * hier ein Update, kein Leave, s. Modul-Kommentar `Ortebereich.vue`). Teil 2
 * — `visibilitychange`→`hidden`, über eine Eigenschafts-Überschreibung auf
 * `document.visibilityState` simuliert (kein Tab-/Fenster-Wechsel im
 * Testrunner selbst möglich).
 */
async function pruefeBewertungsachseSchliessenUndSichtbarkeitswechsel(seite, befunde) {
  try {
    // Teil 1: /orte/:a -> /orte über „Detailansicht schließen".
    const kommentarMarkerSchliessen = 'rauchtest-achse-schliessen-kommentar'
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Achse-Schliessen')
    await seite.locator('.bewertungsachse').first().getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    await seite.waitForTimeout(150)
    // Beide Felder gleichzeitig offen — über `setzeEingabenOhneFokus` (s. dort),
    // sonst würde das Fokussieren des Zahlenfelds den Kommentar sofort committen.
    await setzeEingabenOhneFokus(seite, [
      { feld: 'kommentar', achsenIndex: 0, wert: kommentarMarkerSchliessen },
      { feld: 'zahl', achsenIndex: 1, wert: '9' },
    ])
    await seite.waitForTimeout(150)

    await seite.locator('[aria-label="Detailansicht schließen"]').click() // /orte/:a -> /orte
    await seite.waitForTimeout(300)
    await seite.locator('.ortszeile', { hasText: 'Rauchtest-Achse-Schliessen' }).click()
    await seite.waitForTimeout(300)

    const achseS1Neu = seite.locator('.bewertungsachse').first()
    const kommentarNachSchliessen = await wertOderLeer(achseS1Neu.locator('.bewertungsachse__kommentar-feld'))
    if (kommentarNachSchliessen !== kommentarMarkerSchliessen) {
      befunde.push(`bewertungsachse-schliessen: Kommentar "${kommentarMarkerSchliessen}" fehlt nach /orte/:a→/orte (Schließen), war: "${kommentarNachSchliessen}"`)
    }
    const achseS2Neu = seite.locator('.bewertungsachse').nth(1)
    const zahlNachSchliessen = await achseS2Neu.locator('input[type="number"]').inputValue()
    if (zahlNachSchliessen !== '9') {
      befunde.push(`bewertungsachse-schliessen: Zahlenwert "9" fehlt nach /orte/:a→/orte (Schließen), war: "${zahlNachSchliessen}"`)
    }

    // Teil 2: visibilitychange -> hidden.
    const kommentarMarkerHidden = 'rauchtest-achse-hidden-kommentar'
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Achse-Hidden')
    await seite.locator('.bewertungsachse').first().getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    await seite.waitForTimeout(150)
    await setzeEingabenOhneFokus(seite, [
      { feld: 'kommentar', achsenIndex: 0, wert: kommentarMarkerHidden },
      { feld: 'zahl', achsenIndex: 1, wert: '4' },
    ])
    await seite.waitForTimeout(150)

    await seite.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await seite.waitForTimeout(300)

    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    const achseH1Neu = seite.locator('.bewertungsachse').first()
    const kommentarNachHidden = await wertOderLeer(achseH1Neu.locator('.bewertungsachse__kommentar-feld'))
    if (kommentarNachHidden !== kommentarMarkerHidden) {
      befunde.push(`bewertungsachse-hidden: Kommentar "${kommentarMarkerHidden}" fehlt nach visibilitychange→hidden, war: "${kommentarNachHidden}"`)
    }
    const achseH2Neu = seite.locator('.bewertungsachse').nth(1)
    const zahlNachHidden = await achseH2Neu.locator('input[type="number"]').inputValue()
    if (zahlNachHidden !== '4') {
      befunde.push(`bewertungsachse-hidden: Zahlenwert "4" fehlt nach visibilitychange→hidden, war: "${zahlNachHidden}"`)
    }
  } catch (fehler) {
    befunde.push(`bewertungsachse-schliessen-hidden: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * GEMELDET, OHNE Einfluss auf `process.exitCode` (analog `pruefeTagFokussiertesFeldBeimEchtenReload`,
 * ADR-0031 Punkt 5/6): Kommentar im FOKUSSIERTEN Feld, ein ECHTES
 * `seite.reload()` löst das entladungsbedingte `pagehide` aus. Dieselbe,
 * bereits für Tags dokumentierte Grenze (ADR-0031 Punkt 1) gilt strukturell
 * für JEDES Feld im Ortsdetail, nicht nur Tags — kein Kriterium verlangt,
 * dass das zusicherbar wäre.
 */
async function pruefeBewertungsachseFokussiertesFeldBeimEchtenReload(seite, gemeldeteGrenzen) {
  const kommentarMarker = 'rauchtest-achse-fokus-kommentar'
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Achse-Fokus')
    const achse = seite.locator('.bewertungsachse').first()
    await achse.getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    await achse.locator('.bewertungsachse__kommentar-feld').fill(kommentarMarker) // Fokus bleibt im Feld
    await seite.waitForTimeout(200)

    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    const erhalten = (await wertOderLeer(seite.locator('.bewertungsachse').first().locator('.bewertungsachse__kommentar-feld'))) === kommentarMarker
    gemeldeteGrenzen.push(
      `bewertungsachse-fokussiertes-feld-echter-reload (ADR-0031/ADR-0035, benannte Grenze, kein Kriterium): Kommentar "${kommentarMarker}" ist nach dem echten Neuladen ${erhalten ? 'ERHALTEN geblieben' : 'VERLOREN gegangen'}.`,
    )
  } catch (fehler) {
    gemeldeteGrenzen.push(`bewertungsachse-fokussiertes-feld-echter-reload: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Zusicherungen ab PO-2026-09-27-002 (design-conventions.md „Kurztextfeld mit
 * Zeichenobergrenze"): Die Anfangsnotiz hat KEINEN lokalen Entwurf — jede
 * Eingabe geht sofort über den Store-Setter (`aktualisiereAnfangsnotiz`) in
 * den Arbeitsspeicher, genau wie Bezeichnung/Adresse. Anders als bei
 * Tags/Bewertungsachse (ADR-0030/ADR-0035) braucht es deshalb KEINEN
 * `uebernimmOffeneEingabe`-Weg: Der Store hält den normalisierten Text
 * bereits, sobald getippt wird, und `persistiereOrt` (ausgelöst von JEDEM der
 * vier Auslöser aus ADR-0005 Punkt 5) schreibt ohnehin den VOLLSTÄNDIGEN
 * aktuellen Datensatz — die Anfangsnotiz reist also "kostenlos" mit jedem der
 * vier Auslöser mit, auch wenn keiner davon speziell für sie geschrieben
 * wurde. Genau DAS prüfen die folgenden Funktionen: unbestätigter (nicht per
 * `blur` committeter) Text übersteht Feld-verlassen, beide Routenwechsel,
 * `visibilitychange`→`hidden` und `pagehide` am weiterlebenden Dokument.
 */
async function pruefeAnfangsnotizUeberlebtNeuladen(browser, befunde, gemeldeteGrenzen) {
  const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await seite.addInitScript(() => {
    window.__putAufzeichnungAnfangsnotiz = []
    const originalPut = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'orte') {
        window.__putAufzeichnungAnfangsnotiz.push(JSON.parse(JSON.stringify(value)))
      }
      return originalPut.call(this, value, key)
    }
  })
  await pruefeAnfangsnotizFeldVerlassenUeberlebtNeuladen(seite, befunde)
  await pruefeAnfangsnotizSchliessenUeberlebtNeuladen(seite, befunde)
  await pruefeAnfangsnotizOrtswechselPerKlickUeberlebtNeuladen(seite, befunde)
  await pruefeAnfangsnotizSichtbarkeitswechselUeberlebtNeuladen(seite, befunde)
  await pruefeAnfangsnotizPagehideAmLebendenDokument(seite, befunde)
  await pruefeAnfangsnotizFokussiertesFeldBeimEchtenReload(seite, gemeldeteGrenzen)
  await pruefeAnfangsnotizOrtswechselUeberBrowserverlauf(seite, befunde)
  await seite.close()
}

/** Auslöser „Feld verlassen": Tab statt Blur-Auslöser verlässt das Feld. */
async function pruefeAnfangsnotizFeldVerlassenUeberlebtNeuladen(seite, befunde) {
  const marker = 'rauchtest-anfangsnotiz-tab'
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Anfangsnotiz-Tab')
    await seite.locator('#ortsdetail-anfangsnotiz').fill(marker)
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(300)

    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    if ((await seite.locator('#ortsdetail-anfangsnotiz').inputValue()) !== marker) {
      befunde.push(`anfangsnotiz-feld-verlassen: Anfangsnotiz "${marker}" fehlt nach dem Neuladen (Feld verlassen)`)
    }
  } catch (fehler) {
    befunde.push(`anfangsnotiz-feld-verlassen: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Auslöser „Route verlassen", Teil 1: `/orte/:a` → `/orte` über
 * „Detailansicht schließen" (`onBeforeRouteUpdate`, kein Leave, s.
 * Modul-Kommentar `Ortebereich.vue`). Text bleibt FOKUSSIERT, NICHT per
 * `blur` committet, bevor geschlossen wird.
 */
async function pruefeAnfangsnotizSchliessenUeberlebtNeuladen(seite, befunde) {
  const marker = 'rauchtest-anfangsnotiz-schliessen'
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Anfangsnotiz-Schliessen')
    await seite.locator('#ortsdetail-anfangsnotiz').fill(marker) // fokussiert, NICHT verlassen
    await seite.locator('[aria-label="Detailansicht schließen"]').click() // /orte/:a -> /orte
    await seite.waitForTimeout(300)

    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    await seite.locator('.ortszeile', { hasText: 'Rauchtest-Anfangsnotiz-Schliessen' }).click()
    await seite.waitForTimeout(300)
    if ((await seite.locator('#ortsdetail-anfangsnotiz').inputValue()) !== marker) {
      befunde.push(`anfangsnotiz-schliessen: Anfangsnotiz "${marker}" fehlt nach /orte/:a→/orte (Schließen) und Neuladen`)
    }
  } catch (fehler) {
    befunde.push(`anfangsnotiz-schliessen: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Auslöser „Route verlassen", Teil 2: `/orte/:a` → `/orte/:b` per KLICK auf
 * eine andere Listenzeile (ebenfalls ein `onBeforeRouteUpdate`). Text bleibt
 * an A FOKUSSIERT, NICHT committet, bevor zu B gewechselt wird.
 */
async function pruefeAnfangsnotizOrtswechselPerKlickUeberlebtNeuladen(seite, befunde) {
  const marker = 'rauchtest-anfangsnotiz-a-b'
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Anfangsnotiz-A')
    await seite.locator('#ortsdetail-anfangsnotiz').fill(marker) // fokussiert, NICHT verlassen

    await seite.getByRole('button', { name: 'Ort hinzufügen', exact: true }).first().click()
    await seite.waitForTimeout(300)
    await seite.locator('#ort-anlegen-bezeichnung').fill('Rauchtest-Anfangsnotiz-B')
    await seite.keyboard.press('Enter') // /orte/:a -> /orte/:b
    await seite.waitForTimeout(700)

    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    await seite.locator('.ortszeile', { hasText: 'Rauchtest-Anfangsnotiz-A' }).click()
    await seite.waitForTimeout(300)
    if ((await seite.locator('#ortsdetail-anfangsnotiz').inputValue()) !== marker) {
      befunde.push(`anfangsnotiz-ortswechsel-klick: Anfangsnotiz "${marker}" von Ort A fehlt nach /orte/:a→/orte/:b und Neuladen`)
    }
  } catch (fehler) {
    befunde.push(`anfangsnotiz-ortswechsel-klick: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/** Auslöser `visibilitychange` → `hidden`, simuliert über eine
 *  Eigenschafts-Überschreibung (kein echter Tab-/Fensterwechsel im
 *  Testrunner möglich). Text bleibt fokussiert, nicht committet. */
async function pruefeAnfangsnotizSichtbarkeitswechselUeberlebtNeuladen(seite, befunde) {
  const marker = 'rauchtest-anfangsnotiz-hidden'
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Anfangsnotiz-Hidden')
    await seite.locator('#ortsdetail-anfangsnotiz').fill(marker) // fokussiert, NICHT verlassen

    await seite.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await seite.waitForTimeout(300)

    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    if ((await seite.locator('#ortsdetail-anfangsnotiz').inputValue()) !== marker) {
      befunde.push(`anfangsnotiz-hidden: Anfangsnotiz "${marker}" fehlt nach visibilitychange→hidden und Neuladen`)
    }
  } catch (fehler) {
    befunde.push(`anfangsnotiz-hidden: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Auslöser `pagehide` AM WEITERLEBENDEN DOKUMENT (kein echtes Entladen) —
 * HART, analog `pruefeTagPagehideAmLebendenDokument`/
 * `pruefeBewertungsachsePagehideAmLebendenDokument`: Der ERSTE `put()` auf dem
 * Object Store „orte" nach diesem `pagehide` muss die Anfangsnotiz bereits
 * tragen.
 */
async function pruefeAnfangsnotizPagehideAmLebendenDokument(seite, befunde) {
  const marker = 'rauchtest-anfangsnotiz-pagehide'
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Anfangsnotiz-Pagehide')
    await seite.locator('#ortsdetail-anfangsnotiz').fill(marker) // fokussiert, NICHT verlassen

    await seite.evaluate(() => {
      window.__putAufzeichnungAnfangsnotiz.length = 0
    })
    await seite.evaluate(() => window.dispatchEvent(new Event('pagehide'))) // Dokument lebt weiter
    await seite.waitForTimeout(300)

    const aufzeichnung = await seite.evaluate(() => window.__putAufzeichnungAnfangsnotiz)
    if (aufzeichnung.length === 0) {
      befunde.push('anfangsnotiz-pagehide-lebend: pagehide (am weiterlebenden Dokument) hat keinen put() ausgelöst')
    } else if (aufzeichnung[0]?.anfangsnotiz !== marker) {
      befunde.push(
        `anfangsnotiz-pagehide-lebend: der ERSTE put() trägt die Anfangsnotiz "${marker}" nicht (war: ${JSON.stringify(aufzeichnung[0]?.anfangsnotiz)})`,
      )
    }

    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    if ((await seite.locator('#ortsdetail-anfangsnotiz').inputValue()) !== marker) {
      befunde.push(`anfangsnotiz-pagehide-lebend: Anfangsnotiz "${marker}" fehlt nach dem Neuladen`)
    }
  } catch (fehler) {
    befunde.push(`anfangsnotiz-pagehide-lebend: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * GEMELDET, OHNE Einfluss auf `process.exitCode` (analog
 * `pruefeTagFokussiertesFeldBeimEchtenReload`/
 * `pruefeBewertungsachseFokussiertesFeldBeimEchtenReload`, ADR-0031 Punkt
 * 5/6): Text im FOKUSSIERTEN Feld, ein ECHTES `seite.reload()` löst das
 * entladungsbedingte `pagehide` aus. Dieselbe, bereits für Tags/
 * Bewertungsachse dokumentierte strukturelle Grenze (ADR-0031) gilt für JEDES
 * Feld im Ortsdetail, auch die Anfangsnotiz — kein Kriterium verlangt, dass
 * das zusicherbar wäre.
 */
async function pruefeAnfangsnotizFokussiertesFeldBeimEchtenReload(seite, gemeldeteGrenzen) {
  const marker = 'rauchtest-anfangsnotiz-fokus'
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Anfangsnotiz-Fokus')
    await seite.locator('#ortsdetail-anfangsnotiz').fill(marker) // Fokus bleibt im Feld
    await seite.waitForTimeout(200)

    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    const erhalten = (await seite.locator('#ortsdetail-anfangsnotiz').inputValue()) === marker
    gemeldeteGrenzen.push(
      `anfangsnotiz-fokussiertes-feld-echter-reload (ADR-0031, benannte Grenze, kein Kriterium): Anfangsnotiz "${marker}" ist nach dem echten Neuladen ${erhalten ? 'ERHALTEN geblieben' : 'VERLOREN gegangen'}.`,
    )
  } catch (fehler) {
    gemeldeteGrenzen.push(`anfangsnotiz-fokussiertes-feld-echter-reload: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Kriterium 2 (Handoff PO-2026-09-27-002): Ab `lg` ausschließlich über den
 * Browserverlauf (`goBack`/`goForward`, nie Klick) landet unbestätigter Text
 * bei A, NICHT im Feld von B — analog
 * `pruefeTagBleibtBeimOrtswechselAmRichtigenOrt`/
 * `pruefeBewertungsachseOrtswechselUeberBrowserverlauf`. Die Anfangsnotiz hat
 * zwar keinen lokalen Entwurf (anders als Tags/Bewertungsachse), aber genau
 * deshalb ist die Struktur hier einfacher: Ohne eigenen `:key` an
 * `AnfangsnotizFeld` zeigt die rein aus `ort.anfangsnotiz` gespeiste
 * `:wert`-Prop nach dem Wechsel automatisch den Wert des NEUEN Ortes — ein
 * Rot-Nachweis gegen einen (hypothetischen) lokalen Zwischenzustand in der
 * Komponente würde hier tatsächlich fälschlich den Text von A bei B zeigen.
 */
async function pruefeAnfangsnotizOrtswechselUeberBrowserverlauf(seite, befunde) {
  const markerAB = 'rauchtest-anfangsnotiz-verlauf-a-b'
  const markerA2 = 'rauchtest-anfangsnotiz-verlauf-a-zweite-eingabe'

  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Anfangsnotiz-Verlauf-A') // Historie: [/orte, A]

    await seite.getByRole('button', { name: 'Ort hinzufügen', exact: true }).click()
    await seite.waitForTimeout(300)
    await seite.locator('#ort-anlegen-bezeichnung').fill('Rauchtest-Anfangsnotiz-Verlauf-B')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(700) // Historie: [/orte, A, B]

    await seite.goBack({ waitUntil: 'networkidle' }) // zurück zu A, rein über den Verlauf
    await seite.waitForTimeout(300)
    await seite.locator('#ortsdetail-anfangsnotiz').fill(markerAB) // fokussiert, NICHT verlassen

    await seite.goForward({ waitUntil: 'networkidle' }) // A -> B, ausschließlich über den Verlauf
    await seite.waitForTimeout(300)
    const feldBWert = await seite.locator('#ortsdetail-anfangsnotiz').inputValue()
    if (feldBWert !== '') {
      befunde.push(`anfangsnotiz-ortswechsel-verlauf: Feld von Ort B ist nach A→B nicht leer, zeigt fälschlich "${feldBWert}"`)
    }

    await seite.goBack({ waitUntil: 'networkidle' }) // zurück zu A, Verifikation
    await seite.waitForTimeout(300)
    const feldAWert = await seite.locator('#ortsdetail-anfangsnotiz').inputValue()
    if (feldAWert !== markerAB) {
      befunde.push(
        `anfangsnotiz-ortswechsel-verlauf: Ort A trägt den Entwurf "${markerAB}" nach dem Wechsel zu B nicht (Commit im Route-Guard fehlgeschlagen, war: "${feldAWert}")`,
      )
    }

    // Zweiter Teil ("dazu A→/orte per goBack"): `/orte` und `/orte/:ortId`
    // sind dieselbe Komponente — auch dieser Wechsel ist ein
    // `onBeforeRouteUpdate`, kein Leave.
    await seite.locator('#ortsdetail-anfangsnotiz').fill(markerA2) // fokussiert, NICHT verlassen
    await seite.goBack({ waitUntil: 'networkidle' }) // A -> /orte
    await seite.waitForTimeout(300)

    await seite.goForward({ waitUntil: 'networkidle' }) // zurück zu A, rein zur Verifikation
    await seite.waitForTimeout(300)
    const feldANeu = await seite.locator('#ortsdetail-anfangsnotiz').inputValue()
    if (feldANeu !== markerA2) {
      befunde.push(`anfangsnotiz-ortswechsel-verlauf: Ort A trägt den Entwurf "${markerA2}" nach dem Wechsel zu /orte (goBack) nicht (war: "${feldANeu}")`)
    }
  } catch (fehler) {
    befunde.push(`anfangsnotiz-ortswechsel-verlauf: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Zusicherung ab PO-2026-09-26-003 (ADR-0033, Korrektur zu ADR-0011 Punkt 6):
 * Ab lg beginnt die Detail-Spalte bei A→B von oben (Versatz 0), unabhängig
 * vom Scroll-Stand bei A, und der Fokus liegt danach auf "Detailansicht
 * schließen" — geprüft für BEIDE Auslöser: Klick auf die Listenzeile und
 * ausschließlich über den Browserverlauf (`goBack`/`goForward`, wie in
 * `pruefeTagBleibtBeimOrtswechselAmRichtigenOrt`; `pushState` kappt dabei
 * vorwärts liegende Einträge). Zusätzlich hart in derselben Funktion:
 * Kriterium 2 — ein erneuter Klick auf die bereits hervorgehobene Zeile
 * setzt den Versatz NICHT zurück (folgt strukturell aus dem Wertvergleich in
 * `watch(ortId)`, kein eigener Code dafür) — und Kriterium 3 — A→B per Klick
 * auf eine sichtbare Zeile ändert den Versatz der Listen-Spalte nicht.
 *
 * Der Scroll-Container der Detail-Spalte wird als EIGENSCHAFT bestimmt: der
 * nächste Vorfahr des Buttons "Detailansicht schließen" mit
 * `overflow-y: auto` oder `scroll` (ADR-0033 Punkt 7) — nie über eine
 * Klassen- oder ID-Liste, bleibt so auch gültig, falls `MasterDetail.vue`
 * seine interne Struktur ändert (ADR-0033 Punkt 2, "Vertrag ist die
 * Methode, nicht die Struktur").
 *
 * Vorbedingung ist TEIL der Zusicherung (ADR-0033 Punkt 7): Vor jedem
 * Wechsel muss bei Ort A tatsächlich ein Versatz > 0 erreicht sein — sonst
 * wäre "Versatz ist 0" kein Beleg für einen wirksamen Reset, sondern nur
 * dafür, dass nie gescrollt wurde. `verlaengereUndScrolleDetailSpalte` öffnet
 * dafür den Koordinaten-Notnagel (verlängert das Formular zuverlässig über
 * die Fensterhöhe hinaus) und scrollt danach ans Ende. Für Kriterium 3 legt
 * diese Funktion zusätzlich zwölf Füll-Orte an, deren Bezeichnung
 * alphabetisch VOR "Rauchtest-Versatz-A/-B" sortiert (Voreinstellung ist
 * Bezeichnung aufsteigend) — die Listen-Spalte ist dadurch tatsächlich
 * scrollbar, A und B liegen am Ende, und ein Scroll ans Ende hält die
 * geklickte Zeile sichtbar, ohne dass Playwrights automatisches
 * Ins-Sicht-Scrollen vor dem Klick selbst einen Versatz erzeugt, den der
 * Test fälschlich der Anwendung zuschreiben würde.
 *
 * Läuft NUR ab lg (der Aufrufer filtert `BREITEN` auf `width >= 1024`) —
 * unterhalb lg ist der Wrapper strukturell kein Scroll-Container
 * (ADR-0033 Punkt 2).
 */
async function pruefeScrollVersatzUndFokusBeiOrtswechsel(seite, breite, befunde) {
  const kontext = `${breite.name}/scroll-versatz-ortswechsel`

  async function bestimmeVersatzUndFokus() {
    return seite.evaluate(() => {
      const schliessen = document.querySelector('[aria-label="Detailansicht schließen"]')
      if (!schliessen) return null
      let container = schliessen.parentElement
      while (container && !['auto', 'scroll'].includes(getComputedStyle(container).overflowY)) {
        container = container.parentElement
      }
      if (!container) return null
      return {
        versatz: container.scrollTop,
        fokusIstSchliessen: document.activeElement === schliessen,
      }
    })
  }

  async function verlaengereUndScrolleDetailSpalte() {
    const reveal = seite.getByRole('button', { name: 'Koordinaten von Hand eintragen' })
    if ((await reveal.count()) > 0) {
      await reveal.click().catch(() => {})
      await seite.waitForTimeout(200)
    }
    await seite.evaluate(() => {
      const schliessen = document.querySelector('[aria-label="Detailansicht schließen"]')
      let container = schliessen?.parentElement ?? null
      while (container && !['auto', 'scroll'].includes(getComputedStyle(container).overflowY)) {
        container = container.parentElement
      }
      if (container) container.scrollTop = container.scrollHeight
    })
    await seite.waitForTimeout(150)
  }

  const zeileB = seite.locator('.ortszeile', { hasText: 'Rauchtest-Versatz-B' })

  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    // Füll-Orte für Kriterium 3 (s. Funktionskommentar) — bewusst VOR A/B
    // angelegt, damit die alphabetische Voreinstellung sie an den Anfang der
    // Liste sortiert und A/B ans Ende, wo ein Scroll-ans-Ende sie sichtbar
    // hält.
    for (let i = 0; i < 12; i += 1) {
      await legeOrtAnUndOeffneIhn(seite, `Rauchtest-Aaa-Fueller-${String(i).padStart(2, '0')}`)
    }

    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Versatz-A') // Historie: [..., A]
    await seite.getByRole('button', { name: 'Ort hinzufügen', exact: true }).first().click()
    await seite.waitForTimeout(300)
    await seite.locator('#ort-anlegen-bezeichnung').fill('Rauchtest-Versatz-B')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(700) // Historie: [..., A, B]

    await seite.goBack({ waitUntil: 'networkidle' }) // zurück zu A
    await seite.waitForTimeout(300)

    // --- Auslöser 1: Klick auf die Listenzeile, plus Kriterium 3 -------
    const listeVorKlick = await seite.evaluate(() => {
      const liste = document.querySelector('.master-detail__liste')
      if (!liste) return null
      liste.scrollTop = liste.scrollHeight
      return liste.scrollTop
    })
    if (listeVorKlick === null || listeVorKlick === 0) {
      befunde.push(`${kontext}: Listen-Spalte lässt sich nicht scrollen — Vorbedingung für Kriterium 3 nicht erreicht`)
    }

    await verlaengereUndScrolleDetailSpalte()
    const vorKlick = await bestimmeVersatzUndFokus()
    if (!vorKlick || vorKlick.versatz === 0) {
      befunde.push(`${kontext}: Vorbedingung nicht erreicht — Versatz bei Ort A vor dem Klick-Wechsel ist ${vorKlick?.versatz ?? 'unbekannt'}, erwartet > 0`)
    }

    await zeileB.click()
    await seite.waitForTimeout(400)

    const nachKlick = await bestimmeVersatzUndFokus()
    if (!nachKlick) {
      befunde.push(`${kontext}: Scroll-Container/Schließen-Button nach Klick-Wechsel nicht gefunden`)
    } else {
      if (nachKlick.versatz !== 0) {
        befunde.push(`${kontext}: Detail-Spalte beginnt nach Klick-Wechsel A→B nicht bei Versatz 0 (${nachKlick.versatz}px)`)
      }
      if (!nachKlick.fokusIstSchliessen) {
        befunde.push(`${kontext}: Fokus liegt nach Klick-Wechsel A→B nicht auf "Detailansicht schließen"`)
      }
    }

    const listeNachKlick = await seite.evaluate(() => document.querySelector('.master-detail__liste')?.scrollTop ?? null)
    if (listeVorKlick !== null && listeNachKlick !== listeVorKlick) {
      befunde.push(`${kontext}: Listen-Spalte ändert ihren Versatz beim Klick-Wechsel A→B (${listeVorKlick}px → ${listeNachKlick}px)`)
    }

    // --- Kriterium 2: erneuter Klick auf die bereits hervorgehobene Zeile --
    await verlaengereUndScrolleDetailSpalte()
    const vorErneutemKlick = await bestimmeVersatzUndFokus()
    await zeileB.click()
    await seite.waitForTimeout(300)
    const nachErneutemKlick = await bestimmeVersatzUndFokus()
    if (vorErneutemKlick && vorErneutemKlick.versatz > 0 && nachErneutemKlick && nachErneutemKlick.versatz === 0) {
      befunde.push(`${kontext}: ein erneuter Klick auf die bereits ausgewählte Zeile setzt den Versatz der Detail-Spalte zurück (sollte stehen bleiben)`)
    }

    // --- Auslöser 2: rein über den Browserverlauf -----------------------
    await seite.goBack({ waitUntil: 'networkidle' }) // zurück zu A
    await seite.waitForTimeout(300)
    await verlaengereUndScrolleDetailSpalte()
    const vorGoForward = await bestimmeVersatzUndFokus()
    if (!vorGoForward || vorGoForward.versatz === 0) {
      befunde.push(`${kontext}: Vorbedingung nicht erreicht — Versatz bei Ort A vor dem Verlaufs-Wechsel ist ${vorGoForward?.versatz ?? 'unbekannt'}, erwartet > 0`)
    }

    await seite.goForward({ waitUntil: 'networkidle' }) // A -> B, ausschließlich über den Verlauf
    await seite.waitForTimeout(400)
    const nachGoForward = await bestimmeVersatzUndFokus()
    if (!nachGoForward) {
      befunde.push(`${kontext}: Scroll-Container/Schließen-Button nach Verlaufs-Wechsel nicht gefunden`)
    } else {
      if (nachGoForward.versatz !== 0) {
        befunde.push(`${kontext}: Detail-Spalte beginnt nach Verlaufs-Wechsel A→B nicht bei Versatz 0 (${nachGoForward.versatz}px)`)
      }
      if (!nachGoForward.fokusIstSchliessen) {
        befunde.push(`${kontext}: Fokus liegt nach Verlaufs-Wechsel A→B nicht auf "Detailansicht schließen"`)
      }
    }

    console.log(`  ${kontext} — geprüft (Klick und Browserverlauf, Vorbedingung Versatz > 0, Listen-Spalte behält ihren Versatz, Wiederklick setzt nicht zurück)`)
  } catch (fehler) {
    befunde.push(`${kontext}: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * PO-2026-09-27-001, Weg (2): Ortswechsel ab lg PER KLICK von Ort A (langer
 * Kommentar an der ersten Achse) zu Ort B (einzeiliger Kommentar an der
 * ersten Achse) darf die Feldhöhe von A nicht auf B übertragen.
 *
 * Seit PO-2026-09-27-004 (ADR-0035 Punkt 5) trägt `Bewertungsachse.vue` ein
 * ortsgebundenes `:key` — ein Ortswechsel mountet die Instanz seitdem neu,
 * statt sie zu erhalten (vorher: HEUTE-NICHT-neu-gemountet, s. Historie
 * dieser Funktion). `kommentarOffen` beginnt dadurch je Ort frisch:
 * „Kommentar hinzufügen" wird deshalb an JEDEM neu angelegten Ort (Referenz,
 * A, B) einzeln geklickt, nicht mehr nur einmal an der Referenz. Bei der
 * Rückkehr zu A/B ist das Feld bereits offen, weil beide dort inzwischen
 * einen gespeicherten Kommentar tragen (`kommentar !== null` öffnet
 * automatisch, design_notes PO-2026-09-07-002). Referenz für die
 * Zwei-Zeilen-Mindesthöhe ist ein frisch geöffnetes, LEERES Kommentarfeld an
 * einem eigenen, unbeteiligten Ort — kein hart codierter Pixelwert (das Feld
 * kennt seine Mindesthöhe nur über `rows="2"`, s. `useMitwachsendesTextfeld.ts`).
 * Das Composable selbst muss laut seiner eigenen Einordnung sowohl MIT als
 * auch OHNE Remount funktionieren (Auslöser (a) Mount / (b) externe
 * Wertänderung, `useMitwachsendesTextfeld.ts`) — diese Zusicherung bleibt
 * deshalb unverändert gültig, auch wenn der Ortswechsel jetzt strukturell
 * über Auslöser (a) statt (b) läuft.
 */
async function pruefeMehrzeiligesFeldBeiOrtswechsel(seite, befunde) {
  const kontext = 'desktop-1280/ortswechsel-mehrzeiliges-feld'
  try {
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })

    // Referenz: frisch geöffnetes, leeres Feld — unbeteiligt am Wechsel unten.
    await legeOrtAnUndOeffneIhn(seite, 'Rauchtest-Mehrzeilig-Referenz')
    const referenzAchse = seite.locator('.bewertungsachse').first()
    await referenzAchse.getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    await seite.waitForTimeout(200)
    const referenzHoehe = await referenzAchse
      .locator('.bewertungsachse__kommentar-feld')
      .evaluate((el) => el.getBoundingClientRect().height)

    // Ort A: langer Kommentar an der ersten Achse — frischer Ort, `:key`
    // sorgt für eine neue Instanz mit `kommentarOffen === false`, „Kommentar
    // hinzufügen" muss deshalb hier (seit PO-2026-09-27-004) erneut geklickt
    // werden.
    await seite.getByRole('button', { name: 'Ort hinzufügen', exact: true }).first().click()
    await seite.waitForTimeout(300)
    await seite.locator('#ort-anlegen-bezeichnung').fill('Rauchtest-Mehrzeilig-A')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(700)
    await seite.locator('.bewertungsachse').first().getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    await seite.locator('.bewertungsachse').first().locator('.bewertungsachse__kommentar-feld').fill(LANGER_KOMMENTAR)
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(300)

    // Ort B: einzeiliger Kommentar an der ersten Achse — ebenfalls ein
    // frischer Ort, „Kommentar hinzufügen" erneut klicken.
    await seite.getByRole('button', { name: 'Ort hinzufügen', exact: true }).first().click()
    await seite.waitForTimeout(300)
    await seite.locator('#ort-anlegen-bezeichnung').fill('Rauchtest-Mehrzeilig-B')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(700)
    await seite.locator('.bewertungsachse').first().getByRole('button', { name: 'Kommentar hinzufügen' }).click()
    await seite.locator('.bewertungsachse').first().locator('.bewertungsachse__kommentar-feld').fill('Kurzer einzeiliger Kommentar.')
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(300)

    // Zurück zu A (Klick in der ab lg gleichzeitig sichtbaren
    // Listen-Spalte) — die Prüfung DIREKT NACH DIESEM Klick ist Teil der
    // Zusicherung, nicht nur Vorbereitung: Eine Fehlimplementierung, die nur
    // auf das native `input`-Ereignis reagiert, würde hier die zuletzt beim
    // eigenen Tippen an Ort B gesetzte (kurze) Höhe stehen lassen, während A
    // schon seinen LANGEN Inhalt zeigt — ohne diesen Zwischenschritt bliebe
    // das unentdeckt, weil ein anschließender Wechsel zurück zu B seine
    // eigene, ebenfalls beim Tippen bereits korrekte Höhe einfach wieder
    // vorfände.
    await seite.locator('.ortszeile', { hasText: 'Rauchtest-Mehrzeilig-A' }).click()
    await seite.waitForTimeout(300)
    for (const eintrag of await seite.evaluate(pruefeMehrzeiligeTextfelder)) {
      befunde.push(`${kontext} (nach Wechsel zu A): ${eintrag}`)
    }

    // Der eigentliche, zu prüfende Wechsel A→B PER KLICK.
    await seite.locator('.ortszeile', { hasText: 'Rauchtest-Mehrzeilig-B' }).click()
    await seite.waitForTimeout(300)

    const hoeheNachWechsel = await seite
      .locator('.bewertungsachse')
      .first()
      .locator('.bewertungsachse__kommentar-feld')
      .evaluate((el) => el.getBoundingClientRect().height)

    if (hoeheNachWechsel > referenzHoehe + 1) {
      befunde.push(
        `${kontext}: Kommentarfeld von Ort B ist nach dem Wechsel von A ${Math.round(hoeheNachWechsel)}px hoch, erwartet die Zwei-Zeilen-Mindesthöhe eines frisch geöffneten leeren Felds (${Math.round(referenzHoehe)}px)`,
      )
    }

    for (const eintrag of await seite.evaluate(pruefeMehrzeiligeTextfelder)) {
      befunde.push(`${kontext}: ${eintrag}`)
    }
    console.log(`  ${kontext} — geprüft (Kommentarfeldhöhe folgt dem Wert von Ort B, nicht der Höhe von Ort A)`)
  } catch (fehler) {
    befunde.push(`${kontext}: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * PO-2026-09-27-001, Weg (3): eine reine Breitenänderung OHNE Texteingabe
 * (1280 → 390) muss die Feldhöhe erneut anpassen — einziger Auslöser dafür
 * ist der `ResizeObserver` im Composable (design-conventions.md „bei jeder
 * reinen Breitenänderung ohne Textänderung").
 */
async function pruefeMehrzeiligesFeldBeiBreitenwechsel(seite, befunde) {
  const kontext = 'ortsdetail-langer-kommentar/breitenwechsel-ohne-eingabe'
  try {
    await seite.setViewportSize({ width: 1280, height: 900 })
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhnMitLangenKommentaren(seite)

    await seite.setViewportSize({ width: 390, height: 844 })
    await seite.waitForTimeout(300)

    for (const eintrag of await seite.evaluate(pruefeMehrzeiligeTextfelder)) {
      befunde.push(`${kontext}: ${eintrag}`)
    }
    console.log(`  ${kontext} — geprüft (Breitenwechsel 1280px→390px ohne Texteingabe)`)
  } catch (fehler) {
    befunde.push(`${kontext}: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  }
}

/**
 * Gegenprobe zu den benannten Ausnahmen aus PO-2026-11-24-005 (ADR-0023 Punkt 7:
 * eine Ausnahme kann einen echten Befund verschlucken, deshalb gehört zu jeder
 * eine Probe, dass die Prüfung weiterhin anschlägt, wo sie anschlagen soll).
 * Synthetisches DOM auf einer leeren Seite, beide Prüffunktionen unverändert:
 *   `pruefeUeberlauf`   — ein reiner Horizontal-Scroller im Bildschirm ist kein
 *                         Befund; dagegen bleiben: ein nicht abschneidender
 *                         Container (Muster der Koordinatenzeile), eine vertikal
 *                         scrollende Spalte und ein Streifen, der selbst zu breit ist.
 *   `pruefeVerdeckung`  — eine nicht modale Überlagerung AUF der Fläche eines
 *                         großen Elements ist kein Befund (die Schnellansicht auf
 *                         dem Kartencontainer); dagegen bleiben: ein kleines Element,
 *                         das nur teilweise unter ihr liegt, und ein Element jenseits
 *                         der Viewport-Breite ohne Streifen. `inert` nimmt das
 *                         verdeckte Element aus der Prüfung.
 */
async function pruefeAusnahmenGegenprobe(browser, befunde) {
  const seite = await browser.newPage({ viewport: { width: 390, height: 700 } })
  try {
    const fall = async (name, html, funktion, erwartetBefund) => {
      await seite.setContent(`<!doctype html><html><body style="margin:0">${html}</body></html>`)
      const gefunden = await seite.evaluate(funktion)
      if (!erwartetBefund && gefunden.length > 0) {
        befunde.push(`ausnahmen-gegenprobe/${name}: unerwartet ${gefunden.length} Befund(e): ${gefunden.slice(0, 2).join('; ')}`)
      }
      if (erwartetBefund && gefunden.length === 0) {
        befunde.push(`ausnahmen-gegenprobe/${name}: kein Befund, obwohl die Prüfung hier anschlagen muss (die Ausnahme ist zu weit)`)
      }
    }
    const streifen = 'overflow-x:auto;overflow-y:hidden;display:flex'
    // Überlauf
    await fall('ueberlauf-streifen-im-bildschirm', `<div style="${streifen};width:300px"><div style="flex:none;width:200px;height:20px;background:red"></div><div style="flex:none;width:200px;height:20px;background:red"></div></div>`, pruefeUeberlauf, false)
    await fall('ueberlauf-container-ohne-abschneiden', '<div style="width:300px"><div style="width:200px;height:20px;margin-left:250px;background:red"></div></div>', pruefeUeberlauf, true)
    await fall('ueberlauf-vertikal-scrollende-spalte', '<div style="overflow-y:auto;height:50px;width:300px"><div style="width:500px;height:20px;background:red"></div></div>', pruefeUeberlauf, true)
    await fall('ueberlauf-streifen-selbst-zu-breit', `<div style="${streifen};width:600px"><div style="flex:none;width:700px;height:20px;background:red"></div></div>`, pruefeUeberlauf, true)
    // Verdeckung
    await fall('verdeckung-ueberlagerung-auf-der-flaeche', '<div tabindex="0" style="position:relative;width:300px;height:300px"><div role="dialog" style="position:absolute;left:0;right:0;bottom:0;height:200px;background:#ccc"></div></div>', pruefeVerdeckung, false)
    const teilweise = '<button style="position:absolute;left:10px;top:10px;width:100px;height:40px">B</button><div role="dialog" style="position:absolute;left:0;top:30px;width:200px;height:100px;background:#ccc"></div>'
    await fall('verdeckung-kleines-element-teilweise-darunter', teilweise, pruefeVerdeckung, true)
    await fall('verdeckung-inert-nimmt-aus', teilweise.replace('<button ', '<button inert '), pruefeVerdeckung, false)
    await fall('verdeckung-streifen-im-bildschirm', `<div style="${streifen};width:300px"><button style="flex:none;width:200px">a</button><button style="flex:none;width:200px">b</button></div>`, pruefeVerdeckung, false)
    await fall('verdeckung-jenseits-der-breite-ohne-streifen', '<div style="width:300px"><button style="margin-left:250px;width:200px">c</button></div>', pruefeVerdeckung, true)
    console.log('  ausnahmen-gegenprobe — geprüft (Horizontal-Streifen, Überlagerung auf der Fläche, inert, jeweils samt Gegenfall)')
  } catch (fehler) {
    befunde.push(`ausnahmen-gegenprobe: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}`)
  } finally {
    await seite.close()
  }
}

// ---------------------------------------------------------------------------
// PO-2026-11-24-005: Schnellansicht (Quick-Look-Bottom-Sheet auf der Karte)
// ---------------------------------------------------------------------------

/** Höhen der drei Zustände (design-conventions.md „Karte: Quick-Look-Sheet"),
 *  hier bewusst NOCHMAL aus dem Design abgeleitet statt aus `lib/schnellansichtHoehen.ts`
 *  importiert: Messgröße und Erwartung sollen nicht dieselbe Funktion sein.
 *  `bereich` ist die gemessene Höhe des Kartenbereichs (Elternknoten der Schnellansicht). */
const SCHNELLANSICHT_TOLERANZ_PX = 2
function erwarteteSchnellansichtHoehen(bereich) {
  return { eingeklappt: 80, halb: Math.max(Math.round(bereich / 2), 280), voll: Math.max(bereich - 56, 80) }
}
/** Abstand Marker zur Oberkante nach dem Verschieben (design-conventions.md: 24px). */
const SCHNELLANSICHT_PAN_ABSTAND_PX = 24

const SN_LANGE_NOTIZ = 'Schnellansicht-Notiz-ohne-Leerzeichen-die-deutlich-laenger-ist-als-eine-Zeile-breit-sein-kann-1234'

/**
 * Bestand der Schnellansicht. Geometrie: Alpha und Beta liegen im Süden
 * nebeneinander, Nord weit im Norden — beim Einpassen stehen Alpha/Beta unten
 * (UNTER der Schnellansicht in „halb"), Nord oben. Öffnet Alpha, schiebt die
 * Karte minimal nach oben; Beta bleibt dabei NEBEN Alpha und damit darüber
 * erreichbar (Wechsel), Nord verlässt den Ausschnitt.
 *   Alpha — Bilder (hoch/quer), lange Kommentare, Anfangsnotiz, Adresse, Tag sa,
 *           Ambiente 8 / Zeit 7, Geschmack und Preis/Leistung nicht bewertet
 *   Beta  — nichts bewertet (Punkt statt Zahl), keine Bilder, Tag sb
 *   Nord  — Geschmack 9, Tag sa
 *   Ohne  — keine Koordinaten (kein Marker, „nicht sichtbar" für `?ort=`)
 */
const SN_ORTE = [
  { name: 'Sn-Alpha', breite: 52.519, laenge: 13.405, tag: 'sa', achsen: { 0: 8, 1: 7 }, kommentare: true, notiz: true, adresse: 'Schnellansichtstraße 1, 10115 Berlin', bilder: 6 },
  { name: 'Sn-Beta', breite: 52.519, laenge: 13.4095, tag: 'sb' },
  { name: 'Sn-Nord', breite: 52.5225, laenge: 13.4072, tag: 'sa', achsen: { 2: 9 } },
  { name: 'Sn-Ohne' },
]
const SN_FORMATE = [
  [300, 600],
  [600, 300],
  [300, 600],
  [600, 300],
  [300, 600],
  [600, 300],
]

async function legeSchnellansichtOrtAn(seite, ort) {
  await legeOrtAnUndOeffneIhn(seite, ort.name)
  if (ort.tag) {
    await seite.locator('.tag-eingabe__feld').fill(ort.tag)
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(300)
  }
  if (ort.breite !== undefined) {
    await seite.getByRole('button', { name: 'Koordinaten von Hand eintragen' }).click()
    await seite.locator('#ortsdetail-breite').fill(String(ort.breite))
    await seite.locator('#ortsdetail-laenge').fill(String(ort.laenge))
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(400)
  }
  for (const [index, wert] of Object.entries(ort.achsen ?? {})) {
    await seite.locator('.bewertungsachse').nth(Number(index)).locator('input[type="number"]').fill(String(wert))
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(100)
  }
  if (ort.kommentare) {
    const achsen = await seite.locator('.bewertungsachse').all()
    for (const [i, achse] of achsen.entries()) {
      await achse.getByRole('button', { name: 'Kommentar hinzufügen' }).click()
      const text = i === 0 ? `${LANGE_ZEICHENFOLGE_OHNE_LEERZEICHEN} ${LANGER_KOMMENTAR}` : LANGER_KOMMENTAR
      await achse.locator('.bewertungsachse__kommentar-feld').fill(text)
      await seite.keyboard.press('Tab')
      await seite.waitForTimeout(150)
    }
  }
  if (ort.notiz) {
    await seite.locator('#ortsdetail-anfangsnotiz').fill(SN_LANGE_NOTIZ)
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(200)
  }
  if (ort.adresse) {
    await seite.locator('#ortsdetail-adresse').fill(ort.adresse)
    await seite.keyboard.press('Tab')
    await seite.waitForTimeout(200)
  }
  if (ort.bilder) {
    const dateien = await erzeugeTestbilder(seite, SN_FORMATE.slice(0, ort.bilder))
    await seite.locator('input[type="file"]').setInputFiles(dateien)
    await seite.locator('.bildkachel').nth(ort.bilder - 1).waitFor({ state: 'visible', timeout: 15000 })
    await seite.waitForTimeout(300)
  }
  await seite.waitForTimeout(300)
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
}

async function legeSchnellansichtBestandAn(seite, orte = SN_ORTE) {
  await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
  for (const ort of orte) await legeSchnellansichtOrtAn(seite, ort)
}

/** Öffnet die Karte frisch (volle Navigation = Ausschnitt eingepasst, nichts gemerkt). */
async function oeffneSchnellansichtKarte(seite, markerAnzahl = 3) {
  await seite.goto(BASIS + '/orte?ansicht=karte', { waitUntil: 'networkidle' })
  await warteAufKartenmarker(seite, markerAnzahl)
}

const SN_ZUSTAENDE = ['eingeklappt', 'halb', 'voll']

/** Vorbedingung über alle Breiten: Bei mindestens einer ragte die Karte unter die feste Tab-Leiste. */
const SN_BEOBACHTUNG = { hochgesetzt: 0 }

/** Stellt den Zustand OHNE Geste ein (Treiberaktion über den Griff-Button, Pfeiltasten). */
async function setzeSchnellansichtZustand(seite, ziel) {
  for (let i = 0; i < 3; i += 1) {
    const label = await seite.locator('.schnellansicht__griff').getAttribute('aria-label')
    const aktuell = SN_ZUSTAENDE.find((z) => label?.endsWith(`aktuell ${z}`))
    if (aktuell === ziel) break
    await seite.locator('.schnellansicht__griff').focus()
    await seite.keyboard.press(SN_ZUSTAENDE.indexOf(ziel) > SN_ZUSTAENDE.indexOf(aktuell) ? 'ArrowUp' : 'ArrowDown')
    await seite.waitForTimeout(450)
  }
  await seite.waitForTimeout(300)
}

function bereiteSchnellansichtVor(zustand) {
  return async (seite) => {
    await legeSchnellansichtBestandAn(seite, SN_ORTE.slice(0, 2))
    await oeffneSchnellansichtKarte(seite, 2)
    await oeffneMarkerSchnellansicht(seite, 'Sn-Alpha')
    if (zustand !== 'halb') await setzeSchnellansichtZustand(seite, zustand)
  }
}

function leseSchnellansicht(seite) {
  return seite.evaluate(() => {
    const d = document.querySelector('.schnellansicht')
    if (!d) return null
    const r = d.getBoundingClientRect()
    const huelle = d.parentElement.getBoundingClientRect()
    const aktiv = document.activeElement
    return {
      hoehe: r.height,
      oben: r.top,
      unten: r.bottom,
      links: r.left,
      rechts: r.right,
      huelle: { oben: huelle.top, hoehe: huelle.height, links: huelle.left, unten: huelle.bottom },
      versatzUnten: huelle.bottom - r.bottom,
      position: getComputedStyle(d).position,
      ariaModal: d.getAttribute('aria-modal'),
      name: d.getAttribute('aria-label'),
      griff: d.querySelector('.schnellansicht__griff')?.getAttribute('aria-label') ?? null,
      fokus: aktiv
        ? {
            tag: aktiv.tagName,
            text: (aktiv.textContent ?? '').trim().slice(0, 40),
            label: aktiv.getAttribute('aria-label') ?? '',
            istMarker: aktiv.classList.contains('karte-marker'),
            kachelId: aktiv.getAttribute('data-bild-id'),
          }
        : null,
    }
  })
}

function leseSchnellansichtMarker(seite) {
  return seite.evaluate(() => {
    const c = document.querySelector('.karte-container').getBoundingClientRect()
    return [...document.querySelectorAll('.karte-marker')].map((el) => {
      const r = el.getBoundingClientRect()
      const koerper = el.querySelector('.karte-marker__koerper')
      const kr = koerper?.getBoundingClientRect()
      const ks = koerper ? getComputedStyle(koerper) : null
      const label = el.querySelector('.karte-marker__label')
      const name = el.getAttribute('aria-label') ?? ''
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      return {
        name,
        basis: name.replace(/, (Gesamtnote |keine Gesamtnote).*$/, ''),
        x,
        y,
        cx: x - c.left,
        cy: y - c.top,
        inert: el.hasAttribute('inert'),
        gewaehlt: el.classList.contains('karte-marker--gewaehlt'),
        istPunkt: koerper?.classList.contains('karte-marker__punkt') ?? false,
        durchmesser: kr ? Math.round(kr.width * 10) / 10 : null,
        ring: ks?.borderTopWidth ?? null,
        schatten: ks?.boxShadow ?? null,
        labelAus: label?.classList.contains('karte-marker__label--aus') ?? true,
        labelDeckkraft: label ? getComputedStyle(label).opacity : null,
      }
    })
  })
}

function ortParameter(seite) {
  return new URL(seite.url()).searchParams.get('ort')
}

function historyLaenge(seite) {
  return seite.evaluate(() => history.length)
}

/** Ziehgeste an einem Element per Maus (Pointer Events). `dyHoch` > 0 zieht nach
 *  oben. `pauseMs` > 0 = langsam (unter der Schnapp-Geschwindigkeit von 0,5px/ms),
 *  0 = Flick. Liefert die Höhe der Schnellansicht VOR dem Loslassen. */
async function ziehe(seite, selektor, dyHoch, schritte, pauseMs) {
  const kasten = await seite.locator(selektor).first().boundingBox()
  const x = kasten.x + kasten.width / 2 - Math.min(40, kasten.width / 4)
  const y = kasten.y + kasten.height / 2
  await seite.mouse.move(x, y)
  await seite.mouse.down()
  for (let i = 1; i <= schritte; i += 1) {
    await seite.mouse.move(x, y - (dyHoch * i) / schritte)
    if (pauseMs > 0) await seite.waitForTimeout(pauseMs)
  }
  const zwischen = (await leseSchnellansicht(seite))?.hoehe ?? null
  await seite.mouse.up()
  await seite.waitForTimeout(500)
  return zwischen
}

/** Ein freier Punkt auf der Karte (Fensterkoordinaten): nicht unter der
 *  Schnellansicht, nicht nahe einem Marker oder einem Bedienelement. */
async function findeFreienKartenpunkt(seite) {
  return seite.evaluate(() => {
    const c = document.querySelector('.karte-container').getBoundingClientRect()
    const d = document.querySelector('.schnellansicht')?.getBoundingClientRect()
    const marker = [...document.querySelectorAll('.karte-marker')].map((el) => el.getBoundingClientRect())
    const obergrenze = d ? d.top : c.bottom
    for (let y = c.top + 90; y < obergrenze - 20; y += 12) {
      for (const anteil of [0.5, 0.35, 0.65, 0.8, 0.2]) {
        const x = c.left + c.width * anteil
        const nah = marker.some((m) => x > m.left - 60 && x < m.right + 60 && y > m.top - 60 && y < m.bottom + 60)
        if (nah) continue
        const treffer = document.elementFromPoint(x, y)
        if (treffer && treffer.closest('.leaflet-container') && !treffer.closest('.leaflet-control, .karte-marker')) return { x, y }
      }
    }
    return null
  })
}

/** Gegen-Zusicherung zur Ausnahme `[inert]` in `pruefeVerdeckung` (ADR-0039 Punkt 7):
 *  jeder Marker, dessen Mittelpunkt unter der gerenderten Schnellansicht liegt
 *  (Oberkante und Seiten), ist `inert` — und kein anderer. Gemessen wird am
 *  gerenderten Rechteck der Schnellansicht, nicht an einem Rechenwert der App.
 *  `gesehen` zählt, welche Klassen überhaupt vorkamen (Vorbedingung: beide). */
async function pruefeMarkerInertGegenZusicherung(seite, wo, befunde, gesehen) {
  const sheet = await leseSchnellansicht(seite)
  const marker = await leseSchnellansichtMarker(seite)
  if (!sheet) {
    befunde.push(`${wo}: keine Schnellansicht zum Prüfen von inert`)
    return
  }
  for (const m of marker) {
    const darunter = m.y >= sheet.oben && m.x >= sheet.links && m.x <= sheet.rechts
    if (darunter) gesehen.inert += 1
    else gesehen.aktiv += 1
    if (m.inert !== darunter) {
      befunde.push(`${wo}: „${m.basis}" liegt ${darunter ? 'UNTER' : 'nicht unter'} der Schnellansicht (Mittelpunkt y ${Math.round(m.y)}, Oberkante ${Math.round(sheet.oben)}), ist aber ${m.inert ? '' : 'nicht '}inert`)
    }
    if (darunter) {
      // Sie ist wirklich verdeckt (sonst wäre inert unnötig) und nicht erreichbar.
      const oben = await seite.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('.schnellansicht') != null, [m.x, m.y])
      if (!oben) befunde.push(`${wo}: „${m.basis}" ist inert, liegt aber gar nicht unter der Schnellansicht`)
    }
  }
}

/**
 * PO-2026-11-24-005 (ADR-0039), harte Zusicherungen der Schnellansicht — je Breite
 * aus BREITEN, frische Seite, eigener Bestand (`SN_ORTE`). Eigenschaften:
 *   1. Marker öffnet ein NICHT modales Sheet (kein aria-modal, position absolute,
 *      Karte bedienbar, Tipp auf leere Karte schließt nicht) im Zustand halb;
 *      Öffnen legt GENAU einen Verlaufseintrag an; der ausgewählte Marker ist über
 *      Größe UND Ringstärke erkennbar (Scheibe 48/Ring 4, Punkt 24), sein Name
 *      immer sichtbar; Fokus auf der Überschrift; die Karte schiebt den Marker
 *      über die Oberkante (24px), ohne zu zoomen.
 *   2. Inhalt nur lesend: Bezeichnung, Gesamtnote ohne Zonenfarbe, vier Achsen,
 *      Kommentare (halb geklemmt, voll vollständig), Anfangsnotiz, Adresse, Tags,
 *      Bildstreifen (ohne Bilder: nichts); „Bearbeiten" ist sekundär.
 *   3. Jeder Zustand ist per ZIEHGESTE erreichbar und rastet ein (Vorbedingung: die
 *      Höhe beim Loslassen ist nicht die Zielhöhe); ein schneller Flick schnappt in
 *      Wischrichtung; im Inhalt zieht nichts; der Griff-Button und die Pfeiltasten
 *      erreichen jeden Zustand ohne Geste.
 *   4. Wechsel auf einen anderen Marker: Inhalt springt, Zustand bleibt, `replace`
 *      (kein zusätzlicher Verlaufseintrag), Fokus auf die Überschrift.
 *   5. „×" und Esc schließen, der Fokus liegt auf dem Marker; Zurück schließt;
 *      Neuladen mit gültiger ID öffnet auf „halb"; unbekannte/nicht sichtbare ID:
 *      Karte ohne Sheet, Parameter per replace entfernt; ein Filter, der den Ort
 *      ausblendet, schließt das Sheet.
 *   6. Gegen-Zusicherung zu `[inert]`: jeder Marker unter dem Sheet ist inert, keiner
 *      sonst — in jedem Zustand, bei verschobener Karte (Vorbedingung: beide Klassen).
 *   7. „Bearbeiten" öffnet /orte/:id, goBack zeigt das Sheet desselben Ortes in
 *      „halb" bei unverschobenem Ausschnitt; ein Bild öffnet das Vollbild: Esc
 *      schließt nur das Vollbild (Fokus auf der Streifen-Kachel des zuletzt
 *      gezeigten Bildes, Zustand bleibt), goBack ebenso, das zweite goBack das Sheet.
 *   8. Öffnen, Wechsel und Schließen verschieben den Fenster-Scroll nicht.
 */
async function pruefeSchnellansicht(browser, breite, befunde) {
  const wo = `${breite.name}/schnellansicht`
  const seite = await browser.newPage({ viewport: { width: breite.width, height: breite.height } })
  seite.on('pageerror', (fehler) => befunde.push(`${wo}: Laufzeitfehler: ${fehler.message}`))
  const dialog = (name) => seite.getByRole('dialog', { name: new RegExp(`^Schnellansicht: ${escapeRegExp(name)}`) })
  const gleich = (a, b, toleranz = SCHNELLANSICHT_TOLERANZ_PX) => Math.abs(a - b) <= toleranz
  const pruefeHoehe = async (zustand, text) => {
    const sheet = await leseSchnellansicht(seite)
    if (!sheet) {
      befunde.push(`${wo}: ${text} — keine Schnellansicht`)
      return null
    }
    const erwartet = erwarteteSchnellansichtHoehen(sheet.huelle.hoehe - sheet.versatzUnten)[zustand]
    if (!gleich(sheet.hoehe, erwartet)) befunde.push(`${wo}: ${text} — Höhe ${sheet.hoehe.toFixed(1)}px statt ${erwartet}px („${zustand}")`)
    return sheet
  }
  try {
    await legeSchnellansichtBestandAn(seite)

    // ===== 1. Öffnen, nicht modal, Auswahl, Verschieben, Inhalt ===================
    await oeffneSchnellansichtKarte(seite)
    const markerVorher = await leseSchnellansichtMarker(seite)
    const alphaVorher = markerVorher.find((m) => m.basis === 'Sn-Alpha')
    const betaVorher = markerVorher.find((m) => m.basis === 'Sn-Beta')
    if (!alphaVorher || !betaVorher || markerVorher.length !== 3) {
      befunde.push(`${wo}: Vorbedingung nicht erreicht — ${markerVorher.length} statt 3 Marker`)
      return
    }
    // Kartenbereich und der Platz, den <main> unten für die feste Tab-Leiste reserviert:
    // ragt die Karte darunter, steht die Schnellansicht ÜBER der Leiste (Versatz).
    const messung = await seite.evaluate(() => {
      const rahmen = document.querySelector('.karte-container').getBoundingClientRect()
      const reserviert = Number.parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom) || 0
      return { hoehe: rahmen.height, versatz: Math.max(0, Math.round(rahmen.bottom - (innerHeight - reserviert))), leiste: innerHeight - reserviert }
    })
    if (messung.versatz > 0) SN_BEOBACHTUNG.hochgesetzt += 1
    const bereich = messung.hoehe - messung.versatz
    const halbHoehe = erwarteteSchnellansichtHoehen(bereich).halb
    const oberkanteHalb = bereich - halbHoehe
    if (!(alphaVorher.cy >= oberkanteHalb)) {
      befunde.push(`${wo}: Vorbedingung nicht erreicht — Alpha liegt vor dem Öffnen nicht unter der künftigen Oberkante (y ${Math.round(alphaVorher.cy)}, Oberkante ${oberkanteHalb}); ohne das beweist das Verschieben nichts`)
    }
    const abstandVorher = Math.abs(alphaVorher.x - betaVorher.x)
    const laengeVorher = await historyLaenge(seite)
    await seite.evaluate(() => document.querySelector('.karte-marker[aria-label^="Sn-Alpha"]').focus({ preventScroll: true }))
    await seite.keyboard.press('Enter')
    await dialog('Sn-Alpha').waitFor({ state: 'visible', timeout: 10000 })
    await seite.waitForTimeout(800)

    let sheet = await pruefeHoehe('halb', 'Öffnen')
    const alphaId = ortParameter(seite)
    if (!alphaId) befunde.push(`${wo}: Öffnen — die Adresse trägt keinen ort-Parameter`)
    if ((await historyLaenge(seite)) !== laengeVorher + 1) befunde.push(`${wo}: Öffnen legt nicht genau einen Verlaufseintrag an`)
    if (await seite.getByRole('dialog', { name: /Detail|Ort bearbeiten/ }).count()) befunde.push(`${wo}: Öffnen zeigt ein Ortsdetail statt der Schnellansicht`)
    if (sheet) {
      // Über der festen Tab-Leiste, nie dahinter („Bearbeiten" in der Fußzeile bliebe sonst verdeckt).
      if (!gleich(sheet.versatzUnten, messung.versatz)) befunde.push(`${wo}: die Schnellansicht steht ${sheet.versatzUnten.toFixed(1)}px über der Kartenunterkante statt ${messung.versatz}px (über der Tab-Leiste)`)
      if (sheet.unten > messung.leiste + 1) befunde.push(`${wo}: die Unterkante der Schnellansicht (${Math.round(sheet.unten)}) liegt unter der Oberkante der festen Leiste (${Math.round(messung.leiste)})`)
      if (sheet.ariaModal !== null || (await seite.locator('[aria-modal="true"]').count()) > 0) befunde.push(`${wo}: die Schnellansicht ist modal (aria-modal)`)
      if (sheet.position !== 'absolute') befunde.push(`${wo}: die Schnellansicht ist ${sheet.position} positioniert statt absolute (ADR-0039 Punkt 8)`)
      if (!(sheet.fokus?.tag === 'H2' && sheet.fokus.text === 'Sn-Alpha')) befunde.push(`${wo}: Öffnen — der Fokus liegt nicht auf der Überschrift (${sheet.fokus?.tag} „${sheet.fokus?.text}")`)
    }
    if ((await seite.locator('.sheet-backdrop').count()) > 0) befunde.push(`${wo}: die Schnellansicht liegt auf einem Backdrop`)

    // Auswahl: Größe UND Ringstärke
    let marker = await leseSchnellansichtMarker(seite)
    const gewaehlt = marker.filter((m) => m.gewaehlt)
    if (gewaehlt.length !== 1 || gewaehlt[0].basis !== 'Sn-Alpha') befunde.push(`${wo}: ausgewählt ist nicht genau Alpha (${gewaehlt.map((m) => m.basis).join(', ') || 'keiner'})`)
    const alpha = marker.find((m) => m.basis === 'Sn-Alpha')
    const beta = marker.find((m) => m.basis === 'Sn-Beta')
    if (alpha) {
      if (alpha.istPunkt || alpha.durchmesser !== 48 || alpha.ring !== '4px') befunde.push(`${wo}: ausgewählter Marker mit Note ist ${alpha.durchmesser}px mit Ring ${alpha.ring} statt 48px/4px`)
      if (alpha.labelAus || alpha.labelDeckkraft !== '1') befunde.push(`${wo}: der Name des ausgewählten Markers ist nicht sichtbar`)
      // Verschieben: Marker mindestens 24px über der Oberkante, kein Zoom
      if (!(alpha.cy <= oberkanteHalb - SCHNELLANSICHT_PAN_ABSTAND_PX + SCHNELLANSICHT_TOLERANZ_PX)) {
        befunde.push(`${wo}: Alpha liegt nach dem Öffnen bei y ${Math.round(alpha.cy)} (Oberkante ${oberkanteHalb}) — nicht ≥ ${SCHNELLANSICHT_PAN_ABSTAND_PX}px darüber (die Karte wurde nicht verschoben)`)
      }
      if (alpha.inert) befunde.push(`${wo}: der ausgewählte Marker ist inert`)
    }
    if (beta) {
      if (beta.gewaehlt || !beta.istPunkt || beta.durchmesser !== 16) befunde.push(`${wo}: nicht ausgewählter Marker ohne Note hat ${beta.durchmesser}px statt 16px`)
    }
    if (marker.filter((m) => !m.gewaehlt && !m.istPunkt && m.durchmesser !== 40).length) {
      befunde.push(`${wo}: ein nicht ausgewählter Marker mit Note ist nicht 40px groß`)
    }
    if (beta) {
      if (!gleich(Math.abs(alpha.x - beta.x), abstandVorher, 1.5)) befunde.push(`${wo}: das Öffnen hat gezoomt (Abstand Alpha–Beta ${Math.abs(alpha.x - beta.x).toFixed(1)}px statt ${abstandVorher.toFixed(1)}px)`)
    }
    // Der andere Marker bleibt bedienbar (nicht modal): Beta liegt über der Oberkante und ist aktiv.
    if (beta && beta.cy < oberkanteHalb && beta.inert) befunde.push(`${wo}: Beta liegt über der Schnellansicht und ist trotzdem inert`)

    // Inhalt (halb)
    const inhaltHalb = await seite.evaluate(() => {
      const d = document.querySelector('.schnellansicht')
      const titel = d.querySelector('.schnellansicht__titel')
      const note = d.querySelector('.schnellansicht__note')
      const klemm = [...d.querySelectorAll('.schnellansicht__klemmbar')]
      const bearbeiten = [...d.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Bearbeiten')
      const bs = bearbeiten ? getComputedStyle(bearbeiten) : null
      return {
        titel: titel?.textContent?.trim(),
        note: note?.textContent?.trim() ?? null,
        noteFarbe: note ? getComputedStyle(note).color : null,
        noteFlaeche: note ? getComputedStyle(note).backgroundColor : null,
        titelFarbe: titel ? getComputedStyle(titel).color : null,
        achsen: [...d.querySelectorAll('.schnellansicht__achse')].map((a) => ({
          name: a.querySelector('.schnellansicht__achse-name')?.textContent?.trim(),
          zahl: a.querySelector('.intensitaetsbalken__zahl')?.textContent?.trim() ?? null,
          platzhalter: a.querySelector('.intensitaetsbalken__platzhalter')?.textContent?.trim() ?? null,
          kommentar: a.querySelector('.schnellansicht__klemmbar') != null,
        })),
        klemmbar: klemm.map((k) => ({ geklemmt: k.scrollHeight > k.clientHeight + 1, ueberstand: k.scrollWidth > k.clientWidth + 1, zeilen: getComputedStyle(k).webkitLineClamp })),
        adresse: d.querySelector('.schnellansicht__adresse')?.textContent?.trim() ?? null,
        tags: [...d.querySelectorAll('.schnellansicht__tag')].map((t) => t.textContent.trim()),
        kacheln: d.querySelectorAll('.streifenkachel').length,
        bearbeiten: bs ? { flaeche: bs.backgroundColor, rahmen: bs.borderTopWidth, text: bs.color } : null,
        bearbeitenImFuss: bearbeiten?.closest('.schnellansicht__fuss') != null,
      }
    })
    if (inhaltHalb.titel !== 'Sn-Alpha') befunde.push(`${wo}: Überschrift „${inhaltHalb.titel}" statt „Sn-Alpha"`)
    if (!/^\d+,\d$/.test(inhaltHalb.note ?? '')) befunde.push(`${wo}: Gesamtnote „${inhaltHalb.note}" ist keine Zahl mit Komma`)
    if (inhaltHalb.note && (inhaltHalb.noteFarbe !== inhaltHalb.titelFarbe || inhaltHalb.noteFlaeche !== 'rgba(0, 0, 0, 0)')) befunde.push(`${wo}: die Gesamtnote trägt eine Zonenfarbe (${inhaltHalb.noteFarbe} auf ${inhaltHalb.noteFlaeche})`)
    if (inhaltHalb.achsen.length !== 4) befunde.push(`${wo}: ${inhaltHalb.achsen.length} statt 4 Achsen`)
    const erwarteteWerte = ['8', '7', null, null]
    for (const [i, achse] of inhaltHalb.achsen.entries()) {
      if (achse.zahl !== erwarteteWerte[i] || (erwarteteWerte[i] === null && achse.platzhalter !== 'Noch nicht bewertet')) befunde.push(`${wo}: Achse „${achse.name}" zeigt ${achse.zahl ?? achse.platzhalter ?? 'nichts'}`)
      if (!achse.kommentar) befunde.push(`${wo}: Achse „${achse.name}" zeigt ihren Kommentar nicht`)
    }
    if (inhaltHalb.klemmbar.length !== 5) befunde.push(`${wo}: ${inhaltHalb.klemmbar.length} statt 5 Textblöcke (Anfangsnotiz + vier Kommentare)`)
    if (!inhaltHalb.klemmbar.some((k) => k.geklemmt)) befunde.push(`${wo}: in „halb" ist kein Kommentar auf 2 Zeilen geklemmt (Vorbedingung/Klemmung)`)
    if (inhaltHalb.klemmbar.some((k) => k.zeilen !== '2')) befunde.push(`${wo}: ein Textblock ist in „halb" nicht auf 2 Zeilen geklemmt`)
    if (inhaltHalb.adresse !== 'Schnellansichtstraße 1, 10115 Berlin') befunde.push(`${wo}: Adresse „${inhaltHalb.adresse}"`)
    if (inhaltHalb.tags.join(',') !== 'sa') befunde.push(`${wo}: Tags „${inhaltHalb.tags.join(',')}" statt „sa"`)
    if (inhaltHalb.kacheln !== 6) befunde.push(`${wo}: ${inhaltHalb.kacheln} statt 6 Kacheln im Bildstreifen`)
    if (!inhaltHalb.bearbeiten || !inhaltHalb.bearbeitenImFuss) befunde.push(`${wo}: „Bearbeiten" fehlt in „halb"`)
    else if (inhaltHalb.bearbeiten.flaeche !== 'rgba(0, 0, 0, 0)' || inhaltHalb.bearbeiten.rahmen !== '1px') befunde.push(`${wo}: „Bearbeiten" ist kein Sekundär-Button (Fläche ${inhaltHalb.bearbeiten.flaeche}, Rahmen ${inhaltHalb.bearbeiten.rahmen})`)
    await seite.screenshot({ path: `${FOTOS}/${breite.name}-schnellansicht-halb.png` })

    // Tipp auf leere Karte schließt nicht; die Karte bleibt bedienbar (Mausrad zoomt)
    const frei = await findeFreienKartenpunkt(seite)
    if (!frei) {
      befunde.push(`${wo}: Vorbedingung nicht erreicht — kein freier Kartenpunkt für „Tipp auf leere Karte"`)
    } else {
      await seite.mouse.click(frei.x, frei.y)
      await seite.waitForTimeout(400)
      if (!(await leseSchnellansicht(seite)) || ortParameter(seite) !== alphaId) befunde.push(`${wo}: ein Tipp auf die leere Karte schließt die Schnellansicht`)
      const vorZoom = await leseSchnellansichtMarker(seite)
      await seite.mouse.move(frei.x, frei.y)
      await seite.mouse.wheel(0, -240)
      await seite.waitForTimeout(900)
      const nachZoom = await leseSchnellansichtMarker(seite)
      const a1 = vorZoom.find((m) => m.basis === 'Sn-Alpha')
      const b1 = vorZoom.find((m) => m.basis === 'Sn-Beta')
      const a2 = nachZoom.find((m) => m.basis === 'Sn-Alpha')
      const b2 = nachZoom.find((m) => m.basis === 'Sn-Beta')
      if (!(Math.abs(b2.x - a2.x) > Math.abs(b1.x - a1.x) + 5)) befunde.push(`${wo}: die Karte lässt sich bei offener Schnellansicht nicht zoomen (nicht modal)`)
    }

    // ===== 2. Zustände per Ziehgeste ================================================
    await oeffneSchnellansichtKarte(seite)
    await oeffneMarkerSchnellansicht(seite, 'Sn-Alpha')
    const hoehen = erwarteteSchnellansichtHoehen(bereich)
    // halb -> voll an der KOPFZEILE (nicht am Griff), langsam und zu kurz: nächstgelegen = voll
    let zwischen = await ziehe(seite, '.schnellansicht__kopf', hoehen.voll - hoehen.halb - 25, 12, 40)
    await pruefeHoehe('voll', 'Ziehen an der Kopfzeile nach oben')
    if (zwischen === null || Math.abs(zwischen - hoehen.voll) < 5) befunde.push(`${wo}: Vorbedingung nicht erreicht — die Höhe beim Loslassen (${zwischen}) war schon die Zielhöhe, „Einrasten" ist so nicht belegt`)
    // voll -> eingeklappt am Griff, langsam, nur bis 30px über eingeklappt
    zwischen = await ziehe(seite, '.schnellansicht__griff', -(hoehen.voll - hoehen.eingeklappt - 30), 12, 40)
    await pruefeHoehe('eingeklappt', 'Ziehen am Griff nach unten')
    if (zwischen === null || Math.abs(zwischen - hoehen.eingeklappt) < 5) befunde.push(`${wo}: Vorbedingung nicht erreicht — beim Ziehen nach unten rastete nichts ein`)
    // eingeklappt -> halb, langsam bis 30px unter halb
    zwischen = await ziehe(seite, '.schnellansicht__griff', hoehen.halb - hoehen.eingeklappt - 30, 12, 40)
    await pruefeHoehe('halb', 'Ziehen nach oben auf halb')
    if (zwischen === null || Math.abs(zwischen - hoehen.halb) < 5) befunde.push(`${wo}: Vorbedingung nicht erreicht — beim Ziehen auf „halb" rastete nichts ein`)
    // Flick: nur 40px, aber schnell -> der nächste größere Zustand (voll), obwohl „halb" näher läge
    zwischen = await ziehe(seite, '.schnellansicht__griff', 40, 2, 0)
    await pruefeHoehe('voll', 'schneller Flick nach oben')
    if (zwischen === null || !(Math.abs(zwischen - hoehen.halb) < Math.abs(zwischen - hoehen.voll))) befunde.push(`${wo}: Vorbedingung nicht erreicht — der Flick endete nicht näher an „halb" als an „voll" (${zwischen})`)
    // Flick nach unten aus voll: schneller Wisch schnappt auf halb
    zwischen = await ziehe(seite, '.schnellansicht__griff', -40, 2, 0)
    await pruefeHoehe('halb', 'schneller Flick nach unten')
    // Im Inhalt zieht nichts (nie im scrollenden Inhalt)
    const inhaltKasten = await seite.locator('.schnellansicht__inhalt').boundingBox()
    await seite.mouse.move(inhaltKasten.x + inhaltKasten.width / 2, inhaltKasten.y + inhaltKasten.height - 20)
    await seite.mouse.down()
    for (let i = 1; i <= 8; i += 1) {
      await seite.mouse.move(inhaltKasten.x + inhaltKasten.width / 2, inhaltKasten.y + inhaltKasten.height - 20 - i * 8)
      await seite.waitForTimeout(30)
    }
    const waehrendInhaltZug = await leseSchnellansicht(seite)
    await seite.mouse.up()
    // Das Ziehen im Inhalt markiert Text (Treiberaktion) — die Markierung würde in den Bildschirmfotos stehen.
    await seite.evaluate(() => window.getSelection()?.removeAllRanges())
    await seite.waitForTimeout(400)
    if (waehrendInhaltZug && !gleich(waehrendInhaltZug.hoehe, hoehen.halb)) befunde.push(`${wo}: eine Geste im Inhalt verändert die Höhe (${waehrendInhaltZug.hoehe}px)`)
    await pruefeHoehe('halb', 'Geste im Inhalt')

    // ===== 3. Griff-Button und Pfeiltasten ohne Geste ==========================
    const griffSchritte = [
      ['Enter', 'voll'],
      ['Enter', 'halb'],
      ['ArrowDown', 'eingeklappt'],
      ['ArrowDown', 'eingeklappt'],
      ['ArrowUp', 'halb'],
      ['ArrowUp', 'voll'],
      ['ArrowUp', 'voll'],
    ]
    await seite.locator('.schnellansicht__griff').focus()
    for (const [taste, erwartet] of griffSchritte) {
      await seite.keyboard.press(taste)
      await seite.waitForTimeout(450)
      const st = await pruefeHoehe(erwartet, `Griff: ${taste}`)
      if (st && !st.griff?.endsWith(`aktuell ${erwartet}`)) befunde.push(`${wo}: Griff: ${taste} — Beschriftung „${st.griff}" nennt nicht „aktuell ${erwartet}"`)
    }
    // Ein echter Tipp (Maus, keine Bewegung) auf den Griff schaltet ebenfalls (kein verschluckter Klick nach einer Geste)
    await seite.locator('.schnellansicht__griff').click()
    await seite.waitForTimeout(450)
    await pruefeHoehe('halb', 'Tipp auf den Griff (aus voll zurück auf halb)')
    // Eingeklappt: nur Zeile, Inhalt weder sichtbar noch fokussierbar, kein „Bearbeiten"
    await setzeSchnellansichtZustand(seite, 'eingeklappt')
    const eingeklappt = await seite.evaluate(() => {
      const d = document.querySelector('.schnellansicht')
      const inhalt = d.querySelector('.schnellansicht__inhalt')
      return {
        sichtbar: getComputedStyle(inhalt).visibility,
        inert: inhalt.hasAttribute('inert'),
        bearbeiten: [...d.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Bearbeiten'),
        titel: d.querySelector('.schnellansicht__titel').getBoundingClientRect().height,
        note: d.querySelector('.schnellansicht__note') != null,
      }
    })
    if (eingeklappt.sichtbar !== 'hidden' || !eingeklappt.inert) befunde.push(`${wo}: eingeklappt ist der Inhalt noch sichtbar/fokussierbar (visibility ${eingeklappt.sichtbar}, inert ${eingeklappt.inert})`)
    if (eingeklappt.bearbeiten) befunde.push(`${wo}: eingeklappt zeigt „Bearbeiten"`)
    if (!eingeklappt.note) befunde.push(`${wo}: eingeklappt fehlt die Gesamtnote in der Zeile`)
    await seite.screenshot({ path: `${FOTOS}/${breite.name}-schnellansicht-eingeklappt.png` })
    await setzeSchnellansichtZustand(seite, 'voll')
    const inhaltVoll = await seite.evaluate(() =>
      [...document.querySelectorAll('.schnellansicht__klemmbar')].map((k) => ({ abgeschnitten: k.scrollHeight > k.clientHeight + 1, ueberstand: k.scrollWidth > k.clientWidth + 1 })),
    )
    if (inhaltVoll.some((k) => k.abgeschnitten || k.ueberstand)) befunde.push(`${wo}: in „voll" ist ein Kommentar/die Anfangsnotiz abgeschnitten oder ragt heraus`)
    await seite.screenshot({ path: `${FOTOS}/${breite.name}-schnellansicht-voll.png` })

    // ===== 4. „×", Esc, Fokus auf dem Marker ===========================================
    await oeffneSchnellansichtKarte(seite)
    await oeffneMarkerSchnellansicht(seite, 'Sn-Alpha')
    await seite.getByRole('button', { name: 'Schnellansicht schließen' }).click()
    await seite.locator('.schnellansicht').waitFor({ state: 'detached', timeout: 10000 })
    await seite.waitForTimeout(400)
    if (ortParameter(seite) !== null) befunde.push(`${wo}: nach „×" steht noch ein ort-Parameter in der Adresse`)
    let fokus = (await seite.evaluate(() => ({ istMarker: document.activeElement?.classList.contains('karte-marker'), label: document.activeElement?.getAttribute('aria-label') ?? '' })))
    if (!fokus.istMarker || !fokus.label.startsWith('Sn-Alpha')) befunde.push(`${wo}: nach „×" liegt der Fokus nicht auf dem Marker (${fokus.label || 'anderes Element'})`)
    await oeffneMarkerSchnellansicht(seite, 'Sn-Alpha')
    await seite.keyboard.press('Escape')
    await seite.locator('.schnellansicht').waitFor({ state: 'detached', timeout: 10000 })
    await seite.waitForTimeout(400)
    if (ortParameter(seite) !== null) befunde.push(`${wo}: nach Esc steht noch ein ort-Parameter in der Adresse`)
    fokus = await seite.evaluate(() => ({ istMarker: document.activeElement?.classList.contains('karte-marker'), label: document.activeElement?.getAttribute('aria-label') ?? '' }))
    if (!fokus.istMarker || !fokus.label.startsWith('Sn-Alpha')) befunde.push(`${wo}: nach Esc liegt der Fokus nicht auf dem Marker (${fokus.label || 'anderes Element'})`)
    // Schließen entfernt den eigenen Eintrag: ein weiteres Zurück öffnet nichts mehr
    await seite.goBack({ waitUntil: 'networkidle' }).catch(() => {})
    await seite.waitForTimeout(400)
    // goBack schließt
    await oeffneSchnellansichtKarte(seite)
    await oeffneMarkerSchnellansicht(seite, 'Sn-Alpha')
    await seite.goBack({ waitUntil: 'networkidle' })
    await seite.locator('.schnellansicht').waitFor({ state: 'detached', timeout: 10000 }).catch(() => befunde.push(`${wo}: goBack schließt die Schnellansicht nicht`))
    if (ortParameter(seite) !== null) befunde.push(`${wo}: nach goBack steht noch ein ort-Parameter in der Adresse`)

    // ===== 5. Wechsel auf einen anderen Marker: Zustand bleibt, replace =========
    await oeffneSchnellansichtKarte(seite)
    await oeffneMarkerSchnellansicht(seite, 'Sn-Alpha')
    await setzeSchnellansichtZustand(seite, 'eingeklappt')
    const laengeVorWechsel = await historyLaenge(seite)
    await seite.evaluate(() => document.querySelector('.karte-marker[aria-label^="Sn-Beta"]').focus({ preventScroll: true }))
    await seite.keyboard.press('Enter')
    await dialog('Sn-Beta').waitFor({ state: 'visible', timeout: 10000 })
    await seite.waitForTimeout(600)
    const betaId = ortParameter(seite)
    if (!betaId || betaId === alphaId) befunde.push(`${wo}: Wechsel — der ort-Parameter zeigt nicht auf Beta`)
    if ((await historyLaenge(seite)) !== laengeVorWechsel) befunde.push(`${wo}: Wechsel legt einen zusätzlichen Verlaufseintrag an (replace erwartet)`)
    await pruefeHoehe('eingeklappt', 'Wechsel (der Zustand bleibt)')
    const nachWechsel = await leseSchnellansicht(seite)
    if (nachWechsel && !(nachWechsel.fokus?.tag === 'H2' && nachWechsel.fokus.text === 'Sn-Beta')) befunde.push(`${wo}: Wechsel — der Fokus liegt nicht auf der Überschrift (${nachWechsel.fokus?.tag} „${nachWechsel.fokus?.text}")`)
    marker = await leseSchnellansichtMarker(seite)
    const gewaehltNachWechsel = marker.filter((m) => m.gewaehlt)
    if (gewaehltNachWechsel.length !== 1 || gewaehltNachWechsel[0].basis !== 'Sn-Beta') befunde.push(`${wo}: Wechsel — ausgewählt ist nicht genau Beta`)
    const betaGewaehlt = marker.find((m) => m.basis === 'Sn-Beta')
    if (betaGewaehlt && (!betaGewaehlt.istPunkt || betaGewaehlt.durchmesser !== 24 || !/3px/.test(betaGewaehlt.schatten ?? ''))) {
      befunde.push(`${wo}: ausgewählter Marker ohne Note ist kein 24px-Punkt mit 3px-Außenring (${betaGewaehlt.durchmesser}px, ${betaGewaehlt.istPunkt ? 'Punkt' : 'Scheibe'})`)
    }
    if (betaGewaehlt && (betaGewaehlt.labelAus || betaGewaehlt.labelDeckkraft !== '1')) befunde.push(`${wo}: der Name des ausgewählten Punkts ist nicht sichtbar`)
    if (await seite.locator('.bildstreifen').count()) befunde.push(`${wo}: ein Ort ohne Bilder zeigt trotzdem einen Bildstreifen`)
    await setzeSchnellansichtZustand(seite, 'halb')
    const betaInhalt = await seite.evaluate(() => ({
      note: document.querySelector('.schnellansicht__note')?.textContent ?? null,
      ohneNote: document.querySelector('.schnellansicht__ohne-note')?.textContent?.trim() ?? null,
      kacheln: document.querySelectorAll('.streifenkachel').length,
      achsenOhneWert: document.querySelectorAll('.schnellansicht__achse .intensitaetsbalken__platzhalter').length,
    }))
    if (betaInhalt.note !== null || betaInhalt.ohneNote !== 'Noch nicht bewertet') befunde.push(`${wo}: ein Ort ohne Bewertung zeigt „${betaInhalt.note ?? betaInhalt.ohneNote}" statt „Noch nicht bewertet"`)
    if (betaInhalt.kacheln !== 0 || betaInhalt.achsenOhneWert !== 4) befunde.push(`${wo}: Beta zeigt ${betaInhalt.kacheln} Kacheln und ${betaInhalt.achsenOhneWert} Achsen ohne Wert (erwartet 0 und 4)`)

    // ===== 6. Gegen-Zusicherung inert ==================================================
    await oeffneSchnellansichtKarte(seite)
    await oeffneMarkerSchnellansicht(seite, 'Sn-Alpha')
    const inertGesehen = { inert: 0, aktiv: 0 }
    for (const zustandName of ['halb', 'voll', 'eingeklappt']) {
      await setzeSchnellansichtZustand(seite, zustandName)
      await pruefeMarkerInertGegenZusicherung(seite, `${wo} (inert, ${zustandName})`, befunde, inertGesehen)
    }
    // Karte verschieben (Treiberaktion): Alpha/Beta rutschen unter die Schnellansicht, Nord in den Ausschnitt
    await setzeSchnellansichtZustand(seite, 'halb')
    const freiZiehen = await findeFreienKartenpunkt(seite)
    if (!freiZiehen) {
      befunde.push(`${wo}: Vorbedingung nicht erreicht — kein freier Punkt zum Verschieben der Karte`)
    } else {
      await seite.mouse.move(freiZiehen.x, freiZiehen.y)
      await seite.mouse.down()
      await seite.mouse.move(freiZiehen.x, freiZiehen.y + 170, { steps: 10 })
      await seite.mouse.up()
      await seite.waitForTimeout(800)
      for (const zustandName of ['halb', 'voll', 'eingeklappt']) {
        await setzeSchnellansichtZustand(seite, zustandName)
        await pruefeMarkerInertGegenZusicherung(seite, `${wo} (inert, ${zustandName}, Karte verschoben)`, befunde, inertGesehen)
      }
    }
    if (inertGesehen.inert === 0 || inertGesehen.aktiv === 0) {
      befunde.push(`${wo}: Vorbedingung nicht erreicht — inert-Gegenprobe sah ${inertGesehen.inert} Marker unter und ${inertGesehen.aktiv} nicht unter der Schnellansicht (beide Klassen nötig)`)
    }

    // ===== 7. Bilder: Vollbild aus der Schnellansicht ==================================
    await oeffneSchnellansichtKarte(seite)
    await oeffneMarkerSchnellansicht(seite, 'Sn-Alpha')
    await setzeSchnellansichtZustand(seite, 'voll')
    const kachelIds = await seite.locator('.streifenkachel').evaluateAll((els) => els.map((el) => el.getAttribute('data-bild-id')))
    const kachelName = await seite.locator('.streifenkachel').first().getAttribute('aria-label')
    if (kachelIds.length !== 6 || kachelName !== 'Bild 1 von 6 vergrößern') befunde.push(`${wo}: Bildstreifen: ${kachelIds.length} Kacheln, erste heißt „${kachelName}"`)
    const laengeVorVorschau = await historyLaenge(seite)
    await seite.locator('.streifenkachel').first().focus({ preventScroll: true })
    await seite.keyboard.press('Enter')
    const vorschau = seite.getByRole('dialog', { name: 'Bildvorschau' })
    await vorschau.waitFor({ state: 'visible', timeout: 10000 })
    await seite.waitForTimeout(400)
    if ((await historyLaenge(seite)) !== laengeVorVorschau + 1) befunde.push(`${wo}: das Vollbild legt nicht genau einen Verlaufseintrag an`)
    if (ortParameter(seite) !== alphaId) befunde.push(`${wo}: das Vollbild verändert den ort-Parameter`)
    const zaehler = () => vorschau.locator('.bildvorschau__zaehler').innerText()
    if ((await zaehler()) !== '1 von 6') befunde.push(`${wo}: das Vollbild zeigt „${await zaehler()}" statt „1 von 6" (Blättern über die Bilder DIESES Ortes)`)
    await seite.keyboard.press('ArrowRight')
    await seite.waitForTimeout(200)
    if ((await zaehler()) !== '2 von 6') befunde.push(`${wo}: im Vollbild blättert die Pfeiltaste nicht (${await zaehler()})`)
    await seite.keyboard.press('Escape')
    await vorschau.waitFor({ state: 'detached', timeout: 10000 })
    await seite.waitForTimeout(400)
    if (!(await leseSchnellansicht(seite))) befunde.push(`${wo}: Esc im Vollbild schließt auch die Schnellansicht`)
    const nachEsc = await leseSchnellansicht(seite)
    if (nachEsc?.fokus?.kachelId !== kachelIds[1]) befunde.push(`${wo}: nach Esc im Vollbild liegt der Fokus nicht auf der Streifen-Kachel des zuletzt gezeigten Bildes (2)`)
    if (nachEsc) await pruefeHoehe('voll', 'Schließen des Vollbilds (Zustand bleibt)')
    if (ortParameter(seite) !== alphaId) befunde.push(`${wo}: nach Esc im Vollbild ist der ort-Parameter weg`)
    // goBack: erstes Zurück schließt NUR das Vollbild, zweites die Schnellansicht
    await seite.locator('.streifenkachel').nth(2).focus({ preventScroll: true })
    await seite.keyboard.press('Enter')
    await vorschau.waitFor({ state: 'visible', timeout: 10000 })
    await seite.waitForTimeout(300)
    await seite.goBack({ waitUntil: 'networkidle' })
    await vorschau.waitFor({ state: 'detached', timeout: 10000 }).catch(() => befunde.push(`${wo}: das erste Zurück schließt das Vollbild nicht`))
    await seite.waitForTimeout(400)
    if (!(await leseSchnellansicht(seite)) || ortParameter(seite) !== alphaId) befunde.push(`${wo}: das erste Zurück schließt mehr als das Vollbild`)
    await seite.goBack({ waitUntil: 'networkidle' })
    await seite.locator('.schnellansicht').waitFor({ state: 'detached', timeout: 10000 }).catch(() => befunde.push(`${wo}: das zweite Zurück schließt die Schnellansicht nicht`))

    // ===== 8. „Bearbeiten" und zurück =====================================================
    await oeffneSchnellansichtKarte(seite)
    await oeffneMarkerSchnellansicht(seite, 'Sn-Alpha')
    await setzeSchnellansichtZustand(seite, 'voll')
    const lageVorBearbeiten = await leseMarkerLage(seite)
    await seite.getByRole('button', { name: 'Bearbeiten', exact: true }).click()
    await seite.waitForURL(/\/orte\/[^/?]+/, { timeout: 10000 })
    await seite.waitForTimeout(500)
    if (!new URL(seite.url()).pathname.endsWith(`/orte/${alphaId}`)) befunde.push(`${wo}: „Bearbeiten" öffnet nicht das Ortsdetail dieses Ortes (${seite.url()})`)
    await seite.goBack({ waitUntil: 'networkidle' })
    await dialog('Sn-Alpha').waitFor({ state: 'visible', timeout: 10000 }).catch(() => befunde.push(`${wo}: Zurück aus dem Ortsdetail zeigt die Schnellansicht nicht`))
    await seite.waitForTimeout(900)
    await pruefeHoehe('halb', 'Zurück aus dem Ortsdetail (Zustand halb, nicht der vorherige voll)')
    const lageNachBearbeiten = await leseMarkerLage(seite)
    const abBearbeiten = maxAbweichung(lageVorBearbeiten, lageNachBearbeiten)
    if (!(abBearbeiten <= KARTENAUSSCHNITT_TOLERANZ_PX)) befunde.push(`${wo}: Zurück aus dem Ortsdetail — Ausschnitt nicht wiederhergestellt oder erneut verschoben (Abweichung ${abBearbeiten === Infinity ? 'unvergleichbar' : abBearbeiten.toFixed(1) + 'px'})`)
    // Neuladen mit gültiger ID öffnet auf halb (auch wenn vorher voll)
    await setzeSchnellansichtZustand(seite, 'voll')
    await seite.reload({ waitUntil: 'networkidle' })
    await dialog('Sn-Alpha').waitFor({ state: 'visible', timeout: 10000 }).catch(() => befunde.push(`${wo}: Neuladen mit gültiger Ort-ID öffnet die Schnellansicht nicht`))
    await seite.waitForTimeout(800)
    await pruefeHoehe('halb', 'Neuladen mit Ort-ID')

    // ===== 9. Unbekannte / nicht sichtbare ID ==============================================
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    const ohneId = await seite
      .locator('a.ortszeile', { hasText: 'Sn-Ohne' })
      .getAttribute('href')
      .then((href) => href?.split('/').pop() ?? null)
    for (const [label, id] of [['unbekannte', 'rauchtest-gibt-es-nicht'], ['nicht sichtbare (ohne Koordinaten)', ohneId]]) {
      if (!id) {
        befunde.push(`${wo}: Vorbedingung nicht erreicht — keine ID für die ${label} Ort-ID`)
        continue
      }
      await seite.goto(`${BASIS}/orte?ansicht=karte&ort=${id}`, { waitUntil: 'networkidle' })
      const entfernt = await seite.waitForFunction(() => !location.search.includes('ort='), null, { timeout: 5000 }).then(() => true, () => false)
      await seite.waitForTimeout(500)
      if (!entfernt) befunde.push(`${wo}: ${label} Ort-ID — der Parameter wird nicht entfernt`)
      if (await seite.locator('.schnellansicht').count()) befunde.push(`${wo}: ${label} Ort-ID öffnet eine Schnellansicht`)
      if (!new URL(seite.url()).search.includes('ansicht=karte')) befunde.push(`${wo}: ${label} Ort-ID — die Kartenansicht ging verloren (${seite.url()})`)
      if ((await seite.locator('.karte-marker').count()) !== 3) befunde.push(`${wo}: ${label} Ort-ID — die Karte zeigt keine 3 Marker`)
    }

    // ===== 10. Filter, der den Ort ausblendet, schließt das Sheet =========================
    await oeffneSchnellansichtKarte(seite)
    await oeffneMarkerSchnellansicht(seite, 'Sn-Alpha')
    await seite.locator('.tag-filterleiste__pill', { hasText: /^\s*sb\s*$/ }).click()
    await seite.locator('.schnellansicht').waitFor({ state: 'detached', timeout: 10000 }).catch(() => befunde.push(`${wo}: ein Filter, der den Ort ausblendet, schließt die Schnellansicht nicht`))
    await seite.waitForTimeout(400)
    if (ortParameter(seite) !== null) befunde.push(`${wo}: nach dem Filter steht noch ein ort-Parameter in der Adresse`)

    // ===== 11. Fenster-Scroll bleibt ======================================================
    await oeffneSchnellansichtKarte(seite)
    await seite.evaluate(() => {
      // Treiberaktion: die Seite scrollbar machen und einen Stand anfahren — gemessen wird danach nur der Stand.
      const abstandhalter = document.createElement('div')
      abstandhalter.style.height = '900px'
      abstandhalter.setAttribute('aria-hidden', 'true')
      document.body.appendChild(abstandhalter)
      window.scrollTo(0, 120)
    })
    await seite.waitForTimeout(300)
    const scrollStart = await seite.evaluate(() => window.scrollY)
    if (!(scrollStart >= 100)) {
      befunde.push(`${wo}: Vorbedingung nicht erreicht — Scroll-Stand ${scrollStart} statt ~120`)
    } else {
      const scrollNach = async (was) => {
        await seite.waitForTimeout(700)
        const jetzt = await seite.evaluate(() => window.scrollY)
        if (Math.abs(jetzt - scrollStart) > 1) befunde.push(`${wo}: ${was} verschiebt den Fenster-Scroll (${scrollStart} -> ${jetzt})`)
      }
      await seite.evaluate(() => document.querySelector('.karte-marker[aria-label^="Sn-Alpha"]').focus({ preventScroll: true }))
      await seite.keyboard.press('Enter')
      await dialog('Sn-Alpha').waitFor({ state: 'visible', timeout: 10000 })
      await scrollNach('Öffnen')
      await setzeSchnellansichtZustand(seite, 'eingeklappt')
      await seite.evaluate(() => document.querySelector('.karte-marker[aria-label^="Sn-Beta"]').focus({ preventScroll: true }))
      await seite.keyboard.press('Enter')
      await dialog('Sn-Beta').waitFor({ state: 'visible', timeout: 10000 })
      await scrollNach('Wechsel')
      await seite.keyboard.press('Escape')
      await seite.locator('.schnellansicht').waitFor({ state: 'detached', timeout: 10000 })
      await scrollNach('Schließen')
    }

    console.log(`  ${wo} — geprüft (Öffnen, Zustände per Geste/Griff, Wechsel, Schließen, inert, Bilder, Bearbeiten, Adresse, Scroll), Bildschirmfotos in ${FOTOS}/`)
  } catch (fehler) {
    befunde.push(`${wo}: unerwarteter Abbruch — ${fehler.message.split('\n')[0]}${process.env.SMOKE_DEBUG ? ' @ ' + String(fehler.stack).split('\n').slice(1, 3).join(' | ') : ''}`)
    if (process.env.SMOKE_DEBUG) await seite.screenshot({ path: `${FOTOS}/${breite.name}-schnellansicht-abbruch.png` }).catch(() => {})
  } finally {
    await seite.close()
  }
}


async function main() {
  const playwright = await ladePlaywright()
  if (!playwright) {
    console.log('Playwright nicht gefunden — Rauchtest übersprungen.')
    console.log('Installation: npm i -D playwright && npx playwright install chromium')
    console.log('Die Zusicherungen bleiben damit UNGEPRÜFT (VERIFICATION.md, ADR-0023) —')
    console.log('inklusive der Telefonbreiten, des Überlauf-Checks und der vier')
    console.log('Ortssuche-Hinweiszustände.')
    return
  }

  await rm(FOTOS, { recursive: true, force: true })
  await mkdir(FOTOS, { recursive: true })

  const server = starteVorschau()
  let browser
  const befunde = []
  // Gemeldet, aber ohne Einfluss auf `process.exitCode` (ADR-0031 Punkt 5/6,
  // benannte Ausnahme zu ADR-0023 Punkt 2/7) — aktuell nur Fall (b2), s. u.
  const gemeldeteGrenzen = []

  try {
    if (!(await warteAufServer())) {
      throw new Error(`Vorschau-Server auf ${BASIS} nicht erreichbar — läuft "npm run build"?`)
    }

    browser = await playwright.chromium.launch()

    for (const breite of BREITEN) {
      const seite = await browser.newPage({ viewport: { width: breite.width, height: breite.height } })

      // Zusicherung 2: keine unbehandelten Laufzeitfehler. Ausgenommen sind
      // Konsolenmeldungen zum abgefangenen Photon-Endpunkt selbst: Die
      // Zustände „fehler"/„laedt" (`ORTSSUCHE_ZUSTAENDE`) erzeugen bewusst
      // einen 5xx/abgebrochenen Request, und Chromium protokolliert jeden
      // gescheiterten Request unabhängig vom App-Code als
      // "Failed to load resource" — das ist der Rauchtest, der sich selbst
      // meldet, kein App-Fehler. `sucheOrt()` fängt das bereits ab
      // (Ergebnis statt Ausnahme, ADR-0020 Punkt 4).
      seite.on('pageerror', (fehler) => befunde.push(`${breite.name}: Laufzeitfehler: ${fehler.message}`))
      seite.on('console', (nachricht) => {
        if (nachricht.type() !== 'error') return
        if (nachricht.location()?.url?.includes('photon.komoot.io')) return
        befunde.push(`${breite.name}: Konsole: ${nachricht.text().slice(0, 160)}`)
      })

      await pruefeAnsichtenBeiBreite(seite, breite, befunde)
      await pruefeOrtssucheZustaende(seite, breite, befunde)

      await seite.close()
    }

    // Zusicherung ab -001 (ADR-0023 Punkt 2, PO-2026-09-12-001): Ein
    // angelegter Ort übersteht ein Neuladen. Das ist der eine Beleg, den
    // Vitest (fake-indexeddb) grundsätzlich nicht liefern kann. Unabhängig
    // von der Breite — läuft einmal, auf einer frischen Seite.
    const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await seite.getByRole('button', { name: /hinzuf|anlegen/i }).first().click()
    await seite.waitForTimeout(300)
    await seite.locator('input[type="text"]:visible').first().fill('Rauchtest-Ueberlebt-Neuladen')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(700)
    if (await seite.getByText('Speichern ist fehlgeschlagen').isVisible().catch(() => false)) {
      befunde.push('ort-ueberlebt-neuladen: „Speichern ist fehlgeschlagen" bereits direkt nach dem Anlegen sichtbar')
    }
    await seite.reload({ waitUntil: 'networkidle' })
    await seite.waitForTimeout(400)
    const textNachNeuladen = await seite.evaluate(() => document.body.innerText)
    if (!textNachNeuladen.includes('Rauchtest-Ueberlebt-Neuladen')) {
      befunde.push('ort-ueberlebt-neuladen: der angelegte Ort ist nach dem Neuladen verschwunden')
    }
    await seite.screenshot({ path: `${FOTOS}/ort-ueberlebt-neuladen.png` })
    console.log(`  ort-ueberlebt-neuladen — geprüft, Bildschirmfoto in ${FOTOS}/ort-ueberlebt-neuladen.png`)
    await seite.close()

    // Zusicherung ab PO-2026-09-13-001 (ADR-0027 Punkt 5/6), s.o.
    // Unabhängig von der Breite — läuft einmal, auf einer frischen Seite.
    const reglerSeite = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await pruefeReglerCommitWaehrendZiehens(reglerSeite, befunde)
    await reglerSeite.close()

    // Zusicherungen ab PO-2026-09-26-001 (ADR-0030), s.o. — nur bei 1280px
    // (Fall c braucht die gleichzeitig sichtbare Listen-Spalte ab `lg`).
    await pruefeTagUeberlebtNeuladen(browser, befunde, gemeldeteGrenzen)

    // Nachweis ab PO-2026-09-26-002 (Kriterium 1, s.o.) — nur bei 1280px,
    // läuft einmal auf einer frischen Seite.
    const tagfilterSeite = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await pruefeTagFilterLeerBeiAusgewaehltemOrt(tagfilterSeite, befunde)
    await tagfilterSeite.close()

    // Zusicherung ab PO-2026-09-26-003 (ADR-0033), s.o. — für JEDE Breite aus
    // BREITEN mit width >= 1024 (aktuell nur 1280px), auf einer frischen
    // Seite, eigene Füll-Orte statt Vermischung mit den übrigen Läufen.
    for (const breite of BREITEN.filter((b) => b.width >= 1024) /* --breakpoint-lg */) {
      const versatzSeite = await browser.newPage({ viewport: { width: breite.width, height: breite.height } })
      await pruefeScrollVersatzUndFokusBeiOrtswechsel(versatzSeite, breite, befunde)
      await versatzSeite.close()
    }

    // Zusicherung ADR-0011, Nachtrag zu Punkt 6 (2026-09-28,
    // PO-2026-09-27-003): jede Spalte ist ab lg ein abgeschlossener
    // Scroll-Bereich — für JEDE Breite aus BREITEN mit width >= 1024, eigener
    // Bestand statt Vermischung mit den übrigen Läufen (s. Funktionskommentar).
    for (const breite of BREITEN.filter((b) => b.width >= 1024) /* --breakpoint-lg */) {
      const spaltenSeite = await browser.newPage({ viewport: { width: breite.width, height: breite.height } })
      await pruefeSpaltenAbgeschlossenerScrollBereich(spaltenSeite, breite, befunde)
      await spaltenSeite.close()
    }

    // Zusicherungen ab PO-2026-11-24-006 (ADR-0036), s. `pruefeBildvorschau` —
    // für JEDE Breite aus BREITEN, jeweils auf frischer Seite.
    for (const breite of BREITEN) {
      await pruefeBildvorschau(browser, breite, befunde)
    }

    // Zusicherungen ab PO-2026-11-24-003 (ADR-0038), s. Funktionskommentar —
    // für JEDE Breite aus BREITEN, jeweils auf frischer Seite mit eigenem Bestand.
    for (const breite of BREITEN) {
      await pruefeKartenausschnittBleibtErhalten(browser, breite, befunde)
    }

    // Zusicherungen ab PO-2026-11-24-004, s. `pruefeKartenMarker` — für JEDE
    // Breite aus BREITEN, jeweils auf frischer Seite mit eigenem Bestand.
    for (const breite of BREITEN) {
      await pruefeKartenMarker(browser, breite, befunde)
    }

    // Gegenprobe zu den benannten Ausnahmen aus PO-2026-11-24-005 (synthetisches DOM).
    await pruefeAusnahmenGegenprobe(browser, befunde)

    // Zusicherungen ab PO-2026-11-24-005 (ADR-0039), s. `pruefeSchnellansicht` — für
    // JEDE Breite aus BREITEN, jeweils auf frischer Seite mit eigenem Bestand.
    for (const breite of BREITEN) {
      await pruefeSchnellansicht(browser, breite, befunde)
    }
    if (SN_BEOBACHTUNG.hochgesetzt === 0) {
      befunde.push('schnellansicht: Vorbedingung nicht erreicht — bei keiner Breite ragte die Karte unter die feste Tab-Leiste, „über der Tab-Leiste" ist so nicht belegt')
    }

    // Zusicherung ab PO-2026-11-24-001 (ADR-0037), s. Funktionskommentar —
    // nur bei 1280px, eigener Bestand auf frischer Seite.
    await pruefeGewichtungWirktUeberallUndUeberstehtNeuladen(browser, befunde)

    // Zusicherungen ab PO-2026-11-24-002 (ADR-0037), s. Funktionskommentare —
    // nur bei 1280px, je auf frischer Seite mit eigenem Bestand.
    await pruefeEigeneGewichteUndEndgruppen(browser, befunde)
    await pruefeGewichtsreglerCommitWaehrendZiehens(browser, befunde)

    // Zusicherung ab PO-2026-09-27-001 (design-conventions.md „Mehrzeilige
    // Textfelder wachsen mit dem Inhalt"), Weg (2) — nur bei 1280px (ab lg
    // gleichzeitig sichtbare Listen-Spalte, s. Funktionskommentar). Weg (1)
    // (Mount) läuft bereits über `ANSICHTEN`/`pruefeAnsichtenBeiBreite` bei
    // allen drei Breiten mit.
    const mehrzeiligWechselSeite = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await pruefeMehrzeiligesFeldBeiOrtswechsel(mehrzeiligWechselSeite, befunde)
    await mehrzeiligWechselSeite.close()

    // Weg (3): Breitenwechsel 1280→390 ohne Texteingabe.
    const mehrzeiligBreiteSeite = await browser.newPage()
    await pruefeMehrzeiligesFeldBeiBreitenwechsel(mehrzeiligBreiteSeite, befunde)
    await mehrzeiligBreiteSeite.close()

    // Zusicherungen ab PO-2026-09-27-004 (ADR-0035), s.o. — nur bei 1280px
    // (Fall c/d brauchen die gleichzeitig sichtbare Listen-Spalte ab `lg`).
    await pruefeBewertungsachseUeberlebtNeuladen(browser, befunde, gemeldeteGrenzen)

    // Zusicherungen ab PO-2026-09-27-002 (Anfangsnotiz), s.o. — nur bei
    // 1280px (dieselbe Begründung: die A→B-Fälle brauchen die ab `lg`
    // gleichzeitig sichtbare Listen-Spalte).
    await pruefeAnfangsnotizUeberlebtNeuladen(browser, befunde, gemeldeteGrenzen)
  } finally {
    await browser?.close()
    beendeVorschau(server)
  }

  // Immer ausgegeben, unabhängig vom Ausgang unten (ADR-0031 Punkt 6, analog
  // zum bestehenden „auf WebKit ungeprüft"-Muster ADR-0029): eine benannte,
  // nicht zusicherbare Grenze bleibt sichtbar, auch wenn alles andere grün
  // ist — und verschwindet nicht in einem roten Lauf zwischen echten Befunden.
  if (gemeldeteGrenzen.length > 0) {
    console.log('\nGemeldet, ohne Einfluss auf den Exit-Code (ADR-0031):')
    for (const grenze of gemeldeteGrenzen) console.log(`  - ${grenze}`)
  }

  if (befunde.length > 0) {
    console.error(`\nRauchtest fehlgeschlagen — ${befunde.length} Befund(e):`)
    for (const befund of befunde) console.error(`  - ${befund}`)
    process.exitCode = 1
    return
  }
  console.log('\nRauchtest erfolgreich:')
  console.log(`  Breiten: ${BREITEN.map((b) => `${b.name} (${b.width}px)`).join(', ')}`)
  console.log(`  Ansichten: ${ANSICHTEN.map((a) => a.name).join(', ')}`)
  console.log(`  Ortssuche-Zustände: ${ORTSSUCHE_ZUSTAENDE.map((z) => z.name).join(', ')}`)
  console.log('Alle Ansichten geöffnet, keine Laufzeitfehler, CSS-Ressourcen aufgelöst,')
  console.log('kein Bedienelement verdeckt, nichts ragt aus dem Bildschirm, ein angelegter')
  console.log('Ort übersteht ein Neuladen. Ein Tag committet auch ohne Enter (Feld verlassen,')
  console.log('pagehide am weiterlebenden Dokument, Ortswechsel ab lg über den Browserverlauf)')
  console.log('und bleibt filterbar (PO-2026-09-26-001, ADR-0030). Das Verhalten beim ECHTEN')
  console.log('Entladen mit Fokus im Feld ist eine benannte, nicht zusicherbare Grenze')
  console.log('(ADR-0031) — siehe „Gemeldet" oben.')
  console.log('Master-Detail zeigt ab lg auf jeder betroffenen Ansicht beide Spalten')
  console.log('gleichzeitig, überlappungsfrei und randbündig, ohne Fenster-Scroll —')
  console.log('unterhalb lg weiterhin nur die dem Zustand entsprechende Spalte')
  console.log('(PO-2026-09-26-002, ADR-0032).')
  console.log('Ab lg beginnt die Detail-Spalte bei A→B (Klick oder Browserverlauf) bei')
  console.log('Versatz 0 mit Fokus auf „Detailansicht schließen", ein erneuter Klick auf die')
  console.log('bereits ausgewählte Zeile setzt nicht zurück, und die Listen-Spalte behält')
  console.log('beim Klick-Wechsel ihren eigenen Versatz (PO-2026-09-26-003, ADR-0033).')
  console.log('Jedes sichtbare <textarea> zeigt seinen Inhalt vollständig, ohne internes')
  console.log('Scrollen und ohne manuellen Anfasser (resize: none) — beim Mount, nach einem')
  console.log('Ortswechsel ab lg PER KLICK und nach einer reinen Breitenänderung ohne')
  console.log('Texteingabe (PO-2026-09-27-001).')
  console.log('Kommentar und Zahl einer Bewertungsachse committen auch ohne Enter/Klick')
  console.log('(Feld verlassen, Route verlassen inkl. Schließen, Hintergrund, pagehide am')
  console.log('weiterlebenden Dokument) und überstehen ein Neuladen; ein geleertes Zahlenfeld')
  console.log('kommt als "nicht bewertet" zurück, nicht als 0. Mehrere gleichzeitig offene')
  console.log('Entwürfe (Tag + Kommentar + Zahl verschiedener Achsen) landen in EINEM')
  console.log('Schreibvorgang (PO-2026-09-27-004, ADR-0035). Das Verhalten beim ECHTEN')
  console.log('Entladen mit Fokus im Kommentarfeld ist dieselbe benannte, nicht zusicherbare')
  console.log('Grenze wie bei Tags (ADR-0031) — siehe „Gemeldet" oben.')
  console.log('Die Anfangsnotiz committet ohne Enter/Klick auf denselben vier Auslösern')
  console.log('(Feld verlassen, beide Routenwechsel, Hintergrund, pagehide am weiterlebenden')
  console.log('Dokument) und übersteht ein Neuladen; ab lg landet unbestätigter Text bei einem')
  console.log('Ortswechsel ausschließlich über den Browserverlauf bei A, nicht bei B. Eine')
  console.log('100-Zeichen-Notiz (auch als leerzeichenloses Wort) bleibt im Feld UND in der')
  console.log('Ortsliste bei jeder Breite vollständig sichtbar (PO-2026-09-27-002). Das')
  console.log('Verhalten beim ECHTEN Entladen mit Fokus im Anfangsnotiz-Feld ist dieselbe')
  console.log('benannte, nicht zusicherbare Grenze wie bei Tags/Bewertungsachse (ADR-0031) —')
  console.log('siehe „Gemeldet" oben.')
  console.log('Die ausgewählte Zeile behält ihre Auswahlkante im berechneten box-shadow in')
  console.log('jeder Zonen-/Hervorhebungs-Kombination, ihre Accessible Name enthält den')
  console.log('erwarteten Screenreader-Text (PO-2026-09-27-003, ADR-0034). Kein sichtbarer')
  console.log('Button-Text bricht innerhalb seines Buttons um, auf jeder Ansicht/Breite —')
  console.log('die Kopfzeile mit Zonen-Legende zeigt dafür ab 360px Containerbreite wieder')
  console.log('eine Zeile, darunter zwei (Design-Antwort-Roundtrip PO-2026-09-27-003).')
  // ADR-0029 Punkt 4: ein ERFOLGREICHER Lauf weist die Grenze selbst aus,
  // nicht nur der Fehlerfall (Playwright-Skip oben) und nicht nur der Kopf
  // dieser Datei. Als Eigenschaft formuliert, nicht als Funktions-/
  // Klassenliste (ADR-0023 Punkt 7): Der Rauchtest fährt genau eine Engine
  // (Chromium, ADR-0023 Punkt 5) — Zusicherungen über engine-abhängige
  // Darstellung (Pseudo-Element-Stile, `appearance`, native
  // Bedienelement-Darstellung) sind auf WebKit ungeprüft.
  console.log('Die Bildvorschau (Vollbild) zeigt jedes Bild vollständig, blättert per Pfeiltaste,')
  console.log('Pfeil-Button und Wischgeste ohne Umbruch und ohne Verlaufseinträge, schließt per')
  console.log('Esc/„×" (Fokus auf der Kachel des zuletzt gezeigten Bildes, eigener Eintrag')
  console.log('entfernt) und per System-Zurück (Adresse bleibt das Ortsdetail); Vorwärts und')
  console.log('Neuladen öffnen nie (PO-2026-11-24-006, ADR-0036).')
  console.log('Die Gewichtung der Gesamtnote wirkt sofort und nach dem Neuladen auf Liste, Detail,')
  console.log('Sortierung und Zonenfarbe (überall derselbe Wert, nie „8,0" und mehr ohne Zone,')
  console.log('Hinweiszeile nur bei Abweichung von Ausgewogen, alle drei Einstiege öffnen dasselbe')
  console.log('Sheet) (PO-2026-11-24-001, ADR-0037).')
  console.log('Eigene Gewichte (0-10) wirken sofort und überstehen Neuladen und den Wechsel auf ein')
  console.log('festes Szenario; Gewicht 0 nimmt die Achse aus der Rechnung, ein Ort nur mit solchen')
  console.log('Achsen steht ohne Zahl und Zone in einer eigenen Endgruppe nach „ohne Bewertung";')
  console.log('7,95 (159/20) zeigt „8,0" MIT Zone; die letzte Achse über 0 bleibt auf 1 mit')
  console.log('Statuszeile; ein Gewichtsregler wirkt schon während des Ziehens (PO-2026-11-24-002).')
  console.log('Zonen als Plakette (PO-2026-11-24-007): die Zahl steht in einer Zone auf einer Fläche in')
  console.log('Zonenfarbe (Kontrast >= 4,5:1), die Zeilenhöhe hängt nicht an der Zone, benachbarte')
  console.log('Zonen werden streng dunkler, die Balkenfüllung folgt bei einer Einzelachse der Zone')
  console.log('(nur in der Ortsliste), die Hervorhebung trägt einen 1px-Hairline plus Schattenlayer,')
  console.log('Zeilenabstand >= 8px. Der Legenden-Auslöser zeigt sichtbaren Text in beiden')
  console.log('Listen-Kopfzeilen bei jeder Breite, ab lg bleibt die Kopfzeile einzeilig.')
  console.log('Der Kartenausschnitt (Mitte, Zoom) bleibt über Detail (Schließen, goBack), Liste und')
  console.log('/daten erhalten, nach einem Neuladen gilt wieder der eingepasste Startausschnitt;')
  console.log('liegt im gemerkten Ausschnitt kein sichtbarer Marker, und bei einer Filteränderung in')
  console.log('der Kartenansicht, wird eingepasst (PO-2026-11-24-003, ADR-0038).')
  console.log('Die Schnellansicht (Quick-Look auf der Karte) öffnet per Marker nicht modal im Zustand halb')
  console.log('(ein Verlaufseintrag, Karte bedienbar, Marker über Größe und Ring erkennbar, Karte schiebt')
  console.log('den Marker über die Oberkante), erreicht jeden Zustand per Ziehgeste und ohne Geste, wechselt')
  console.log('per replace, schließt per „×"/Esc/Zurück (Fokus auf dem Marker), hält Marker darunter inert')
  console.log('(und nur diese), öffnet das Vollbild für Bilder, kehrt aus „Bearbeiten" in „halb" zurück und')
  console.log('verschiebt den Fenster-Scroll nie (PO-2026-11-24-005, ADR-0039).')
  console.log('Zusicherungen über engine-abhängige Darstellung sind auf WebKit ungeprüft')
  console.log('(ADR-0029) — geprüft ist ausschließlich Chromium.')
}

await main()

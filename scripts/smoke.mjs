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
      return await import(kandidat.startsWith('/') ? kandidat : require.resolve(kandidat))
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

  const verdeckt = []
  const auswahl = 'button, input, select, textarea, a[href], [role="button"], [tabindex]:not([tabindex="-1"])'
  for (const el of document.querySelectorAll(auswahl)) {
    // Absichtlich versteckte Elemente sind kein Befund: der per Button
    // ausgelöste Datei-Eingang etwa liegt als 1x1-Fläche mit `clip` und
    // `aria-hidden` irgendwo im Baum. Er SOLL verdeckt sein.
    if (el.getAttribute('tabindex') === '-1') continue
    if (el.closest('[aria-hidden="true"]')) continue
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

  for (const el of document.querySelectorAll('body *')) {
    if (el.getAttribute('tabindex') === '-1') continue
    if (el.closest('[aria-hidden="true"]')) continue
    const stil = getComputedStyle(el)
    if (stil.visibility === 'hidden' || stil.opacity === '0' || stil.display === 'none') continue
    const kasten = el.getBoundingClientRect()
    if (kasten.width < 4 || kasten.height < 4) continue
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
      const bezeichner = attributWert(inputKnoten, 'id') ? '#' + attributWert(inputKnoten, 'id') : 'input[type="range"]'

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

/** Öffnet jede Ansicht bei einer Breite und prüft die Zusicherungen 1-5
 *  (Zusicherung 2 — Laufzeitfehler — hängt an Listenern auf `seite`, die
 *  der Aufrufer vor dem Aufruf registriert). */
async function pruefeAnsichtenBeiBreite(seite, breite, befunde) {
  for (const ansicht of ANSICHTEN) {
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
    // PO-2026-09-26-002 (ADR-0032 Punkt 6): läuft auf JEDER Ansicht, deren
    // Wurzel `.master-detail` im DOM ist — benannte Bedingung, keine Liste
    // von Ansichtsnamen.
    if ((await seite.locator('.master-detail').count()) > 0) {
      await pruefeMasterDetailSpalten(seite, breite, `${breite.name}/${ansicht.name}`, befunde)
    }
    // PO-2026-09-13-002: nur auf der Ansicht, die Regler zeigt — kein neuer
    // Sonderpfad, läuft über dieselbe BREITEN-Liste wie alles andere hier.
    // Läuft über CDP statt `seite.evaluate` (s. Kommentar an der Funktion).
    if (ansicht.name === 'ortsdetail') {
      befunde.push(...(await pruefeReglerGreifbarkeit(seite, `${breite.name}/${ansicht.name}:`)))
      // PO-2026-09-13-003: ebenfalls kein neuer Sonderpfad, läuft über
      // dieselbe bereits geöffnete Ortsdetail-Seite und dieselbe BREITEN-Liste.
      await pruefeAbschlussKombination(seite, breite, befunde)
    }

    await seite.screenshot({ path: `${FOTOS}/${breite.name}-${ansicht.name}.png` })
    console.log(`  ${breite.name}/${ansicht.name} — geöffnet, Bildschirmfoto in ${FOTOS}/${breite.name}-${ansicht.name}.png`)
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
  // ADR-0029 Punkt 4: ein ERFOLGREICHER Lauf weist die Grenze selbst aus,
  // nicht nur der Fehlerfall (Playwright-Skip oben) und nicht nur der Kopf
  // dieser Datei. Als Eigenschaft formuliert, nicht als Funktions-/
  // Klassenliste (ADR-0023 Punkt 7): Der Rauchtest fährt genau eine Engine
  // (Chromium, ADR-0023 Punkt 5) — Zusicherungen über engine-abhängige
  // Darstellung (Pseudo-Element-Stile, `appearance`, native
  // Bedienelement-Darstellung) sind auf WebKit ungeprüft.
  console.log('Zusicherungen über engine-abhängige Darstellung sind auf WebKit ungeprüft')
  console.log('(ADR-0029) — geprüft ist ausschließlich Chromium.')
}

await main()

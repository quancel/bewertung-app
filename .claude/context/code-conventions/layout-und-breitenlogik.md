# Layout und Breitenlogik (ADR-0010/0011/0012)

> Themendatei von `.claude/context/code-conventions.md` (Abschnitt „Layout und
> Breitenlogik"). Single-Writer: `architekt`. Maßgeblich ist dieser Wortlaut
> samt Ausnahmen, nicht die Kurzzeile im Register.

## Rahmen und Abfragen

- **Der App-Rahmen ist eine Komponente, keine Route.** `App.vue` verzweigt
  vor dem `<router-view>`: Sperrzustand aus `persistence/` → vollflächige
  Meldung ohne Rahmen; sonst Rahmen (Skip-Link, Bereichsnavigation,
  `<main id="main-content">`). Kein `route.meta`-Flag, kein `<keep-alive>`.
- **Breitenabhängige Layouts fragen ihren Container ab, nicht das Fenster**:
  eigener Block mit `container-type: inline-size`, `@container (min-width: …)`.
  Kein `container-name` als Contract zwischen Contexts. `@media` bleibt für
  den Rahmen selbst und Nicht-Breiten-Abfragen (`prefers-reduced-motion`).
  **`container-type` sitzt auf einem Vorfahren** der Elemente, deren Regeln
  im `@container`-Block stehen, nie auf dem umgeschalteten Element selbst:
  Die Abfrage sucht den nächsten Container unter den **Vorfahren**, auf sich
  selbst greift sie nie, und das ohne Fehlermeldung. Zuerst einen vorhandenen
  Vorfahren nehmen, erst dann einen Wrapper einziehen. Vorbild:
  `.ortebereich__liste-spalte` ist Container für `.ortebereich__kopf`
  (`Ortebereich.vue`, ab PO-2026-09-27-003). Nicht so: `container-type`
  direkt auf `.ortebereich__kopf`, das blieb wirkungslos.
- **Welche der beiden Abfragen, entscheidet die Frage, nicht der Ort im Baum**
  (ADR-0028): „welches Navigationsmuster ist aktiv" (ein-/zweispaltig,
  Bottom-Tabs/Nav-Rail, Chrome das an „ist die Liste daneben sichtbar" hängt)
  → `@media`. „wie viel Platz hat dieser Inhalt" (Raster, Kurz-/Langform,
  Zeilenumbruch) → `@container`. **Bedienelemente, die einander ersetzen**
  („Zurück" ↔ „×", „Fertig"), stehen in **einem** `@media`-Block je Datei mit
  wörtlich derselben Bedingung — sonst gibt es ein Breitenfenster mit beiden
  oder keinem. „Ab `lg` nicht vorhanden" ist `display: none` (nimmt Bild,
  Tabfolge und Accessibility-Baum in einem), nie `visibility`/`opacity`.
- **Breitenabhängige Sichtbarkeit wird auf ihren Bereich begrenzt, nicht
  überschrieben** (ADR-0032). Eine Ein- oder Ausblendung, die nur unterhalb
  `lg` gelten soll, steht in `@media not all and (min-width: 1024px)
  /* --breakpoint-lg */`. Sie steht also weder ohne Bedingung noch in einem
  Block, den eine `lg`-Regel wieder aufheben muss. Die wörtliche Negation in
  derselben Datei gilt als „dieselbe Bedingung" und als „eine Stelle". Nie
  `max-width: 1023px` (Lücke an der Grenze), nie `(width < 1024px)` (WebKit
  < 16.4). Zustandsabhängige Regeln im selben Bereich sind **disjunkt**: Im
  selben Zustand trifft höchstens eine auf ein Element zu. Kein
  `!important`, kein Selektor nur für Spezifität, kein Verlass auf die
  Reihenfolge. Vorbild: `shared/ui/MasterDetail.vue` (ab PO-2026-09-26-002).
  Nicht gemeint sind Layoutwerte (Abstände, Richtung), die mobile-first
  überschrieben werden.
- **Custom Properties funktionieren nicht in `@media`/`@container`** — dort
  steht die Zahl wörtlich, mit Tokennamen im Kommentar. `var(--breakpoint-lg)`
  in einer Bedingung trifft stillschweigend nie zu.
- **Layoutmaße sind Tokens** (Container-Höchstbreite, Nav-Rail, Listen-Spalte,
  Höhe der Bottom-Tab-Leiste) — kein freier Pixelwert im Feature-Stylesheet.

## Bausteine umschalten

- **Schaltet ein Elternteil die Sichtbarkeit eines gemeinsam genutzten
  Bausteins um, bekommt der Baustein einen eigenen Wrapper** — das
  `display: none` liegt auf dem Wrapper, nie auf einer Klasse am
  Wurzelelement des Kind-Bausteins. Grund: Vue hängt an das eigenständige
  Root-Element eines Kindes **beide** scoped-CSS-Attribute (seins und das des
  Elternteils); Elternregel und die eigene Regel des Bausteins
  (`.primaer-button { display: inline-flex }`) haben dann dieselbe
  Spezifität, und wer gewinnt, hängt an der Bündelungs-/Importreihenfolge
  statt an der Quelle. Der Wrapper umgeht das strukturell. Vorbilder:
  `shared/ui/MasterDetail.vue`, `.ortsdetail__fertig` in `Ortebereich.vue`.
  Layoutangaben für den Baustein selbst (z. B. `width: 100%`) bleiben an
  seiner eigenen Klasse — die kollidieren nicht.
- **Ein Baustein, der in zwei verschieden breiten Containern steht, wird
  selbst zum Container** und schaltet zwischen Kurz- und Langform um, statt
  die Elternbreite anzunehmen. Vorbild: `orte/components/Werkzeugleiste.vue`.

## Scrollen und Schrumpfen

- **Ab `lg` scrollt die Listen-Spalte selbst, nicht das Fenster** (ADR-0011
  P6). Was kleben soll, klebt **innerhalb** des scrollenden Spaltenelements.
- **Ein Scroll-Container in einem Grid-/Flex-Elternteil mit fester Höhe ist
  ein abgeschlossener Scroll-Bereich** (ADR-0011 Nachtrag P6). Das gilt für
  jeden Layout-Container, nicht nur in `shared/ui/`. Drei Teile gehören
  zusammen:
  - In der Scroll-Achse ist die **Spur** begrenzt:
    `grid-template-rows: minmax(0, …)`, nie eine implizite `auto`-Zeile und
    nie ein nacktes `1fr`, das `minmax(auto, 1fr)` bedeutet.
  - Das **Item** trägt `min-width: 0` **und** `min-height: 0` als Paar. Das
    gilt auch für jedes Grid-/Flex-Item zwischen der festen Höhe und dem
    Scroll-Container.
  - Neben `overflow-y: auto|scroll` steht `position: relative`, ohne
    `z-index`. Sonst entkommt ein absolut positionierter Nachfahre ohne
    eigenen positionierten Vorfahren (typisch: Screenreader-Text mit
    `clip`-Muster) dem Abschneiden und verlängert das Dokument.
  Vorbild ist `shared/ui/MasterDetail.vue` (ab PO-2026-09-27-003). Die drei
  Teile sind **nicht** überflüssig, auch wenn im Anlassfall nur einer trug
  (Befund: `docs/pakete/PO-2026-09-27-003.md`): Jeder schließt eine eigene
  Art ab, auf die eine Spalte das Dokument verlängern kann. Nicht als
  „wirkungslos" entfernen.
- **Visuell versteckter Text nutzt das `clip`-Muster lokal im scoped Style**
  (`position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0`),
  wörtlich und vollständig. Klassenname `<block>__sr-<zweck>`, Vorbild
  `.ortszeile__sr-hervorhebung`. Es gibt **kein globales Utility**, weil ein
  solches den Anlassfall nicht verhindert hätte: Das Risiko liegt nicht in
  der Klasse, sondern im **Containing Block**. Abgesichert wird deshalb der
  Scroll-Container (Regel oben), nicht jede Kopie. Wer das Muster in einen
  scrollenden Bereich setzt, prüft, ob der Scroll-Container oder ein
  Vorfahre dazwischen positioniert ist.
- **Den Versatz eines Scroll-Containers setzt der Baustein zurück, dem der
  Container gehört** (ADR-0033). Bei `MasterDetail.vue` geschieht das über
  `defineExpose({ setzeDetailVersatzZurueck })`: synchron, nur
  `scrollTop = 0` am eigenen Spalten-Wrapper, keine Breitenprüfung. Die
  Bereichsansicht ruft die Methode über eine typisierte Template-Ref auf. Sie
  greift **nie** über `querySelector`/`closest`/`parentElement` oder eine
  Suche nach dem „nächsten scrollbaren Vorfahren" in das DOM des Bausteins.
  Eigene Elemente im Slot (z. B. Listenzeilen) darf sie per
  `scrollIntoView({ block: 'nearest' })` sichtbar machen.
- **Alles, was in Grid/Flex schrumpfen soll, bekommt `min-width: 0`** — nicht
  nur Layout-Spalten, sondern **jedes Flex-Item mit eigener Inhaltsbreite**,
  besonders `input` (Standard-`size`, Spinner bei `type="number"`). Sonst
  misst die Container-Abfrage eine Breite, die es nie gibt, oder das Element
  läuft aus dem Bildschirm. **Vertikal scrollen ist normal, horizontal nie** —
  aus dem Bildschirm ragen darf nichts.

## Selbst gezeichnete Bedienelemente

- **Ein selbst gezeichnetes Bedienelement wächst auf seine Trefferfläche über
  einen transparenten `border`, nicht über `padding`** (Vorbild:
  `shared/ui/Regler.vue`, die gemeinsame Regler-Bauform für
  `Bewertungsachse.vue` und `GewichtungSheet.vue` — 8px Bahn +
  `border-width: 18px 0` = 44px). `Regler.vue` ist ein einziges `<input>`
  mit den Props `wert`, `min`, `max`, `leer`. Ereignisse, `id`, `class` und
  `aria-*` fallen per Attribut-Fallthrough durch. Das Layout (`flex`,
  `min-width: 0`, `grid-area`) setzt der Nutzer, nicht der Baustein. Drei
  Teile, die nur zusammen funktionieren:
  - **Lokale Ausnahme `box-sizing: content-box`** vom globalen `border-box`
    (`base.css`) — sonst verdrängt der Rahmen die deklarierte Höhe der
    sichtbaren Fläche, statt sie zu ergänzen.
  - **`background-clip: content-box`** — sonst färbt der Hintergrund die
    gesamte Trefferfläche statt nur die sichtbare Fläche.
  - **Der sichtbare Rahmen ist ein inset `box-shadow` (`inset 0 0 0 Npx`),
    kein `outline`.** `outline-offset` kennt **einen** Versatz für alle vier
    Seiten und zieht ihn auch auf der Achse ohne Abstand nach innen (Befund:
    `docs/pakete/PO-2026-09-16-001.md`). Der inset-Schatten
    beginnt immer an der Innenkante des Rahmens (Padding-Box) und passt sich
    damit pro Achse von selbst an. Das ist zugleich der Grund für `border`
    statt `padding`: mit `padding` läge die Padding-Box an der falschen Kante.
- **Ein permanenter Rahmen wird nicht an `:not(:focus-visible)` gehängt.**
  `box-shadow` und `outline` sind verschiedene CSS-Eigenschaften und bleiben
  gleichzeitig sichtbar — der Fokusring **ergänzt** einen permanenten Rahmen,
  statt ihn zu ersetzen. Die Ausnahme-Bindung ließ den Rahmen bei
  Tastaturfokus komplett verschwinden (Befund:
  `docs/pakete/PO-2026-09-16-001.md`).

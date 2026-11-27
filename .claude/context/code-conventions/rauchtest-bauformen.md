# Rauchtest-Bauformen (`scripts/smoke.mjs`)

> Themendatei von `.claude/context/code-conventions.md` (Abschnitt „Tests und
> Verifikation", Teil Rauchtest). Single-Writer: `architekt`. Maßgeblich ist
> dieser Wortlaut samt Ausnahmen, nicht die Kurzzeile im Register. Funktionen
> werden hier per Name genannt, nie per Zeilennummer.

## Greifbarkeit und UA-Pseudo-Elemente

- **„Bedienelement ist greifbar" ist eine Rauchtest-Zusicherung** (ADR-0027
  P5): Sichtbarkeit und 44×44px-Trefferfläche werden am berechneten Stil in
  einer echten Engine geprüft, inklusive `::-webkit-slider-thumb`, und als
  Eigenschaft formuliert — nie als Prüfung auf eine bestimmte Klasse.
  **Was `pruefeReglerGreifbarkeit()` deckt, steht ausgeschrieben** (ADR-0029
  P3), weil die Lücke genau dort lag, wo man sie für gedeckt hielt:
  - *Geprüft*: 44×44px am `<input>`; Thumb-Knoten vorhanden und nicht durch
    `opacity: 0`, `visibility: hidden` oder Größe < 4px unbedienbar.
  - *Nicht geprüft*: Kontrast/Farbe des Thumbs gegen seine Umgebung · ob eine
    Autoren-Regel auf dem Thumb in der Ziel-Engine überhaupt **greift** ·
    `::-moz-range-thumb` · jede Darstellung in WebKit · WebKit-Touchverhalten.
- **Stile eines UA-Pseudo-Elements (`::-webkit-*`) werden über das Chrome
  DevTools Protocol gelesen, nie über `getComputedStyle(el, '::-webkit-…')`**
  (ADR-0027 P5, korrigiert): Letzteres liefert in Chromium die UA-Vorgabe
  statt des Autoren-Stils — die Zusicherung wäre dauerhaft grün geblieben
  (Nachweis: `docs/pakete/PO-2026-09-13-001.md`). Bauform in
  `pruefeReglerGreifbarkeit()` (`scripts/smoke.mjs`):
  `DOM.getDocument({ pierce: true })` → Knoten über **matchende Selektoren**
  finden (`CSS.getMatchedStylesForNode`, nicht über interne `id`-Namen) →
  `CSS.getComputedStyleForNode`. Wirkt umständlich, ist es nicht — nicht
  „vereinfachen".

## Listen, Ausnahmen, gemeinsamer Bestand

- **Neue Ansicht, neue Breite, neuer Zustand?** In die zentralen Listen oben
  in `scripts/smoke.mjs` eintragen — sonst prüft sie niemand. Ausnahmen von
  einer Zusicherung stehen als **benannte Bedingung** (Bauform), nie als
  Liste von IDs oder Klassennamen. **Das Register aller gültigen Ausnahmen
  steht in ADR-0040**, eine neue Ausnahme kommt über den Architekten dort
  hinein. Jede Ausnahme hat in `pruefeAusnahmenGegenprobe()` zwei Fälle am
  synthetischen DOM: einen, in dem sie greift, und einen Gegenfall, in dem
  die Prüfung weiter anschlägt. Beide werden rot nachgewiesen. Ob ein
  Vorfahr ein Element abschneidet, entscheidet der **Containing Block**,
  nicht der DOM-Baum: Ein `fixed`-Element oder ein absolutes ohne
  positionierten Vorfahren im Abschneider entkommt ihm (ADR-0040 P4; im
  heutigen `pruefeUeberlauf()` noch nicht umgesetzt, benannte Lücke). Die
  `[inert]`-Ausnahme gilt nur zusammen mit der harten Gegen-Zusicherung
  „genau die überdeckten Marker sind `inert`" (ADR-0039 P7). Eine nicht
  modale Überlagerung ist **nicht** `position: fixed`, sonst verschluckt die
  Ausnahme „fixierte Chrome" ihre Befunde.
- **Die Ansichten aus `ANSICHTEN` teilen sich Seite, Bestand und persistierte
  Einstellungen** (Sortierung, Filter, Gewichtung). Das gilt über die
  gesamte Laufzeit. Zwei Bauformen schützen davor, eine fremde, spätere
  Zusicherung zu verfälschen:
  - **`aufraeumen`** an der Ansicht: Wer eine persistierte Einstellung
    verstellt, stellt sie dort zurück. Das gilt **samt Unterzustand**,
    nicht nur den Schalter: `setzeGewichtungZurueck` setzt erst die eigenen
    Gewichte auf 1:1:1:1, dann Ausgewogen. Ein älterer Reset steht noch
    beim Nachfolger `oeffneZonenLegende()`. Wer die Reihenfolge in
    `ANSICHTEN` ändert, zieht ihn mit.
  - **`eigenerKontext: true`** an der Ansicht (frischer Browser-Kontext,
    eigene IndexedDB): für einen Bestand mit Koordinaten oder vielen
    zusätzlichen Orten. Auf der gemeinsamen Seite verlängert er die Liste,
    und spätere Ansichten melden Fehlbefunde.
  Rauchtest-Daten legen **kurze** Tag-Namen an (`ka`, `kb`). Tags bleiben im
  Bestand, und lange Filter-Pillen ragen in jeder späteren Ansicht aus dem
  Bildschirm. Braucht eine Zusicherung einen bestimmten Bestand als
  **Vorbedingung**, läuft sie auf einer frischen Seite und legt ihn selbst an.
  Der zufällig angesammelte Bestand eines Laufs zählt nicht als Vorbedingung.
  Vorbild: `pruefeSpaltenAbgeschlossenerScrollBereich()`.
- **Wer eine Zusicherung auf eine neue Dimension ausweitet, grenzt zuerst die
  falschen Befunde ab** — generisch, nicht am Einzelfall: Prüfpunkte jenseits
  der Viewport-**Höhe** sind normales Scrollen; eine fixierte Bottom-Tab-Leiste
  überdeckt bei einem nicht scrollenden Test zwangsläufig die Unterkante,
  obwohl `AppRahmen.vue` `padding-bottom` reserviert. Und die Prüfumgebung
  meldet sich selbst: Chromium protokolliert jeden abgefangenen `fetch`/`xhr`
  als Konsolenfehler.

## Treiberaktionen und Lesewege

- **Mehrere gleichzeitig offene Entwürfe werden ohne Fokuswechsel
  hergestellt** (ADR-0035): `locator.fill()`/`.click()` auf ein zweites Feld
  löst am ersten dessen eigenes „Feld verlassen" aus und committet es, bevor
  der geprüfte externe Auslöser (Route, `visibilitychange`, `pagehide`)
  feuert — die Zusicherung prüft dann einen Zustand, den es nicht mehr gibt.
  Bauform: `setzeEingabenOhneFokus()` in `scripts/smoke.mjs` (`el.value` +
  synthetisches `input`-Ereignis, `document.activeElement` bleibt). Umgekehrt
  bleibt `.fill()` richtig, wo „Feld verlassen" **selbst** der geprüfte
  Auslöser ist. Die synthetische Eingabe überspringt Playwrights
  Bedienbarkeitsprüfung — dass das Feld sichtbar und bedienbar ist, belegt
  sie nicht.
- **Ein Feld, dessen Existenz selbst Teil des geprüften Zustands ist, wird
  über `locator.count()` gelesen, nicht direkt über `inputValue()`**:
  Letzteres wartet bei fehlendem Element den vollen Timeout (30s) ab und
  wirft; außerhalb von `try`/`catch` bricht das den ganzen Lauf ab und kostet
  den Bericht der übrigen Zusicherungen. Bauform: `wertOderLeer()` in
  `scripts/smoke.mjs` — fehlt das Feld, ist das der Befund. Jede
  `pruefe…`-Funktion läuft zusätzlich in `try`/`catch` und meldet ihren
  Fehler, statt ihn zu werfen.

## Grenzen des Rauchtests

- **Die Bildschirmfotos in `.smoke/` gehören zur Verifikation einer
  Darstellungsänderung, nicht zum Beiwerk.** Der Rauchtest prüft **benannte
  Eigenschaften** (Trefferfläche, Greifbarkeit, Verdeckung, Überstand) — die
  **Geometrie** einer selbst gezeichneten Fläche prüft keine davon (Anlass:
  `docs/pakete/PO-2026-09-16-001.md`). Wer eine Darstellung ändert, sieht das
  Bildschirmfoto der betroffenen Ansicht **je Breite** an und sagt im
  Bericht, dass er es getan hat. Das ist die zweite Hälfte der Grenze aus
  ADR-0029: dort die ungeprüfte **Engine**, hier die ungeprüfte
  **Eigenschaft in der geprüften Engine**. Kein Ersatz für eine
  Zusicherung — wo sich die Eigenschaft als solche formulieren lässt, wird
  sie zugesichert.
- **Ein roter Rauchtest, der einen bekannten, bereits geschnittenen Befund
  meldet, wird nicht abgeschwächt** — er wird durch das zugehörige Paket
  grün. Fehlt Playwright: überspringen, Exit-Code 0, im Bericht ausdrücklich
  „ungeprüft" sagen.
- **„Überlebt ein Neuladen" ist nur für bestimmte Felder zugesichert**: den
  Anlege-Fall, Tags (ADR-0030) sowie Kommentar und Zahlenwert je
  Bewertungsachse (ADR-0035), jeweils am weiterlebenden Dokument. Für alle
  übrigen Felder des Ortsdetails ist es **nicht** zugesichert; das nächste
  Paket, das an einem davon arbeitet, erweitert die Zusicherung. Das echte
  Entladen mit Fokus im Feld bleibt für jedes Feld nur gemeldet (ADR-0031).

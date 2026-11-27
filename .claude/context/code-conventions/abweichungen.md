# Abweichungen und bewusst akzeptierte Stellen

> Themendatei von `.claude/context/code-conventions.md` (Abschnitt
> „Abweichungen und bewusst akzeptierte Stellen"). Single-Writer: `architekt`.

Damit sie niemand bei nächster Gelegenheit „korrigiert" oder als neuen
Befund meldet.

- `src/app/dev/`: außerhalb von `features/`, ohne Tests — Dev-Werkzeug.
- **Schatten als Literal an sechs Stellen** (`shared/ui/Sheet.vue`,
  `Toast.vue`, `tags/TagEingabe.vue`, `orte/Ortssuche.vue`,
  `karte/Kartenflaeche.vue` 2×), Werte bereits abweichend, obwohl
  `design-concept.md` nur zwei Elevation-Stufen kennt. Die einzige
  Token-Lücke. **Kein Einzelfall-Aufräumen** — das Auflösen braucht die zwei
  Tokenwerte aus `design-concept.md` und geht in einem Zug. Nicht betroffen:
  Scrims hinter Sheets/Dialogen und Bildkacheln.
- **Zwei Tokenwerte als Hex-Konstanten in JS**
  (`shared/ui/Intensitaetsbalken.vue`) — CSS kann keine Farbskala
  interpolieren. Bei einer Token-Änderung mitziehen, nicht aufräumen.
- **Ortsdetail, Koordinatenfelder** (Nutzerentscheidung 2026-09-13,
  „akzeptabel so"): Leert man bei einem Ort **mit** hinterlegten Koordinaten
  beide Felder, klappt der Abschnitt zu und der Reveal-Button muss erneut
  gedrückt werden. Im Browser bestätigt, bewusst so gelassen — **kein
  unentdeckter Fehler**, nicht nebenbei reparieren.
- **Die Maße des Reglerdaumens stehen als Literale in `Bewertungsachse.vue`**
  (24px Durchmesser, 2px Rahmen; dazu 18px/8px an der Bahn) statt als Tokens.
  `design-conventions.md` gibt bewusst keinen Absolutwert vor, nur Gleichheit
  zwischen den Zuständen — 24px ist die Bemessungswahl des Leads, im
  Dateikommentar begründet. **Nicht nebenbei tokenisieren**: Ob daraus ein
  benannter Wert wird, entscheidet der `ux-ui-designer` in
  `design-conventions.md` (Single-Writer). Bis dahin: bei einer Änderung beide
  Pseudo-Element-Regeln (`::-webkit-slider-thumb`, `::-moz-range-thumb`)
  mitziehen.
- **`istOffeneAuswahlliste()` in `scripts/smoke.mjs` ist ungeprüft**
  (Nutzerentscheidung 2026-09-13): `ORTSSUCHE_ZUSTAENDE` kennt keinen
  `treffer`-Zustand, die Ausnahme wird von keinem Testzustand durchlaufen.
  Dokumentiert, bewusst so.
- **`Ortebereich.vue` schaltet „Zurück", „×" und „Fertig" noch per
  reihenfolgeabhängigem Override um** (eine Klasse, gleiche Spezifität, der
  `@media`-Block steht später), nicht nach ADR-0032. Das ist bewusst
  akzeptiert: Es hängt keine Zustandsklasse daran, und
  `pruefeAbschlussKombination` deckt die Stelle hart ab. Umgestellt wird,
  wenn der Chrome-Block dieser Datei aus eigenem Grund angefasst wird. Kein
  Einzelfall-Aufräumen.
- **`Schnellansicht.vue` liest das `padding-bottom` des nächsten `<main>`**
  (`messe()`), um sich über die feste Tab-Leiste anzuheben, wenn die
  480px-Karte darunter reicht (ADR-0039 Nachtrag). Das ist ein lesender
  Griff aus `orte` in das Layout von `app-shell`. Er ist bewusst
  akzeptiert, weil `pruefeSchnellansicht()` (9) ihn bei 320×700 hart
  abdeckt. Wer in `AppRahmen.vue` ändert, wie Platz für feste Leisten
  reserviert wird, zieht ihn mit. Ob die Kartenhöhe stattdessen der
  verfügbaren Höhe folgt, ist eine offene Nutzerfrage, nicht nebenbei
  umbauen.
- **`.datenbereich__datei-input`** (`Datenbereich.vue`) nutzt das `clip`-Muster
  für ein Datei-Input und nicht für Screenreader-Text. Deshalb heißt es nicht
  `__sr-…`. Nicht umbenennen.
- Bewusste Abweichung von der Greenfield-Referenz des Plugins (Angular/NgRx,
  Microservices): ADR-0001/0002.

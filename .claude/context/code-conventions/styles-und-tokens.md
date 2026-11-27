# Styles, Tokens, Icons

> Themendatei von `.claude/context/code-conventions.md` (Abschnitt „Regeln, die
> die Struktur tragen", Teil Styles). Single-Writer: `architekt`. Maßgeblich
> ist dieser Wortlaut samt Ausnahmen, nicht die Kurzzeile im Register.

- **Rohwerte nur in `styles/tokens.css`.** Kein Hex-Wert, kein freier Abstand
  außerhalb der Skalen aus `design-concept.md` in Feature-Stylesheets;
  Komponenten binden an semantische Tokens. Muss ein Tokenwert
  ausnahmsweise in JavaScript stehen (CSS kann keine Farbskala
  interpolieren), dann als benannte Konstante **mit dem Tokennamen im
  Kommentar** — wer eine Farbe ändert, greppt nach ihrem Namen. Siehe
  „Abweichungen" (`abweichungen.md`).
  - **Zonenfarben** (nur Ortsliste): `--color-zone-8`, `--color-zone-8-5`,
    `--color-zone-9`, `--color-zone-9-5` und `--color-zone-10`. Das Suffix
    ist der Zonenschlüssel, das Komma wird zum Bindestrich. Die Namen tragen
    ihre Bedeutung wie `--color-primary-*`, deshalb gibt es keinen Alias in
    `semantic.css`. Die Zuordnung Zone → Tokenname steht wörtlich und genau
    einmal in `features/orte/lib/zonen.ts` (ADR-0034 P2). Die Zone
    vergleicht ganzzahlige Zehntel (ADR-0037 P5): `ZONEN[].untergrenzeZehntel`
    (80/85/90/95/100), `bestimmeZone(zehntel)`. Ein Einzelachsenwert geht als
    `wert × 10` hinein.
  - **Kartenmarker** (ab PO-2026-11-24-004): Maße als Tokens mit Präfix
    `--karte-marker-*` in `tokens.css`, analog `--karte-hoehe`. Das sind
    Scheibe 40/48px, Ring 3/4px, Punkt 16/24px, Außenring 3px,
    Trefferfläche 44px und die Etikettbreite 120/240px. `L.divIcon` braucht
    `iconSize`/`iconAnchor` als Zahl in JS, dort steht eine benannte
    Konstante mit Tokennamen im Kommentar (`MARKER_TREFFERFLAECHE`,
    `ETIKETT_RANDABSTAND` = `--space-8`). Farben nur semantisch
    (`--surface`, `--color-accent-500`, `--text`, `--border`), keine
    Zonenfarbe.
  - **Hervorhebungs-Schatten**: `--shadow-hervorhebung-schwach` und
    `--shadow-hervorhebung-stark`, Farbbasis `--color-neutral-900`, im
    Kommentar genannt. Das sind **keine** Elevation-Tokens. Die sechs
    Schatten-Literale unter „Abweichungen" bleiben davon unberührt.
- **Ein Elternteil passt einen geteilten Baustein über eine dokumentierte
  Custom Property an, nie über `:deep()`**. Der Baustein liest
  `var(--<baustein>-<eigenschaft>, <bisherige Vorgabe>)`, der Default bleibt
  also für alle anderen Nutzer unverändert. Der Elternteil setzt die Property
  auf seinem eigenen Wrapper, und die Vererbung trägt sie über die
  Scoped-Grenze. Vorbild: `Intensitaetsbalken.vue` mit
  `--intensitaetsbalken-zahl-{farbe,padding,radius,flaeche,gewicht,ziffern}`
  und `--intensitaetsbalken-fuellung-farbe` (ab PO-2026-09-27-003/-11-24-007).
  Ein Hook ist kein Prop. Gesetzt wird er nur auf dem Wrapper des Nutzers,
  nie global (`body`, `:root`), sonst leckt er in andere Nutzer. Die
  bestehende `:deep()`-Stelle in `ImportEntscheidenSheet.vue` nicht nebenbei
  umbauen.
- **Mehrere unabhängige Signale auf derselben Eigenschaft (`box-shadow`)
  bekommen je Signal eine lokale Custom Property mit neutralem Fallback**
  (`0 0 0 0 transparent`). Sie werden in **einer** Deklaration kombiniert, nie
  über eine zweite Regel, die die erste ersetzt. Vorbild: `.ortszeile`
  (Auswahlkante + Hervorhebung, ab PO-2026-09-27-003).
- **Schriften und Icons unter `src/assets/`** — kein Fremd-Host, kein
  Icon-CDN (Offline-Zusage, ADR-0001). Icons je Paket nachziehen: SVG nach
  `assets/icons/<kurzname>.svg` + Wrapper `shared/ui/icons/Icon<Name>.vue`,
  Quelle Lucide Outline. Nie ein ganzes Set auf Vorrat. Dieselbe Regel gilt
  rückwärts: Wer den letzten Nutzer eines Icons entfernt, löscht SVG und
  Wrapper im selben Paket.

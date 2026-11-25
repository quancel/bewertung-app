# Regler und Bewertungsachse (Werte, bei denen 0 gültig ist)

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: „Werte mit Bereich, bei denen 0 gültig ist" inkl. „Regler-Bahn und
> -Thumb". Eingabe-/Commit-Logik des Reglers: [formulare.md](formulare.md).

## Werte mit Bereich, bei denen 0 gültig ist

Gilt für jedes Feld mit numerischem Bereich, in dem 0 gültig ist **und** ein
davon getrennter Zustand „nicht gesetzt" existiert (aktuell die vier Achsen).

- **0 und „nicht gesetzt" sind verschieden**, nie dieselbe Darstellung.
  „Nicht gesetzt" = Muster „Leeres Feld (regulär)". Gesetztes 0 = wie jeder
  andere Wert (Zahl + Balken, normale Textfarbe, keine gemutete Fläche).
- **Rücksetzen**: sobald ein Wert gesetzt ist, ein kleiner Icon-Button „×"
  (`aria-label` „[Achse] zurücksetzen", Optik wie Tag-Entfernen), per Tastatur
  erreichbar. Alternativ genügt das Leeren der Zahleneingabe.
- **Intensitätsbalken**: Spur hat **immer** einen sichtbaren 1px-Rahmen
  (`--border`), auch bei 0. Die Zahl steht immer daneben. Füllfarbe: Tonleiter
  zwischen `--color-neutral-100` (0) und `--color-primary-600` (10), keine
  Stufenfarben. „Nicht gesetzt" zeigt **keinen** Balken, nur den Platzhaltertext.
  (Zonenfüllung in der Ortsliste: [zonen-ortsliste.md](zonen-ortsliste.md).)

## Regler-Bahn und -Thumb

Nutzerentscheidung (PO-2026-09-16-001): `appearance: none` auch auf dem
`<input>` selbst; Bahn **und** Thumb komplett selbst gezeichnet, in keiner
Engine nativ. Umgesetzt in `shared/ui/Regler.vue` (ADR-0029).

- **Bahn**: Werte der Intensitätsbalken-Spur — Höhe 8px, `border: 1px solid
  var(--border)`, `border-radius: var(--radius-full)`, `background-color:
  var(--surface)`, **in jedem Zustand identisch**, keine Füllung (der
  Intensitätsbalken zeigt dieselbe Information bereits).
- **Anker-Prinzip**: Rahmen, Radius, Hintergrund und Höhe stehen auf dem
  Basis-Selektor des `<input type="range">` selbst, **nicht nur** auf
  `::-webkit-slider-runnable-track`/`::-moz-range-track`. Die Track-
  Pseudo-Elemente bekommen nur einen Reset (`background: transparent`,
  `border: none`, gleiche Höhe/Radius). So bleibt die Bahn auch bei fehlender
  Pseudo-Selektor-Unterstützung sichtbar; ausfallen kann nur der Thumb.
- **Thumb**: `::-webkit-slider-thumb` **und** `::-moz-range-thumb` mit
  derselben Bauform, 2px-Rahmen + Füllfarbe in beiden Zuständen. **Nicht
  gesetzt**: Hintergrund `var(--surface)`, Rahmen 2px `var(--text-muted)`
  (≈ 4,8:1). **Gesetzt** (inkl. 0): Hintergrund und Rahmen
  `var(--color-primary-600)` (≈ 6,1:1). Größe/Form wechseln nicht.
  `appearance: none` zusätzlich auf dem Thumb-Pseudo-Element (WebKit
  verlangt es dort separat); beide Vendor-Varianten immer gemeinsam.
- **Durchmesser 24px — benannte Design-Festlegung**, keine freie Bemessung
  (Auffindbarkeit; entspricht der Icon-Basisgröße, design-concept.md
  „Ikonografie"). Token-Kandidat `--regler-thumb-groesse` für `tokens.css`;
  ob und wann, entscheidet der `architekt`.
- **`accent-color` entfällt** ersatzlos (ohne Wirkung bei selbst gezeichneten
  Bahn/Thumb, kein toter Attribut-Rest).
- **Degradation**: Ohne Track-/Thumb-Pseudo-Selektoren fällt nur der Thumb
  auf die Engine-Darstellung zurück; behauptet wird **nicht**, dieser sei
  „von sich aus sichtbar" — die Bahn ist über den Basis-Selektor abgesichert.
- **Fokusring**: die projektweite `:focus-visible`-Regel (`base.css`) greift.
  Manche WebKit-Versionen unterdrücken den Ring bei `-webkit-appearance: none`
  (hier nicht prüfbar, ADR-0023 Punkt 5): zeigt sich das, ergänzt eine
  höher-spezifische `:focus-visible { outline: var(--focus-ring-width) solid
  var(--focus-ring); outline-offset: var(--focus-ring-offset); }` als Fallback.
- **Baseline „Farbe nie alleiniger Bedeutungsträger"**: Die Bahn ist
  zustandsfarblos; „nicht gesetzt"/„gesetzt" unterscheidet der Thumb (reine
  Farbänderung) **plus** drei Nachbar-Auszeichnungen: kein Intensitätsbalken
  bei `null` (nur Platzhaltertext), Zurücksetzen-Knopf erst bei gesetztem Wert,
  Zahlenfeld-Platzhalter „–". Wer eine davon entfernt, kippt das Kriterium.
- **A11y**: bei `null` kein `aria-valuenow`, sondern `aria-valuetext="nicht
  bewertet"`.
- **Trefferfläche** mind. 44×44px, über Padding auf dem `<input>` (gerechnet
  gegen Bahnhöhe 8px **und** Thumb-Größe), nicht über sichtbar vergrößerte
  Bahn/Thumb.

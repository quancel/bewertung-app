# Design-Konzept (Template)

> Vorlage — kopiere sie ins Ziel-Repo nach
> `.claude/context/design-concept.md`.
>
> **Single-Writer: Nur der `design-concept`-Agent schreibt hierhin.** Der
> `ux-ui-designer` liest die Datei und setzt darauf auf, ändert sie aber
> nicht.
>
> Zweck: die **gestalterische Grundausrichtung** des Projekts an einer
> Stelle. Sie wird einmal festgelegt und ändert sich selten — im Gegensatz
> zu `design-conventions.md`, das die operativen Regeln pro Feature
> mitwächst:
>
> | Datei                   | Beantwortet                                  | Ändert sich       |
> |-------------------------|----------------------------------------------|-------------------|
> | `design-concept.md`     | Wie sieht das Produkt aus und warum?          | selten, bewusst   |
> | `design-conventions.md` | Wie verhält sich ein konkretes UI-Element?    | mit jedem Feature |
>
> **Herkunft** dieses Konzepts (eine Zeile setzen, siehe unten): Entweder
> aus einer bestehenden Codebasis **abgeleitet** — dann beschreibt es, was
> ist — oder **neu entworfen**, dann ist es eine Setzung. Ein Neuentwurf
> startet als `Bestätigung ausstehend` und wird erst bestätigt, wenn die
> Markenfragen beim Nutzer beantwortet sind; bis dahin stehen sie unten
> unter „Offene Markenfragen".
>
> **Änderbar.** Das Konzept ist kein Denkmal: Auf Verlangen wird es
> überarbeitet oder refactored. Der `design-concept`-Agent meldet dabei
> Einträge aus `design-conventions.md`, die dem neuen Konzept widersprechen;
> auflösen tut sie der `ux-ui-designer`. Ein Konzeptwechsel, der die
> Konventionen stehen lässt, blockiert zwar nichts — das Konzept ist
> höherrangig —, hinterlässt aber falsche Konventionen, die beim nächsten
> Feature wieder gelesen werden.
>
> **Kompakt halten (Faustregel: < 120 Zeilen).** Diese Datei wird bei jedem
> Frontend-Paket mitgelesen — vom `ux-ui-designer` und vom `frontend-lead`.
> Jede überflüssige Zeile kostet dauerhaft. Wo die Tokens im Code stehen,
> gehört hierher das **System** und der Verweis auf die Quelle, nicht die
> ausgeschriebene Werteliste.

- **Herkunft**: `abgeleitet aus bestehender Codebasis` | `neu entworfen — Bestätigung ausstehend` | `neu entworfen (bestätigt am YYYY-MM-DD)`
- **Zuletzt überarbeitet**: YYYY-MM-DD
- **Quellen** (bei `abgeleitet`): `<z.B. src/styles/_tokens.scss, tailwind.config.js, Storybook>`

## Marke & Tonalität

- **Charakter**: `<3–5 Adjektive, die die Gestaltung leiten, z.B. „sachlich, ruhig, dicht">`
- **Corporate Design**: `<Bindende Vorgaben von außen — Logo, Wortmarke, Hausfarben,
  Schutzräume. Falls es keine gibt: „keine externen Vorgaben" explizit vermerken,
  damit niemand danach sucht.>`
- **Sprache im UI**: `<z.B. Du/Sie, Aktiv statt Passiv, keine Ausrufezeichen>`

## Farbsystem

Nicht als Hex-Liste pflegen, wenn die Tokens im Code stehen — dann hierher
nur das **System** und den Verweis auf die Quelle.

| Rolle       | Token                | Verwendung                              |
|-------------|----------------------|------------------------------------------|
| Primär      | `<--color-primary>`  | `<Hauptaktion, max. eine pro Ansicht>`   |
| Sekundär    | `<...>`              | `<...>`                                  |
| Erfolg      | `<...>`              | `<...>`                                  |
| Warnung     | `<...>`              | `<...>`                                  |
| Fehler      | `<...>`              | `<...>`                                  |
| Neutral     | `<Skala, z.B. 50–900>` | `<Flächen, Text, Rahmen>`              |

- **Kontrast-Ziel**: `<z.B. WCAG 2.2 AA — 4.5:1 für Text, 3:1 für UI-Elemente>`
- **Regel**: `<z.B. Farbe nie alleiniger Bedeutungsträger — immer mit Text oder Icon>`

## Theming

- **Modi**: `<z.B. Light + Dark, beide gleichwertig gepflegt>`
- **Mechanik**: `<z.B. CSS Custom Properties auf :root, Umschaltung über data-theme>`
- **Regel**: `<z.B. keine modus-spezifischen Hex-Werte in Komponenten>`

## Typografie

- **Familien**: `<Überschrift / Fließtext / Mono — inkl. Fallback-Stack>`
- **Skala**: `<z.B. 12/14/16/20/24/32/40, keine Zwischenwerte>`
- **Gewichte**: `<z.B. nur 400 und 600>`
- **Zeilenhöhe**: `<z.B. 1.5 für Fließtext, 1.2 für Überschriften>`

## Spacing & Layout

- **Basiseinheit**: `<z.B. 4px>` — **Skala**: `<z.B. 4/8/12/16/24/32/48/64>`
- **Breakpoints**: `<z.B. sm 640 / md 768 / lg 1024 / xl 1280>`
- **Container**: `<z.B. max. 1200px, zentriert, 16px Außenabstand mobil>`
- **Grid**: `<z.B. 12 Spalten ab md, darunter einspaltig>`

## Form & Tiefe

- **Radien**: `<z.B. 4px Standard, 8px Karten, 999px Pills>`
- **Elevation/Schatten**: `<z.B. drei Stufen; Modals höchste, Karten keine>`
- **Rahmen**: `<z.B. 1px neutral-200; Trennung bevorzugt über Abstand statt Linie>`

## Ikonografie

- **Set**: `<z.B. Lucide, ausschließlich Outline, 24px Basisgröße>`
- **Regel**: `<z.B. kein Icon ohne Label bei Primäraktionen>`

## Motion

- **Grundprinzip**: `<z.B. Bewegung erklärt Herkunft, dekoriert nicht>`
- **Dauern**: `<z.B. 100ms Hover, 150ms Ein-/Ausblenden, 250ms Layout>`
- **Easing**: `<z.B. ease-out beim Erscheinen, ease-in beim Verschwinden>`
- **Reduced Motion**: `<z.B. prefers-reduced-motion respektieren;
  Animationen ersetzen statt streichen>`

## Barrierefreiheit

- **Zielniveau**: `<z.B. WCAG 2.2 AA>`
- **Nicht verhandelbar**: `<z.B. sichtbarer Fokus, Tastaturbedienbarkeit, Labels an allen Feldern>`

## Offene Markenfragen

Nur bei `Herkunft: neu entworfen — Bestätigung ausstehend`. Was der
`design-concept`-Agent als `user_questions` an den Nutzer gestellt hat, mit
der Annahme, unter der das Konzept vorläufig steht. Sind die Fragen
beantwortet, entfällt dieser Abschnitt ersatzlos.

- `<Frage>` — vorläufig: `<Annahme>`

## Bewusst nicht festgelegt

Damit spätere Lücken nicht als Versäumnis gelesen und eigenmächtig gefüllt
werden.

- `<z.B. Illustrationsstil — wird entschieden, wenn die erste Illustration gebraucht wird>`

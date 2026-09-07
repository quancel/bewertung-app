# Design-Konzept — bewertung-app

> **Single-Writer: Nur der `design-concept`-Agent schreibt hierhin.** Der
> `ux-ui-designer` liest die Datei und setzt darauf auf, ändert sie aber
> nicht.
>
> | Datei                   | Beantwortet                                  | Ändert sich       |
> |-------------------------|----------------------------------------------|-------------------|
> | `design-concept.md`     | Wie sieht das Produkt aus und warum?          | selten, bewusst   |
> | `design-conventions.md` | Wie verhält sich ein konkretes UI-Element?    | mit jedem Feature |
>
> **Kompakt halten (< 120 Zeilen).** Wird bei jedem Frontend-Paket
> mitgelesen. Stehen Tokens später im Code, gehört hierher das **System**
> und der Verweis auf die Quelle, nicht die ausgeschriebene Werteliste.

- **Herkunft**: `neu entworfen (bestätigt am 2026-09-07)`
- **Zuletzt überarbeitet**: 2026-09-07
- **Quellen**: keine — Repo war zum Zeitpunkt des Entwurfs ohne Anwendungscode
  (kein Token-File, keine Theme-Config, kein Stylesheet). Alles hier ist
  **Setzung**, nicht Bestandsaufnahme.

## Marke & Tonalität

- **Charakter**: leicht, warm, aufgeräumt, beiläufig. Ein privates Notizbuch,
  kein Portal — es gibt kein Publikum, also keine Bewertungs-Rhetorik
  („Top-Bewertung", Badges, Ranglisten).
- **Corporate Design**: **keine externen Vorgaben** — kein Logo, kein
  App-Icon, keine Wortmarke, keine Hausfarben, keine Schriftbindung.
  Vom Nutzer am 2026-09-07 ausdrücklich bestätigt: **nicht weiter danach
  suchen.** Wortmarke bleibt reine Typografie in Inter 600.
- **Sprache im UI**: Deutsch, **Du**, Aktiv, keine Ausrufezeichen. Fehlende
  Daten werden nie als Mangel formuliert („noch nichts eingetragen", nicht
  „Pflichtfeld fehlt").
- **Inhalt trägt die Farbe.** Fotos und Karte sind bunt; die Bedienoberfläche
  ist es nicht. Chrome bleibt neutral, damit die Inhalte nicht konkurrieren.

## Farbsystem

Grünlich getönte Neutrale, damit sie zum Primärton passen; Primär sparsam.

| Rolle       | Token / Wert                              | Verwendung                                          |
|-------------|-------------------------------------------|-----------------------------------------------------|
| Primär      | `--color-primary-600` `#0F6E60`           | Hauptaktion, **max. eine pro Ansicht**; weiße Schrift |
| Primär-Text | `--color-primary-700` `#0A554A`           | Links, Text-Buttons auf hellem Grund                 |
| Primär-Fläche | `--color-primary-50` `#E9F5F2`          | ruhige Hervorhebung, aktiver Tag                     |
| Akzent      | `--color-accent-500` `#C2643C`            | **nur** Kartenpin und Auswahl auf der Karte          |
| Erfolg      | `--color-success` `#15803D`               | abgeschlossene Aktion                                |
| Warnung     | `--color-warning` `#B45309`               | drohender Datenverlust                               |
| Fehler      | `--color-danger` `#B42318`                | echter Fehlschlag (Speichern misslungen)             |
| Neutral     | `--color-neutral-{0,50,100,200,300,500,700,900}` `#FFFFFF · #F7F8F7 · #EEF0EF · #DFE3E1 · #C3C9C6 · #6B7570 · #3C4340 · #1A1F1D` | Flächen, Text, Rahmen |

- **Kontrast-Ziel**: WCAG 2.2 AA — 4.5:1 Text, 3:1 UI-Elemente und Fokus,
  geprüft gegen die hellen Flächen (`neutral-0`/`neutral-50`).
- **Farbe nie alleiniger Bedeutungsträger** — immer mit Text oder Icon.
- **Bewertungswerte sind nicht ampelfarbig.** 0–10 wird über eine
  Intensitätsstufe **eines** Tons dargestellt, nicht rot→gelb→grün. Eine 2 bei
  „Preis/Leistung" ist ein Messwert, kein Fehler; Rot/Gelb sind für echte
  Probleme reserviert und verlieren ihre Bedeutung, wenn sie hier auftauchen.
- **Fehlende Daten sind neutral.** Unvollständige Orte und leere Achsen
  bekommen `neutral-500` auf `neutral-50` — nie Warn- oder Fehlerfarbe. Der
  unvollständige Ort ist der **Normalzustand** des Produkts.
- **Karte ohne Netz** ist ebenfalls neutral: leere Kachelfläche
  `neutral-100` mit ruhigem Hinweistext. Kein Fehler-Rot, kein Alarm-Icon,
  kein Wiederholen-Button als Primäraktion.

## Theming — Light-only

- **Ein Modus: Light.** Alle Werte oben sind Light-Werte; es gibt kein
  zweites Theme.
- **Dark Mode ist bewusst nicht Teil von v1** (Nutzerentscheidung
  2026-09-07, gegen die doppelte Token-Pflege) — nicht vergessen, sondern
  abgewählt. Ein Nachrüsten betrifft **Tokens und bereits gebaute
  Komponenten**, ist also kein reiner Token-Nachtrag. Wer es später will,
  plant es als eigenes Arbeitspaket.
- **Mechanik**: CSS Custom Properties auf `:root`. Kein `[data-theme]`,
  keine `prefers-color-scheme`-Abfrage.
- **Regel**: Komponenten kennen nur **semantische** Tokens (`--surface`,
  `--text-muted`), nie `neutral-700` direkt. Das gilt unabhängig vom
  Theming — es hält die Farbbedeutung an einer Stelle und ist zugleich das
  Einzige, was ein späteres Dark-Nachrüsten bezahlbar hält.

## Typografie

- **Familien**: eine Sans für alles — **Inter** (variabel), Fallback
  `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Zahlen in
  Bewertungen und Tabellen mit `font-variant-numeric: tabular-nums`.
- **Schriften werden mitgeliefert, nie vom CDN geladen** (woff2, subsetted,
  `font-display: swap`). Die App muss offline vollständig bedienbar sein —
  eine Web-Font vom Fremd-Host bricht genau das.
- **Skala**: 12/14/16/18/20/24/30/36 — keine Zwischenwerte. Fließtext 16.
- **Gewichte**: nur 400, 500, 600.
- **Zeilenhöhe**: 1.5 Fließtext, 1.25 Überschriften.

## Spacing & Layout

- **Basiseinheit**: 4px — **Skala**: 4/8/12/16/24/32/48/64.
- **Mobile first.** Die App wird unterwegs am Ort benutzt, einhändig.
  Desktop ist die abgeleitete, nicht die geplante Ansicht.
- **Breakpoints**: sm 480 / md 768 / lg 1024 / xl 1280.
- **Container**: max. 1120px, zentriert, 16px Außenabstand mobil.
- **Grid**: einspaltig bis md; ab lg zweispaltig (Liste + Karte/Detail).
- **Großzügiger Weißraum statt Trennlinien** — trägt „leicht" und
  „übersichtlich" mehr als jede Rahmenfarbe.

## Form & Tiefe

- **Radien**: 8px Standard (Felder, Buttons), 12px Karten und Bilder,
  16px Sheets/Dialoge, 999px Tag-Pills.
- **Elevation**: nur zwei Stufen. Karten sind **flach** (Rahmen statt
  Schatten); Schatten hat ausschließlich, was über dem Inhalt schwebt
  (Sheet, Dialog, Menü).
- **Rahmen**: 1px `neutral-200`. Trennung bevorzugt über Abstand.
- **Bilder**: 12px Radius, 4:3 als Standardverhältnis, `object-fit: cover`.

## Ikonografie

- **Set**: Lucide, ausschließlich Outline, 24px Basis (20px in dichten
  Listen). **Lokal gebündelt**, nicht per Icon-CDN.
- **Regel**: kein Icon ohne Label bei Primäraktionen. Icon-only nur bei
  eindeutigen, wiederkehrenden Aktionen — dann mit `aria-label`.

## Motion

- **Grundprinzip**: Bewegung erklärt Herkunft und Zustandswechsel, sie
  dekoriert nicht.
- **Dauern**: 120ms Hover/Fokus, 180ms Ein-/Ausblenden, 240ms Layout und
  Sheets. Nichts über 300ms.
- **Easing**: `ease-out` beim Erscheinen, `ease-in` beim Verschwinden.
- **Reduced Motion**: `prefers-reduced-motion` respektieren — Bewegung durch
  Ein-/Ausblenden **ersetzen**, nicht ersatzlos streichen.

## Barrierefreiheit

- **Zielniveau**: WCAG 2.2 AA.
- **Nicht verhandelbar**: sichtbarer Fokusring (2px, 2px Offset, 3:1 gegen
  Umgebung), vollständige Tastaturbedienbarkeit, Label an **jedem** Feld,
  Touch-Ziele mind. 44×44px.
- Die Vier-Achsen-Bewertung ist **ohne Maus bedienbar** und hat je Achse eine
  Texteingabe-Alternative zum Slider — ein reiner Drag-Regler ist weder mit
  Tastatur noch mit Screenreader zumutbar.

## Bewusst nicht festgelegt

Damit spätere Lücken nicht als Versäumnis gelesen und eigenmächtig gefüllt
werden.

- **Farbcodierung der vier Bewertungsachsen** — bewusst offen. Aktuell werden
  Achsen über Label unterschieden, nicht über Farbe. Vier zusätzliche Farben
  entscheidet der `ux-ui-designer`, wenn das erste Achsen-Diagramm ansteht.
- **Kartenstil und Tile-Anbieter** — gestalterisch relevant, aber eine
  Architektur-/Lizenzentscheidung (`architekt`).
- **Illustrationen für Leerzustände** — bis dahin Leerzustände rein
  typografisch, ohne Bild.

# Ortsliste: Zonenfarben, Hervorhebungs-Schatten, Legende

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: „Ortsliste: Zonenfarben und Hervorhebungs-Schatten (PO-2026-09-27-003)".
> Zeilen-Sekundärzeile und Sortierung: [listen.md](listen.md).

Design-Konzept-Ausnahme (`design-concept.md` → „Ausnahme Ortsliste"). Gilt
**nur** für `Ortszeile.vue`-Zeilen — Sortier-Sheet, Karte, Ortsdetail, Schnellansicht
und andere Sheets/Listen bleiben ohne Zonenfarbe.

## Fünf Zonenfarben

Tokenbenennung beim `architekt`. Kühle Skala Teal → Indigo, streng monoton dunkler:

| Zone | Wertebereich | Hex | HSL | Kontrast weiß / neutral-50 |
|---|---|---|---|---|
| 8 | 8,0 bis unter 8,5 | `#29707A` | `hsl(188 50% 32%)` | 5,7:1 / 5,4:1 |
| 8,5 | 8,5 bis unter 9,0 | `#20546F` | `hsl(200 55% 28%)` | 8,2:1 / 7,7:1 |
| 9 | 9,0 bis unter 9,5 | `#1A3B61` | `hsl(212 58% 24%)` | 11,4:1 / 10,7:1 |
| 9,5 | 9,5 bis unter 10 | `#142552` | `hsl(224 60% 20%)` | 14,9:1 / 14,0:1 |
| 10 | genau 10 | `#101342` | `hsl(236 62% 16%)` | 17,6:1 / 16,5:1 |

Bewusst mit Marge über 4,5:1 (Text) bzw. 3:1 (Fläche). Kein Rot/Orange/Gelb/
reines Grün/Terrakotta.

## Träger: Zonen-Plakette um die Zahl (PO-2026-11-24-007)

Vom Nutzer bestätigt (ebenso der 1px-Hairline im Schatten). Die Zahl des
Wert-Slots (`.ortszeile__gesamtnote-wert` bzw. `.intensitaetsbalken__zahl` bei
Sortierung nach Einzelachse) steht bei einer Zone auf einer Plakette: Fläche =
Zonenfarbe, Zahl `--color-neutral-0`, Gewicht 600, `tabular-nums`, Radius
`--radius-8`. Fläche gegen `neutral-0`/`neutral-50`/`primary-50` ≥ 3:1;
Graustufen L* ca. 43/33/24/17/9 (Schritt ≥ 7).

- **Zeilenhöhe bleibt konstant**: der Wert-Slot trägt in JEDER Zeile
  `padding: var(--space-4) var(--space-8)` auf der Zahl (ohne Zone transparent,
  Zahl `--color-primary-700` bzw. `--text`). Rechte Kante aller Zahlen fluchtet.
- **Balken in der Zone eingefärbt** (bei Sortierung nach Einzelachse): Die
  Füllung von `Intensitaetsbalken` ist bei einer Zone **flach** in der
  Zonenfarbe (nur in der Ortsliste), Breite `wert/10`; Werte < 8 behalten die
  Tonleiter. Der Balken im Ortsdetail trägt nie Zonenfarbe.
- **Kein** `border-left: 2px` am Wert-Slot (die Plakette ersetzt den Rahmen).
  „aus N von 4 Achsen" bleibt `--text-muted` und steht NACH der Plakette.
- `Intensitaetsbalken.vue`: rückwärtskompatible CSS-Hooks im Muster von
  `--intensitaetsbalken-zahl-farbe` (`-zahl-flaeche`, `-zahl-padding`,
  `-zahl-radius`, `-zahl-gewicht`, `-fuellung`); Default überall außer in der
  Ortsliste unverändert. Hooks oder Prop entscheidet der `architekt`.
- **Zuordnung**: Grenzen der Tabelle, angewendet auf den angezeigten Wert
  (Gesamtnote nach Gewichtung, siehe [gewichtung.md](gewichtung.md), oder
  sortierte Achse). Werte < 8, die Gruppe „ohne Wert" und fehlende
  Bewertungen: weder Plakette noch Zonenfüllung. „Sortierpunkte" = Wert-Slot
  der Ortszeile (Nutzer bestätigt).

## Hervorhebungs-Schatten, zwei Stufen, feste Achsenzuordnung

Reihenfolge nach `ACHSEN_KRITERIEN` (Geschmack vor Preis-Leistung). Basis
`--color-neutral-900` (`rgb(26 31 29 / …)`), kein Zonenton, keine Warn-/Akzentfarbe.

- **Schwach → Geschmack ≥ 9**: `0 0 0 1px rgb(26 31 29 / 10%), 0 2px 6px 0 rgb(26 31 29 / 12%)`
- **Stark → Preis-Leistung ≥ 9**: `0 0 0 1px rgb(26 31 29 / 16%), 0 4px 10px 1px rgb(26 31 29 / 18%)`
- **Beide ≥ 9**: beide Layer kommagetrennt in derselben `box-shadow`-
  Deklaration, kein dritter gemischter Wert; welche Achse(n) zutreffen, trägt
  nur der Screenreader-Text.
- Der 1px-Hairline macht die Zeile erkennbar, ohne den Schatten zu verstärken.
  Weiterhin deutlich schwächer als der Sheet-Schatten (`0 -4px 24px rgb(0 0 0
  / 12%)`). Tokens `--shadow-hervorhebung-schwach/-stark` tragen diese Werte.
- **Zeilenabstände der Liste ≥ `--space-8`** (Ist: `gap: var(--space-8)` in
  `Ortebereich.vue`; der Rauchtest prüft ≥ 8px hart).
- `border-radius` folgt der Zeile (`--radius-12`). Keine Elevation: kein
  `transform`, kein `z-index`.

## Kombination mit der Auswahlkante — eine `box-shadow`-Deklaration, mehrere Layer

Zwei `box-shadow`-Regeln ersetzen sich gegenseitig. Verbindliches Ergebnis
(Umsetzung beim `frontend-lead`): je Signal eine Custom Property mit neutralem
Fallback, kombiniert in einer Deklaration:

```css
.ortszeile {
  --schatten-auswahl: 0 0 0 0 transparent;
  --schatten-hervorhebung: 0 0 0 0 transparent;
  box-shadow: var(--schatten-auswahl), var(--schatten-hervorhebung);
}
.ortszeile--ausgewaehlt { --schatten-auswahl: inset 3px 0 0 var(--color-primary-600); }
.ortszeile--hervorhebung-schwach { --schatten-hervorhebung: 0 0 0 1px rgb(26 31 29 / 10%), 0 2px 6px 0 rgb(26 31 29 / 12%); }
.ortszeile--hervorhebung-stark { --schatten-hervorhebung: 0 0 0 1px rgb(26 31 29 / 16%), 0 4px 10px 1px rgb(26 31 29 / 18%); }
```

Bei beiden Achsen bekommt `--schatten-hervorhebung` beide Layer als EINEN
Wert. Die Auswahlkante bleibt in JEDEM Zustand sichtbar.

## Screenreader-Text

Zusätzliches visuell verstecktes `<span>` (`clip`-Pattern wie
`.ortebereich__sr-titel`) am Ende des `RouterLink`-Inhalts in `Ortszeile.vue`,
je auslösender Achse ein Eintrag „{Achsenname} {Wert, eine Nachkommastelle,
Komma}", keine wertenden Worte: „Geschmack 9,4" · „Preis-Leistung 9,0" ·
beide: „Geschmack 9,4, Preis-Leistung 9,0" (Geschmack zuerst). Erscheint
unabhängig davon, ob die Achse in der Zeile sichtbar ist.

## Legende (PO-2026-11-24-007)

Beschrifteter Auslöser statt Icon-only (der Nutzer fand ein Icon nicht).

- **Auslöser**: Text-Button mit sichtbarem Text **„Legende"** (`TextButton`-
  Optik, `--color-primary-700`, 14px, kein Icon, mind. 44×44px, horizontales
  Padding `--space-8`), `aria-label="Legende der Zonenfarben und
  Hervorhebungen"`, `aria-haspopup="dialog"`. Kein Icon, weil Icon + Text die
  einzeilige Kopfzeile in der 368px-Spalte sprengt (≈ 377px statt 353px).
- **Ort**: in `.ortebereich__kopf` zwischen `<h1>Orte</h1>` und „Ort
  hinzufügen" — nur in den beiden Listen-Kopfzeilen (Master-Detail-Liste und
  Null-Treffer-Zustand), **nicht** in der Kartenansicht, **nicht** in
  `Werkzeugleiste.vue` Zeile 1 (Platz dort bereits durchgerechnet).
- **Kopfzeile bei Enge (ADR-0012, `@container`, keine `@media`)**:
  `.ortebereich__liste-spalte` ist der Container (`container-type:
  inline-size`; nicht der Kopf selbst). Unterhalb **360px** Containerbreite
  zwei Zeilen: Zeile 1 `<h1>` + Legende, Zeile 2 ausschließlich „Ort
  hinzufügen", rechtsbündig und kompakt (nicht über die volle Breite
  gestreckt). Ab 360px (auch 368px ab `lg`) einzeilig. Kein DOM-/
  Reihenfolgewechsel, Tab-Reihenfolge `<h1>` → Legende → „Ort hinzufügen".
  **Verworfen**: Icon-only „Ort hinzufügen" (design-concept.md „Ikonografie":
  kein Icon ohne Label bei Primäraktionen).
- **Sheet** (bestehende `Sheet.vue`-Chrome, Tastatur/Escape/Backdrop von dort):
  ein erklärender Satz ohne Bewertungs-Rhetorik — „Gefärbt wird der angezeigte
  Wert: die Gesamtnote ({Gewichtung}) bzw. der Wert der Achse, nach der du
  sortierst." ({Gewichtung} = Name des aktiven Szenarios, bei „Ausgewogen"
  entfällt die Klammer; Ist-Stand `ZonenLegende.vue` bestätigt 2026-11-25, kein
  zweiter Erklärsatz — die Hinweiszeile aus [gewichtung.md](gewichtung.md)
  trägt die Erklärung). Danach fünf Zonenzeilen: Plakette mit Untergrenze als
  Beispielzahl („8,0", „8,5" …), 64px-Balken mit Zonenfarbe auf der
  Untergrenze, Wertebereich als Text. Darunter zwei Hervorhebungs-Kacheln
  (`--radius-12`, Schatten aus denselben Tokens, „Geschmack ab 9" /
  „Preis-Leistung ab 9"). Plakette, Balken, Schatten nutzen dieselben
  Tokens/Klassen wie `Ortszeile.vue`.

# ADR-0022: Reine `lib`-Funktionen über Context-Grenzen — Präzisierung von ADR-0013 Punkt 2/3

- **Status**: accepted
- **Datum**: 2026-09-11
- **Bounded Context(s)**: `orte`, `karte`, `bewertungen`, `tags`, `medien`, `datensicherung`
- **task_id**: `PO-2026-09-07-006` (Nachpflege nach der Abnahme)

## Kontext

ADR-0013 Punkt 2 erlaubt einer `orte`-View, aus einem Geschwister-Context
**präsentationale Komponenten** zu importieren — und nennt ausdrücklich
„genau diese eine Art Modul". Punkt 3 nennt als eigentlichen Grund den
**Zyklus**: Erlaubt ist, was seinerseits nichts aus `orte` importiert und
keinen Store anfasst.

Bei der Umsetzung von PO-2026-09-07-006 ist ein Fall entstanden, den der
Wortlaut nicht deckt, der Grund aber sehr wohl:
`features/orte/views/Ortebereich.vue` importiert `filtereOrteMitKoordinaten`
und `bestimmeKartenLeerzustand` aus `features/karte/lib/` — zwei reine
Funktionen ohne Store, ohne `persistence/`, ohne Rückimport. Die Platzierung
war so vorgegeben (Handoff zu -006): Beide Funktionen gehören inhaltlich der
Karte, nicht der Ortsliste, und `karte` ist seit ADR-0019 store-frei.

Damit steht im Repo ein Import, den ein Reviewer oder eine spätere
Lint-Regel als Verstoß gegen ADR-0013 liest, obwohl er dessen Bedingung
erfüllt. Beides zusammen — Regel nach Modulart, Begründung nach Zyklus —
lässt sich nicht offen stehen lassen: Entweder wandern die Funktionen nach
`src/shared/lib/`, wo sie niemandem gehören, oder die Ausnahme wird
nachgezogen.

## Entscheidung

1. **Die Ausnahme aus ADR-0013 Punkt 2 gilt zusätzlich für reine Funktionen
   aus `features/<context>/lib/`.** Eine View **oder** Komponente in `orte`
   darf ein solches Modul eines Geschwister-Contexts importieren.
2. **Bedingung wörtlich wie in ADR-0013 Punkt 3 — sie ist der Kern, nicht
   die Modulart.** Erlaubt ist ein `lib`-Modul nur, wenn es
   (a) keinen Pinia-Store anfasst, (b) nichts aus `persistence/` importiert,
   (c) nichts aus dem importierenden Context importiert und (d) keinen
   Zustand über Aufrufe hinweg hält. Trifft eines davon nicht zu, ist der
   Import verboten — ohne Einzelfallabwägung.
3. **Die Richtung bleibt einseitig.** Diese Erlaubnis schafft **keinen**
   Rückweg: Ein Geschwister-Context importiert weiterhin nichts aus `orte`
   (ADR-0008). Sie gilt nicht zwischen zwei Geschwistern
   (`medien` ↔ `tags` o. ä.) — nur von der Ansichtsseite aus, die die
   Zusammenstellung verantwortet.
4. **Kein Verschieben nach `src/shared/lib/` „zur Sicherheit".** `shared/lib/`
   bleibt für Ableitungen reserviert, die **zwei** Contexts wirklich nutzen
   (ADR-0008 Punkt 6/7). Eine Funktion mit genau einem Nutzer bleibt im
   besitzenden Feature — auch wenn dieser eine Nutzer in einem anderen
   Context sitzt. Sonst sammelt sich in `shared/lib/` genau das an, was die
   Import-Richtung stört, und der Besitz löst sich auf.
5. **Prüfbar am Modul, nicht an der Absicht.** Eine künftige Lint-Regel
   formuliert die Schranke als „Import aus `features/X/` nach `features/Y/`
   ist zulässig, wenn das importierte Modul unter `components/` oder `lib/`
   liegt **und** selbst nichts aus `features/`, `stores/` oder
   `persistence/` importiert" — nicht als Ausnahmeliste einzelner Dateien.

## Konsequenzen

- Positiv: Der Bestand ist regelkonform, ohne eine Zeile Code zu bewegen.
  `features/karte/lib/koordinatenFilter.ts` und `leerzustand.ts` bleiben im
  Context, dessen Darstellung sie beschreiben.
- Positiv: Die Regel steht jetzt vollständig auf dem Zyklus-Argument.
  Modulart (`components/` oder `lib/`) ist nur noch die grobe Vorauswahl,
  Bedingung 2 die eigentliche Schranke — dieselbe, die ADR-0016 Punkt 9/10
  für `medien` schon nutzt.
- Negativ/Trade-off: Die Import-Regel lässt sich nicht mehr in einem Satz
  sagen. Die Fassung in `code-conventions.md` ist die verbindliche
  Kurzform; dieses ADR liefert die Begründung.
- Negativ/Trade-off: Ein `lib`-Modul kann seine Unschuld später verlieren
  (jemand zieht einen Store hinein). Dann fällt die Erlaubnis weg, und der
  Aufrufer muss angepasst werden — genau wie bei einer Komponente, die
  einen Store anfasst.
- Betrifft künftig: Jedes Paket, das eine Berechnung eines fremden Contexts
  in einer Ansicht braucht. Erst Bedingung 2 prüfen, dann importieren —
  nicht vorsorglich nach `shared/lib/` kopieren.

## Alternativen (kurz)

- **Beide Funktionen nach `src/shared/lib/`** — verworfen: Sie haben genau
  einen Nutzer, und ADR-0008 Punkt 8 verlangt für `shared/` einen
  nachweisbaren zweiten. Außerdem verlöre `karte` die Definition dessen, was
  es überhaupt zeichnet.
- **Die Funktionen nach `features/orte/lib/`** — verworfen: „Welche Orte
  erscheinen als Marker" und „wann ist die Karte leer" sind Kartenregeln.
  In `orte` müsste die Ortsliste sie bei jeder Kartenänderung mitpflegen.
- **ADR-0013 wörtlich halten und den Import als Verstoß behandeln** —
  verworfen: Der Verstoß wäre rein formal; die Bedingung, aus der das
  Verbot stammt (Zyklusfreiheit), ist erfüllt und bleibt prüfbar.
- **ADR-0013 direkt editieren** — verworfen: Die Historie soll lesbar
  bleiben (`adr/` wird nicht klein gehalten). ADR-0013 gilt unverändert
  weiter; dieses ADR erweitert nur seinen Geltungsbereich — gleiche Bauform
  wie ADR-0021 gegenüber ADR-0015 Punkt 6.

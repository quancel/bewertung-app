# Commit ohne Enter: Tag-Eingabe und Bewertungsachse

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: „Tag-Eingabe: Commit ohne Enter", „Tag-Eingabe: Ortswechsel ab `lg`",
> „Bewertungsachse: Commit ohne Enter/Blur-Ersatz".

Bindende Nutzerentscheidung (PO-2026-09-26-001): unbestätigter, nicht-leerer
Text gilt wie jedes andere Textfeld als gewollter Wert (Autosave, siehe
Hauptdatei) und wird automatisch übernommen. Abgelehnt: Text verwerfen,
Text als unbestätigten Entwurf stehen lassen (ADR-0005).

## Tag-Eingabe: Commit ohne Enter (PO-2026-09-26-001)

- **Vier Auslöser aus ADR-0005 Punkt 5** committen den Feldinhalt als neuen Tag:
  Feld verlassen (`blur`), Route verlassen (inkl. `/orte/:a`→`/orte` und
  `/orte/:a`→`/orte/:b`), `visibilitychange`→`hidden`, `pagehide`. **Enter
  bleibt zusätzlich** und committet sofort (ADR-0014 Punkt 4). Committet wird
  immer der **rohe getippte Text**, nie eine nur per Pfeiltaste markierte
  Vorschlagszeile (das bleibt Enter und Klick auf den Vorschlag vorbehalten).
- **Leerer oder bereits committeter Text löst nichts aus** (`commitTag` bricht
  bei getrimmt-leerem Wert ab) — wiederholtes `visibilitychange`/`pagehide`
  erzeugt weder zweiten Tag noch wiederholte Rückkehr-Optik.
- **Bereits vorhandener Tag** (case-insensitiv, ADR-0014 Punkt 3) bleibt
  unmarkiert; die Rückkehr-Optik greift nur bei tatsächlich neuem Tag.
- **Vorschlag-Klick vs. Blur**: `@mousedown.prevent` an den Vorschlags-Buttons
  verhindert den Fokusverlust; ein Klick ergibt genau einen Tag (den
  Vorschlag), nie zusätzlich den Teiltext.
- **Rückkehr aus dem Hintergrund** (`visibilitychange`→`visible` nach einem
  Commit durch `hidden`) ist die **einzige Ausnahme** von „Autosave hat keine
  sichtbare Bestätigung": nur dort geschieht der Wechsel Text → Pille, während
  der Nutzer nicht hinsieht.
  - Die neue Pille zeigt kurz die Optik eines aktiven Filter-Tags
    (`--color-primary-50`, `--color-primary-700`, kein Rahmen) **und** den
    Zusatz „{Tag} · übernommen" (Farbe nie alleiniger Träger). Fade-in 180ms ease-out.
  - Endet bei der nächsten Eingabe im Tag-Feld oder beim Verlassen der
    Detailansicht — kein Timer.
  - `aria-label` des Entfernen-Buttons währenddessen „{Tag} (automatisch
    übernommen) entfernen".
  - Reiner Sitzungszustand der Instanz, nicht persistiert.
- **Anbindung von „Route verlassen"**: `TagEingabe.vue` kennt keinen Router
  (ADR-0013 Punkt 3); die Technik legen `architekt`/`frontend-lead` fest
  (ADR-0030). Design-seitig zählt: kein Auslöser verwirft Text stillschweigend.

## Tag-Eingabe: Ortswechsel ab `lg` (PO-2026-09-26-001)

- `TagEingabe` bekommt wie `Ortssuche` (ADR-0025 Punkt 5) `:key="ortId"` in
  `Ortebereich.vue`: Remount statt Reset.
- **Reihenfolge**: Der unbestätigte Text von Ort A wird **vor** dem Remount
  als Tag an Ort A committet (Auslöser „Route verlassen"); Ort B beginnt
  strukturell leer.
- Kein neues visuelles Element, kein Highlight beim späteren Wiederöffnen von
  Ort A (der Nutzer hat den Wechsel selbst ausgelöst; der Inhaltswechsel ist ein Sprung).

## Bewertungsachse: Commit ohne Enter/Blur-Ersatz (PO-2026-09-27-004)

Für das mehrzeilige Kommentarfeld einer Bewertungsachse (ADR-0035 erweitert
das auf den Zahlenwert).

- **Dasselbe Vier-Auslöser-Muster** wie oben (Details dort).
- **Kein Enter-Commit als fünfter Auslöser**: das Feld ist echt mehrzeilig, Enter
  ist regulärer Zeilenumbruch. Die vier Auslöser **ersetzen** das bisherige
  alleinige `blur` (daher „Blur-Ersatz"), kommen zu keinem Enter-Commit hinzu.
- **Keine Rückkehr-Markierung** (ein Kommentarfeld ändert beim Commit seine Form nicht).
- Die technische Lösung (ortsgebundener `:key` an `Bewertungsachse`) liegt beim `architekt`.

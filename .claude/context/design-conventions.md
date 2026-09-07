# Design Conventions — bewertung-app

> **Single-Writer: Nur der `ux-ui-designer`-Agent schreibt hierhin.** Alle
> anderen Rollen lesen nur; der `frontend-lead` setzt daraus um.
>
> Zweck: Das Gedächtnis des Designers. Einmal entschiedene
> Interaktions-Konventionen stehen hier, damit sie beim nächsten Feature
> wiederverwendet statt neu erfunden werden. Kein Styleguide, kein
> Moodboard — nur Festlegungen, die für die Umsetzung bindend sind und
> direkt in Code übersetzbar bleiben.
>
> **Kuratieren statt anhängen.** Wird eine Konvention abgelöst, ersetze den
> Eintrag und aktualisiere das Datum, statt einen zweiten danebenzustellen.
> Zwei widersprüchliche Konventionen in dieser Datei erzeugen beim
> `frontend-lead` einen Patt auf gleicher Rangstufe und blockieren das
> Paket. Faustregel: < 150 Zeilen.

**Stand: noch nicht befüllt.** Der `ux-ui-designer` trägt hier ein, was er
je UI-Paket entscheidet.

- **Zuletzt kuratiert**: YYYY-MM-DD

## Zustände

Wie werden die Standard-Zustände einer Ansicht dargestellt?

| Zustand | Konvention                                                        | Seit       |
|---------|-------------------------------------------------------------------|------------|
| Leer    | `<z.B. zentrierte Illustration + Primär-Aktion, nie nur Text>`     | YYYY-MM-DD |
| Lädt    | `<z.B. Skeleton bei Listen; Spinner nur bei erwartet < 400ms>`     | YYYY-MM-DD |
| Fehler  | `<z.B. inline unter dem Feld, rote Border 1px, kein Modal>`        | YYYY-MM-DD |
| Erfolg  | `<z.B. Toast 3s, kein Redirect>`                                   | YYYY-MM-DD |

## Interaktion & Animation

- `<z.B. Ein-/Ausblendungen 150ms ease-out; nichts über 300ms>`
- `<z.B. destruktive Aktionen immer mit Bestätigungsdialog, nie Undo-Toast>`

## Formulare

- `<z.B. Validierung on-blur, nicht bei jedem Tastendruck>`
- `<z.B. Pflichtfelder mit Sternchen; optionale Felder nicht markiert>`

## Tokens & Spacing

- `<z.B. Spacing ausschließlich aus der 4er-Skala, keine freien px-Werte>`
- `<z.B. Farben nur über Design-Tokens, kein Hex im Component-Stylesheet>`

## Barrierefreiheit (Baseline)

- `<z.B. Fokus-Ring nie entfernen; jede Aktion per Tastatur erreichbar>`

## Bewusst offen gelassen

Punkte, die absichtlich pro Feature neu entschieden werden — hier
aufgeführt, damit sie niemand fälschlich als bestehende Konvention liest
oder als Lücke „auffüllt".

- `<z.B. Dichte von Tabellen — hängt vom jeweiligen Datenvolumen ab>`

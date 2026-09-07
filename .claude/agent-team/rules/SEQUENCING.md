# Reihenfolge und Abhängigkeiten

Gilt für `architekt` (setzt die Felder) und `frontend-lead` (prüft sie).
Feldbedeutungen: `HANDOFF_SCHEMA.md` (im selben Ordner).

Die Rollen laufen nicht frei parallel — Implementierung setzt fertige
Vorarbeit voraus. Drei harte Regeln:

## 1. Kein Frontend ohne fertiges Design

Bei `ui_impact: true` startet der `frontend-lead` erst, wenn `design_notes`
gefüllt **und** `design_open_questions` leer ist.

Er denkt sich fehlendes Design **nicht selbst aus** — auch nicht
„naheliegend", „analog zur Nachbarkomponente" oder „erstmal als Platzhalter".
Fehlt es: `status: "blocked"`, `target_role: "ux-ui-designer"`.

## 2. Backend startet ohne Design

Der `backend-lead` wartet nie auf den Designer. `routing: "backend"` läuft
sofort los; bei `routing: "both"` startet der Backend-Teil parallel zur
Design-Abstimmung. Der Backend-Teil bekommt nie ein `depends_on` auf den
Frontend-Teil.

## 3. Kein blindes Frontend gegen fehlendes Backend

Braucht ein Frontend-Paket Backend-Funktionen, die es noch nicht gibt,
entscheidet **der `architekt`** — nie der Lead selbst — über
`frontend_start`:

| Wert | Bedeutung | Wann |
|------|-----------|------|
| `after_backend` | Start erst, wenn alle `depends_on`-Pakete `done` sind. | **Standardfall**, wenn neue Backend-Funktionalität gebraucht wird. |
| `against_contract` | Start sofort gegen die in `backend_contract` beschriebene Ziel-Schnittstelle. | Wenn der Contract stabil festliegt und Parallelität den Aufwand lohnt. |
| `independent` | Start sofort, ohne Backend-Bezug. | Nur ohne neue Backend-Funktion: reine UI-Änderung, Styling, bestehende Endpunkte. |

**Ist `frontend_start` nicht gesetzt**, gilt:

- `routing: "both"` ⇒ `after_backend` — der sichere Fall.
- `routing: "frontend"` mit gesetztem `depends_on` ⇒ ebenfalls
  `after_backend`.
- `routing: "frontend"` mit leerem `depends_on` ⇒ es gibt nichts zu warten,
  der Lead startet.

Bei `against_contract` trägt der `architekt` `backend_contract` in **beide**
Teilpakete ein — der `backend-lead` sieht sonst nie, wogegen das Frontend
bereits baut.

Bei `against_contract` ohne brauchbares `backend_contract` blockiert der
`frontend-lead` und gibt an den `architekt` zurück: Ein Contract, der nur
behauptet wird, ist kein Contract. Der Lead füllt ihn **nicht** selbst aus —
das wäre genau das blinde Entwickeln, das die Regel verhindern soll.

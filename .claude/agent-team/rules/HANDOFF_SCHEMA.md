# Handoff-Schema

Alle Übergaben zwischen den Rollen laufen über **ein** schlankes JSON-Objekt
pro Arbeitspaket — nicht über den vollen Gesprächsverlauf. Jeder Agent liest
das Handoff-Objekt und schreibt beim Weiterreichen ein aktualisiertes.

Die Regeln sind auf drei Dateien aufgeteilt, damit jede Rolle nur lädt, was
sie braucht. **Nach Belang geschnitten, nicht nach Rolle** — ein Belang steht
genau einmal, auch wenn ihn mehrere Rollen brauchen:

| Datei | Inhalt | Lesen |
|-------|--------|-------|
| `HANDOFF_SCHEMA.md` (hier) | Felder, Beispiel, Grundregeln | alle |
| `PRECEDENCE.md` | Rangfolge bei widersprüchlichen Vorgaben, Patt-Regel | `architekt`, beide Leads, `ux-ui-designer` |
| `SEQUENCING.md` | Wann Frontend/Backend starten dürfen | `architekt`, `frontend-lead` |

Jeder Agent-Prompt nennt die Felder, die er liest und setzt — aber nur die
**Namen**. Die Bedeutung steht ausschließlich hier, damit eine Schemaänderung
nur an einer Stelle nachgezogen werden muss.

## Pflichtfelder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `task_id` | string | Stabile ID (`PO-<YYYY-MM-DD>-<NNN>`). Vom product-owner vergeben, unverändert über alle Handoffs. |
| `bounded_context` | string | Name aus `context-map.md`. Falls neu: vom architekt vergeben. |
| `constraints` | array\<string\> | Technische/architektonische Vorgaben. |
| `acceptance_criteria` | array\<string\> | Prüfbare Kriterien — keine Prosa. |
| `files_to_touch` | array\<string\> | Pfade oder Globs. Vom architekt gefüllt, vom Lead präzisierbar. |

## Optionale Felder

| Feld | Typ | Gesetzt von | Beschreibung |
|------|-----|-------------|--------------|
| `source_role` / `target_role` | string | jeweils | Absender / Empfänger. |
| `parent_task_id` | string \| null | architekt / Lead | Gesetzt beim Split: vom architekt bei `-fe`/`-be`, vom Lead bei Sub-Tasks. |
| `ui_impact` | boolean | product-owner | Sichtbare UI-Auswirkung? Steuert Design-Schleife und die Startsperre des frontend-lead. |
| `design_notes` | array\<string\> | ux-ui-designer | Interaktions-/Animations-Vorgaben. Nur was paket-spezifisch ist — Projektweites steht in `design-conventions.md`. |
| `design_open_questions` | array\<string\> | ux-ui-designer | Offene Verhaltensfragen an den product-owner. **Nicht leer ⇒ Design nicht final ⇒ frontend-lead startet nicht.** |
| `routing` | `frontend` \| `backend` \| `both` | architekt | An wen das Paket geht. |
| `depends_on` | array\<string\> | architekt | `task_id`s, die `done` sein müssen, bevor dieses Paket startet. |
| `frontend_start` | `after_backend` \| `against_contract` \| `independent` | architekt | Wann der frontend-lead darf. Siehe `SEQUENCING.md` (im selben Ordner). |
| `backend_contract` | object \| null | architekt | Pflicht bei `against_contract`: Ziel-Schnittstelle (Endpunkt, Request/Response, Fehlerfälle, Events), konkret genug zum Dagegenbauen. **Steht in beiden Teilpaketen** (`-fe` und `-be`) — Bauvorlage fürs Frontend, Lieferzusage fürs Backend. Jeder Lead sieht nur sein eigenes Handoff. |
| `spawn_subtasks` | boolean | Lead | Schwelle überschritten, Subagents werden gespawnt. Schwelle und Definition im jeweiligen Agent-Prompt. |
| `subtasks` | array\<Handoff\> | Lead | Sub-Handoffs, je mit `parent_task_id`. |
| `status` | `open` \| `in_progress` \| `blocked` \| `done` | jeweils | Fortschritt, primär für `/orchestrate`. `done` heißt **implementiert und validiert**, nicht abgenommen — `depends_on` wartet auf genau dieses `done`, nicht auf die Abnahme. |
| `accepted` | boolean \| null | product-owner | Ergebnis der Abnahme. `null` = noch nicht geprüft, `true` = alle `acceptance_criteria` am Code nachvollziehbar erfüllt, `false` = Befunde in `review_findings`. Nur der product-owner setzt `true`/`false`; der Lead setzt es nach Nacharbeit auf `null` zurück, damit erneut abgenommen wird. |
| `review_findings` | array\<string\> | product-owner | Pflicht bei `accepted: false`. Je Eintrag: welches Kriterium, was fehlt oder abweicht, wo im Code. Keine Lösungsvorschläge — die macht der Lead. |
| `blocked_reason` | string \| null | jeweils | **Pflicht bei `blocked`.** Was blockiert — kollidierende Vorgaben im Wortlaut, nicht paraphrasiert. |
| `notes_for_learnings` | array\<string\> | Leads | Kandidaten für `learnings.md`. Nur der architekt übernimmt. |
| `notes_for_conventions` | array\<string\> | Leads | Beobachtungen zu Struktur/Benennung für `code-conventions.md`. Nur der architekt übernimmt. |
| `user_questions` | array\<object\> | product-owner, architekt, design-concept (**immer**, notfalls `[]`) | Fragen, die **nur der Nutzer** beantworten kann. **Pflicht je Eintrag: alle vier Felder** — `frage`, `optionen` (2–4 konkrete Antwortmöglichkeiten), `warum` (was ohne Antwort geraten würde), `annahme` (womit du weiterarbeitest, falls keine Antwort kommt). Siehe Grundregel 4. **Nicht leer ⇒ das Ergebnis steht unter Vorbehalt** und wird nicht als endgültig behandelt. |

## Beispiel

```json
{
  "task_id": "PO-2026-08-29-001-fe",
  "parent_task_id": "PO-2026-08-29-001",
  "source_role": "architekt",
  "target_role": "frontend-lead",
  "bounded_context": "checkout",
  "routing": "frontend",
  "ui_impact": true,
  "depends_on": ["PO-2026-08-29-001-be"],
  "frontend_start": "against_contract",
  "backend_contract": {
    "endpoint": "POST /api/v1/carts/{cartId}/discount-codes",
    "request": { "code": "string" },
    "response_200": { "discountCents": "number", "totalCents": "number" },
    "errors": {
      "404": "Code existiert nicht",
      "409": "Code abgelaufen oder bereits eingelöst"
    }
  },
  "constraints": [
    "Bestehenden NgRx-Feature-State 'cart' erweitern, keinen neuen Store anlegen",
    "Kein direkter HTTP-Call aus der Komponente — über CartFacade"
  ],
  "acceptance_criteria": [
    "Nutzer sieht Rabattcode-Feld im Checkout-Schritt 2",
    "Ungültiger Code zeigt Inline-Fehlermeldung ohne Seiten-Reload",
    "Gültiger Code aktualisiert die Summenanzeige ohne Redirect"
  ],
  "files_to_touch": [
    "src/app/checkout/cart/cart.facade.ts",
    "src/app/checkout/cart/components/discount-code/**"
  ],
  "design_notes": [
    "Abgelaufener Code (409) bekommt eigenen Text, nicht dieselbe Meldung wie 404"
  ],
  "design_open_questions": [],
  "user_questions": [],
  "spawn_subtasks": false,
  "status": "open"
}
```

## Grundregeln

1. **Kein Kontext-Dump.** Was nicht in ein Feld passt, gehört nicht ins
   Handoff. Wer übergibt, fasst zusammen.
2. **Eine `task_id` wird nie umbenannt.** Sie bleibt über den gesamten
   Lebenszyklus ihres Pakets dieselbe. Abgeleitete Pakete (`-fe`/`-be`,
   Sub-Tasks) bekommen eine **eigene** `task_id` und zeigen über
   `parent_task_id` auf die ursprüngliche — sie überschreiben sie nicht.
3. **Kompaktes JSON** ohne Markdown drumherum — im Subagent-Prompt wie als
   Rückgabewert.
4. **Kein Agent fragt den Nutzer selbst.** `AskUserQuestion` ist in
   Subagents **nicht verfügbar** — die Laufzeitumgebung entfernt das Werkzeug
   aus jedem Subagent, auch wenn es im Frontmatter stünde. Nur der
   aufrufende Hauptthread (`/orchestrate` bzw. der Nutzer selbst) kann fragen.

   Eine Frage an den Nutzer geht deshalb **nie** verloren und **nie** in den
   Fließtext, sondern in `user_questions`:

   ```json
   "user_questions": [
     {
       "frage": "Soll ein laufender Export weiterlaufen, wenn der Nutzer die Seite verlässt?",
       "optionen": ["Weiterlaufen, Ergebnis später abrufbar", "Abbrechen beim Verlassen"],
       "warum": "Bestimmt, ob der Job serverseitig persistiert werden muss",
       "annahme": "Weiterlaufen — der Request nennt lange Laufzeiten als Grund für Asynchronität"
     }
   ]
   ```

   Regeln dazu:
   - **Alle vier Felder, jedes Mal.** Sie sind keine Ausschmückung, sondern
     das, woraus der Aufrufer die Frage baut: Ohne `optionen` muss er sich
     die Antwortmöglichkeiten selbst ausdenken — und trifft damit genau die
     Entscheidung, die er dir abnehmen sollte. Ohne `warum` kann der Nutzer
     nicht abwägen und wählt nach Bauchgefühl. Ein Eintrag mit nur `frage`
     und `annahme` ist ein unvollständiger Eintrag, kein kurzer.
   - **Das Feld, nicht der Fließtext.** Eine Frage zählt nur, wenn sie
     **im JSON** unter `user_questions` steht. Ein Abschnitt „user_questions"
     in der Prosa daneben erreicht den Nutzer nicht — der Aufrufer liest das
     Objekt. Ist nichts offen, steht dort `"user_questions": []`; das Feld
     ganz wegzulassen ist nicht dasselbe und macht „keine Fragen" von
     „vergessen" ununterscheidbar.
   - **Blockiere nicht.** Arbeite mit `annahme` weiter und liefere ein
     vollständiges Ergebnis. Ein Agent, der auf eine Antwort wartet, die
     ihn nie erreichen kann, hält den ganzen Ablauf an.
   - **Rate nicht stillschweigend.** Jede Annahme, die eine echte
     Produkt- oder Markenentscheidung ersetzt, gehört als Eintrag hierher —
     sonst sieht sie im Ergebnis wie eine geklärte Festlegung aus.
   - **Bündele.** Höchstens 3 Einträge pro Aufruf, gebündelt statt
     nacheinander.
   - Rollen, die kein Handoff-Objekt zurückgeben (`design-concept`), geben
     dieselbe Struktur als eigenen Block `user_questions` im Ergebnis aus.

   Der Aufrufer legt die Fragen dem Nutzer vor und ruft den Agenten mit den
   Antworten erneut auf. Was der Agent hier nicht einträgt, wird nie
   gefragt.
5. **Single-Writer je Datei.** Jede Datei unter `.claude/context/` hat genau
   eine schreibende Rolle; alle anderen lesen nur.

   | Datei | Schreibt | Vorschläge über |
   |-------|----------|-----------------|
   | `context-map.md` | `architekt` | — |
   | `adr/*.md` + `adr/INDEX.md` | `architekt` | — |
   | `learnings.md` | `architekt` | `notes_for_learnings` |
   | `code-conventions.md` | `architekt` | `notes_for_conventions` |
   | `design-concept.md` | `design-concept` | — |
   | `design-conventions.md` | `ux-ui-designer` | Konflikt-Liste von `design-concept` nach einer Konzeptänderung; Meldungen der Leads über `notes_for_learnings`, wenn eine Konvention per Rangfolge überstimmt wurde |

   Pro Datei formuliert, nicht pro Rolle: So pflegen die Design-Rollen ihr
   eigenes Gedächtnis, ohne Umweg über den Architekten. Das schützt gegen
   Konflikte **zwischen** Rollen, nicht gegen mehrere Instanzen **derselben**
   Rolle — deshalb laufen `architekt`, `ux-ui-designer` und `design-concept`
   je als Einzelinstanz.

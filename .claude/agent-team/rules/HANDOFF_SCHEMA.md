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

**Der Aufrufmodus gehört nicht ins Handoff.** In welchem Modus eine Rolle
gerufen wird (zerlegen, abnehmen, einordnen, nachpflegen …), ist eine
Eigenschaft des *Aufrufs*, nicht des Arbeitspakets — ein Aufruf kann mehrere
Pakete umfassen. Der Aufrufer nennt ihn deshalb im Prompt-Text (`Modus:
<name>`), nicht als Feld im Objekt. Die Modus-Namen stehen im jeweiligen
Agent-Prompt.

## Pflichtfelder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `task_id` | string | Stabile ID (`PO-<YYYY-MM-DD>-<NNN>`). Vom product-owner vergeben, unverändert über alle Handoffs. |
| `constraints` | array\<string\> | Technische/architektonische Vorgaben. |
| `acceptance_criteria` | array\<object\> | Prüfbare Kriterien — keine Prosa. **Je Kriterium ein Objekt** mit `kriterium` (der Satz), `pruefung` (`test` \| `code` \| `manuell`), `ziel` (woran geprüft wird: Testname, erwartete Fundstelle, oder was ein Mensch ansehen muss) und `ergebnis` (vom Lead gefüllt, sonst `null`) und bei der Abnahme `abnahme` (vom product-owner: `{status, beleg}`). Siehe Grundregel 6. Reine Strings sind Altbestand und weiterhin lesbar; wer ein solches Paket anfasst, überführt sie ins Objektformat. |
| `files_to_touch` | array\<string\> | Pfade oder Globs. Vom architekt gefüllt, vom Lead präzisierbar. |

## Optionale Felder

| Feld | Typ | Gesetzt von | Beschreibung |
|------|-----|-------------|--------------|
| `bounded_context` | string | architekt | Name aus `context-map.md`, falls neu vom architekt vergeben. **Der product-owner lässt es leer** — er kennt die Context-Map nicht und seine Vermutung würde ohnehin überschrieben. |
| `titel` | string | product-owner | Kurzer Klartext-Titel des Pakets (max. ~8 Wörter), z.B. „Barcode-Scan im Eintrags-Dialog". Die `task_id` allein sagt einem Menschen nichts — der Titel ist das, woran er das Paket wiedererkennt, wenn eine Rückfrage kommt. Bleibt über alle Handoffs unverändert. |
| `source_role` / `target_role` | string | jeweils | Absender / Empfänger. |
| `parent_task_id` | string \| null | architekt / Lead | Gesetzt beim Split: vom architekt bei `-fe`/`-be`, vom Lead bei Sub-Tasks. |
| `ui_impact` | boolean | product-owner | Sichtbare UI-Auswirkung? Steuert Design-Schleife und die Startsperre des frontend-lead. |
| `design_notes` | array\<string\> | ux-ui-designer | Interaktions-/Animations-Vorgaben. Nur was paket-spezifisch ist — Projektweites steht in `design-conventions.md`. |
| `design_demo` | string \| null | ux-ui-designer | Pfad zu einer Wegwerf-Demo (`.claude/demos/<task_id>.html`), die den Ist-Stand und die Varianten der offenen Frage zeigt. Nur gesetzt, wenn es etwas Sichtbares zu entscheiden gibt. Reine Anschauung — kein Produktcode, nicht getestet, nicht importiert. Siehe `ux-ui-designer`. |
| `design_open_questions` | array\<string\> | ux-ui-designer | Offene Verhaltensfragen an den product-owner. **Nicht leer ⇒ Design nicht final ⇒ frontend-lead startet nicht.** |
| `routing` | `frontend` \| `backend` \| `both` | architekt | An wen das Paket geht. |
| `depends_on` | array\<string\> | architekt | `task_id`s, die `done` sein müssen, bevor dieses Paket startet. |
| `frontend_start` | `after_backend` \| `against_contract` \| `independent` | architekt | Wann der frontend-lead darf. Siehe `SEQUENCING.md` (im selben Ordner). |
| `backend_contract` | object \| null | architekt | Pflicht bei `against_contract`: Ziel-Schnittstelle (Endpunkt, Request/Response, Fehlerfälle, Events), konkret genug zum Dagegenbauen. **Steht in beiden Teilpaketen** (`-fe` und `-be`) — Bauvorlage fürs Frontend, Lieferzusage fürs Backend. Jeder Lead sieht nur sein eigenes Handoff. |
| `spawn_subtasks` | boolean | Lead | Schwelle überschritten, Subagents werden gespawnt. Schwelle und Definition im jeweiligen Agent-Prompt. |
| `subtasks` | array\<Handoff\> | Lead | Sub-Handoffs, je mit `parent_task_id`. |
| `status` | `open` \| `in_progress` \| `blocked` \| `done` | jeweils | Fortschritt, primär für `/orchestrate`. `done` heißt **implementiert und validiert**, nicht abgenommen — `depends_on` wartet auf genau dieses `done`, nicht auf die Abnahme. |
| `accepted` | boolean \| null | product-owner | Ergebnis der Abnahme. `true` = alle `acceptance_criteria` nachvollziehbar erfüllt, `false` = Befunde in `review_findings`. Nur der product-owner setzt `true`/`false`; der Lead setzt es nach Nacharbeit auf `null` zurück, damit erneut abgenommen wird. **`null` heißt zweierlei — `user_questions` unterscheidet:** leer ⇒ noch nicht geprüft; gefüllt ⇒ geprüft, aber eine Entscheidung steht beim Nutzer (Scope verschoben o.ä.). Ohne diesen Blick behandelt der Aufrufer eine Eskalation wie einen offenen Rest. |
| `review_findings` | array\<string\> | product-owner | Pflicht bei `accepted: false`. Je Eintrag: welches Kriterium, was fehlt oder abweicht, wo im Code. Keine Lösungsvorschläge — die macht der Lead. |
| `blocked_reason` | string \| null | jeweils | **Pflicht bei `blocked`.** Was blockiert — kollidierende Vorgaben im Wortlaut, nicht paraphrasiert. |
| `files_touched` | array\<string\> | Lead | Die **tatsächlich** geänderten Dateien — im Unterschied zu `files_to_touch` (Plan). Pflicht bei `status: "done"`. Kein anderer Feldname (nicht `files_to_touch_tatsaechlich`). |
| `criteria_changes` | array\<object\> | Lead | Jedes Kriterium, das der Lead **inhaltlich geändert, gestrichen oder ergänzt** hat — je Eintrag `kriterium`, `vorher`, `jetzt`, `grund`. Ein Lead ändert Kriterien nie still; der product-owner prüft die Änderung bei der Abnahme und entscheidet, ob sie gilt. Fehlt der Eintrag, gilt das ursprüngliche Kriterium. |
| `user_answers` | array\<object\> | Orchestrator | Antworten des Nutzers auf frühere `user_questions` — je Eintrag `id` (die der Frage), `antwort` (Wortlaut oder gewählte Option), `art` (`option` \| `frei` \| `annahme_gilt`, letzteres wenn keine Antwort kam). Gibt der Orchestrator beim erneuten Aufruf mit; die Rolle liest sie und trägt sie nicht selbst ein. So lässt sich jede Frage ihrer Antwort zuordnen. |
| `notes_for_learnings` | array\<string\> | Leads | Kandidaten für `learnings.md`. Nur der architekt übernimmt. |
| `notes_for_conventions` | array\<string\> | Leads | Beobachtungen zu Struktur/Benennung für `code-conventions.md`. Nur der architekt übernimmt. |
| `roundtrips` | object | wer zurückschickt | Zähler je Schleifenart: `design`, `blocked`, `review`. **Wer ein Paket zurückgibt, erhöht seinen Zähler im Objekt** — siehe Grundregel 5. Fehlt das Feld, gilt `{"design":0,"blocked":0,"review":0}`. |
| `frage_kontext` | string | wer `user_questions` füllt | **Pflicht, sobald `user_questions` nicht leer ist.** Kurze Zusammenfassung von Ausgangslage, Problem und Lösung für alle Fragen dieses Objekts — max. **10 Sätze**. Der Nutzer sieht sie unmittelbar vor der Frage; ohne sie klickt er auf die empfohlene Option, weil er nicht weiß, worum es geht. Siehe Grundregel 4. |
| `user_questions` | array\<object\> | product-owner, architekt, design-concept (**immer**, notfalls `[]`) | Fragen, die **nur der Nutzer** beantworten kann. **Pflicht je Eintrag: `id` (`q-<task_id>-<n>`, je Paket von 1 hochgezählt) und alle vier Felder** — `frage`, `optionen` (2–4 konkrete Antwortmöglichkeiten), `warum` (was ohne Antwort geraten würde), `annahme` (womit du weiterarbeitest, falls keine Antwort kommt). Siehe Grundregel 4. **Nicht leer ⇒ das Ergebnis steht unter Vorbehalt** und wird nicht als endgültig behandelt. |

## Beispiel

```json
{
  "task_id": "PO-2026-08-29-001-fe",
  "titel": "Rabattcode-Feld im Checkout",
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
    "Bestehenden Cart-State erweitern, keinen neuen Store anlegen",
    "Kein direkter HTTP-Call aus der Komponente — über die bestehende Cart-Schnittstelle"
  ],
  "acceptance_criteria": [
    {
      "kriterium": "Nutzer sieht Rabattcode-Feld im Checkout-Schritt 2",
      "pruefung": "code",
      "ziel": "src/app/checkout/cart/components/discount-code/*.html",
      "ergebnis": null
    },
    {
      "kriterium": "Ungültiger Code zeigt Inline-Fehlermeldung ohne Seiten-Reload",
      "pruefung": "test",
      "ziel": "discount-code.component.spec.ts › zeigt Fehlertext bei 404",
      "ergebnis": null
    },
    {
      "kriterium": "Die Summenanzeige wirkt nach dem Einlösen ruhig, nicht sprunghaft",
      "pruefung": "manuell",
      "ziel": "Checkout-Schritt 2 im Browser ansehen — Wirkung ist am Code nicht beurteilbar",
      "ergebnis": null
    }
  ],
  "files_to_touch": [
    "src/app/checkout/cart/cart.facade.ts",
    "src/app/checkout/cart/components/discount-code/**"
  ],
  "design_notes": [
    "Abgelaufener Code (409) bekommt eigenen Text, nicht dieselbe Meldung wie 404"
  ],
  "design_open_questions": [],
  "design_demo": null,
  "user_questions": [],
  "roundtrips": { "design": 2, "blocked": 0, "review": 0 },
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
       "id": "q-PO-2026-08-29-003-1",
       "frage": "Soll ein laufender Export weiterlaufen, wenn der Nutzer die Seite verlässt?",
       "optionen": ["Weiterlaufen, Ergebnis später abrufbar", "Abbrechen beim Verlassen"],
       "warum": "Bestimmt, ob der Job serverseitig persistiert werden muss",
       "annahme": "Weiterlaufen — der Request nennt lange Laufzeiten als Grund für Asynchronität"
     }
   ]
   ```

   Regeln dazu:
   - **`id` und alle vier Felder, jedes Mal.** Die `id` ordnet der Nutzer-Antwort (`user_answers`) ihre Frage zu. Sie sind keine Ausschmückung, sondern
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
   - **Ohne Kontext keine Frage.** Der Nutzer sieht deine Frage mitten in
     einem langen Lauf, ohne das Gespräch davor. Ein Dialog mit drei
     Optionen und einer „empfohlenen" beantwortet sich dann von selbst:
     Man klickt die Empfehlung, weil man nicht weiß, wonach gefragt wird.
     Deshalb steht zu jedem Fragenkomplex ein `frage_kontext` — **ein**
     Text für alle Fragen dieses Objekts, **höchstens 10 Sätze**, in dieser
     Reihenfolge:

     1. **Ausgangslage** — worum geht es (Feature, Bildschirm, Paket) und
        wie ist der Stand jetzt?
     2. **Problem** — was ist offen, und warum lässt es sich nicht ohne den
        Nutzer entscheiden?
     3. **Lösung** — was würdest du tun und warum? Das ist die `annahme`,
        in ganzen Sätzen begründet.

     Er muss **allein stehen**. Der Leser kennt weder das Gespräch noch
     deine internen Begriffe: Nenne das Feature in den Worten des Nutzers,
     und erkläre Fachwörter (Komponentennamen, ADR-Nummern, Paketkürzel)
     mit einem Halbsatz, statt sie vorauszusetzen. Er wiederholt nicht die
     Frage und listet nicht die Optionen — die stehen im Dialog. Gibt es
     eine `design_demo`, nenne sie im Kontext.
   - Rollen, die kein Handoff-Objekt zurückgeben (`design-concept`), geben
     dieselbe Struktur als eigenen Block `user_questions` samt
     `frage_kontext` im Ergebnis aus.

   Der Aufrufer legt die Fragen dem Nutzer vor und ruft den Agenten mit den
   Antworten erneut auf. Was der Agent hier nicht einträgt, wird nie
   gefragt.
5. **Schleifen zählen im Objekt, nicht im Gedächtnis.** Jede Rückschleife im
   Ablauf hat eine Obergrenze. Die Grenze wird am Feld `roundtrips` geprüft —
   nicht daran, ob sich jemand erinnert, wie oft dieses Paket schon zurück
   war. Über einen Lauf mit mehreren Paketen und drei Schleifenarten ist das
   sonst eine Gedächtnisleistung, die zuverlässig scheitert.

   Genau **eine** Rolle erhöht je Zähler, und zwar beim Zurückgeben:

   | Zähler | Erhöht von | Beim |
   |--------|------------|------|
   | `design` | `ux-ui-designer` | Abschluss jeder Designrunde |
   | `blocked` | dem Lead, der blockiert | Setzen von `status: "blocked"` |
   | `review` | `product-owner` | Setzen von `accepted: false` |

   Du erhöhst **nur deinen eigenen** Zähler und lässt die anderen unverändert
   stehen. Fehlt das Feld im eingehenden Objekt, legst du es mit allen drei
   Zählern auf `0` an und erhöhst dann deinen. Ein Zähler wird nie
   zurückgesetzt — auch nicht, wenn das Paket zwischendurch weiterlief.

   **Rollen ohne eigenen Zähler reichen das Feld unverändert durch.** Der
   `architekt` etwa zählt nichts, bekommt aber blockierte Pakete und gibt sie
   zurück — lässt er `roundtrips` dabei weg, beginnt die Zählung von vorn und
   die Obergrenze greift nie.

   Die Obergrenzen selbst stehen in `/orchestrate`; hier steht nur, wer zählt.
6. **Jedes Kriterium nennt, woran es geprüft wird.** Ein Kriterium ohne
   Prüfmethode ist eine Absichtserklärung: Bei der Abnahme bleibt dann nur
   Lesen und Schätzen, obwohl die härteste Evidenz — der Testlauf des Leads —
   längst existiert und nur nirgends festgehalten wurde.

   Deshalb trägt jedes Kriterium drei Angaben, die der `product-owner` beim
   Zerlegen setzt:

   | `pruefung` | `ziel` | Wird bei der Abnahme zu |
   |---|---|---|
   | `test` | Testname/-datei, die das Kriterium abdeckt | *erfüllt*, wenn der Test existiert und laut `ergebnis` grün war |
   | `code` | erwartete Fundstelle (Pfad oder Glob) | *erfüllt*, wenn die Stelle da ist und trägt, was das Kriterium verlangt |
   | `manuell` | was ein Mensch ansehen muss, und warum es am Code nicht geht | *nicht am Code beurteilbar* — ein legitimes Urteil, keine Ausrede |

   Bei der Abnahme setzt der `product-owner` je Kriterium `abnahme`:
   `{"status": "geprueft" | "uebernommen" | "nicht_beurteilbar", "beleg": "…"}`.
   `geprueft` = in dieser Abnahme am Code nachvollzogen, `beleg` ist `Datei:Zeile`
   oder die Fundstelle des Tests. `uebernommen` = aus einer früheren Abnahme
   übernommen, nicht neu geprüft; `beleg` verweist auf diese Abnahme. `nicht_beurteilbar`
   = am Code nicht prüfbar (z. B. `manuell`); `beleg` nennt, was fehlt. Ohne
   diese Unterscheidung sagt `accepted: true` nicht, wie viel tatsächlich
   geprüft wurde.

   `ergebnis` füllt der **Lead** beim Abschluss: kurz, was er ausgeführt hat
   und wie es ausging (`"grün — 14 Tests, exit 0"`). Bei `manuell` bleibt es
   `null`.

   **Der Nebeneffekt ist der eigentliche Gewinn:** Ein Kriterium, für das
   sich keine Prüfmethode benennen lässt, ist schlecht formuliert — und das
   fällt jetzt beim *Zerlegen* auf statt erst bei der Abnahme. `manuell` ist
   dabei kein Ausweichen, sondern die ehrliche dritte Möglichkeit; sie
   braucht nur eine Begründung.
7. **Behauptungen im Auftrag sind belegt oder als unverifiziert markiert.**
   Was der Aufrufer einer Rolle als Ist-Stand des Codes mitgibt (ein Wortlaut,
   eine Dateistruktur, „das gibt es schon"), stammt oft aus dem Bericht einer
   anderen Rolle und wurde nie am Code gesehen. Der Aufrufer gibt es deshalb
   mit Quelle weiter (`Datei:Zeile`) oder schreibt „unverifiziert". Die
   empfangende **planende** Rolle prüft solche Behauptungen mit `Grep`/`Read`,
   **bevor** sie darauf aufbaut, und meldet eine falsche im Ergebnis, statt
   sie zu übernehmen.
8. **Das Schema ist geschlossen.** Ein Handoff-Objekt trägt nur Felder aus
   diesen Tabellen. Eigene Felder (`files_touched` unter anderem Namen,
   `acceptance_criteria_status`, `…_aenderung`) kommen vor, weil etwas
   Echtes fehlt — melde es über `notes_for_conventions` oder `notes_for_learnings`,
   statt das Objekt zu erweitern: Ein Feld, das nur eine Rolle kennt, liest
   niemand.
9. **Berichte knapp, Nachweise in Dateien.** Die Rückgabe einer Rolle besteht aus
   einem Kopf (höchstens 10 Zeilen: was getan, was offen, was der Aufrufer wissen
   muss), dem Handoff-JSON und optional einem Anhang. Was ein Mensch später
   nachschlagen will — Rot-Nachweise, Mutationslisten, Messwerte, lange
   Begründungen — gehört nach `docs/pakete/<task_id>.md`, im Bericht steht der Pfad.
   Der Aufrufer reicht Pfade und Abschnittsnamen weiter, **nicht** Auszüge: Ein
   Bericht, der den Inhalt der Datei wiederholt, wird beim Weiterreichen mehrfach
   bezahlt. Gedächtnisdateien lesen heißt: Hauptdatei, dann nur die Themendatei zum
   Paket (`rules/CONTEXT_BUDGET.md`).
10. **Single-Writer je Datei.** Jede Datei unter `.claude/context/` hat genau
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

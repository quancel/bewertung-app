---
description: Startet den vollen 6-Rollen Agent-Team-Workflow für einen Feature-Request.
argument-hint: <Feature-Beschreibung>
---

Du orchestrierst jetzt das 6-Rollen Agent-Team dieses Plugins für folgenden
Feature-Request:

> $ARGUMENTS

Alle Rollen kommunizieren über ein schlankes Handoff-JSON. Das Schema und
die Regeln (Präzedenz, Reihenfolge) liegen im Plugin und werden von den
Agents **selbst** geladen — du musst sie nicht öffnen und findest sie auch
nicht unter einem relativen Pfad, denn dein Arbeitsverzeichnis ist das
Ziel-Repo, nicht der Plugin-Ordner.

Führe den Workflow als Hauptthread, der die folgenden Agents
nacheinander/parallel aufruft (via `Agent`-Tool bzw. Subagent-Aufruf mit dem
jeweiligen `name` aus dem Frontmatter):

## Zwei Dinge, die du bei **jedem** Aufruf mitgibst

### 1. Den Modus — nenne ihn, lass ihn nicht erraten

Vier Rollen arbeiten in mehreren Modi. **Du weißt bei jedem Aufruf, welcher
es ist** — du rufst ja bewusst Schritt 3 oder Schritt 7 auf. Sag es dazu,
als erste Zeile des Aufrufs:

```
Modus: abnahme
```

| Rolle | Modi | Wo im Ablauf |
|---|---|---|
| `product-owner` | `zerlegen` · `design-fragen` · `freigeben` · `abnahme` | Schritt 1 · 2 · 3 · 7 |
| `architekt` | `einordnen` · `nachpflege` · `rückläufer` | Schritt 4 · 7b · 6 |
| `design-concept` | `anlegen` · `überarbeiten` | Schritt 1b · 6 |
| `ux-ui-designer` | `runde-1` · `runde-2` · `konventions-nachpflege` | Schritt 2 · 2 · 7b · 6 |

Bei einem Rückläufer aus Schritt 6 nimmst du den Modus, der zur **Ursache**
passt: kollidierende Konventionseinträge → `konventions-nachpflege`;
unfertiges Design → die nächste Designrunde, sofern `roundtrips.design` sie
noch zulässt; ein widersprüchliches Konzept → `überarbeiten`.

Die Agents können ihren Modus zur Not aus der Form der übergebenen Objekte
ableiten — aber diese Ableitung ist mehrdeutig, und eine falsch geratene
Runde kostet einen vollen Durchlauf. Der Modus im Aufruf **gewinnt** immer
gegen das, was der Agent selbst vermuten würde.

**Bei einer Antwortrunde** (du rufst denselben Agenten mit beantworteten
`user_questions` erneut auf) nennst du **denselben** Modus wie beim
ursprünglichen Aufruf — Antworten arbeiten die Annahmen ein, sie schieben
niemanden in den nächsten Abschnitt.

### 2. Den Schleifenzähler — lies ihn, zähle nicht mit

Jede Rückschleife hat eine Obergrenze. Die prüfst du am Feld `roundtrips`
des Pakets, **nicht** aus dem Gedächtnis:

| Zähler | Obergrenze | Erreicht ⇒ |
|--------|-----------|------------|
| `roundtrips.design` | 2 | Designschleife beenden, Rest an den Nutzer (Schritt 3) |
| `roundtrips.blocked` | 1 | Paket an den Nutzer, nicht erneut zurückreichen |
| `roundtrips.review` | 1 | Befunde an den Nutzer, keine weitere Abnahmerunde |

Erhöht werden die Zähler von den Agents selbst (Designer, blockierender
Lead, `product-owner` bei `accepted: false`) — du liest sie nur. Über einen
Lauf mit mehreren Paketen und drei Schleifenarten ist Mitzählen im Kopf
genau die Stelle, an der ein langer Ablauf kippt.

Fehlt das Feld in einem eingehenden Objekt, behandle es als
`{"design":0,"blocked":0,"review":0}` — und notiere die Lücke für die
Zusammenfassung, denn dann zählt eine Rolle nicht mit.

## Rückfragen laufen über dich — sonst gar nicht

**Kein Agent kann den Nutzer fragen.** `AskUserQuestion` wird aus jedem
Subagent entfernt, auch wenn es im Frontmatter steht. Du bist der einzige
hier, der es hat.

Die planenden Rollen (`product-owner`, `architekt`, `design-concept`) geben
Fragen deshalb im Feld `user_questions` zurück — je Eintrag mit `frage`,
`optionen`, `warum` und der `annahme`, unter der sie weitergearbeitet haben.
Dazu je Objekt ein `frage_kontext`: die kurze Einordnung (Ausgangslage, Problem,
Lösung), die der Nutzer vor der Frage zu sehen bekommt.

**Nach jedem Aufruf einer dieser Rollen prüfst du dieses Feld.** Ist es nicht
leer:

1. **Erst den Kontext, dann die Frage.** Der Nutzer sieht deine Rückfrage
   mitten in einem langen Lauf und kennt das Gespräch davor nicht. Ohne
   Einordnung klickt er die empfohlene Option, weil er nicht weiß, worum es
   geht — das ist der häufigste Weg, auf dem eine echte Entscheidung als
   Zufall endet. Deshalb gilt für **jedes** Objekt mit gefülltem
   `user_questions`: Schreibe **unmittelbar vor** dem `AskUserQuestion`-Aufruf,
   im selben Zug und als normalen Text, diesen Block:

   ```
   **Rückfrage zu „<titel>" (<task_id>)** — Schritt <n>, <Rolle>

   <frage_kontext, unverändert>

   Demo zum Ansehen: <design_demo>      ← nur wenn gesetzt
   ```

   Danach **ein** Dialog mit den Fragen dieses Objekts und den gelieferten
   `optionen`. Mehrere Objekte mit Fragen: je Objekt ein Block und ein Dialog,
   nacheinander — so steht der Kontext direkt bei den Fragen, zu denen er
   gehört, statt in einem gemeinsamen Vorspann zu verschwimmen.

   Den `frage_kontext` gibst du **unverändert** wieder; du kürzt ihn nicht und
   schmückst ihn nicht aus. Fehlt `titel`, nimm die `task_id` allein. Fehlt der
   `frage_kontext` (das Schema-Gate meldet es), gib das Paket einmal zurück;
   fehlt er danach immer noch, schreib **keinen** eigenen — nenne stattdessen
   Paket, Schritt und die `warum`-Angaben der Fragen, denn die sind der
   Kontext, den der Agent schon geliefert hat.
2. Rufe **denselben Agenten** mit den Antworten erneut auf, damit er sie
   einarbeitet — und sag dabei, aus welchem Schritt die Fragen stammen. Die
   Antworten ersetzen seine Annahmen; sie schieben ihn nicht in den nächsten
   Abschnitt. Beantwortete Fragen aus Schritt 1 führen zu einer
   überarbeiteten Zerlegung, nicht zur Freigabe.
3. Erst danach geht es weiter.

**Drei Formfehler, die du nicht selbst ausbügelst:**

- **Kein `frage_kontext`**, obwohl `user_questions` gefüllt ist, oder einer mit
  mehr als 10 Sätzen. Siehe oben: einmal zurück an den Agenten.
- **Ein Eintrag ohne `optionen` oder `warum`** ist unvollständig. Ergänze ihn
  **nicht** selbst — dann erfindest du die Antwortmöglichkeiten, also genau
  die Vorstrukturierung der Entscheidung, die beim Agenten liegt. Gib das
  Paket **einmal** an den Agenten zurück mit dem Hinweis, welche Felder
  fehlen. Kommt es erneut unvollständig, stellst du die Frage so gut es geht
  und vermerkst die Lücke in der Zusammenfassung.
- **Eine Frage im Fließtext statt im Feld** — ein Abschnitt „user_questions"
  neben dem JSON, während das Feld fehlt oder leer ist — zählt nicht als
  gestellte Frage. Auch hier: einmal zurück an den Agenten, damit er sie ins
  Objekt legt. Was nur in der Prosa steht, geht beim Weiterreichen der
  Handoffs verloren; das ist derselbe Fehler, den `user_questions`
  abstellen soll, nur eine Ebene tiefer.

Übergehst du das Feld, arbeitet das Team mit geratenen Annahmen weiter, die
im Ergebnis wie Festlegungen aussehen. Das ist der eine Fehler, der im ganzen
Ablauf nicht auffällt — die Pakete laufen durch, nur eben am Nutzer vorbei.
Ein Agent, der ein Ergebnis liefert und dabei `user_questions` füllt, hat
nichts falsch gemacht: Er blockiert bewusst nicht.

## Ablauf

0. **Stand der Vendor-Kopie prüfen** — nur zur Information, blockiert nichts.
   Hält das Ziel-Repo die Rollen als Projekt-Agents unter `.claude/`, kann die
   Kopie veraltet oder ohne die Protokoll-Hooks eingerichtet sein. Lauf einmal:

   ```bash
   python3 .claude/agent-team/scripts/check-vendor-stand.py 2>/dev/null
   ```

   Danach, ebenfalls nur zur Information:

   ```bash
   python3 .claude/agent-team/scripts/check-context-size.py 2>/dev/null
   ```

   Es meldet Gedächtnisdateien über ihrem Größenbudget (`rules/CONTEXT_BUDGET.md`).
   Gib `DRINGEND`-Zeilen mit weiter und schlag vor, den `architekt` bzw.
   `ux-ui-designer` im Nachpflege-Modus kuratieren zu lassen — als eigenes Paket,
   nicht mitten im Feature.

   Gibt es keine Ausgabe (oder das Skript nicht, etwa im Plugin-Betrieb),
   fahre fort. Gibt es `WARNUNG:`-Zeilen, gib sie dem Nutzer in der ersten
   Antwort wörtlich weiter und mach dann **ohne Rückfrage** weiter: Ein Sync
   ändert `.claude/` und gehört nicht in einen laufenden Feature-Durchlauf.

1. **`product-owner`** mit dem Feature-Request aufrufen (sein **Modus A**).
   Ergebnis: Entwurfspakete mit gesetztem `ui_impact` — **noch nicht** die
   finale, vom Nutzer freigegebene Liste.

   Der `product-owner` wird pro Feature **viermal** aufgerufen (Modi A–D
   in seinem Prompt): zerlegen, Design-Fragen beantworten, freigeben,
   abnehmen. Übergib ihm jedes Mal die Handoff-Objekte im aktuellen Stand —
   er erkennt den Modus daran.

1b. **Design-Konzept sicherstellen** — einmalig, nur wenn mindestens ein
   Paket `ui_impact: true` hat und `.claude/context/design-concept.md` im
   Ziel-Repo noch nicht existiert. Rufe dann den **`design-concept`**-Agenten
   auf, **bevor** die Paket-Schleife startet. Er läuft laut Frontmatter auf
   `opus` — kein Modell-Override nötig.

   Beim **Neuentwurf** gibt er `user_questions` zu Corporate Design,
   Charakter und Dark Mode zurück und schreibt das Konzept mit
   `Herkunft: neu entworfen — Bestätigung ausstehend`. Leg die Fragen dem
   Nutzer vor und ruf ihn mit den Antworten erneut auf (das ist sein
   **Auftrag B**), damit die Herkunft bestätigt wird. Das ist eine Setzung
   für alle künftigen Features — sie unbestätigt stehen zu lassen, ist die
   teuerste Abkürzung im ganzen Ablauf.

   Existiert das Konzept bereits, überspringst du diesen Schritt: Der
   `design-concept`-Agent wird **nicht** pro Feature aufgerufen, sondern nur
   beim Projektstart und bei gewollten Änderungen der Grundausrichtung.

   Verlangt der Nutzer eine **Überarbeitung** des Konzepts, ist das ein
   eigener Ablauf, kein Feature: `design-concept` aufrufen, und wenn er
   Konventions-Konflikte meldet, anschließend den **`ux-ui-designer`** mit
   dieser Liste, damit er `design-conventions.md` nachzieht.

2. **Design-Schleife** für jedes Entwurfspaket mit `ui_impact: true`.
   Du fährst die Schleife, weil der `product-owner` selbst keine Agents
   aufrufen kann:
   - **`ux-ui-designer`** mit dem Entwurfspaket aufrufen → liefert
     `design_notes` + `design_open_questions` und, wenn es etwas Sichtbares zu
     entscheiden gibt, eine `design_demo` (Wegwerf-HTML zur Anschauung).
     Übernimm sie ins Paketobjekt: Beim Fragenblock nennst du sie dem Nutzer.
   - Sind Fragen offen: **`product-owner`** mit diesen Fragen erneut
     aufrufen (**Modus B**) → er beantwortet sie und schärft die
     `acceptance_criteria`. Was er nicht selbst entscheiden darf, kommt als
     `user_questions` zurück — die stellst du (siehe oben), bevor der
     Designer seine zweite Runde bekommt.
   - **`ux-ui-designer`** ein zweites Mal aufrufen, um die Antworten
     einzuarbeiten.
   - **Schluss bei `roundtrips.design >= 2`** — der Designer erhöht den
     Zähler je Runde selbst. Bleiben Fragen offen, gehen sie in Schritt 3 an
     den Nutzer; nicht weiter iterieren. Ist `design_open_questions` schon
     nach Runde 1 leer, endet die Schleife dort — der Zähler ist eine
     Obergrenze, kein Soll.
   - Wie der Architekt läuft auch der Designer als **Einzelinstanz**: Er
     schreibt `design-conventions.md` und würde sich parallel selbst
     überschreiben. Pakete also nacheinander durch die Schleife geben.
   - Pakete mit `ui_impact: false` überspringen diesen Schritt vollständig.

3. **`product-owner`** für Priorisierung und Freigabe aufrufen (**Modus C**).
   Er präsentiert die Liste, gibt die Handoff-Objekte aus und stellt die
   Freigabe als Eintrag in `user_questions` (ganz / mit Änderungen / neu
   zerlegen). **Die Freigabe holst du ein**, er kann es nicht.

   - **„ganz freigeben"** → die Objekte gelten unverändert; leere ihr
     `user_questions` (die Frage ist beantwortet) und geh direkt zu Schritt 4
     weiter. Ein erneuter PO-Aufruf wäre reine Wiederholung.
   - **„mit Änderungen" / „neu zerlegen"** → `product-owner` erneut in
     Modus C aufrufen, mit der Antwort des Nutzers.

   Kein Paket geht ohne diese Freigabe an den `architekt`.

4. **`architekt`** für jedes bestätigte Handoff-Objekt aufrufen → liefert
   `constraints`, `bounded_context`, `routing`, `frontend_start` /
   `depends_on` / ggf. `backend_contract`, ggf. Split, ggf. ADR, und legt
   beim ersten Lauf `code-conventions.md` an.

   **Gib ihm die bereits eingeordneten Pakete desselben Features mit** — die
   angereicherten Handoff-Objekte aus den vorherigen Aufrufen dieses
   Schritts, nicht die Entwurfsfassung des `product-owner`. Er startet jedes
   Mal ohne Gedächtnis: Ob er in `-001` einen `backend_contract` gesetzt hat,
   kann er beim Einordnen von `-003` nur wissen, wenn das Objekt vor ihm
   liegt. Fehlt es, entscheidet er über die Reihenfolge auf Basis einer
   erratenen eigenen Vorgeschichte.

   **Immer nur eine `architekt`-Instanz gleichzeitig.** Bei mehreren
   Handoff-Objekten die Aufrufe **sequenziell** abarbeiten — der Architekt
   ist Single-Writer auf `context-map.md`, `adr/` samt `adr/INDEX.md`,
   `learnings.md` und `code-conventions.md`; parallele Instanzen würden sich beim Schreiben
   überschreiben und dieselbe ADR-Nummer vergeben.

5. Umsetzung, je nach `routing`:
   - `backend` → **`backend-lead`** sofort aufrufen.
   - `frontend` → **`frontend-lead`** aufrufen.
   - `both` → **`backend-lead` startet immer sofort.** Der `frontend-lead`
     richtet sich nach `frontend_start`:
     - `independent` → parallel zum Backend starten.
     - `against_contract` → parallel starten; das Handoff muss
       `backend_contract` enthalten.
     - `after_backend` (auch: Feld nicht gesetzt) → **erst aufrufen, wenn
       alle `depends_on`-Pakete `status: "done"` gemeldet haben.** Nicht
       vorher anstoßen, damit das Frontend nicht blind entwickelt.

6. Sammle die `status`-Rückmeldungen. Ein `blocked` kann aus jedem Schritt
   kommen — nicht nur von den Leads; der `architekt` gibt ein Paket bereits
   in Schritt 4 zurück, wenn das Design unfertig ist. Die Behandlung richtet
   sich nach `target_role`:
   - **`architekt`** (Patt zwischen gleichrangigen Vorgaben, oder fehlendes
     bzw. zu vages `backend_contract`): Handoff **einmal** an den
     `architekt` zurückreichen, danach den Lead erneut aufrufen.
   - **`ux-ui-designer`** (Design fehlt, ist unfertig, oder zwei
     Design-Konventionen kollidieren): Handoff **einmal** an den Designer
     zurückreichen; hat er weiterhin offene Fragen, gehen diese über den
     `product-owner` an den Nutzer.
   - **`design-concept`** (zwei Einträge in `design-concept.md`
     widersprechen sich): an den `design-concept`-Agenten. Meldet er dabei
     eine Konventions-Korrektur, rufe anschließend den `ux-ui-designer`
     damit auf.
     *Nicht* hierher gehört der Fall „Konzept widerspricht Konvention" — das
     ist kein Patt, sondern per Rangfolge aufgelöst (Konzept gewinnt); der
     Lead meldet die veraltete Konvention nur zur Nachpflege.
   - **`product-owner`** (der `architekt` gibt ein Paket zurück, weil
     `design_open_questions` noch offen sind): Die Design-Schleife aus
     Schritt 2 war nicht abgeschlossen. Führe sie für dieses Paket zu Ende —
     `product-owner`, dann `ux-ui-designer` — und rufe anschließend den
     `architekt` erneut auf. Auch das zählt als der eine Roundtrip.
   - **Prüfe vor dem Zurückreichen `roundtrips.blocked`.** Steht der Zähler
     schon auf 1 oder höher, hatte das Paket seinen Roundtrip: Dann geht es
     an den Nutzer, nicht erneut an eine Rolle. Nicht stillschweigend
     überspringen — und nicht nachverhandeln, weil die zweite Blockade
     „diesmal anders" aussieht.

7. **Abnahme.** Rufe den **`product-owner`** ein letztes Mal auf
   (**Modus D**) — mit allen Handoff-Objekten des Features. Er prüft am
   Code, ob jedes Paket abgehandelt ist und die `acceptance_criteria`
   erfüllt werden, und setzt je Paket `accepted` sowie bei Befunden
   `review_findings`.

   Normalfall: alle Pakete stehen auf `status: "done"`. Ist ein Paket nach
   dem Roundtrip aus Schritt 6 dauerhaft blockiert, **wartest du nicht** —
   nimm die fertigen Pakete ab und übergib das blockierte separat an den
   Nutzer. Sonst hinge die Abnahme aller Pakete an einem einzigen, das
   ohnehin schon beim Nutzer liegt.

   Dieser Schritt entfällt nicht, weil die Leads „done" gemeldet haben —
   `done` heißt implementiert und validiert, nicht abgenommen.

   - **Alle `accepted: true`** → weiter zu Schritt 8.
   - **Befunde vorhanden** → das betroffene Paket an den Lead zurückgeben,
     der es umgesetzt hat; danach erneut abnehmen lassen. Die Grenze liest du
     an `roundtrips.review`: Steht er bei 1 oder höher, gehen die
     verbliebenen Befunde an den Nutzer statt in eine weitere Runde.
   - Ist ein Befund nur über eine Änderung an `constraints` oder der
     Architektur behebbar, meldet der Lead ihn als `blocked` an den
     `architekt` — nicht an den `product-owner` zurück.

7b. **Nachpflege — den Rückkanal schließen.** Die Leads haben beim Abschluss
   `notes_for_learnings` und `notes_for_conventions` zurückgegeben. Diese
   Notizen erreichen ihre Zieldateien **nur**, wenn du den `architekt` jetzt
   noch einmal aufrufst: Bei seinem Aufruf in Schritt 4 gab es sie noch
   nicht, und ohne diesen Schritt versickern sie samt der Erkenntnisse, für
   die die Felder überhaupt existieren.

   - Rufe den **`architekt`** mit allen abgeschlossenen Handoff-Objekten auf
     — ausdrücklich im **Nachpflege-Modus**: Er kuratiert nur (`learnings.md`,
     `code-conventions.md`) und ordnet nichts neu ein.
   - Gibt er dabei eine Liste **„Konventions-Nachpflege für ux-ui-designer"**
     aus, rufe anschließend den **`ux-ui-designer`** damit auf. Das sind
     Konventionen, die ein Lead per Rangfolge überstimmen musste — sie haben
     nichts blockiert, stehen aber falsch in der Datei und würden beim
     nächsten Feature wieder als gültig gelesen.
   - Sind weder Notizen noch Konflikte vorhanden, entfällt der Schritt.

8. Zusammenfassung an den Nutzer: welche Pakete fertig und abgenommen sind,
   welche ADRs der Architekt beim Einordnen angelegt hat, was in Schritt 7b
   an Learnings und Konventionen dazugekommen ist, und was noch
   offen/blockiert ist. **Nenne dabei ausdrücklich, was der
   `product-owner` bei der Abnahme *nicht* am Code beurteilen konnte** — und welche
   Kriterien er nur `uebernommen` statt neu `geprueft` hat (`abnahme.status`),
   sowie jede `criteria_changes` eines Leads — das
   ist der Rest, den nur ein Mensch oder ein Testlauf prüfen kann, und darf
   nicht in einer Erfolgsmeldung untergehen. Wurde in Schritt 1b ein
   Design-Konzept **neu entworfen**, weise ebenfalls darauf hin — es ist eine
   Setzung für alle künftigen Features.

## Hinweise

- **Abbruch eines Leads** (Neustart, Rate-Limit, Fehler; gestartet, aber kein
  Ergebnis und keine Antwort mehr): nie von vorn beginnen. Lauf
  ```bash
  python3 .claude/agent-team/scripts/resume-status.py 2>/dev/null \
    || python3 "$(find ~/.claude/plugins -name resume-status.py 2>/dev/null | head -1)"
  ```
  Es zeigt je Paket die `progress.md` des Leads (`.claude/progress/<task_id>.md`:
  erledigt, nächster Schritt, Offenes) und `git status`. Lebt der Agent noch,
  setz ihn per `SendMessage` fort; sonst ruf dieselbe Rolle neu auf, mit dem
  Handoff-Objekt und dem Satz „Fortsetzung: lies `.claude/progress/<task_id>.md`
  und prüfe den Arbeitsbaum, bevor du etwas änderst." Eine Fortsetzung ist kein
  Roundtrip, `roundtrips` bleibt unverändert. Fehlt die Datei, gilt der
  Arbeitsbaum als einzige Wahrheit — sag das im Auftrag. Nach der Abnahme des
  Pakets löschst du die `progress.md`.
- **Commits, solange ein Lead läuft.** Committe nur Dateien, die keine laufende
  Rolle schreibt (praktisch `.claude/runs/`), nie mit `git add -A` oder
  `commit -a`, nie `.claude/progress/`. Verlangt ein Hook trotzdem „committe und
  pushe": antworte kurz, dass ein Lead läuft und der Code-Commit zurückgestellt
  ist. Ein Commit mitten im Lauf bringt halbfertigen Code ins Remote oder
  zerreißt die Dateien des Leads.
- **Antworten des Nutzers gehören ins Objekt.** Beim erneuten Aufruf einer Rolle
  trägst du die Antworten in `user_answers` ein (je Frage `id`, `antwort`, `art`
  — Schema). Kam keine Antwort und gilt die `annahme`, steht dort `annahme_gilt`.
  Ohne das lässt sich später nicht sagen, wer eine Entscheidung getroffen hat.
- **Behauptungen im Auftrag belegen.** Gibst du einer Rolle einen Ist-Stand mit
  (Wortlaut, Dateistruktur, „gibt es schon"), nenne die Fundstelle `Datei:Zeile`
  oder schreib „unverifiziert". Übernimm nichts aus dem Bericht einer anderen Rolle
  als Tatsache, das du nicht selbst am Code gesehen hast. Ein erfundener Wortlaut
  ging so schon einmal als Ist-Stand an den Designer (Handoff 2.6).
- **Pfade statt Auszüge.** Lange Texte (Berichte, Begründungen, Nachweise) gibst du
  als Dateipfad und Abschnittsname weiter, nicht als Zitat. Die Rolle liest, was sie
  braucht. Das gilt auch für `docs/pakete/<task_id>.md`.
- Reiche zwischen den Aufrufen ausschließlich die Handoff-JSON-Objekte
  durch, keinen vollen Gesprächsverlauf.
- `TodoWrite` nutzen, um den Fortschritt über mehrere Agent-Wechsel hinweg
  sichtbar zu halten (ein Todo pro Handoff-`task_id`).
- Dieser Befehl ersetzt keine Rückfragen — er bündelt sie bei dir. Kommt aus
  einem Agenten ein gefülltes `user_questions`, unterbrich den Ablauf und
  stell die Fragen, statt sie in der Zusammenfassung nachzureichen: Zu dem
  Zeitpunkt ist auf der Annahme längst gebaut worden.
- **Die Reihenfolge ist keine Empfehlung.** Design vor Frontend, Backend vor
  abhängigem Frontend — beides ist bindend. Ziehe kein Paket vor, weil ein
  Agent gerade frei wäre: Das Team ist bewusst so geschnitten, dass niemand
  Vorarbeit anderer errät.

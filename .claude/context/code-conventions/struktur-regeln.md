# Regeln, die die Struktur tragen

> Themendatei von `.claude/context/code-conventions.md` (Abschnitt „Regeln, die
> die Struktur tragen"). Single-Writer: `architekt`. Maßgeblich ist dieser
> Wortlaut samt Ausnahmen, nicht die Kurzzeile im Register.

## Feature-Importe

- **Ein Feature importiert nicht aus einem anderen Feature.** Drei enge
  Ausnahmen:
  1. `bewertungen`, `tags`, `medien` dürfen den `orte`-Store über sein
     öffentliches API nutzen — nur in diese Richtung. **`karte` nicht**: der
     Context fasst gar keinen Store an (ADR-0019 P8).
  2. Eine **View** in `orte` darf Komponenten und reine
     `features/<context>/lib/`-Funktionen fremder Contexts importieren und
     über Props/Emits anbinden (ADR-0013/0022). Geprüft wird am **Zyklus**,
     nicht am Wort „Store": verboten ist der Import eines Moduls, das
     seinerseits den `orte`-Store oder `persistence/` anfasst, Zustand über
     Aufrufe hält oder aus dem importierenden Context zurückimportiert.
     `medien` darf seinen **eigenen** Store anfassen, solange es nichts aus
     `orte` importiert (ADR-0016 P9/10). Store-gebundene Exporte gibt es
     genau zwei, `Bilderbereich.vue` und `Bildstreifen.vue` (ADR-0039 P6).
     Ein dritter braucht ein ADR. `Bildstreifen.vue` bindet nicht die
     View, sondern die **Komponente** `orte/components/Schnellansicht.vue`
     ein. Das ist die einzige `components/`-Datei mit einem
     store-gebundenen Kind, und sie gilt nicht als Vorbild für „Komponente
     kennt Store". `karte` importiert aus keinem Feature,
     auch nicht aus `medien`.
  3. `datensicherung` darf nach einem Import `useOrteStore`/`useMedienStore`
     **zum Neuladen** anstoßen — nur das, ohne Rückrichtung (ADR-0017 P9).

  Alles andere läuft über `shared/` bzw. `persistence/schema.ts`, nie quer.
  Nach `shared/` erst **ab zwei Nutzern**; ein zweiter Nutzer zählt, sobald
  er in einem freigegebenen Paket steht. `app/` und `features/` importieren
  nicht voneinander — was beide brauchen, liegt von Anfang an in `shared/`.
- **Reicht ein anderer Context in einen Baustein hinein, bekommt er einen
  benannten Slot statt eines Imports** (ADR-0013; `Werkzeugleiste.vue`,
  Slot `zeile-2`). Leerer Slot = Zeile wird nicht gerendert.
  `Werkzeugleiste.vue` bleibt store- und routerfrei. Was sie anzeigt,
  bekommt sie als Pflicht-Prop (`gewichtungName`), was sie auslöst,
  meldet sie per Emit (`gewichtung-oeffnen`).

## Besitz und Ableitungen

- **Der Ort-Datensatz hat genau einen Besitzer im Arbeitsspeicher:
  `useOrteStore`** (ADR-0008). Contexts, die Felder darin bearbeiten
  (`bewertungen`, `tags`), führen **keinen eigenen Store** und rufen
  `persistence/` nicht selbst auf. Einen eigenen Store hat nur, wer einen
  eigenen Object Store hat (`medien`). Ableitungen auf Ort-Feldern
  (Gesamtnote, Tag-Prädikat, Sortierung) liegen in `shared/lib/` und liefern
  alles mit, was die Ansicht sonst zweimal formulieren müsste (ADR-0009 P9).
  Das gilt für Ableitungen mit zwei Nutzern. Eine Darstellungsregel, die
  **nur die Ortsliste** kennt, liegt in `features/orte/lib/`. Beispiel ist
  `zonen.ts` (ADR-0034).
- **Gesamtnote nur über `berechneGesamtnote(bewertungen, gewichte)`**
  (ADR-0037). Die Gewichte sind ein Pflichtparameter ohne Default, Quelle
  ist `useOrteStore` (`orte.gewichtung`). Das Ergebnis unterscheidet `wert`
  (`roh`, `zehntel`), `unbewertet` und `ohne-gewicht`, also kein
  `number | null`. **Anzeige und Zone lesen `zehntel`** (ganzzahlig,
  `Math.round(10 · Zähler / Nenner)`). **Sortierung, Gleichstand und
  Vorrang lesen `roh`.** Komponenten und `karte` rechnen nicht selbst,
  sie bekommen das Ergebnis bzw. primitive Felder von `Ortebereich.vue`
  (`gesamtnoteVon`, die einzige rechnende Stelle; `Ortszeile.vue` hat die
  Pflicht-Prop `gesamtnote`, `KartenOrt` die Felder `notentext`/`rohwert`/
  `ohneNoteGrund`). `SortierErgebnis` hat **drei** Gruppen: `mitWert`,
  `ohneWert` und `ohneGewicht`. Die dritte ist nur bei Kriterium
  Gesamtnote gefüllt. Jeder Konsument muss alle drei behandeln.
- **`model/*.types.ts` importiert nichts** und enthält nur den Anteil seines
  Contexts; `persistence/schema.ts` setzt daraus `OrtDatensatz` zusammen. Ein
  Import von `persistence/` dorthin dreht die Richtung um und ist ein Fehler.
- **Nur `persistence/` spricht mit dem Gerätespeicher** — kein
  `localStorage`/`indexedDB` in Komponenten, Stores, Composables; auch kein
  zweiter Weg „nur für Kleinigkeiten" (ADR-0006).

## Komponenten, Views, Composables

- **`components/` kennt keinen Store** (Props rein, Emits raus); `views/`
  sind die einzige Stelle, die Stores anbinden.
  - **Einzige Ausnahme vom „nur Emits raus": unbestätigte Eingabe abgeben**
    (ADR-0030). Hält eine Komponente im Ortsdetail einen Entwurf lokal,
    exponiert sie per `defineExpose` genau eine synchrone Methode, die ihn
    über ihren normalen Commit-Weg und ihr normales Emit abgibt. Die View
    ruft sie bei Route verlassen, `visibilitychange`→`hidden` und `pagehide`
    **vor** dem Persistieren auf — über eine Hilfsfunktion, nicht je Auslöser
    nachgebaut. Die Komponente registriert dafür keinen eigenen
    `document`/`window`-Listener. Der Emit-Handler in der View bindet die
    Ort-ID des gerenderten Ortes, nicht die reaktive `ortId`; die Komponente
    wird per `:key` auf der `ortId` eingebunden. Bei **mehreren**
    Entwurfsbesitzern (seit PO-2026-09-27-004: `TagEingabe` und die vier
    `Bewertungsachse`-Instanzen) holt die Hilfsfunktion **alle** ab. Während
    des Abholens persistieren die Emit-Handler nicht selbst, danach wird
    genau einmal persistiert (ADR-0035). Ein zweiter Aufruf ohne neue Eingabe
    emittiert nichts. Verglichen wird dafür mit dem zuletzt übernommenen
    Stand, nicht mit den möglicherweise veralteten Props.
- **Eine projektweit entschiedene Interaktionsregel steht einmal in
  `shared/composables/`**, nicht je Feature nachgebaut (ADR-0024; Bauform wie
  `useNetzzustand.ts`). `shared/` ist kein Bounded Context — ein Baustein
  dort erzeugt keinen Feature-zu-Feature-Import. Ein Paket darf zum Anbinden
  die Datei eines fremden Contexts anfassen, **nur** dafür.
  - **„Blur" und „Tap außerhalb" sind zwei Mechanismen, nicht einer**
    (`useSchliesseBeiAussenaktion.ts`): `focusout` mit
    `relatedTarget`-Containment fürs Wegtabben, `document`-`pointerdown` für
    Touch/Maus. Ein `@blur` auf dem Input allein zerstört das Tabben in die
    eigene Vorschlagsliste.
  - **Mehrzeilige Textfelder wachsen über
    `shared/composables/useMitwachsendesTextfeld.ts`**. Das Composable entsteht
    mit PO-2026-09-27-001, der zweite Nutzer ist die Anfangsnotiz aus -002. Die
    Höhe setzt **nur JavaScript**, **kein `field-sizing: content`**, auch
    nicht zusätzlich: Sonst prüft der Rauchtest in Chromium einen anderen Weg
    als den, der in WebKit läuft. Ausgelöst wird durch den **Wert und die
    Breite** des Feldes, nicht durch das `input`-Ereignis: beim Mount, bei
    jeder Wertänderung (auch von außen), bei Breitenänderung
    (`ResizeObserver`, nur bei geänderter Breite) und nach dem Laden der
    Schrift. Die Mindesthöhe kommt allein aus `rows`. Dazu `resize: none`,
    keine Höhen-Transition und `overflow-wrap: break-word`. Die Messung
    verschiebt keinen Scroll-Versatz und sucht keinen scrollbaren Vorfahren.

## `watch`

- **Ein `watch` auf ein abgeleitetes Array feuert bei jeder Neuberechnung**,
  nicht erst bei inhaltlicher Änderung — `computed` + `filter`/`map` liefert
  jedes Mal ein neues Array. Soll eine Wirkung nur bei **Inhalts**änderung
  eintreten, vergleicht der Watcher selbst (stabile Kennung der Menge).
  Vorbild: `bildeMengenKennung()` in `karte/lib/kartenausschnitt.ts`,
  benutzt von `useLeafletKarte.ts` (ADR-0038 P5).
- **Ein `watch`, der das DOM misst oder liest** (`scrollHeight`,
  `getBoundingClientRect`, `offsetHeight`, `feld.value` …), läuft mit
  `{ flush: 'post' }`, nicht mit dem Vue-Standard `pre`. Template-Bindungen,
  auch `v-model`, schreiben den neuen Wert erst im Render-Effekt des
  Aufrufers ins DOM, und ein `pre`-Watcher misst noch den alten Inhalt. Das
  fällt nur auf, wenn die Komponente beim Wertwechsel **nicht** neu gemountet
  wird. Vorbild: `shared/composables/useMitwachsendesTextfeld.ts`.

## Dev-Werkzeug

- **`app/dev/`** ist Dev-Werkzeug: Routen nur unter `import.meta.env.DEV`,
  importiert nichts aus `features/`. `Tokenschau.vue` **bleibt dauerhaft**.

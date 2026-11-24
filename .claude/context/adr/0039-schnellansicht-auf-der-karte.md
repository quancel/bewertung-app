# ADR-0039: Schnellansicht auf der Karte: eingefrorene Adressform `ort`, Komponente in `orte`, keine Kopplung `karte` → `medien`, `inert` als benannte Ausnahme der Verdeckungsprüfung (löst ADR-0019 Punkt 6 teilweise ab, erweitert ADR-0016 Punkt 10 und ADR-0023 Punkt 7)

- **Status**: accepted
- **Datum**: 2026-11-24
- **Bounded Context(s)**: `orte`, `karte`, `medien`, `app-shell`
- **task_id**: `PO-2026-11-24-005`

## Kontext

Ab -005 öffnet ein Marker nicht mehr das Ortsdetail, sondern ein nicht
modales Bottom-Sheet über der Karte, adressiert mit `?ort=<id>`. Das Sheet
zeigt Felder aus `orte`, `bewertungen`, `tags` und Bilder aus `medien`.
`karte` darf keinen Store anfassen und nichts aus `orte` importieren
(ADR-0019 Punkt 8). Ein Import von `karte` nach `medien` wäre ein
Feature-zu-Feature-Import außerhalb der drei erlaubten Ausnahmen
(code-conventions.md). Das Sheet verdeckt Marker. Die Verdeckungsprüfung
würde das melden, sie kennt aber nur die Ausnahmen „aktive Auswahlliste",
„fixierte Chrome" und „hinter `aria-modal`".

## Entscheidung

1. **Neue eingefrorene Adressform `ort`** (ADR-0019 Punkt 2): Name `ort`,
   Wert ist die Ort-ID. Bedeutung **nur zusammen mit `ansicht=karte`**.
   Auf `/orte` ohne Karte und auf `/orte/:ortId` wird der Parameter
   ignoriert, ohne die Adresse zu korrigieren (wie bei einem unbekannten
   Wert von `ansicht`). Die Sheet-Größe steht nicht in der Adresse.
   Öffnen ist `push`, Wechsel auf einen anderen Marker ist `replace`.
   Schließen über „×" oder Esc ist `router.back()`, wenn der vorige Eintrag
   in der App liegt (`history.state.back`, Muster aus `aufZurueck()`),
   sonst `replace` ohne `ort`. Zurück schließt.
2. **Bewusste Abweichung von ADR-0019 Punkt 2 („wird nicht korrigiert")**:
   Ist die ID unbekannt oder nicht sichtbar (nicht in `orteGefiltert` mit
   beiden Koordinaten), oder fällt der Ort durch eine Filteränderung heraus,
   wird `ort` per `replace` entfernt. Der Grund: Sonst stünde ein
   Verlaufseintrag mit einem Ort, den die Seite nicht zeigt. Geprüft wird
   erst, **wenn der Store geladen ist**. Sonst wäre beim Neuladen jede ID
   „unbekannt", und die Adresse verlöre ihren Parameter, bevor die Daten da
   sind. Das ist der beobachtbare Fehlerfall.
3. **ADR-0019 Punkt 6 abgelöst, soweit er den Marker-Klick betrifft**: Ein
   Marker öffnet die Schnellansicht, nicht mehr `/orte/:ortId`. Ins
   Ortsdetail führt „Bearbeiten" (`push`). Zurück landet auf
   `?ansicht=karte&ort=<id>`, dann mit Sheet „halb" und dem Ausschnitt nach
   ADR-0038. Der Rest von Punkt 6 gilt unverändert: Die Kartenansicht
   existiert nur ohne offene Detailansicht, und Löschen ist `replace('/orte')`.
4. **Die Schnellansicht ist eine Komponente in `orte`**
   (`features/orte/components/`), nicht in `karte`. Die Felder darin gehören
   `orte`, und nur so bleibt `karte` ohne Wissen über Ort-Inhalte.
   `Ortebereich.vue` leitet die offene ID ausschließlich aus der Adresse ab
   (ADR-0011 Punkt 4, ADR-0019 Punkt 7), es gibt kein zweites Flag. Der
   Sheet-Zustand (eingeklappt/halb/voll) ist lokal in der Komponente und
   beginnt nach jedem Mount bei „halb".
5. **`karte` bekommt nur Darstellungsgrößen über Props**: die ausgewählte
   ID (Größe/Ring nach -004), die von unten verdeckte Höhe in px (Marker
   mit Mittelpunkt darunter werden `inert`, Leaflet-Bedienelemente und
   Attribution rücken nach oben) und den Auslöser für das minimale `panBy`.
   Der Auslöser kommt **nur** bei Öffnen oder Wechsel durch eine
   Nutzeraktion, nicht bei Rückkehr über den Verlauf. Marker-Aktivierung
   ist ein Emit. Eine exponierte Methode ist nur nach dem Muster von
   ADR-0033 zulässig („der Baustein, dem es gehört, führt aus"), wenn eine
   Prop nicht reicht.
6. **Keine Kopplung `karte` → `medien`.** Den Bildstreifen liefert `medien`
   als **zweiten** store-gebundenen Baustein `Bildstreifen.vue` (Prop
   `ortId`, Bezeichnung für den Alt-Text). `Ortebereich.vue` bzw. die
   Schnellansicht in `orte` bindet ihn ein. Das **erweitert ADR-0016
   Punkt 10** („genau einen") auf genau zwei. Die Bedingung bleibt
   dieselbe: `medien` importiert nichts aus `orte`. Der Streifen öffnet die
   Bildvorschau aus -006 (ADR-0036) und gibt Objekt-URLs nach ADR-0016
   Punkt 11 frei.
7. **`inert` ist eine benannte Ausnahme der Verdeckungsprüfung** (ADR-0023
   Punkt 7). Ein Element in einem `[inert]`-Teilbaum ist nicht bedienbar und
   wird wie `aria-hidden` übersprungen. Die Bedingung ist die Eigenschaft,
   keine ID- oder Klassenliste. Weil eine Ausnahme einen echten Befund
   verschlucken kann, gehört eine **harte Gegen-Zusicherung** dazu: Bei
   offenem Sheet ist **jeder** Marker mit Mittelpunkt unter der
   Sheet-Oberkante `inert` und **keiner** darüber, in jedem Zustand und
   jeder Breite. Sie muss gegen einen verletzenden Stand rot werden
   (ADR-0027 Punkt 8).
8. **Das Sheet ist nicht `position: fixed`**, sondern im Kartenbereich
   positioniert. Sonst griffe die Ausnahme „fixierte Chrome" in
   `pruefeVerdeckung()` und verschluckte jede Überdeckung eines nicht
   `inert` gesetzten Markers.

## Konsequenzen

- Positiv: `karte` bleibt präsentational und ohne Datenwissen, und kein
  neuer Feature-zu-Feature-Import entsteht.
- Negativ/Trade-off: `Ortebereich.vue` wächst weiter (fünfter Zweig).
  Geschnitten wird innerhalb von `features/orte/` (ADR-0011).
- Negativ/Trade-off: Zwei Adressparameter sind jetzt eingefroren
  (`ansicht`, `ort`), beide nicht in `routes.ts` sichtbar.
  `context-map.md` und `code-conventions.md` führen sie.
- Betrifft künftig: Ein dritter store-gebundener Export aus `medien`
  braucht wieder ein ADR. Jede weitere nicht modale Überlagerung nutzt
  dieselbe `inert`-Ausnahme samt Gegen-Zusicherung.

## Alternativen (kurz)

- **Schnellansicht in `karte`**: verworfen. `karte` müsste Ort-Inhalte als
  Prop-Typ kennen und für die Bilder `medien` importieren.
- **`karte` importiert `Bildstreifen.vue` aus `medien`**: verworfen,
  Feature-zu-Feature-Import ohne Ausnahme.
- **Unbekannte ID stehen lassen (ADR-0019 Punkt 2 wörtlich)**: verworfen,
  toter Verlaufseintrag (Punkt 2).
- **Verdeckte Marker ausblenden statt `inert`**: verworfen. Die Karte
  verlöre sichtbare Information, und die Design-Vorgabe verlangt `inert`.

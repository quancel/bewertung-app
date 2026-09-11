# ADR-0013: Fremde Bausteine in den Ortsansichten — Import-Richtung und die Slot-Naht der Werkzeugleiste

- **Status**: accepted
- **Datum**: 2026-09-09
- **Bounded Context(s)**: `orte`, `bewertungen`, `tags`, `medien`
- **task_id**: `PO-2026-09-07-003` (baut die Naht), verbindlich ab `PO-2026-09-07-004` (erster Nutzer)
- **Präzisiert durch**: ADR-0016 Punkt 9/10 (`medien` mit eigenem Store),
  ADR-0022 (reine Funktionen aus `features/<context>/lib/`). Punkt 2 nennt
  nur präsentationale Komponenten; maßgeblich ist Punkt 3 (Zyklusfreiheit).

## Kontext

Zwei Regeln, die bisher nebeneinander standen, treffen sich in der
Werkzeugleiste der Ortsliste. Die Context Map sagt: „Kein Rückweg: `orte`
importiert aus keinem der drei" (`bewertungen`, `tags`, `medien`). ADR-0009
Punkt 2 sagt für PO-2026-09-07-004: „`tags` bringt die Filterleiste
(Komponenten) mit … Es entsteht kein zweiter Ansichtszustand und **kein
Feature-zu-Feature-Import**." Beides zusammen ergibt eine Leiste, deren
Zeile 1 `orte` gehört und deren Zeile 2 `tags` gehört — ohne gesagt zu haben,
wie Zeile 2 in die Leiste kommt.

Derselbe Fall steht im Ortsdetail: Die Bearbeitungsoberfläche fremder Felder
liegt laut ADR-0008 Punkt 4 im Feature-Ordner des besitzenden Contexts
(`bewertungen` ab -002, `tags` ab -004), gerendert wird sie aber von einer
Ansicht in `orte`. ADR-0008 Punkt 7 regelt nur den Fall „erscheint in der
Ortsliste" (→ `src/shared/ui/`). Ohne Entscheidung rät jedes Paket neu, und
-004 hätte die Wahl zwischen einem verbotenen Import und einem zweiten
Ansichtszustand.

## Entscheidung

1. **Die Einbahnstraße gilt unverändert für Zustand und Logik.** `orte`
   importiert aus `bewertungen`, `tags` und `medien` **keinen** Store, kein
   Composable mit Store- oder Speicherzugriff und keine Ableitung. Ableitungen
   bleiben in `src/shared/lib/` (ADR-0008 Punkt 6).
2. **Für Darstellung gilt sie nicht mehr wörtlich: Eine `orte`-View darf
   präsentationale Komponenten eines Geschwister-Contexts importieren.**
   Erlaubt ist genau diese eine Richtung und genau diese eine Art Modul.
3. **Bedingung dafür — und der eigentliche Kern der Regel: Diese Komponenten
   sind store-frei.** Sie erhalten alles über Props und melden über Emits
   zurück (`code-conventions.md`). Die `orte`-View bindet `useOrteStore` an
   und ruft dessen öffentliches API auf; ADR-0008 Punkt 2 bleibt damit wörtlich
   erfüllt. Weil die importierte Komponente ihrerseits nichts aus `orte`
   importiert, entsteht **kein Import-Zyklus** — das war der einzige Grund,
   aus dem ADR-0008 die Gegenrichtung verworfen hat. Sobald eine
   Feature-Komponente den `orte`-Store selbst anfasst, ist sie keine
   präsentationale Komponente mehr und darf von `orte` nicht importiert werden.
4. **Die Werkzeugleiste ist ein Baustein von `orte` mit einer benannten
   Naht.** `features/orte/components/Werkzeugleiste.vue` besitzt den
   zweizeiligen Rahmen und den Inhalt von Zeile 1 (Sortier-Chip, Richtung,
   Trefferzahl). Zeile 2 ist ein benannter Slot (`zeile-2`). Ist der Slot
   leer, wird die Zeile nicht gerendert — der Zustand „Bestand ohne einen
   einzigen Tag" ist damit strukturell die leere Naht und keine Fallabfrage.
5. **Gefüllt wird der Slot ausschließlich von der Bereichsansicht**
   (`features/orte/views/Ortebereich.vue`, ADR-0011). Sie ist die einzige
   Stelle, an der `orte` eine Komponente aus `tags` importiert. Die
   Werkzeugleiste selbst kennt `tags` nicht und muss bei einem künftigen
   dritten Zeileninhalt nicht angefasst werden.
6. **Nach `src/shared/ui/` geht weiterhin nur, was zwei Contexts wirklich
   nutzen** (ADR-0008 Punkt 7/8): die Intensitäts-Balkenanzeige aus -002
   (Detail **und** Liste), `MasterDetail.vue`, `AdresseOhneZiel.vue`. Die
   Tag-Filterleiste und die Tag-Eingabe haben je genau einen Nutzer und
   bleiben in `features/tags/components/`. `shared/ui/` ist keine Umgehung der
   Import-Richtung.

## Konsequenzen

- Positiv: -004 hat einen benannten Platz für Zeile 2, ohne die Leiste aus
  -003 umzubauen und ohne einen zweiten Ansichtszustand. „Trefferzahl
  aktualisiert sich mit dem Filter" bleibt eine Ableitung in Zeile 1.
- Positiv: Die Feature-Ordner behalten Inhalt. Die Alternative hätte
  `features/tags/` auf ein Typmodul reduziert und die Tag-Oberfläche in
  `shared/ui/` abgelegt, wo sie niemandem gehört.
- Positiv: Die Regel ist am Modul prüfbar (importiert die Komponente einen
  Store?), nicht an einer Einschätzung im Einzelfall.
- Negativ/Trade-off: Die Context Map sagt nicht mehr in einem Satz „`orte`
  importiert aus keinem der drei". Die Ausnahme ist eng und an Punkt 3
  gebunden; sie wird dort und in `code-conventions.md` mitgeführt.
- Negativ/Trade-off: Ein Slot ist eine schwächere Zusage als ein Typ. Was
  Zeile 2 an Props braucht, steht nicht im Baustein, sondern in der
  Bereichsansicht.
- **Kein rückwirkender Umbau:** PO-2026-09-07-002 wird parallel gebaut. Hat
  es die Achsen-Bearbeitung bereits in `src/shared/ui/` abgelegt, bleibt sie
  dort — dieses ADR gilt ab -003 vorwärts und ist kein Auftrag, Fertiges zu
  verschieben.
- Betrifft künftig: **-004** (Filterleiste in den Slot, Tag-Eingabe im
  Detail), **-005** (Bilder-Raster in der Detail-Spalte nach derselben Regel),
  **-006** (`Kartenbereich.vue` bekommt keine zweite Naht — sie gehört zur
  Ortsliste).

## Alternativen (kurz)

- **Tag-Filterleiste nach `src/shared/ui/`** — verworfen: Sie hat genau einen
  Nutzer; ADR-0008 Punkt 8 fordert einen nachweisbaren zweiten. `shared/ui/`
  würde zur Ablage für alles, was die Import-Richtung stört.
- **Werkzeugleiste importiert die Filterleiste selbst** — verworfen: Dann
  kennt ein `orte`-Baustein `tags` fest, und jede weitere Zeile ändert ihn
  erneut. Die Naht liegt eine Ebene zu tief.
- **`tags` hält eigenen Filterzustand und die Liste führt zwei Stores
  zusammen** — verworfen: bereits in ADR-0009 verworfen, aus demselben Grund.
- **Registrierungspunkt / Plugin-Mechanismus, in den Features Blöcke
  einhängen** — verworfen: Indirektion ohne Gegenwert bei sieben Contexts in
  einem Bundle; die Zuordnung wäre nur noch zur Laufzeit sichtbar.
- **Import-Richtung wörtlich halten und Zeile 2 in `orte` nachbauen** —
  verworfen: Die Tag-Oberfläche stünde in einem Context, dem sie nicht
  gehört, und -004 müsste sie bei jeder Änderung dort pflegen.

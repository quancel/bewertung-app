# ADR-0036: Ein modaler Vollbild-Dialog bekommt einen Verlaufseintrag ohne eigene Adresse (Präzisierung von ADR-0011 Punkt 4 und ADR-0019 Punkt 2)

- **Status**: accepted
- **Datum**: 2026-11-24
- **Bounded Context(s)**: `medien`, `orte`, `app-shell`
- **task_id**: `PO-2026-11-24-006` (wiederverwendet in `PO-2026-11-24-005`)

## Kontext

Die Bildvorschau aus -006 soll sich über System-Zurück schließen lassen.
Auf Android und iOS ist das die Geste, mit der man „aus dem Bild heraus"
will. Danach soll man im Ortsdetail desselben Ortes stehen und nicht eine
Seite zu weit zurück. Bisher kennt das Projekt zwei Arten von Zustand.
Eine **Adresse** (Pfad oder Query, ADR-0011 Punkt 4, ADR-0019 Punkt 2)
ist verlinkbar, überlebt das Neuladen und erzeugt Verlaufseinträge.
**Lokaler Zustand** (offene Sheets) tut nichts davon. Eine Vorschau als
Adresse (`?bild=<id>`) würde verlinkbar und müsste das Neuladen überleben.
Das will niemand, und eine eingefrorene Adressform entstünde für einen
Zustand ohne Nutzen. Als rein lokaler Zustand verlässt System-Zurück
dagegen das Ortsdetail. Das ist der beobachtbare Fehlerfall: Bild offen,
Zurück, und man landet in der Liste statt im Detail.

## Entscheidung

1. **Dritte Art: ein Verlaufseintrag ohne eigene Adresse.** Öffnen der
   Vorschau legt **einen** Verlaufseintrag mit **unveränderter** Adresse
   an (gleicher Pfad, gleiche Query) und markiert ihn im History-State
   (`bildvorschau`). Blättern erzeugt **keinen** Eintrag. Die Adresse
   bleibt die einzige Quelle der **Auswahl** (ADR-0011 Punkt 4). Die
   Vorschau ist keine Auswahl, sondern ein modaler Zustand über ihr.
2. **Normativ ist die Eigenschaft, das Mittel prüft der Lead.**
   (a) System-Zurück bei offener Vorschau schließt nur die Vorschau, die
   Adresse ist danach unverändert. (b) „×" und Esc schließen und entfernen
   den eigenen Eintrag wieder (`router.back()`, nur wenn der aktuelle
   Eintrag die Markierung trägt), damit ein späteres Zurück nicht erneut in
   eine Vorschau führt. (c) Eine Vorwärts-Navigation oder ein Neuladen auf
   einem markierten Eintrag **öffnet nie** eine Vorschau. Geöffnet wird nur
   durch eine Nutzeraktion, der Dialogzustand lebt in der Komponente. Als
   Mittel naheliegend ist `router.push({ path, query, state, force: true })`.
   Das ist **vom Lead zu verifizieren** (learnings.md 2026-09-15), ebenso
   die Erkennung des Schließens über `popstate` oder einen Routen-Hook.
   **Kein** rohes `history.pushState` am Router vorbei: vue-router legt
   seine Positions- und Zurück-Informationen in `history.state` ab, und
   `aufZurueck()` in `Ortebereich.vue` liest `history.state.back`.
3. **Ein solcher Eintrag verschiebt nichts.** `scrollBehavior` in
   `app/router/index.ts` gibt bei gleicher `fullPath` von `to` und `from`
   `false` zurück, setzt also keinen Fenster-Scroll. Hooks, die an einem
   Routenwechsel hängen (Autosave „Route verlassen", `watch(ortId)` für den
   Scroll-Reset nach ADR-0033, die Sichtbarkeits-Kennung nach ADR-0026),
   dürfen dabei nichts auslösen, was sie bei einem echten Ortswechsel
   auslösen. Ein zusätzlicher vollständiger `put()` des unveränderten
   Datensatzes ist unschädlich (ADR-0005), ein Fokus- oder Versatz-Reset
   ist es nicht.
4. **Der Mechanismus gehört dem Dialog, nicht der Bereichsansicht.** Er
   liegt als Composable in `features/medien/composables/`, weil heute nur
   die Bildvorschau ihn braucht (aus dem Raster in -006 und aus dem
   Bildstreifen in -005). Ein zweiter Dialog in einem anderen Context zieht
   ihn nach `shared/composables/` um (ADR-0024).
5. **Geschichtet mit Adressen.** In der Schnellansicht (-005, ADR-0039)
   liegt der Vorschau-Eintrag über dem `?ort=`-Eintrag. Das erste Zurück
   schließt die Vorschau, das zweite die Schnellansicht. Das ergibt sich
   aus Punkt 1 und braucht keinen Sonderfall.

## Konsequenzen

- Positiv: System-Zurück schließt die Vorschau so, wie man es auf einem
  Telefon erwartet, ohne dass eine verlinkbare Adressform entsteht, die ab
  Auslieferung eingefroren wäre.
- Negativ/Trade-off: Nach „×" bleibt ein Vorwärts-Eintrag mit gleicher
  Adresse stehen. Vorwärts tut dort nichts Sichtbares (Punkt 2c). Das ist
  hingenommen.
- Negativ/Trade-off: `scrollBehavior` bekommt eine Bedingung. Sie fragt
  nur `fullPath` ab und kennt keinen Feature-Begriff.
- Betrifft künftig: Jeder weitere modale Vollbild-Zustand, der über Zurück
  schließen soll, nutzt dieses Muster und keine neue Adressform.

## Alternativen (kurz)

- **Query-Parameter `?bild=<id>`**: verworfen. Verlinkbar und
  neuladefest, obwohl beides nicht verlangt ist, und ab Auslieferung
  eingefroren (ADR-0019 Punkt 2).
- **Rein lokaler Zustand ohne Verlaufseintrag**: verworfen. System-Zurück
  verlässt das Ortsdetail (Fehlerfall oben).
- **Rohes `history.pushState`**: verworfen, siehe Punkt 2.

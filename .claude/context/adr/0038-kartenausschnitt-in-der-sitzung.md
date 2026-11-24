# ADR-0038: Der Kartenausschnitt bleibt für die Sitzung erhalten, als flüchtiger Modulzustand in `karte` (löst ADR-0019 Punkt 11 teilweise ab, präzisiert ADR-0019 Punkt 6 und 8)

- **Status**: accepted
- **Datum**: 2026-11-24
- **Bounded Context(s)**: `karte`, `orte`
- **task_id**: `PO-2026-11-24-003`

## Kontext

Bisher geht der Kartenausschnitt bei jedem Verlassen der Kartenansicht
verloren (ADR-0019 Punkt 11, bewusster Preis des `v-if`), und der
Startausschnitt ergibt sich immer aus den Markern (ADR-0019 Punkt 6,
context-map „kein persistierter Ausschnitt"). -003 verlangt, dass Mitte und
Zoom innerhalb der **Sitzung** erhalten bleiben, also bis zum Neuladen oder
Schließen des Tabs, über Detail, Liste und auch über `/daten` hinweg. Er
soll aber weder in `einstellungen` noch in der Adresse stehen. Ein `ref` in
`Ortebereich.vue` reicht nicht: Die Bereichsansicht wird beim Wechsel nach
`/daten` ausgehängt (andere Route), danach wäre der Ausschnitt weg. Das ist
der beobachtbare Fehlerfall. Ein Pinia-Store in `karte` widerspricht
ADR-0019 Punkt 8.

## Entscheidung

1. **Ablage: ein Modul in `features/karte/composables/` mit einer
   nicht-reaktiven Modulvariable** (Mitte und Zoom oder `null`). Kein
   Pinia-Store, kein `persistence/`, kein `einstellungen`, keine Adresse.
   Die Lebensdauer ist ausdrücklich die **JS-Laufzeit des Tabs**: Ein
   Neuladen leert sie, und das ist gewollt (learnings.md 2026-09-13,
   Lebensdauer benennen).
2. **Präzisierung von ADR-0019 Punkt 8**: `karte` bleibt store-frei und
   importiert nichts aus `orte`. Flüchtiger **Darstellungszustand der
   eigenen Fremdbibliothek** über die Mount-Grenze hinweg ist erlaubt,
   solange er nur Leaflet-Größen hält (Mitte, Zoom) und keine Ort-Daten.
   Das Modul wird nur von `useLeafletKarte.ts` benutzt und nicht
   exportiert. `Ortebereich.vue` sieht davon nichts.
3. **Schreiben**: nach jedem `moveend` (deckt Zoom, Pan, `fitBounds` und
   `panBy` ab). Gemerkt wird also auch ein eingepasster Ausschnitt. Das
   entspricht dem, was der Nutzer zuletzt gesehen hat.
4. **Lesen beim Aufbau**: Liegt ein gemerkter Ausschnitt vor **und** liegt
   mindestens ein Marker der aktuellen Menge darin, wird er direkt als
   Startansicht gesetzt (`setView` ohne Animation, kein vorheriges
   Einpassen). Sonst wird wie bisher eingepasst (Nutzerentscheidung „außer
   es liegt kein Marker darin"). Entschieden wird beim ersten Aufbau mit
   **geladener** Markermenge, nicht vor dem Laden des Stores.
5. **Während die Karte gemountet ist**, wird nur eingepasst, wenn sich die
   **Menge der Marker-IDs inhaltlich** ändert (Tag-Filter in der
   Kartenansicht, Akzeptanzkriterium „passt wie heute neu ein"). Verglichen
   wird eine stabile Kennung der ID-Menge, nicht die Array-Identität
   (code-conventions.md `watch`, offene Stelle in `useLeafletKarte.ts`).
   Ändern sich nur Inhalte eines Markers (Note, Name, Gewichtung in -004),
   wird nicht eingepasst.
6. **ADR-0019 Punkt 11** bleibt beim `v-if` (Leaflet misst seinen
   Container). Abgelöst ist nur der Satz, dass der **Kartenausschnitt**
   beim Wechsel Liste ↔ Karte verloren geht. Die Scrollposition der Liste
   geht weiterhin verloren. **ADR-0019 Punkt 6**: Der Startausschnitt
   ergibt sich nur noch beim ersten Aufbau der Sitzung (und nach Punkt 4)
   aus den Markern.
7. **Fokusrückgabe auf den Marker verschiebt nichts**: `focus({
   preventScroll: true })`.

## Konsequenzen

- Positiv: Kein neuer Schlüssel, keine Adressform, kein Store. `karte`
  bleibt präsentational aus Sicht von `orte`.
- Negativ/Trade-off: Ein Modulzustand ist in Vitest zwischen Tests
  sichtbar. Wird er getestet, setzt das Modul ihn über eine nur für Tests
  exportierte Funktion zurück, oder die Logik (Punkt 4: „liegt ein Marker
  im Ausschnitt?") liegt als reine Funktion in `karte/lib/` und wird dort
  geprüft.
- Betrifft künftig: Ein **persistierter** Ausschnitt (über das Neuladen
  hinaus) bleibt ein eigenes Paket mit Schlüssel nach ADR-0006/0009. -005
  verlässt sich auf Punkt 4 für „Zurück aus dem Ortsdetail".

## Alternativen (kurz)

- **`ref` in `Ortebereich.vue` über Prop/Emit**: verworfen. Geht beim
  Aushängen der Bereichsansicht (`/daten`) verloren, und die Sitzung ist
  länger als die Lebensdauer dieser Instanz.
- **Anzeigeeinstellung in `einstellungen`**: verworfen. Überlebt das
  Neuladen, was ausdrücklich nicht gewollt ist.
- **`sessionStorage`**: verworfen. Zweite Speichertechnik (ADR-0006
  Alternativen), und es überlebt das Neuladen.
- **Pinia-Store in `karte`**: verworfen, ADR-0019 Punkt 8.

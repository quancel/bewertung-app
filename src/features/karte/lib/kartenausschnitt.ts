/**
 * Kartenausschnitt-Berechnung (Constraint KARTENAUSSCHNITT, PO-2026-09-07-006):
 * reine Funktion ohne Leaflet-Abhängigkeit, damit sie ohne
 * jsdom/@vue/test-utils testbar bleibt (Constraint TESTS) — `Kartenflaeche.vue`
 * übersetzt das Ergebnis in `map.setView`/`map.fitBounds`-Aufrufe.
 *
 * Drei Fälle: kein Marker (kein Ausschnitt), genau ein Marker (fester Zoom
 * auf seinen Mittelpunkt — ein Vorgabe-Mittelpunkt wird nicht gebraucht,
 * Constraint), mehrere Marker (Bounding Box über alle). Aufgerufen beim
 * Aufbau der Kartenansicht und JEDES MAL, wenn sich die Markermenge ändert —
 * nie bei reinem Pan/Zoom des Nutzers (das ruft diese Funktion gar nicht
 * erst auf).
 */
import type { KartenOrt } from '../model/karte.types'

export interface KartenKoordinate {
  breite: number
  laenge: number
}

export type Kartenausschnitt =
  | { art: 'leer' }
  | { art: 'einzel'; mittelpunkt: KartenKoordinate }
  | { art: 'bounds'; suedwesten: KartenKoordinate; nordosten: KartenKoordinate }

export function berechneKartenausschnitt(orte: readonly KartenOrt[]): Kartenausschnitt {
  if (orte.length === 0) return { art: 'leer' }

  if (orte.length === 1) {
    const [einziger] = orte
    return { art: 'einzel', mittelpunkt: { breite: einziger!.breite, laenge: einziger!.laenge } }
  }

  let minBreite = orte[0]!.breite
  let maxBreite = orte[0]!.breite
  let minLaenge = orte[0]!.laenge
  let maxLaenge = orte[0]!.laenge

  for (const ort of orte) {
    if (ort.breite < minBreite) minBreite = ort.breite
    if (ort.breite > maxBreite) maxBreite = ort.breite
    if (ort.laenge < minLaenge) minLaenge = ort.laenge
    if (ort.laenge > maxLaenge) maxLaenge = ort.laenge
  }

  return {
    art: 'bounds',
    suedwesten: { breite: minBreite, laenge: minLaenge },
    nordosten: { breite: maxBreite, laenge: maxLaenge },
  }
}

/**
 * Geometrie der Überlagerung (PO-2026-11-24-005, ADR-0039 Punkt 5): reine
 * Funktionen ohne Leaflet, damit sie ohne DOM testbar sind. `useLeafletKarte.ts`
 * liefert Containerpunkte (`latLngToContainerPoint`) und übersetzt das Ergebnis
 * in `inert` bzw. `panBy`.
 */
import type { KartenVerdeckung } from '../model/karte.types'

/** Abstand zwischen Marker und Oberkante der Überlagerung nach dem Verschieben (design-conventions.md: 24px). */
export const PAN_ABSTAND_PX = 24
/** Halbe ausgewählte Scheibe (Token `--karte-marker-scheibe-gewaehlt` / 2). */
export const PAN_HALBE_SCHEIBE_PX = 24
/** Untergrenze für die Zielhöhe, damit der Marker bei „voll" nicht aus dem Streifen ragt. */
export const PAN_MINIMUM_Y_PX = PAN_HALBE_SCHEIBE_PX + 4

/** Liegt der Mittelpunkt eines Markers unter der Überlagerung (Oberkante und Seiten)? */
export function liegtUnterVerdeckung(
  punkt: { x: number; y: number },
  containerHoehe: number,
  verdeckung: KartenVerdeckung | null,
): boolean {
  if (!verdeckung || verdeckung.hoehe <= 0) return false
  return punkt.y >= containerHoehe - verdeckung.hoehe && punkt.x >= verdeckung.links && punkt.x <= verdeckung.rechts
}

/**
 * Wie weit (px, positiv = Karte nach oben) die Karte verschoben werden muss, damit
 * der Marker mindestens `PAN_ABSTAND_PX` über der Oberkante der Überlagerung liegt.
 * 0, wenn er schon so liegt oder neben der Überlagerung steht. Nie Zoom.
 */
export function berechnePanVersatz(
  punkt: { x: number; y: number },
  containerHoehe: number,
  verdeckung: KartenVerdeckung | null,
): number {
  if (!verdeckung || verdeckung.hoehe <= 0) return 0
  if (punkt.x < verdeckung.links || punkt.x > verdeckung.rechts) return 0
  const oberkante = containerHoehe - verdeckung.hoehe
  const ziel = Math.max(oberkante - PAN_ABSTAND_PX - PAN_HALBE_SCHEIBE_PX, PAN_MINIMUM_Y_PX)
  return punkt.y > ziel ? Math.round(punkt.y - ziel) : 0
}

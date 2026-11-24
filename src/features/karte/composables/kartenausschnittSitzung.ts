/**
 * Gemerkter Kartenausschnitt für die Sitzung (PO-2026-11-24-003, ADR-0038).
 *
 * Eine nicht-reaktive Modulvariable mit Mitte und Zoom — bewusst kein
 * Pinia-Store, kein `persistence/`, kein `einstellungen`, keine Adresse, kein
 * `sessionStorage`. Lebensdauer ist die JS-Laufzeit des Tabs: Ein Neuladen
 * leert sie, und das ist gewollt. Hält nur Leaflet-Größen, keine Ort-Daten
 * (ADR-0038 Punkt 2). Wird ausschließlich von `useLeafletKarte.ts` benutzt;
 * `Ortebereich.vue` sieht davon nichts.
 */
export interface GemerkterAusschnitt {
  breite: number
  laenge: number
  zoom: number
}

let gemerkt: GemerkterAusschnitt | null = null

export function merkeAusschnitt(ausschnitt: GemerkterAusschnitt): void {
  gemerkt = { ...ausschnitt }
}

export function leseGemerktenAusschnitt(): GemerkterAusschnitt | null {
  return gemerkt ? { ...gemerkt } : null
}

/** Nur für Tests (ADR-0038 Konsequenzen): ein Modulzustand ist zwischen
 * Tests sichtbar. */
export function vergissGemerktenAusschnittFuerTests(): void {
  gemerkt = null
}

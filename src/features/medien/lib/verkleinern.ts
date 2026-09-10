/**
 * Verkleinerung eines Bildes beim Hinzufügen (ADR-0016 Punkt 6, Nutzer-
 * entscheidung 2026-09-10). Läuft im Client, je Datei einzeln — der
 * Aufrufer (medien.store.ts) ruft diese Funktion einmal je ausgewählter
 * Datei auf, kein Alles-oder-nichts über eine Mehrfachauswahl.
 *
 * `createImageBitmap`/`OffscreenCanvas` existieren nur im Browser, nicht im
 * Node-Testrunner — dieses Modul ist deshalb bewusst ungetestet (Handoff
 * PO-2026-09-07-005, „Testbarkeit"): kein Canvas-Mock, keine
 * Component-Test-Infrastruktur dafür.
 */

/** Nutzerentscheidung 2026-09-07: max. 2000px lange Kante. */
const ZIEL_LANGE_KANTE = 2000
/** Nutzerentscheidung 2026-09-10: WebP, Qualität 0,85. */
const WEBP_QUALITAET = 0.85

export interface VerkleinertesBild {
  blob: Blob
  breite: number
  hoehe: number
}

/**
 * Ist die lange Kante der Vorlage bereits ≤ 2000px, wird die Datei
 * UNVERÄNDERT übernommen statt neu kodiert (ADR-0016 Punkt 6) —
 * Neukodieren ohne Größenänderung kostet nur Qualität und Rechenzeit.
 * Sonst: verkleinern und als WebP 0,85 kodieren.
 *
 * `imageOrientation: 'from-image'` ist nicht optional: ohne sie landen
 * Hochformat-Aufnahmen vom Telefon gedreht im Bestand, und das Original, an
 * dem man es korrigieren könnte, ist bereits verworfen.
 */
export async function verkleinereBild(datei: File): Promise<VerkleinertesBild> {
  const bitmap = await createImageBitmap(datei, { imageOrientation: 'from-image' })

  try {
    const langeKante = Math.max(bitmap.width, bitmap.height)

    if (langeKante <= ZIEL_LANGE_KANTE) {
      return { blob: datei, breite: bitmap.width, hoehe: bitmap.height }
    }

    const faktor = ZIEL_LANGE_KANTE / langeKante
    const zielBreite = Math.round(bitmap.width * faktor)
    const zielHoehe = Math.round(bitmap.height * faktor)

    const canvas = new OffscreenCanvas(zielBreite, zielHoehe)
    const kontext = canvas.getContext('2d')
    if (!kontext) {
      // Sehr seltener Fall (kein 2D-Kontext verfügbar): Original unverändert
      // übernehmen statt den Hinzufüge-Versuch scheitern zu lassen — bei
      // mehreren ausgewählten Dateien sollen die übrigen trotzdem
      // gespeichert werden (kein Alles-oder-nichts).
      return { blob: datei, breite: bitmap.width, hoehe: bitmap.height }
    }
    kontext.drawImage(bitmap, 0, 0, zielBreite, zielHoehe)

    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITAET })
    return { blob, breite: zielBreite, hoehe: zielHoehe }
  } finally {
    bitmap.close()
  }
}

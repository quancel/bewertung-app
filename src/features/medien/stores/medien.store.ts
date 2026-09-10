/**
 * `useMedienStore` — der einzige Besitzer der Bilder im Arbeitsspeicher
 * (ADR-0016 Punkt 9). `medien` hat einen eigenen Object Store und deshalb
 * einen eigenen Store, importiert aber NICHTS aus `features/orte/` — er hält
 * Bilder je `ortId`, kennt den Ort selbst nicht, und Typen kommen
 * ausschließlich über `persistence/schema.ts`. Das ist die Bedingung, unter
 * der `Bilderbereich.vue` in `Ortebereich.vue` importiert werden darf
 * (ADR-0013 Punkt 3, ADR-0016 Punkt 10).
 *
 * Persistiert wird ausschließlich über `src/persistence/bilder-repository.ts`
 * — kein Feature ruft die Persistenzschicht an dieser Stelle vorbei auf.
 *
 * Anders als `useOrteStore` gibt es hier kein Autosave-Schreibmodell
 * (ADR-0005): Ein Bild-Datensatz wird einmal beim Hinzufügen geschrieben und
 * nie wieder verändert, nur gelöscht — deshalb kein `persistiereXyz`, keine
 * Serialisierung je ID.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ladeBilderFuerOrt, loescheBild, speichereBild } from '../../../persistence/bilder-repository'
import type { BildDatensatz } from '../../../persistence/schema'
import { verkleinereBild } from '../lib/verkleinern'

export type BildSchreibfehlerGrund = 'speicher_voll' | 'unbekannt'

export type BildHinzufuegenErgebnis =
  | { status: 'hinzugefuegt' }
  | { status: 'fehlgeschlagen'; grund: BildSchreibfehlerGrund }

export const useMedienStore = defineStore('medien', () => {
  const bilderJeOrt = ref<Record<string, BildDatensatz[]>>({})
  const geladeneOrte = ref<Set<string>>(new Set())

  function bilderFuerOrt(ortId: string): BildDatensatz[] {
    return bilderJeOrt.value[ortId] ?? []
  }

  /** Lädt einmalig je Ort; wiederholtes Öffnen desselben Ortes liest nicht
   * erneut (gleiches Muster wie `useOrteStore.sicherstellenGeladen`). */
  async function sicherstellenGeladenFuerOrt(ortId: string): Promise<void> {
    if (geladeneOrte.value.has(ortId)) return
    const ergebnis = await ladeBilderFuerOrt(ortId)
    if (ergebnis.status !== 'geladen') return
    // Reihenfolge im Raster ist `hinzugefuegtAm` (ADR-0016 Punkt 2), nicht
    // die Einfügereihenfolge des Object Stores.
    const sortiert = [...ergebnis.bilder].sort((a, b) => a.hinzugefuegtAm.localeCompare(b.hinzugefuegtAm))
    bilderJeOrt.value = { ...bilderJeOrt.value, [ortId]: sortiert }
    geladeneOrte.value.add(ortId)
  }

  /**
   * Verkleinert und speichert genau EIN Bild. Der Aufrufer (Bilderbereich.vue)
   * ruft dies je ausgewählter Datei separat auf (ADR-0016 Punkt 6: kein
   * Alles-oder-nichts über eine Mehrfachauswahl — bricht eine Datei wegen
   * Speichermangels ab, werden die übrigen trotzdem versucht). Ein
   * gescheitertes Bild landet nicht im Arbeitsspeicher — Schreiben und
   * Sichtbarwerden im Raster sind dieselbe Reihenfolge (ADR-0016 Punkt 7).
   */
  async function fuegeBildHinzu(ortId: string, datei: File): Promise<BildHinzufuegenErgebnis> {
    const verkleinert = await verkleinereBild(datei)
    const bild: BildDatensatz = {
      id: crypto.randomUUID(),
      ortId,
      hinzugefuegtAm: new Date().toISOString(),
      mimeTyp: verkleinert.blob.type,
      breite: verkleinert.breite,
      hoehe: verkleinert.hoehe,
      blob: verkleinert.blob,
    }

    const ergebnis = await speichereBild(bild)
    if (ergebnis.status === 'geschrieben') {
      bilderJeOrt.value = {
        ...bilderJeOrt.value,
        [ortId]: [...bilderFuerOrt(ortId), bild],
      }
      return { status: 'hinzugefuegt' }
    }

    const grund: BildSchreibfehlerGrund = ergebnis.status === 'schreiben_fehlgeschlagen' ? ergebnis.grund : 'unbekannt'
    return { status: 'fehlgeschlagen', grund }
  }

  /** Löscht ein Bild. Das Löschen eines ganzen Ortes läuft NICHT hierüber,
   * sondern kaskadiert in `orte-repository.ts` (ADR-0016 Punkt 8). */
  async function entferneBild(ortId: string, bildId: string): Promise<boolean> {
    const ergebnis = await loescheBild(bildId)
    if (ergebnis.status !== 'geschrieben') return false
    bilderJeOrt.value = {
      ...bilderJeOrt.value,
      [ortId]: bilderFuerOrt(ortId).filter((bild) => bild.id !== bildId),
    }
    return true
  }

  /**
   * Erzwingt ein erneutes Laden — öffentliches API für `datensicherung` nach
   * einem erfolgreichen Import (ADR-0017 Punkt 9). Verwirft nur den
   * Lade-Cache je Ort; ein tatsächlicher Refetch läuft lazy über
   * `sicherstellenGeladenFuerOrt`, sobald der jeweilige Ort wieder geöffnet
   * wird — kein eifriges Neuladen aller Bilder aller Orte, für die gerade
   * niemand hinschaut.
   */
  function ladeAlleNeu(): void {
    geladeneOrte.value = new Set()
    bilderJeOrt.value = {}
  }

  return {
    bilderFuerOrt,
    sicherstellenGeladenFuerOrt,
    fuegeBildHinzu,
    entferneBild,
    ladeAlleNeu,
  }
})

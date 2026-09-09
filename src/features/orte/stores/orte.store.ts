/**
 * `useOrteStore` — der einzige Besitzer des Ort-Datensatzes im
 * Arbeitsspeicher (ADR-0008). Persistiert wird ausschließlich über
 * `src/persistence/orte-repository.ts`; kein Feature ruft die
 * Persistenzschicht an dieser Stelle vorbei auf.
 *
 * Schreibmodell (ADR-0005): `aktualisiereFeld` ändert nur den
 * Arbeitsspeicher (jeder Tastenanschlag), `persistiereOrt` schreibt den
 * vollständigen, aktuellen Datensatz — aufgerufen von der View bei den vier
 * gleichwertigen Auslösern (Feld verlassen/Wert geändert, Route verlassen,
 * `visibilitychange`, `pagehide`).
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  ladeAlleOrte,
  loescheOrt as loescheOrtInDb,
  speichereOrt,
} from '../../../persistence/orte-repository'
import type { OrtDatensatz } from '../../../persistence/schema'
import type { OrtStammdaten } from '../model/orte.types'

export type OrtSchreibfehlerGrund = 'speicher_voll' | 'unbekannt'

export const useOrteStore = defineStore('orte', () => {
  const orte = ref<OrtDatensatz[]>([])
  const istGeladen = ref(false)
  // Je Ort-ID der zuletzt aufgetretene Schreibfehler — `null`, solange der
  // letzte Schreibvorgang erfolgreich war. Kein stiller Fehlschlag
  // (ADR-0005 Punkt 6).
  const schreibfehlerJeId = ref<Record<string, OrtSchreibfehlerGrund | null>>({})

  function ortNachId(id: string): OrtDatensatz | undefined {
    return orte.value.find((ort) => ort.id === id)
  }

  /** Lädt einmalig; wiederholte Aufrufe (z. B. bei jedem Routenwechsel)
   * lesen nicht erneut. Die eigentliche Migration läuft vor diesem Aufruf
   * bereits in `src/persistence/init.ts` (app-shell). */
  async function sicherstellenGeladen(): Promise<void> {
    if (istGeladen.value) return
    const ergebnis = await ladeAlleOrte()
    if (ergebnis.status === 'geladen') {
      orte.value = ergebnis.orte
      istGeladen.value = true
    }
    // 'speicher_nicht_verfuegbar' an dieser Stelle ist der seltene Fall
    // eines Speicherverlusts nach erfolgreichem Start; die App-weite Sperre
    // (src/persistence/init.ts) hat den regulären Fall bereits abgefangen.
  }

  async function legeOrtAn(bezeichnung: string): Promise<OrtDatensatz> {
    const neuerOrt: OrtDatensatz = {
      id: crypto.randomUUID(),
      bezeichnung,
      adresse: null,
      breite: null,
      laenge: null,
      geaendertAm: new Date().toISOString(),
    }
    orte.value = [...orte.value, neuerOrt]
    await persistiereOrt(neuerOrt.id)
    return neuerOrt
  }

  type BearbeitbaresFeld = Omit<OrtStammdaten, 'id' | 'geaendertAm'>

  /** Ändert ausschließlich den Arbeitsspeicher — kein Schreibvorgang. */
  function aktualisiereFeld(id: string, patch: Partial<BearbeitbaresFeld>): void {
    const index = orte.value.findIndex((ort) => ort.id === id)
    if (index === -1) return
    const bisheriger = orte.value[index]!
    const aktualisiert: OrtDatensatz = {
      ...bisheriger,
      ...patch,
      geaendertAm: new Date().toISOString(),
    }
    orte.value = [
      ...orte.value.slice(0, index),
      aktualisiert,
      ...orte.value.slice(index + 1),
    ]
  }

  /** Schreibt den vollständigen, aktuellen Stand aus dem Store (ADR-0005 Punkt 1). */
  async function persistiereOrt(id: string): Promise<void> {
    const aktuellerOrt = ortNachId(id)
    if (!aktuellerOrt) return

    const ergebnis = await speichereOrt(aktuellerOrt)

    if (ergebnis.status === 'geschrieben') {
      schreibfehlerJeId.value = { ...schreibfehlerJeId.value, [id]: null }
    } else if (ergebnis.status === 'schreiben_fehlgeschlagen') {
      schreibfehlerJeId.value = { ...schreibfehlerJeId.value, [id]: ergebnis.grund }
    } else {
      schreibfehlerJeId.value = { ...schreibfehlerJeId.value, [id]: 'unbekannt' }
    }
  }

  async function loescheOrt(id: string): Promise<boolean> {
    const ergebnis = await loescheOrtInDb(id)
    if (ergebnis.status !== 'geschrieben') {
      schreibfehlerJeId.value = {
        ...schreibfehlerJeId.value,
        [id]: ergebnis.status === 'schreiben_fehlgeschlagen' ? ergebnis.grund : 'unbekannt',
      }
      return false
    }
    orte.value = orte.value.filter((ort) => ort.id !== id)
    const verbleibendeFehler = { ...schreibfehlerJeId.value }
    delete verbleibendeFehler[id]
    schreibfehlerJeId.value = verbleibendeFehler
    return true
  }

  function schreibfehlerFuer(id: string) {
    return computed(() => schreibfehlerJeId.value[id] ?? null)
  }

  return {
    orte,
    istGeladen,
    ortNachId,
    sicherstellenGeladen,
    legeOrtAn,
    aktualisiereFeld,
    persistiereOrt,
    loescheOrt,
    schreibfehlerFuer,
  }
})

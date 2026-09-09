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
 *
 * `aktualisiereAchse` ist das öffentliche API, über das der Context
 * `bewertungen` (PO-2026-09-07-002) Achsenwert und -kommentar ändert — er
 * führt dafür keinen eigenen Store und ruft `src/persistence/` nicht selbst
 * auf (ADR-0008).
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

/** Aus dem zusammengesetzten `OrtDatensatz` abgeleitet (ADR-0008 Punkt 5) —
 * kein Import aus `features/bewertungen/model/`. */
export type AchsenName = keyof OrtDatensatz['bewertungen']
type AchsenPatch = Partial<OrtDatensatz['bewertungen'][AchsenName]>

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
      // Aktiv als „nicht bewertet" angelegt (ADR-0007), nicht weggelassen —
      // dieselbe Regel wie im Migrationsschritt 002-bewertungen.
      bewertungen: {
        ambiente: { wert: null, kommentar: null },
        zeit: { wert: null, kommentar: null },
        geschmack: { wert: null, kommentar: null },
        preisLeistung: { wert: null, kommentar: null },
      },
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

  /**
   * Öffentliches API für den Context `bewertungen` (ADR-0008): ändert genau
   * eine Achse eines Ortes im Arbeitsspeicher, kein Schreibvorgang. `patch`
   * berührt nur `wert` oder nur `kommentar` oder beide — Zurücksetzen einer
   * Achse übergibt ausschließlich `{ wert: null }` und lässt `kommentar`
   * damit unangetastet (ADR-0007 Punkt 2).
   */
  function aktualisiereAchse(id: string, achse: AchsenName, patch: AchsenPatch): void {
    const index = orte.value.findIndex((ort) => ort.id === id)
    if (index === -1) return
    const bisheriger = orte.value[index]!
    const aktualisiert: OrtDatensatz = {
      ...bisheriger,
      bewertungen: {
        ...bisheriger.bewertungen,
        [achse]: { ...bisheriger.bewertungen[achse], ...patch },
      },
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
    aktualisiereAchse,
    persistiereOrt,
    loescheOrt,
    schreibfehlerFuer,
  }
})

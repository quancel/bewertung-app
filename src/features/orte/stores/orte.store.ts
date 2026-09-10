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
 *
 * Ansichtszustand der Ortsliste (ADR-0009, PO-2026-09-07-003): Sortierung
 * gehört ebenfalls hierher, nicht in einen eigenen Store. `orteGefiltert` ist
 * bis PO-2026-09-07-004 die Identität — die Naht, an der der Tag-Filter
 * künftig ansetzt, ohne dass `sortierErgebnis` oder die Trefferzahl-Bildung
 * in der View umgebaut werden müssen.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ladeEinstellung, schreibeEinstellung } from '../../../persistence/einstellungen-repository'
import {
  ladeAlleOrte,
  loescheOrt as loescheOrtInDb,
  speichereOrt,
} from '../../../persistence/orte-repository'
import type { OrtDatensatz } from '../../../persistence/schema'
import { sortiereOrte, type SortierErgebnis } from '../../../shared/lib/sortierung'
import {
  istGueltigeOrteSortierung,
  ORTE_SORTIERUNG_VOREINSTELLUNG,
  SORTIER_ANFANGSRICHTUNG,
  type OrteSortierung,
  type SortierKriterium,
} from '../model/ansicht'
import type { OrtStammdaten } from '../model/orte.types'

/** Context-Präfix im Object Store `einstellungen` (ADR-0009 Punkt 3). */
const SORTIERUNG_SCHLUESSEL = 'orte.sortierung'

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

  // Ansichtszustand „Sortierung" (ADR-0009): startet mit der Voreinstellung,
  // bis `sicherstellenGeladen` einen gültigen gespeicherten Wert findet.
  const sortierung = ref<OrteSortierung>(ORTE_SORTIERUNG_VOREINSTELLUNG)

  function ortNachId(id: string): OrtDatensatz | undefined {
    return orte.value.find((ort) => ort.id === id)
  }

  /** Lädt einmalig; wiederholte Aufrufe (z. B. bei jedem Routenwechsel)
   * lesen nicht erneut. Die eigentliche Migration läuft vor diesem Aufruf
   * bereits in `src/persistence/init.ts` (app-shell). Lädt zugleich die
   * gespeicherte Sortierung (ADR-0009) — ein fehlender, unbekannter oder
   * ungültiger Wert bleibt still bei der Voreinstellung (ADR-0006 Punkt 3/4,
   * ADR-0009 Punkt 5): kein Fall für `OrtSchreibfehlerGrund`, keine Meldung. */
  async function sicherstellenGeladen(): Promise<void> {
    if (istGeladen.value) return
    const [ergebnis, sortierungErgebnis] = await Promise.all([
      ladeAlleOrte(),
      ladeEinstellung(SORTIERUNG_SCHLUESSEL),
    ])
    if (ergebnis.status === 'geladen') {
      orte.value = ergebnis.orte
      istGeladen.value = true
    }
    // 'speicher_nicht_verfuegbar' an dieser Stelle ist der seltene Fall
    // eines Speicherverlusts nach erfolgreichem Start; die App-weite Sperre
    // (src/persistence/init.ts) hat den regulären Fall bereits abgefangen.
    if (sortierungErgebnis.status === 'geladen' && istGueltigeOrteSortierung(sortierungErgebnis.wert)) {
      sortierung.value = sortierungErgebnis.wert
    }
  }

  // Naht für PO-2026-09-07-004 (ADR-0009): Hier tritt künftig das
  // Tag-Filter-Prädikat an die Stelle der Identität. Sortierfunktion und
  // Trefferzahl-Bildung in der View bauen bereits auf `orteGefiltert`, nicht
  // auf `orte`, und müssen dafür nicht angefasst werden.
  const orteGefiltert = computed(() => orte.value)

  /** Sortierte Ansicht inkl. der Partition „mit Wert / ohne Wert" für das
   * aktuelle Kriterium (ADR-0009 Punkt 8/9) — reine Ableitung, kein
   * Schreibzugriff. */
  const sortierErgebnis = computed<SortierErgebnis>(() => sortiereOrte(orteGefiltert.value, sortierung.value))

  /** Fire-and-forget (ADR-0009 Punkt 6): ein fehlgeschlagenes Schreiben der
   * Sortierung wird nicht gemeldet und bricht nichts ab. */
  function persistiereSortierung(): void {
    void schreibeEinstellung(SORTIERUNG_SCHLUESSEL, sortierung.value)
  }

  /**
   * Wechselt das Sortierkriterium und setzt die Richtung auf dessen
   * Anfangswert (design_notes PO-2026-09-07-003) — genau EIN Paar
   * (Kriterium, Richtung), kein Richtungsgedächtnis je Kriterium. Ein
   * erneuter Aufruf mit dem bereits aktiven Kriterium ändert nichts, damit
   * eine zwischenzeitlich frei umgeschaltete Richtung nicht durch bloßes
   * Wiederauswählen desselben Kriteriums zurückgesetzt wird.
   */
  function setzeSortierKriterium(kriterium: SortierKriterium): void {
    if (kriterium === sortierung.value.kriterium) return
    sortierung.value = { kriterium, richtung: SORTIER_ANFANGSRICHTUNG[kriterium] }
    persistiereSortierung()
  }

  /** Richtung ist unabhängig vom Kriterium frei umschaltbar (design_notes
   * PO-2026-09-07-003). */
  function schalteSortierrichtungUm(): void {
    sortierung.value = {
      ...sortierung.value,
      richtung: sortierung.value.richtung === 'aufsteigend' ? 'absteigend' : 'aufsteigend',
    }
    persistiereSortierung()
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
    sortierung,
    orteGefiltert,
    sortierErgebnis,
    setzeSortierKriterium,
    schalteSortierrichtungUm,
  }
})

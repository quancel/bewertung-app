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
 * gehört ebenfalls hierher, nicht in einen eigenen Store. Ab PO-2026-09-07-004
 * (ADR-0014) auch der Tag-Filter: `orteGefiltert` wendet das Tag-Prädikat aus
 * `shared/lib/tagfilter.ts` an, `sortierErgebnis` und die Trefferzahl-Bildung
 * in der View bleiben dabei unverändert — sie bauen bereits auf
 * `orteGefiltert`.
 *
 * `fuegeTagHinzu`/`entferneTagVonOrt` sind das öffentliche API, über das der
 * Context `tags` Tags an einem Ort ändert — er führt dafür keinen eigenen
 * Store und ruft `src/persistence/` nicht selbst auf (ADR-0008, ADR-0014
 * Punkt 1).
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
  ermittleKanonischeSchreibweise,
  leiteTagVokabularAb,
  normalisiereTagSchluessel,
  ortErfuelltTagfilter,
} from '../../../shared/lib/tagfilter'
import {
  istGueltigeOrteSortierung,
  istGueltigeTagfilterEinstellung,
  ORTE_SORTIERUNG_VOREINSTELLUNG,
  ORTE_TAGFILTER_VOREINSTELLUNG,
  SORTIER_ANFANGSRICHTUNG,
  type OrteSortierung,
  type OrteTagfilterEinstellung,
  type SortierKriterium,
  type TagVerknuepfung,
} from '../model/ansicht'
import type { OrtStammdaten } from '../model/orte.types'

/** Context-Präfix im Object Store `einstellungen` (ADR-0009 Punkt 3). */
const SORTIERUNG_SCHLUESSEL = 'orte.sortierung'
/** Nur die Verknüpfung wird persistiert, nicht die aktive Tag-Auswahl
 * (ADR-0014 Punkt 8, Nutzerentscheidung 2026-09-09). */
const TAGFILTER_SCHLUESSEL = 'orte.tagfilter'

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

  // Ansichtszustand „Tag-Filter" (ADR-0009, ADR-0014): Verknüpfung wird
  // geladen wie die Sortierung; die aktive Tag-Auswahl ist reiner
  // Arbeitsspeicher ohne eigene Persistenz (Nutzerentscheidung 2026-09-09) —
  // sie startet nach jedem Neuladen leer.
  const tagfilterEinstellung = ref<OrteTagfilterEinstellung>(ORTE_TAGFILTER_VOREINSTELLUNG)
  const tagAuswahlRoh = ref<string[]>([])

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
    const [ergebnis, sortierungErgebnis, tagfilterErgebnis] = await Promise.all([
      ladeAlleOrte(),
      ladeEinstellung(SORTIERUNG_SCHLUESSEL),
      ladeEinstellung(TAGFILTER_SCHLUESSEL),
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
    if (tagfilterErgebnis.status === 'geladen' && istGueltigeTagfilterEinstellung(tagfilterErgebnis.wert)) {
      tagfilterEinstellung.value = tagfilterErgebnis.wert
    }
  }

  /** Abgeleitetes Tag-Vokabular über den gesamten Bestand (ADR-0014 Punkt
   * 2) — kein Register, keine Referenzzählung. */
  const tagVokabular = computed(() => leiteTagVokabularAb(orte.value))

  /** Die aktive Tag-Auswahl gefiltert gegen das aktuelle Vokabular
   * (ADR-0014 Punkt 7): Verschwindet ein Tag mit seinem letzten Ort, fällt
   * er hier automatisch aus dem aktiven Filter — beim Lesen, ohne
   * Aufräum-Schreibvorgang auf `tagAuswahlRoh` (ADR-0014, Alternativen). */
  const aktiveTags = computed(() => tagAuswahlRoh.value.filter((tag) => tagVokabular.value.includes(tag)))

  /** Naht aus PO-2026-09-07-003 (ADR-0009): Das Tag-Prädikat aus
   * `shared/lib/tagfilter.ts` (ADR-0014 Punkt 9/10) ersetzt hier die
   * Identität. Sortierfunktion und Trefferzahl-Bildung in der View bauen
   * bereits auf `orteGefiltert` und müssen dafür nicht angefasst werden. */
  const orteGefiltert = computed(() =>
    orte.value.filter((ort) => ortErfuelltTagfilter(ort.tags, aktiveTags.value, tagfilterEinstellung.value.verknuepfung)),
  )

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
      // Aktiv als leeres Array angelegt (ADR-0014 Punkt 6-Muster), nicht
      // weggelassen.
      tags: [],
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

  /**
   * Öffentliches API für den Context `tags` (ADR-0008, ADR-0014 Punkt 1):
   * fügt einem Ort einen Tag hinzu, kein Schreibvorgang (Persistenz läuft
   * wie bei jedem anderen Feld über `persistiereOrt`, ausgelöst von der
   * View). Leereingabe erzeugt still keinen Tag (ADR-0014 Punkt 4).
   * Existiert im Bestand bereits ein Tag mit demselben normalisierten
   * Schlüssel, wird dessen Schreibweise übernommen (ADR-0014 Punkt 3) statt
   * eine zweite danebenzustellen. Ist der (kanonische) Tag an diesem Ort
   * bereits vergeben, passiert nichts — kein zweiter Eintrag, keine
   * Fehlermeldung.
   */
  function fuegeTagHinzu(id: string, eingabe: string): void {
    const kanonisch = ermittleKanonischeSchreibweise(orte.value, eingabe)
    if (kanonisch === null) return
    const index = orte.value.findIndex((ort) => ort.id === id)
    if (index === -1) return
    const bisheriger = orte.value[index]!
    const schluessel = normalisiereTagSchluessel(kanonisch)
    const bereitsVergeben = bisheriger.tags.some((tag) => normalisiereTagSchluessel(tag) === schluessel)
    if (bereitsVergeben) return
    const aktualisiert: OrtDatensatz = {
      ...bisheriger,
      tags: [...bisheriger.tags, kanonisch],
      geaendertAm: new Date().toISOString(),
    }
    orte.value = [
      ...orte.value.slice(0, index),
      aktualisiert,
      ...orte.value.slice(index + 1),
    ]
  }

  /** Öffentliches API für den Context `tags` (ADR-0008): entfernt einen Tag
   * von einem Ort, kein Schreibvorgang. Leichte, folgenlos wiederholbare
   * Entfernung ohne Bestätigung (design-conventions.md). */
  function entferneTagVonOrt(id: string, tag: string): void {
    const index = orte.value.findIndex((ort) => ort.id === id)
    if (index === -1) return
    const bisheriger = orte.value[index]!
    const schluessel = normalisiereTagSchluessel(tag)
    const aktualisiert: OrtDatensatz = {
      ...bisheriger,
      tags: bisheriger.tags.filter((vorhandenerTag) => normalisiereTagSchluessel(vorhandenerTag) !== schluessel),
      geaendertAm: new Date().toISOString(),
    }
    orte.value = [
      ...orte.value.slice(0, index),
      aktualisiert,
      ...orte.value.slice(index + 1),
    ]
  }

  /** Fire-and-forget (ADR-0009 Punkt 6): ein fehlgeschlagenes Schreiben der
   * Verknüpfung wird nicht gemeldet und bricht nichts ab. */
  function persistiereTagfilter(): void {
    void schreibeEinstellung(TAGFILTER_SCHLUESSEL, tagfilterEinstellung.value)
  }

  /** Setzt die UND/ODER-Verknüpfung explizit (Segment-Control mit zwei
   * Tap-Zielen, design_notes) und persistiert sie — die aktive Tag-Auswahl
   * bleibt dabei unverändert (ADR-0014 Punkt 8). */
  function setzeTagVerknuepfung(verknuepfung: TagVerknuepfung): void {
    if (verknuepfung === tagfilterEinstellung.value.verknuepfung) return
    tagfilterEinstellung.value = { verknuepfung }
    persistiereTagfilter()
  }

  /** Schaltet einen Tag im aktiven Filter an/aus — reiner Ansichtszustand,
   * keine Persistenz (Nutzerentscheidung 2026-09-09). */
  function schalteTagAktiv(tag: string): void {
    tagAuswahlRoh.value = tagAuswahlRoh.value.includes(tag)
      ? tagAuswahlRoh.value.filter((aktiverTag) => aktiverTag !== tag)
      : [...tagAuswahlRoh.value, tag]
  }

  /** Entfernt genau einen Tag aus dem aktiven Filter, ohne die übrigen
   * anzutasten. */
  function entferneTagAusFilter(tag: string): void {
    tagAuswahlRoh.value = tagAuswahlRoh.value.filter((aktiverTag) => aktiverTag !== tag)
  }

  /** Setzt den aktiven Filter in einem Schritt zurück — die gewählte
   * Verknüpfung bleibt unverändert bestehen (Kriterium, ADR-0014 Punkt 8). */
  function setzeTagfilterZurueck(): void {
    tagAuswahlRoh.value = []
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
    fuegeTagHinzu,
    entferneTagVonOrt,
    persistiereOrt,
    loescheOrt,
    schreibfehlerFuer,
    sortierung,
    orteGefiltert,
    sortierErgebnis,
    setzeSortierKriterium,
    schalteSortierrichtungUm,
    tagVokabular,
    aktiveTags,
    tagfilterEinstellung,
    setzeTagVerknuepfung,
    schalteTagAktiv,
    entferneTagAusFilter,
    setzeTagfilterZurueck,
  }
})

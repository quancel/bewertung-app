/**
 * Lese-/Schreib-API für den Object Store `orte` (ADR-0004, ADR-0005).
 * Einziger Zugriffsweg auf gespeicherte Orte — `useOrteStore` ruft
 * ausschließlich hier auf, nie `db.ts` direkt.
 *
 * Kein stiller Ersatzwert beim Lesen: Datensätze werden unverändert
 * zurückgegeben, wie sie in der Datenbank stehen. Ergebnisse statt
 * Ausnahmen: jede Funktion liefert ein ausdrückliches, unterscheidbares
 * Ergebnis.
 */
import { oeffneDatenbank } from './db'
import { sichereKopie } from './sichere-kopie'
import type { OrtDatensatz } from './schema'

export type LadeErgebnis =
  | { status: 'geladen'; orte: OrtDatensatz[] }
  | { status: 'speicher_nicht_verfuegbar' }

export type SchreibErgebnis =
  | { status: 'geschrieben' }
  | { status: 'speicher_nicht_verfuegbar' }
  | { status: 'schreiben_fehlgeschlagen'; grund: 'speicher_voll' | 'unbekannt' }

export async function ladeAlleOrte(): Promise<LadeErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  try {
    const orte = await geoeffnet.db.getAll('orte')
    return { status: 'geladen', orte }
  } catch {
    return { status: 'speicher_nicht_verfuegbar' }
  }
}

// Schreibvorgänge je Ort-ID serialisiert (ADR-0005 Punkt 3): läuft für eine
// ID bereits ein Schreibvorgang, wird der nächste angehängt statt parallel
// zu laufen.
const schreibWarteschlangenJeId = new Map<string, Promise<SchreibErgebnis>>()

/**
 * Persistiert den vollständigen, aktuellen Ort-Datensatz — nie ein
 * Lesen-Ändern-Zurückschreiben gegen die Datenbank (ADR-0005 Punkt 1). Der
 * Aufrufer übergibt bereits den kompletten Stand aus dem Pinia-Store — und
 * damit einen Wert, der (auch nur teilweise, siehe `sichere-kopie.ts`) hinter
 * einem reaktiven `Proxy` stecken kann. `tatsaechlichSpeichern` macht daraus
 * eine klonbare Kopie, bevor sie an `db.put` geht (PO-2026-09-12-001).
 */
export function speichereOrt(ort: OrtDatensatz): Promise<SchreibErgebnis> {
  const vorherigerLauf = schreibWarteschlangenJeId.get(ort.id) ?? Promise.resolve()

  const dieserLauf = vorherigerLauf.then(() => tatsaechlichSpeichern(ort))

  schreibWarteschlangenJeId.set(ort.id, dieserLauf)

  void dieserLauf.finally(() => {
    if (schreibWarteschlangenJeId.get(ort.id) === dieserLauf) {
      schreibWarteschlangenJeId.delete(ort.id)
    }
  })

  return dieserLauf
}

async function tatsaechlichSpeichern(ort: OrtDatensatz): Promise<SchreibErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  try {
    await geoeffnet.db.put('orte', sichereKopie(ort))
    return { status: 'geschrieben' }
  } catch (fehler) {
    return { status: 'schreiben_fehlgeschlagen', grund: bestimmeSchreibfehlerGrund(fehler) }
  }
}

/**
 * Löscht einen Ort. Ab -005 (ADR-0004 Punkt 8, ADR-0016 Punkt 8) läuft das
 * in EINER Transaktion über `orte` UND `bilder`: Der Ort-Datensatz und alle
 * Bilder mit dieser `ortId` (über den Index gefunden) werden gemeinsam
 * entfernt. Keine zweite Löschstelle in `bilder-repository.ts` oder im
 * `medien`-Store.
 */
export function loescheOrt(id: string): Promise<SchreibErgebnis> {
  const vorherigerLauf = schreibWarteschlangenJeId.get(id) ?? Promise.resolve()

  const dieserLauf = vorherigerLauf.then(() => tatsaechlichLoeschen(id))

  schreibWarteschlangenJeId.set(id, dieserLauf)

  void dieserLauf.finally(() => {
    if (schreibWarteschlangenJeId.get(id) === dieserLauf) {
      schreibWarteschlangenJeId.delete(id)
    }
  })

  return dieserLauf
}

async function tatsaechlichLoeschen(id: string): Promise<SchreibErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  try {
    const tx = geoeffnet.db.transaction(['orte', 'bilder'], 'readwrite')
    const orteStore = tx.objectStore('orte')
    const bilderIndex = tx.objectStore('bilder').index('ortId')

    await orteStore.delete(id)

    let cursor = await bilderIndex.openCursor(IDBKeyRange.only(id))
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }

    await tx.done
    return { status: 'geschrieben' }
  } catch (fehler) {
    return { status: 'schreiben_fehlgeschlagen', grund: bestimmeSchreibfehlerGrund(fehler) }
  }
}

function bestimmeSchreibfehlerGrund(fehler: unknown): 'speicher_voll' | 'unbekannt' {
  if (fehler instanceof DOMException && fehler.name === 'QuotaExceededError') {
    return 'speicher_voll'
  }
  return 'unbekannt'
}

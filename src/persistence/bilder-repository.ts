/**
 * Lese-/Schreib-API für den Object Store `bilder` (ADR-0004, ADR-0016).
 * Einziger Zugriffsweg auf gespeicherte Bilder — `useMedienStore` ruft
 * ausschließlich hier auf, nie `db.ts` direkt.
 *
 * Gleiche Bauform wie `orte-repository.ts` (ADR-0016 Punkt 7): Ergebnisse
 * statt Ausnahmen, `QuotaExceededError` als unterscheidbarer, ausdrücklicher
 * Fall. Kein stiller Ersatzwert beim Lesen.
 *
 * Keine Schreib-Warteschlange je ID wie bei `orte-repository.ts` (ADR-0005
 * Punkt 3): Ein Bild-Datensatz wird nach dem Anlegen nie mehr geändert, nur
 * einmal geschrieben oder gelöscht — es gibt keinen Wettlauf konkurrierender
 * Feldänderungen auf demselben Datensatz, den es zu serialisieren gälte.
 */
import { oeffneDatenbank } from './db'
import type { BildDatensatz } from './schema'

export type BilderLadeErgebnis =
  | { status: 'geladen'; bilder: BildDatensatz[] }
  | { status: 'speicher_nicht_verfuegbar' }

export type BildSchreibErgebnis =
  | { status: 'geschrieben' }
  | { status: 'speicher_nicht_verfuegbar' }
  | { status: 'schreiben_fehlgeschlagen'; grund: 'speicher_voll' | 'unbekannt' }

/** Lädt alle Bilder eines Ortes über den Index `ortId` — kein Rückverweis
 * vom Ort-Datensatz aus (ADR-0016 Punkt 1). Reihenfolge im Raster ist Sache
 * des Aufrufers (`hinzugefuegtAm`), nicht dieser Funktion. */
export async function ladeBilderFuerOrt(ortId: string): Promise<BilderLadeErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  try {
    const bilder = await geoeffnet.db.getAllFromIndex('bilder', 'ortId', ortId)
    return { status: 'geladen', bilder }
  } catch {
    return { status: 'speicher_nicht_verfuegbar' }
  }
}

/**
 * Persistiert einen vollständigen Bild-Datensatz. Schlägt der Schreibvorgang
 * wegen vollen Speichers fehl, bleibt der Bestand (Orte wie bereits
 * gespeicherte Bilder) unverändert — der Aufrufer erkennt daran, dass dieses
 * Bild nicht halb hinzugefügt im Raster erscheinen darf (ADR-0016 Punkt 7).
 */
export async function speichereBild(bild: BildDatensatz): Promise<BildSchreibErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  try {
    await geoeffnet.db.put('bilder', bild)
    return { status: 'geschrieben' }
  } catch (fehler) {
    return { status: 'schreiben_fehlgeschlagen', grund: bestimmeSchreibfehlerGrund(fehler) }
  }
}

/** Löscht ein einzelnes Bild. Das Löschen eines ganzen Ortes läuft nicht
 * hierüber, sondern kaskadiert in `orte-repository.ts` (ADR-0016 Punkt 8) —
 * keine zweite Löschstelle für diesen Fall. */
export async function loescheBild(id: string): Promise<BildSchreibErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  try {
    await geoeffnet.db.delete('bilder', id)
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

/**
 * Bestandsinitialisierung am Anwendungsstart, vor dem ersten Lesezugriff
 * eines Features (ADR-0004 Punkt 9). Öffnet die Datenbank, stellt fest, ob
 * ein Erststart, ein aktueller, ein älterer oder ein zu neuer Bestand
 * vorliegt, und schreibt eine Migration in genau einer Transaktion zurück
 * (Alles-oder-nichts, ADR-0003 Punkt 9).
 *
 * Wird von `App.vue` (app-shell) aufgerufen — **nicht** aus einem Feature.
 * Die beiden Sperrzustände `version_zu_neu` und `speicher_nicht_verfuegbar`
 * kommen von hier, damit -011/-012 später darauf verzweigen können, ohne
 * aus `features/` zu importieren (context-map.md).
 */
import { oeffneDatenbank } from './db'
import { SCHEMA_VERSION, type BestandMeta, type OrtDatensatz } from './schema'
import { wendeMigrationsketteAn, type RohBestand } from './migrations'

export type BestandInitErgebnis =
  | { status: 'bereit' }
  | { status: 'version_zu_neu' }
  | { status: 'speicher_nicht_verfuegbar' }

let initPromise: Promise<BestandInitErgebnis> | null = null

/** Einmal pro Sitzung aufrufen; wiederholte Aufrufe liefern dasselbe Ergebnis. */
export function initialisiereBestand(): Promise<BestandInitErgebnis> {
  if (!initPromise) {
    initPromise = tatsaechlichInitialisieren()
  }
  return initPromise
}

async function tatsaechlichInitialisieren(): Promise<BestandInitErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }
  const { db } = geoeffnet

  try {
    const meta = await db.get('meta', 'bestand')

    if (!meta) {
      // Eine leere Datenbank ist kein alter Bestand, sondern ein Erststart
      // (ADR-0004 Punkt 10): anlegen, keine Migration, keine Meldung.
      const erstbestand: BestandMeta = { id: 'bestand', schemaVersion: SCHEMA_VERSION }
      await db.put('meta', erstbestand)
      return { status: 'bereit' }
    }

    if (meta.schemaVersion > SCHEMA_VERSION) {
      return { status: 'version_zu_neu' }
    }

    if (meta.schemaVersion === SCHEMA_VERSION) {
      return { status: 'bereit' }
    }

    // Älterer Bestand: Kette anwenden und in einer Transaktion zurückschreiben.
    const alleOrte = await db.getAll('orte')
    const rohBestand: RohBestand = { schemaVersion: meta.schemaVersion, orte: alleOrte }
    const ergebnis = wendeMigrationsketteAn(rohBestand)

    if (ergebnis.status === 'version_zu_neu') {
      return { status: 'version_zu_neu' }
    }

    const tx = db.transaction(['meta', 'orte'], 'readwrite')
    const metaStore = tx.objectStore('meta')
    const orteStore = tx.objectStore('orte')

    await metaStore.put({ id: 'bestand', schemaVersion: ergebnis.bestand.schemaVersion })
    await orteStore.clear()
    for (const ort of ergebnis.bestand.orte as OrtDatensatz[]) {
      await orteStore.put(ort)
    }
    await tx.done

    return { status: 'bereit' }
  } catch {
    return { status: 'speicher_nicht_verfuegbar' }
  }
}

/** Nur für Tests: setzt den gecachten Initialisierungslauf zurück. */
export function _resetFuerTests(): void {
  initPromise = null
}

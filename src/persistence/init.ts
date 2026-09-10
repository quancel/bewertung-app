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
import { SCHEMA_VERSION, type BestandMeta, type BildDatensatz, type OrtDatensatz } from './schema'
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
    // Ab v4 (ADR-0016 Punkt 4) besteht der RohBestand aus meta + orte + bilder
    // — ein Bestand vor -005 hat den Store `bilder` zwar bereits (Struktur-
    // Upgrade in db.ts läuft vor diesem Zugriff), aber noch leer.
    const [alleOrte, alleBilder] = await Promise.all([db.getAll('orte'), db.getAll('bilder')])
    const rohBestand: RohBestand = {
      schemaVersion: meta.schemaVersion,
      orte: alleOrte,
      bilder: alleBilder,
    }
    const ergebnis = wendeMigrationsketteAn(rohBestand)

    if (ergebnis.status === 'version_zu_neu') {
      return { status: 'version_zu_neu' }
    }

    const tx = db.transaction(['meta', 'orte', 'bilder'], 'readwrite')
    const metaStore = tx.objectStore('meta')
    const orteStore = tx.objectStore('orte')
    const bilderStore = tx.objectStore('bilder')

    await metaStore.put({ id: 'bestand', schemaVersion: ergebnis.bestand.schemaVersion })
    await orteStore.clear()
    for (const ort of ergebnis.bestand.orte as OrtDatensatz[]) {
      await orteStore.put(ort)
    }
    await bilderStore.clear()
    // Ab dem vollständigen Kettenlauf immer gesetzt (schritt004Bilder setzt
    // es aktiv) — kein `?? []` (ADR-0005).
    for (const bild of ergebnis.bestand.bilder as BildDatensatz[]) {
      await bilderStore.put(bild)
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

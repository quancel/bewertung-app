/**
 * Öffnet den Gerätespeicher (IndexedDB über `idb`, ADR-0004). Einzige Stelle,
 * die `openDB` aufruft — alles andere in `src/persistence/` geht über
 * `oeffneDatenbank()`.
 *
 * Die IndexedDB-Datenbankversion hier (`IDB_STRUKTUR_VERSION`) beschreibt
 * ausschließlich, welche Object Stores existieren, und hat nichts mit der
 * inhaltlichen `SCHEMA_VERSION` aus `schema.ts` zu tun (ADR-0004 Punkt 2/3).
 * `upgrade()` legt ausschließlich Stores an und schreibt keinen Inhalt um.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { BestandMeta, OrtDatensatz } from './schema'

export const IDB_DATENBANK_NAME = 'bewertung-app'

/** Nur erhöhen, wenn ein Object Store oder Index dazukommt (z. B. `bilder` ab -005). */
export const IDB_STRUKTUR_VERSION = 1

export interface BewertungAppSchema extends DBSchema {
  meta: {
    key: string
    value: BestandMeta
  }
  orte: {
    key: string
    value: OrtDatensatz
  }
  // -003 füllt diesen Store erstmals (Anzeigeeinstellungen, ADR-0006). Hier
  // nur angelegt, nicht vorsorglich mit einem Wertetyp versehen.
  einstellungen: {
    key: string
    value: unknown
  }
}

export type DatenbankOeffnenErgebnis =
  | { status: 'geoeffnet'; db: IDBPDatabase<BewertungAppSchema> }
  | { status: 'speicher_nicht_verfuegbar' }

let datenbankPromise: Promise<DatenbankOeffnenErgebnis> | null = null

/**
 * Öffnet die Datenbank einmalig und cacht die Verbindung. Kein
 * `try/catch`, das den Fehler verschluckt — ein nicht verfügbarer
 * Gerätespeicher (Privatmodus, blockierte IndexedDB) kommt als
 * ausdrückliches Ergebnis zurück, nie als geworfene Ausnahme.
 */
export function oeffneDatenbank(): Promise<DatenbankOeffnenErgebnis> {
  if (!datenbankPromise) {
    datenbankPromise = tatsaechlichOeffnen()
  }
  return datenbankPromise
}

/** Nur für Tests: verwirft die gecachte Verbindung, damit ein erneuter
 * `oeffneDatenbank()`-Aufruf einen frischen Öffnungsversuch macht. */
export function _resetFuerTests(): void {
  datenbankPromise = null
}

async function tatsaechlichOeffnen(): Promise<DatenbankOeffnenErgebnis> {
  try {
    const db = await openDB<BewertungAppSchema>(
      IDB_DATENBANK_NAME,
      IDB_STRUKTUR_VERSION,
      {
        upgrade(db) {
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('orte')) {
            db.createObjectStore('orte', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('einstellungen')) {
            db.createObjectStore('einstellungen')
          }
        },
      },
    )
    return { status: 'geoeffnet', db }
  } catch {
    // Nicht als gecachtes Versprechen stehen lassen — ein erneuter Versuch
    // (z. B. nächster Aufruf) soll wieder öffnen dürfen, nicht am ersten
    // Fehlschlag für die gesamte Sitzung hängen bleiben.
    datenbankPromise = null
    return { status: 'speicher_nicht_verfuegbar' }
  }
}

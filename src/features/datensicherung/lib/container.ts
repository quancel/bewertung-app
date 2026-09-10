/**
 * Ein-/Auspacken des Export-/Import-Containers (ADR-0017 Punkt 1-5). Der
 * EINZIGE Ort im Projekt, an dem `fflate` importiert wird
 * (code-conventions.md „Export/Import (-009)") — `persistence/` kennt kein
 * Dateiformat, dieses Modul kennt kein IndexedDB: Es bekommt fertige
 * Datensätze übergeben bzw. liefert sie zurück, nie einen Dateinamen oder
 * Pfad.
 *
 * Container-Aufbau: `bestand.json` an der Wurzel trägt `formatKennung`,
 * `schemaVersion`, die vollständigen Ort-Datensätze und die Bild-METADATEN
 * OHNE `blob` (kein Base64!) — je Bild ein eigener, unkomprimierter
 * (`level: 0`) ZIP-Eintrag `bilder/<bildId>` mit den rohen Bytes.
 *
 * `entpackeBestand` prüft nur, ob der Container selbst plausibel ist (ZIP
 * lesbar, `bestand.json` vorhanden und geformt, jedes Bild hat einen
 * Metadatensatz und umgekehrt) — ob die `schemaVersion` zu neu ist,
 * entscheidet erst `wendeMigrationsketteAn` in `persistence/migrations/`,
 * nicht dieses Modul (kennt `SCHEMA_VERSION` bewusst nicht).
 */
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { BildDatensatz, OrtDatensatz } from '../../../persistence/schema'

const FORMAT_KENNUNG = 'bewertung-app-bestand'
const BILDER_PFAD_PRAEFIX = 'bilder/'

/** Formgleich mit dem Gerätespeicher (ADR-0017 Punkt 4): dieselbe Form wie
 * ein durch die Migrationskette gelaufener `RohBestand`, hier aber bereits
 * mit echten `Blob`s statt `unknown[]`. */
export interface BestandContainerDaten {
  schemaVersion: number
  orte: OrtDatensatz[]
  bilder: BildDatensatz[]
}

type BildMetadaten = Omit<BildDatensatz, 'blob'>

/** Ein neues Feld hier wäre optional zu deklarieren (analog `RohBestand`
 * Punkt 4) — `bilder` fehlt bei einem Container, der aus einer Zeit vor
 * PO-2026-09-07-005 stammt (v1-v3), ganz. */
interface BestandJson {
  formatKennung: string
  schemaVersion: number
  orte: unknown[]
  bilder?: BildMetadaten[]
}

function zuMetadaten(bild: BildDatensatz): BildMetadaten {
  return {
    id: bild.id,
    ortId: bild.ortId,
    hinzugefuegtAm: bild.hinzugefuegtAm,
    mimeTyp: bild.mimeTyp,
    breite: bild.breite,
    hoehe: bild.hoehe,
  }
}

/** Packt den vollständigen Bestand zu EINEM ZIP-Blob (ADR-0017 Punkt 1/2). */
export async function packeBestand(bestand: BestandContainerDaten): Promise<Blob> {
  const bestandJson: BestandJson = {
    formatKennung: FORMAT_KENNUNG,
    schemaVersion: bestand.schemaVersion,
    orte: bestand.orte,
    bilder: bestand.bilder.map(zuMetadaten),
  }

  const dateien: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {
    'bestand.json': strToU8(JSON.stringify(bestandJson)),
  }

  for (const bild of bestand.bilder) {
    const bytes = new Uint8Array(await bild.blob.arrayBuffer())
    // Ohne Kompression (ADR-0017 Punkt 1): Bilder sind bereits komprimiert,
    // ein zweiter Durchgang kostet nur Rechenzeit.
    dateien[`${BILDER_PFAD_PRAEFIX}${bild.id}`] = [bytes, { level: 0 }]
  }

  const gepackt = zipSync(dateien)
  return new Blob([gepackt as BlobPart], { type: 'application/zip' })
}

export type EntpackErgebnis =
  | { status: 'ok'; bestand: { schemaVersion: number; orte: unknown[]; bilder: BildDatensatz[] } }
  | { status: 'beschaedigt' }

/**
 * Entpackt einen Container. Liefert noch KEINEN geprüften `OrtDatensatz[]`
 * zurück — `orte` bleibt bewusst `unknown[]`, genau wie bei `RohBestand`: Die
 * inhaltliche Prüfung/Vervollständigung ist Sache der Migrationskette, nicht
 * dieses Moduls.
 */
export async function entpackeBestand(datei: Blob): Promise<EntpackErgebnis> {
  let eintraege: Record<string, Uint8Array>
  try {
    const bytes = new Uint8Array(await datei.arrayBuffer())
    eintraege = unzipSync(bytes)
  } catch {
    return { status: 'beschaedigt' }
  }

  const bestandJsonBytes = eintraege['bestand.json']
  if (!bestandJsonBytes) return { status: 'beschaedigt' }

  let geparst: unknown
  try {
    geparst = JSON.parse(strFromU8(bestandJsonBytes))
  } catch {
    return { status: 'beschaedigt' }
  }

  if (!istBestandJson(geparst)) return { status: 'beschaedigt' }

  const bilderMetadaten = geparst.bilder ?? []
  const bilderDateinamen = new Set(
    Object.keys(eintraege).filter((name) => name.startsWith(BILDER_PFAD_PRAEFIX)),
  )
  const metadatenIds = new Set(bilderMetadaten.map((bild) => bild.id))

  // Jeder Bildeintrag braucht einen Metadatensatz und umgekehrt (ADR-0017
  // Punkt 5) — sonst Abbruch ohne jeden Schreibvorgang.
  if (bilderDateinamen.size !== metadatenIds.size) return { status: 'beschaedigt' }
  for (const id of metadatenIds) {
    if (!bilderDateinamen.has(`${BILDER_PFAD_PRAEFIX}${id}`)) return { status: 'beschaedigt' }
  }

  const bilder: BildDatensatz[] = []
  for (const metadaten of bilderMetadaten) {
    const bytes = eintraege[`${BILDER_PFAD_PRAEFIX}${metadaten.id}`]
    if (!bytes) return { status: 'beschaedigt' }
    bilder.push({
      ...metadaten,
      blob: new Blob([bytes as BlobPart], { type: metadaten.mimeTyp }),
    })
  }

  return {
    status: 'ok',
    bestand: {
      schemaVersion: geparst.schemaVersion,
      orte: geparst.orte,
      bilder,
    },
  }
}

function istBestandJson(wert: unknown): wert is BestandJson {
  if (typeof wert !== 'object' || wert === null) return false
  const kandidat = wert as Record<string, unknown>
  if (kandidat.formatKennung !== FORMAT_KENNUNG) return false
  if (typeof kandidat.schemaVersion !== 'number') return false
  if (!Array.isArray(kandidat.orte)) return false
  if (kandidat.bilder === undefined) return true
  if (!Array.isArray(kandidat.bilder)) return false
  return kandidat.bilder.every((bild) => istBildMetadaten(bild))
}

function istBildMetadaten(wert: unknown): wert is BildMetadaten {
  if (typeof wert !== 'object' || wert === null) return false
  const kandidat = wert as Record<string, unknown>
  return (
    typeof kandidat.id === 'string' &&
    typeof kandidat.ortId === 'string' &&
    typeof kandidat.hinzugefuegtAm === 'string' &&
    typeof kandidat.mimeTyp === 'string' &&
    typeof kandidat.breite === 'number' &&
    typeof kandidat.hoehe === 'number'
  )
}

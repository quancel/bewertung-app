/**
 * Import-Orchestrierung (ADR-0017 Punkt 4): entpacken → `bestand.json`
 * bereits von `container.ts` geprüft → `wendeMigrationsketteAn` (DIESELBE
 * Kette wie der Gerätespeicher, kein zweiter Pfad) → erst danach schreiben
 * über `persistence/bestand-repository.ts`. Die Kette sieht nie einen
 * Dateinamen und nie einen Pfad.
 *
 * Kennt kein ZIP-Detail (das liegt in `container.ts`) und schreibt nie am
 * `bestand-repository.ts` vorbei direkt in IndexedDB.
 */
import { wendeMigrationsketteAn } from '../../../persistence/migrations'
import { ergaenzeBestand, ersetzeBestand } from '../../../persistence/bestand-repository'
import type { BildDatensatz, OrtDatensatz } from '../../../persistence/schema'
import { entpackeBestand, type BestandContainerDaten } from './container'

export type ImportModus = 'ersetzen' | 'ergaenzen'

export type ImportErgebnis =
  | { status: 'importiert'; uebernommeneOrteAnzahl: number }
  | { status: 'beschaedigt' }
  | { status: 'zu_neu' }
  | { status: 'speicher_nicht_verfuegbar' }
  | { status: 'schreiben_fehlgeschlagen'; grund: 'speicher_voll' | 'unbekannt' }

export async function fuehreImportAus(datei: Blob, modus: ImportModus): Promise<ImportErgebnis> {
  const entpackt = await entpackeBestand(datei)
  if (entpackt.status !== 'ok') {
    return { status: 'beschaedigt' }
  }

  const migrationsErgebnis = wendeMigrationsketteAn({
    schemaVersion: entpackt.bestand.schemaVersion,
    orte: entpackt.bestand.orte,
    bilder: entpackt.bestand.bilder,
  })

  if (migrationsErgebnis.status === 'version_zu_neu') {
    return { status: 'zu_neu' }
  }

  // Nach dem vollständigen Kettenlauf immer gesetzt (der letzte Schritt,
  // der `bilder` einführt, füllt es aktiv) — dieselbe Auswertung wie in
  // `persistence/init.ts`.
  const migrierterBestand: BestandContainerDaten = {
    schemaVersion: migrationsErgebnis.bestand.schemaVersion,
    orte: migrationsErgebnis.bestand.orte as OrtDatensatz[],
    bilder: (migrationsErgebnis.bestand.bilder ?? []) as BildDatensatz[],
  }

  if (modus === 'ersetzen') {
    const schreibErgebnis = await ersetzeBestand(migrierterBestand)
    if (schreibErgebnis.status !== 'geschrieben') return schreibErgebnis
    return { status: 'importiert', uebernommeneOrteAnzahl: migrierterBestand.orte.length }
  }

  const schreibErgebnis = await ergaenzeBestand(migrierterBestand)
  if (schreibErgebnis.status !== 'geschrieben') return schreibErgebnis
  return { status: 'importiert', uebernommeneOrteAnzahl: schreibErgebnis.uebernommeneOrteAnzahl }
}

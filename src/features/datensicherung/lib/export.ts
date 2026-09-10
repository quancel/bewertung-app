/**
 * Export-Orchestrierung (ADR-0017): liest den vollständigen Bestand über
 * `persistence/bestand-repository.ts`, packt ihn über `container.ts` und
 * löst den Download aus — ein Tap, kein Zwischenschritt (design_notes).
 * Läuft vollständig auf dem Gerät, ohne Netzwerkzugriff.
 */
import { ladeVollstaendigenBestand } from '../../../persistence/bestand-repository'
import { packeBestand } from './container'

export type ExportErgebnis =
  | { status: 'heruntergeladen' }
  | { status: 'speicher_nicht_verfuegbar' }

export async function fuehreExportAus(): Promise<ExportErgebnis> {
  const gelesen = await ladeVollstaendigenBestand()
  if (gelesen.status !== 'geladen') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  const blob = await packeBestand(gelesen.bestand)
  loeseDownloadAus(blob, dateiname())

  return { status: 'heruntergeladen' }
}

function dateiname(): string {
  const heute = new Date().toISOString().slice(0, 10)
  return `bewertung-app-export-${heute}.zip`
}

function loeseDownloadAus(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

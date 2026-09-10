/**
 * Lese-/Schreib-API für den VOLLSTÄNDIGEN Bestand (ADR-0017 Punkt 8):
 * Export/Import (`datensicherung`) behandeln Orte und Bilder als eine
 * Einheit, statt über `orte-repository.ts`/`bilder-repository.ts` einzeln zu
 * lesen/schreiben. Gleiche Bauform wie die übrigen Repositories: Ergebnisse
 * statt Ausnahmen, kein stiller Ersatzwert.
 *
 * Kennt kein Dateiformat (kein ZIP, kein `fflate`) — das liegt in
 * `features/datensicherung/lib/`. Diese Datei kennt nur IndexedDB.
 */
import { oeffneDatenbank } from './db'
import { SCHEMA_VERSION, type BildDatensatz, type OrtDatensatz } from './schema'

export interface VollstaendigerBestand {
  schemaVersion: number
  orte: OrtDatensatz[]
  bilder: BildDatensatz[]
}

export type BestandLeseErgebnis =
  | { status: 'geladen'; bestand: VollstaendigerBestand }
  | { status: 'speicher_nicht_verfuegbar' }

export type BestandSchreibErgebnis =
  | { status: 'geschrieben' }
  | { status: 'speicher_nicht_verfuegbar' }
  | { status: 'schreiben_fehlgeschlagen'; grund: 'speicher_voll' | 'unbekannt' }

export type BestandErgaenzenErgebnis =
  | { status: 'geschrieben'; uebernommeneOrteAnzahl: number }
  | { status: 'speicher_nicht_verfuegbar' }
  | { status: 'schreiben_fehlgeschlagen'; grund: 'speicher_voll' | 'unbekannt' }

/**
 * Liest den gesamten Bestand für den Export. Kein Zugriff auf `meta` nötig:
 * Wird diese Funktion aufgerufen, läuft die App bereits (nach erfolgreicher
 * `initialisiereBestand()`), also ist der Gerätespeicher garantiert auf
 * `SCHEMA_VERSION` — kein stiller Ersatzwert, sondern dieselbe Konstante wie
 * überall sonst.
 */
export async function ladeVollstaendigenBestand(): Promise<BestandLeseErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  try {
    const [orte, bilder] = await Promise.all([
      geoeffnet.db.getAll('orte'),
      geoeffnet.db.getAll('bilder'),
    ])
    return { status: 'geladen', bestand: { schemaVersion: SCHEMA_VERSION, orte, bilder } }
  } catch {
    return { status: 'speicher_nicht_verfuegbar' }
  }
}

/**
 * „Ersetzen" (ADR-0017 Punkt 6): leert `orte` und `bilder` in EINER
 * Transaktion und schreibt den übergebenen Bestand hinein, inklusive
 * `meta.schemaVersion`. Der Store `einstellungen` wird nicht angefasst —
 * Sortierung und UND/ODER-Verknüpfung überleben einen Import.
 *
 * `bestand` muss bereits durch `wendeMigrationsketteAn` gelaufen und damit
 * auf `SCHEMA_VERSION` sein — diese Funktion prüft die Version nicht noch
 * einmal, das ist Sache der Aufruferin (`features/datensicherung/`).
 */
export async function ersetzeBestand(bestand: VollstaendigerBestand): Promise<BestandSchreibErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  try {
    const tx = geoeffnet.db.transaction(['meta', 'orte', 'bilder'], 'readwrite')
    const metaStore = tx.objectStore('meta')
    const orteStore = tx.objectStore('orte')
    const bilderStore = tx.objectStore('bilder')

    await metaStore.put({ id: 'bestand', schemaVersion: bestand.schemaVersion })
    await orteStore.clear()
    for (const ort of bestand.orte) {
      await orteStore.put(ort)
    }
    await bilderStore.clear()
    for (const bild of bestand.bilder) {
      await bilderStore.put(bild)
    }
    await tx.done

    return { status: 'geschrieben' }
  } catch (fehler) {
    return { status: 'schreiben_fehlgeschlagen', grund: bestimmeSchreibfehlerGrund(fehler) }
  }
}

/**
 * „Ergänzen" (ADR-0017 Punkt 7, Nutzerentscheidung 2026-09-10): führt über
 * die Ort-ID zusammen. Bei einer Kollision bleibt der BESTEHENDE Ort
 * unverändert, der Ort aus `bestand` wird übersprungen — samt seiner Bilder,
 * damit kein Bild ohne Ort entsteht. Die gemeldete Anzahl ist die Zahl der
 * tatsächlich übernommenen Orte, nicht die Zahl der Orte in `bestand`.
 *
 * `meta.schemaVersion` wird NICHT angefasst: Die App läuft bereits auf
 * `SCHEMA_VERSION`, sonst wäre dieser Store nicht erreichbar gewesen.
 */
export async function ergaenzeBestand(bestand: VollstaendigerBestand): Promise<BestandErgaenzenErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  try {
    const tx = geoeffnet.db.transaction(['orte', 'bilder'], 'readwrite')
    const orteStore = tx.objectStore('orte')
    const bilderStore = tx.objectStore('bilder')

    const bestehendeIds = new Set(await orteStore.getAllKeys())
    const uebernommeneOrte = bestand.orte.filter((ort) => !bestehendeIds.has(ort.id))
    const uebernommeneIds = new Set(uebernommeneOrte.map((ort) => ort.id))

    for (const ort of uebernommeneOrte) {
      await orteStore.put(ort)
    }
    for (const bild of bestand.bilder) {
      if (uebernommeneIds.has(bild.ortId)) {
        await bilderStore.put(bild)
      }
    }

    await tx.done

    return { status: 'geschrieben', uebernommeneOrteAnzahl: uebernommeneOrte.length }
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

/**
 * Sortierfunktion für die Ortsliste (ADR-0009 Punkt 8/9/10): eine reine
 * Ableitung — liest den Bestand, schreibt nichts, verändert `geaendertAm`
 * nicht und mutiert das übergebene Array nicht, sondern liefert neue Arrays.
 *
 * Liefert die Partition „Orte mit Wert für dieses Kriterium / Orte ohne
 * Wert" mit (ADR-0009 Punkt 9): Andernfalls müsste die Ansicht die Regel „0
 * ist ein Wert, `null` nicht" (ADR-0007) ein zweites Mal formulieren — genau
 * dort entstünde der Fehler. Ein Ort mit dem Wert 0 gehört nie in die
 * Gruppe „ohne Wert" (design-conventions.md, „Listen").
 *
 * Sortiert und verglichen wird auf der ungerundeten Gesamtnote
 * (`berechneGesamtnote`, ADR-0007 Punkt 6) — der gerundete Anzeigewert wird
 * nie zurückgelesen oder verglichen.
 *
 * Gleichstand (ADR-0009 Punkt 10): zuerst das gewählte Kriterium, dann
 * Bezeichnung über `Intl.Collator('de')`, dann die ID — der Tie-Break
 * bleibt unabhängig von der gewählten Richtung, damit er deterministisch
 * bleibt statt sich bei jedem Richtungswechsel mit umzudrehen.
 *
 * Der Typ der Sortiereinstellung gehört dem Context `orte`
 * (`features/orte/model/ansicht.ts`, ADR-0009 Punkt 1) — dieser Import ist
 * rein typbezogen für die Kriterien-Konstanten, keine Store-/Zustandsbindung.
 */
import type { OrtDatensatz } from '../../persistence/schema'
import { ACHSEN_KRITERIEN, type OrteSortierung, type SortierKriterium } from '../../features/orte/model/ansicht'
import { berechneGesamtnote } from './gesamtnote'

export interface SortierErgebnis {
  /** Orte mit einem Wert für das gewählte Kriterium, sortiert. */
  mitWert: OrtDatensatz[]
  /** Orte ohne Wert für das gewählte Kriterium — nur bei Gesamtnote oder
   * einer Einzelachse überhaupt möglich, gesammelt ans Ende, unabhängig von
   * der Richtung. Für Bezeichnung/Zuletzt geändert immer leer. */
  ohneWert: OrtDatensatz[]
}

const bezeichnungsVergleicher = new Intl.Collator('de')

function istAchsenKriterium(
  kriterium: SortierKriterium,
): kriterium is (typeof ACHSEN_KRITERIEN)[number] {
  return (ACHSEN_KRITERIEN as readonly string[]).includes(kriterium)
}

/** `null`, wenn das Kriterium für diesen Ort keinen Wert hat — nur bei
 * Gesamtnote/Achse möglich, sonst nie. */
function numerischerWert(ort: OrtDatensatz, kriterium: SortierKriterium): number | null {
  if (kriterium === 'gesamtnote') return berechneGesamtnote(ort.bewertungen)
  if (istAchsenKriterium(kriterium)) return ort.bewertungen[kriterium].wert
  return null
}

function hatWert(ort: OrtDatensatz, kriterium: SortierKriterium): boolean {
  if (kriterium === 'bezeichnung' || kriterium === 'geaendertAm') return true
  return numerischerWert(ort, kriterium) !== null
}

/** Deterministischer Tie-Break, unabhängig von der Sortierrichtung. */
function vergleicheGleichstand(a: OrtDatensatz, b: OrtDatensatz): number {
  const bezeichnungsvergleich = bezeichnungsVergleicher.compare(a.bezeichnung, b.bezeichnung)
  if (bezeichnungsvergleich !== 0) return bezeichnungsvergleich
  return a.id.localeCompare(b.id)
}

function vergleicheHauptkriterium(a: OrtDatensatz, b: OrtDatensatz, kriterium: SortierKriterium): number {
  if (kriterium === 'bezeichnung') return bezeichnungsVergleicher.compare(a.bezeichnung, b.bezeichnung)
  if (kriterium === 'geaendertAm') return a.geaendertAm.localeCompare(b.geaendertAm)
  // Gesamtnote/Achse: `mitWert` hat laut `hatWert` bereits nur Orte mit
  // einem Wert für dieses Kriterium — kein erneuter Null-Fallback nötig.
  const wertA = numerischerWert(a, kriterium) as number
  const wertB = numerischerWert(b, kriterium) as number
  return wertA - wertB
}

export function sortiereOrte(orte: readonly OrtDatensatz[], sortierung: OrteSortierung): SortierErgebnis {
  const { kriterium, richtung } = sortierung
  const richtungsfaktor = richtung === 'aufsteigend' ? 1 : -1

  const mitWert: OrtDatensatz[] = []
  const ohneWert: OrtDatensatz[] = []
  for (const ort of orte) {
    if (hatWert(ort, kriterium)) mitWert.push(ort)
    else ohneWert.push(ort)
  }

  mitWert.sort((a, b) => {
    const hauptvergleich = vergleicheHauptkriterium(a, b, kriterium) * richtungsfaktor
    return hauptvergleich !== 0 ? hauptvergleich : vergleicheGleichstand(a, b)
  })
  ohneWert.sort(vergleicheGleichstand)

  return { mitWert, ohneWert }
}

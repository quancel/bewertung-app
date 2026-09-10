<script setup lang="ts">
/**
 * Listenzeile (design_notes PO-2026-09-07-001): Bezeichnung als Primärzeile,
 * Adresse nur als Sekundärzeile, wenn vorhanden — sonst schlicht weggelassen
 * (kein Platzhalter, kein Badge, kein Warn-Icon). Präsentational, kennt
 * keinen Store.
 *
 * Gesamtnote (PO-2026-09-07-002, design_notes): fehlt sie ganz, bleibt die
 * Spalte leer (kein „0,0"-Ersatzwert); bei Teilbewertung ergänzt ein
 * gemuteter Zusatz „aus N von 4 Achsen", der bei 4 von 4 entfällt. Diese
 * Teilbewertungs-Kennzeichnung bleibt sichtbar, unabhängig vom aktuellen
 * Sortierkriterium (Kriterium der Detailansicht aus -002).
 *
 * Wertanzeige nach Sortierkriterium (design_notes PO-2026-09-07-003): Wird
 * nach einer Einzelachse sortiert, zeigt die Zeile den Intensitätsbalken +
 * Zahl GENAU dieser Achse statt der Gesamtnote — die Reihenfolge der Liste
 * bleibt so nachvollziehbar. `zeigeWert=false` (Gruppe „ohne Wert") blendet
 * den gesamten Wert-Slot aus, unabhängig vom Kriterium.
 *
 * Auswahl-Hervorhebung (PO-2026-09-07-012, design-conventions.md
 * „Master-Detail (ab lg)"): `ausgewaehlt` kommt von `Ortebereich.vue`, das
 * `route.params.ortId` gegen diesen Ort vergleicht — diese Komponente
 * bleibt store- und routenfrei und bekommt das Ergebnis nur als Prop.
 */
import { computed } from 'vue'
import type { OrtDatensatz } from '../../../persistence/schema'
import { berechneGesamtnote, formatiereGesamtnote, zaehleAusgefuellteAchsen } from '../../../shared/lib/gesamtnote'
import Intensitaetsbalken from '../../../shared/ui/Intensitaetsbalken.vue'
import { ACHSEN_KRITERIEN, type AchsenKriterium, type SortierKriterium } from '../model/ansicht'

const props = withDefaults(
  defineProps<{
    ort: OrtDatensatz
    ausgewaehlt?: boolean
    /** Aktuelles Sortierkriterium der Liste (ADR-0009) — steuert, ob die
     * Gesamtnote oder eine einzelne Achse gezeigt wird. */
    sortierKriterium?: SortierKriterium
    /** `false` in der Gruppe „ohne Wert": kein Wert-Slot, auch keine
     * Gesamtnote (design_notes PO-2026-09-07-003). */
    zeigeWert?: boolean
  }>(),
  { ausgewaehlt: false, sortierKriterium: 'bezeichnung', zeigeWert: true },
)

function istAchsenKriterium(kriterium: SortierKriterium): kriterium is AchsenKriterium {
  return (ACHSEN_KRITERIEN as readonly string[]).includes(kriterium)
}

// Reine Ableitung aus shared/lib/ (ADR-0008 Punkt 6) — kein Import aus
// features/bewertungen/.
const gesamtnote = computed(() => berechneGesamtnote(props.ort.bewertungen))
const ausgefuellteAchsen = computed(() => zaehleAusgefuellteAchsen(props.ort.bewertungen))

// Nur bei einer Einzelachse als Kriterium gesetzt; in der Gruppe „mit Wert"
// (siehe `sortiereOrte`) ist der Wert dann garantiert nicht `null`.
const achsenWert = computed(() =>
  istAchsenKriterium(props.sortierKriterium) ? props.ort.bewertungen[props.sortierKriterium].wert : null,
)
</script>

<template>
  <RouterLink
    :to="`/orte/${ort.id}`"
    class="ortszeile"
    :class="{ 'ortszeile--ausgewaehlt': ausgewaehlt }"
    :aria-current="ausgewaehlt ? 'true' : undefined"
  >
    <span class="ortszeile__hauptzeile">
      <span class="ortszeile__bezeichnung">{{ ort.bezeichnung }}</span>
      <span
        v-if="zeigeWert && achsenWert !== null"
        class="ortszeile__achsenwert"
      >
        <Intensitaetsbalken :wert="achsenWert" />
      </span>
      <span
        v-else-if="zeigeWert && gesamtnote !== null"
        class="ortszeile__gesamtnote"
      >
        <span class="ortszeile__gesamtnote-wert">{{ formatiereGesamtnote(gesamtnote) }}</span>
        <span
          v-if="ausgefuellteAchsen < 4"
          class="ortszeile__gesamtnote-zusatz"
        >aus {{ ausgefuellteAchsen }} von 4 Achsen</span>
      </span>
    </span>
    <span
      v-if="ort.adresse"
      class="ortszeile__adresse"
    >{{ ort.adresse }}</span>
  </RouterLink>
</template>

<style scoped>
.ortszeile {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-16);
  border-radius: var(--radius-12);
  text-decoration: none;
  color: inherit;
}

.ortszeile:hover {
  background-color: var(--surface-muted);
}

/* Auswahl-Hervorhebung ab lg (design-conventions.md „Master-Detail"): linke
   3px-Kante + Fläche --color-primary-50. Bleibt bestehen, auch wenn die
   Zeile durch eine künftige Filteränderung aus der Liste fällt — sie ist
   dann schlicht nicht mehr im DOM, keine Sonderbehandlung hier nötig. */
.ortszeile--ausgewaehlt {
  background-color: var(--color-primary-50);
  box-shadow: inset 3px 0 0 var(--color-primary-600);
}

.ortszeile--ausgewaehlt:hover {
  background-color: var(--color-primary-50);
}

.ortszeile__hauptzeile {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-8);
}

.ortszeile__bezeichnung {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  color: var(--text);
}

.ortszeile__achsenwert {
  flex-shrink: 0;
}

.ortszeile__gesamtnote {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  flex-shrink: 0;
}

.ortszeile__gesamtnote-wert {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary-700);
}

.ortszeile__gesamtnote-zusatz {
  font-size: var(--font-size-14);
  color: var(--text-muted);
}

.ortszeile__adresse {
  font-size: var(--font-size-14);
  color: var(--text-muted);
}
</style>

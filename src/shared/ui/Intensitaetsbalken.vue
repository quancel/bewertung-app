<script setup lang="ts">
/**
 * Intensitätsbalken (design-conventions.md, „Werte mit Bereich, bei denen 0
 * gültig ist"): stellt einen Achsenwert 0–10 oder den Zustand „nicht
 * bewertet" dar. Präsentational, kennt keinen Store (ADR-0008 Punkt 7) —
 * zweiter Nutzer neben der Bewertungsachse (Detail) ist die Ortsliste
 * (spätestens ab PO-2026-09-07-003, beim Sortieren nach Einzelachse).
 *
 * Genau zwei Darstellungen, nichts dazwischen: „nicht bewertet" (wert ===
 * null) zeigt keinen Balken, nur den Platzhaltertext. Ein gesetztes 0 zeigt
 * Balken (mit sichtbarem 1px-Rahmen, unabhängig vom Füllstand) + Zahl „0"
 * wie jeder andere Wert — die Unterscheidung hängt nie allein an der
 * Füllung.
 */
import { computed } from 'vue'

const props = defineProps<{ wert: number | null }>()

// Tonleiter zwischen --color-neutral-100 (0) und --color-primary-600 (10),
// keine Stufenfarben (design-conventions.md). Interpolation in JS statt CSS,
// weil Custom Properties keine Zwischenwerte einer Skala berechnen können.
const FUELLFARBE_LEER = { r: 0xee, g: 0xf0, b: 0xef } // --color-neutral-100
const FUELLFARBE_VOLL = { r: 0x0f, g: 0x6e, b: 0x60 } // --color-primary-600

function interpoliert(anteil: number, von: number, bis: number): number {
  return Math.round(von + (bis - von) * anteil)
}

const fuellfarbe = computed(() => {
  if (props.wert === null) return ''
  const anteil = props.wert / 10
  const r = interpoliert(anteil, FUELLFARBE_LEER.r, FUELLFARBE_VOLL.r)
  const g = interpoliert(anteil, FUELLFARBE_LEER.g, FUELLFARBE_VOLL.g)
  const b = interpoliert(anteil, FUELLFARBE_LEER.b, FUELLFARBE_VOLL.b)
  return `rgb(${r} ${g} ${b})`
})
</script>

<template>
  <span
    v-if="wert === null"
    class="intensitaetsbalken__platzhalter"
  >Noch nicht bewertet</span>
  <span
    v-else
    class="intensitaetsbalken"
  >
    <span
      class="intensitaetsbalken__spur"
      aria-hidden="true"
    >
      <span
        class="intensitaetsbalken__fuellung"
        :style="{ width: `${(wert / 10) * 100}%`, backgroundColor: fuellfarbe }"
      />
    </span>
    <span class="intensitaetsbalken__zahl">{{ wert }}</span>
  </span>
</template>

<style scoped>
.intensitaetsbalken {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
}

.intensitaetsbalken__spur {
  display: inline-block;
  width: 64px;
  height: 8px;
  flex-shrink: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background-color: var(--surface);
  overflow: hidden;
}

.intensitaetsbalken__fuellung {
  display: block;
  height: 100%;
  border-radius: var(--radius-full);
}

.intensitaetsbalken__zahl {
  font-size: var(--font-size-14);
  color: var(--text);
}

.intensitaetsbalken__platzhalter {
  font-size: var(--font-size-14);
  color: var(--text-muted);
}
</style>

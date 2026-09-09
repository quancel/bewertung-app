<script setup lang="ts">
/**
 * Listenzeile (design_notes PO-2026-09-07-001): Bezeichnung als Primärzeile,
 * Adresse nur als Sekundärzeile, wenn vorhanden — sonst schlicht weggelassen
 * (kein Platzhalter, kein Badge, kein Warn-Icon). Präsentational, kennt
 * keinen Store.
 */
import type { OrtDatensatz } from '../../../persistence/schema'

defineProps<{ ort: OrtDatensatz }>()
</script>

<template>
  <RouterLink
    :to="`/orte/${ort.id}`"
    class="ortszeile"
  >
    <span class="ortszeile__bezeichnung">{{ ort.bezeichnung }}</span>
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

.ortszeile__bezeichnung {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  color: var(--text);
}

.ortszeile__adresse {
  font-size: var(--font-size-14);
  color: var(--text-muted);
}
</style>

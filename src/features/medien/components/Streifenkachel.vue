<script setup lang="ts">
/**
 * Eine Kachel im Bildstreifen der Schnellansicht (PO-2026-11-24-005,
 * design-conventions.md „Quick-Look-Sheet" -> „Bildstreifen"): 96x72px (4:3),
 * Radius 12px, `object-fit: cover`. Rein präsentational, kennt keinen Store —
 * das Öffnen der Vorschau ist ein Emit, die Entscheidung liegt bei
 * `Bildstreifen.vue`. Anders als `Bildkachel.vue` ohne „Bild löschen": die
 * Schnellansicht ist nur lesend.
 *
 * Objekt-URL (ADR-0016 Punkt 11): beim Mounten erzeugt, beim Unmounten
 * freigegeben — dieselbe Regel wie `Bildkachel.vue`.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { BildDatensatz } from '../../../persistence/schema'

const props = defineProps<{
  bild: BildDatensatz
  /** Zugänglicher Name des Öffnen-Buttons: „Bild {n} von {m} vergrößern". */
  beschriftung: string
}>()

const emit = defineEmits<{ oeffnen: [] }>()

const objektUrl = ref<string | null>(null)

onMounted(() => {
  objektUrl.value = URL.createObjectURL(props.bild.blob)
})

onBeforeUnmount(() => {
  if (objektUrl.value) URL.revokeObjectURL(objektUrl.value)
})
</script>

<template>
  <button
    type="button"
    class="streifenkachel"
    :data-bild-id="bild.id"
    :aria-label="beschriftung"
    aria-haspopup="dialog"
    @click="emit('oeffnen')"
  >
    <img
      v-if="objektUrl"
      :src="objektUrl"
      alt=""
      class="streifenkachel__bild"
      draggable="false"
    >
  </button>
</template>

<style scoped>
.streifenkachel {
  flex: none;
  box-sizing: border-box;
  width: 96px;
  height: 72px;
  padding: 0;
  border: none;
  border-radius: var(--radius-12);
  background-color: var(--surface-sunken);
  overflow: hidden;
  scroll-snap-align: start;
  cursor: pointer;
}

.streifenkachel__bild {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

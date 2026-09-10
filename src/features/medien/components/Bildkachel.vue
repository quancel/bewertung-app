<script setup lang="ts">
/**
 * Eine Kachel im Bilder-Raster (design_notes PO-2026-09-07-005): 4:3,
 * Radius 12px, `object-fit: cover` (design-concept.md „Bilder"). Rein
 * präsentational, kennt keinen Store — Löschen wird nur angefragt (Emit),
 * die Bestätigung liegt bei `Bilderbereich.vue`.
 *
 * Objekt-URL (ADR-0016 Punkt 11): erzeugt beim Mounten, freigegeben beim
 * Unmounten — das deckt sowohl „Kachel entfernt" (nach dem Löschen) als
 * auch „Ort verlassen" (das ganze Raster wird abgehängt) über denselben
 * Vue-Lifecycle-Hook ab, ohne dass der Store Objekt-URLs verwalten müsste.
 *
 * Löschauslöser (design_notes): Icon-only (Papierkorb, `aria-label` „Bild
 * löschen"), permanent sichtbar — kein Hover-only-Pattern, das auf
 * Touch-Geräten unbedienbar wäre.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { BildDatensatz } from '../../../persistence/schema'
import IconPapierkorb from '../../../shared/ui/icons/IconPapierkorb.vue'

const props = defineProps<{ bild: BildDatensatz }>()
const emit = defineEmits<{ 'loeschen-angefragt': [] }>()

const objektUrl = ref<string | null>(null)

onMounted(() => {
  objektUrl.value = URL.createObjectURL(props.bild.blob)
})

onBeforeUnmount(() => {
  if (objektUrl.value) URL.revokeObjectURL(objektUrl.value)
})

const altText = computed(() => `Bild vom ${new Date(props.bild.hinzugefuegtAm).toLocaleDateString('de-DE')}`)
</script>

<template>
  <div class="bildkachel">
    <img
      v-if="objektUrl"
      :src="objektUrl"
      :alt="altText"
      class="bildkachel__bild"
    >
    <button
      type="button"
      class="bildkachel__loeschen"
      aria-label="Bild löschen"
      @click="emit('loeschen-angefragt')"
    >
      <IconPapierkorb :size="20" />
    </button>
  </div>
</template>

<style scoped>
.bildkachel {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-12);
  overflow: hidden;
  background-color: var(--surface-sunken);
}

.bildkachel__bild {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bildkachel__loeschen {
  position: absolute;
  top: var(--space-8);
  right: var(--space-8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-8);
  background-color: rgb(0 0 0 / 48%);
  color: var(--color-neutral-0);
  cursor: pointer;
}

.bildkachel__loeschen:hover {
  background-color: rgb(0 0 0 / 64%);
}
</style>

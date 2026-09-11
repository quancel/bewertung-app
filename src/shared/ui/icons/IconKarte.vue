<script setup lang="ts">
/**
 * Karte-Icon — rendert die gebündelte Datei `src/assets/icons/karte.svg`
 * (Lucide „map", Outline, ISC). Zeigt in `Werkzeugleiste.vue` an, dass ein
 * Klick auf den Ansichtsumschalter zur KARTENANSICHT wechselt — das Icon
 * steht also für das Wechselziel, nicht für die aktuell aktive Ansicht
 * (design_notes PO-2026-09-07-006, gleiche Logik wie der rotierende
 * Richtungs-Pfeil daneben: das Icon zeigt, was ein Tap bewirkt).
 *
 * Bauform identisch zu den übrigen Icon-Wrappern (siehe IconList.vue):
 * CSS-Maske für `currentColor`, dekorativ per Default.
 */
import iconUrl from '@assets/icons/karte.svg'

withDefaults(defineProps<{ size?: number }>(), {
  size: 24,
})
</script>

<template>
  <span
    class="icon"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      maskImage: `url(${iconUrl})`,
      WebkitMaskImage: `url(${iconUrl})`,
    }"
    aria-hidden="true"
  />
</template>

<style scoped>
.icon {
  display: inline-block;
  flex-shrink: 0;
  background-color: currentColor;
  mask-repeat: no-repeat;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
}
</style>

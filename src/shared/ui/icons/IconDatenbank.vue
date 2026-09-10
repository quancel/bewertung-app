<script setup lang="ts">
/**
 * Datenbank-Icon — rendert `src/assets/icons/datenbank.svg` (Lucide
 * „database", Outline, ISC). Bereichs-Icon für „Daten" in der
 * Bereichsnavigation (PO-2026-09-07-009) — bewusst nicht `list` (Orte) und
 * nicht `map-pin` (für die Karte reserviert, design_notes).
 *
 * Gleiche Bauform wie `IconList.vue`: CSS-Maske statt Inline-SVG, damit die
 * Pfaddaten nicht dupliziert werden und die Farbe `currentColor` folgt.
 * Dekorativ per Default — das Label der Bereichsnavigation steht als
 * sichtbarer Text daneben.
 */
import iconUrl from '@assets/icons/datenbank.svg'

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

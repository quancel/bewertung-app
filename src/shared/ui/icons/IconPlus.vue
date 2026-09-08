<script setup lang="ts">
/**
 * Plus-Icon — rendert die gebündelte Datei `src/assets/icons/plus.svg`
 * (Lucide „plus", Outline, ISC) über eine CSS-Maske, damit sie
 * `currentColor` folgt und in Größe (24px Basis, 20px in dichten Listen)
 * frei einstellbar bleibt, ohne die Pfaddaten ein zweites Mal im Component
 * zu duplizieren.
 *
 * Dekorativ per Default (aria-hidden) — ein `aria-label` gehört bei
 * Icon-only-Aktionen auf das interaktive Element, nicht auf das Icon selbst
 * (design-concept.md, Ikonografie).
 */
import iconUrl from '../../assets/icons/plus.svg'

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

<script setup lang="ts">
/**
 * List-Icon — rendert die gebündelte Datei `src/assets/icons/list.svg`
 * (Lucide „list", Outline, ISC). Bereichs-Icon für „Orte" in der
 * Bereichsnavigation (PO-2026-09-07-011) — bewusst nicht `map-pin`, um
 * Verwechslung mit dem künftigen Bereich „Karte" zu vermeiden
 * (design_notes PO-2026-09-07-011).
 *
 * Über eine CSS-Maske eingebunden, damit sie `currentColor` folgt und in
 * Größe frei einstellbar bleibt, ohne die Pfaddaten ein zweites Mal im
 * Component zu duplizieren.
 *
 * Dekorativ per Default (aria-hidden) — das Label der Bereichsnavigation
 * steht als sichtbarer Text daneben, kein `aria-label` auf dem Icon selbst.
 *
 * Import über den `@assets`-Alias statt eines relativen `../../` — siehe
 * notes_for_conventions im Handoff von PO-2026-09-07-001.
 */
import iconUrl from '@assets/icons/list.svg'

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

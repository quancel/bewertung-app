<script setup lang="ts">
/**
 * Arrow-Left-Icon — rendert die gebündelte Datei
 * `src/assets/icons/arrow-left.svg` (Lucide „arrow-left", Outline, ISC).
 * Verwendet für die Zurück-Aktion im Detailbereich (design-conventions.md,
 * „Navigation & Routing").
 *
 * Über eine CSS-Maske eingebunden, damit sie `currentColor` folgt und in
 * Größe frei einstellbar bleibt, ohne die Pfaddaten ein zweites Mal im
 * Component zu duplizieren.
 *
 * Dekorativ per Default (aria-hidden) — der Text „Zurück" steht daneben,
 * kein `aria-label` auf dem Icon selbst.
 *
 * Import über den `@assets`-Alias statt eines relativen `../../` — siehe
 * notes_for_conventions im Handoff von PO-2026-09-07-001.
 */
import { computed } from 'vue'
import iconUrl from '@assets/icons/arrow-left.svg'

const props = withDefaults(defineProps<{ size?: number }>(), {
  size: 24,
})

const iconStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  maskImage: `url("${iconUrl}")`,
  WebkitMaskImage: `url("${iconUrl}")`,
}))
</script>

<template>
  <span
    class="icon"
    :style="iconStyle"
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

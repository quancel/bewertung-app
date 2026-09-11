<script setup lang="ts">
/**
 * Warndreieck-Icon — rendert die gebündelte Datei
 * `src/assets/icons/warndreieck.svg` (Lucide „triangle-alert", Outline,
 * ISC). Einziger Verwendungszweck: der Speichermangel-Banner beim
 * Bilder-Hinzufügen (PO-2026-09-07-005, design_notes „Icon+Text" in
 * `--color-warning`) — dieselbe Bauform wie die übrigen Icon-Wrapper.
 *
 * Über eine CSS-Maske eingebunden, damit sie `currentColor` folgt (hier:
 * `--color-warning`) und in Größe frei einstellbar bleibt, ohne die
 * Pfaddaten ein zweites Mal im Component zu duplizieren.
 *
 * Dekorativ per Default (aria-hidden) — der Banner-Text trägt die Bedeutung,
 * das Icon ist Verstärkung (design-concept.md, Ikonografie).
 *
 * Import über den `@assets`-Alias statt eines relativen `../../` (siehe
 * notes_for_conventions im Handoff von PO-2026-09-07-001).
 */
import { computed } from 'vue'
import iconUrl from '@assets/icons/warndreieck.svg'

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

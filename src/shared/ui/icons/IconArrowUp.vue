<script setup lang="ts">
/**
 * Arrow-Up-Icon — rendert die gebündelte Datei `src/assets/icons/arrow-up.svg`
 * (Lucide „arrow-up", Outline, ISC). Basisrichtung aufwärts (Sortierung
 * aufsteigend) — Drehung um 180° für „absteigend" ist Sache des
 * verwendenden Bausteins per CSS `transform` (design_notes
 * PO-2026-09-07-003, gleiches Prinzip wie `IconChevron`), nicht dieses
 * Icons.
 *
 * Über eine CSS-Maske eingebunden, damit sie `currentColor` folgt und in
 * Größe frei einstellbar bleibt, ohne die Pfaddaten ein zweites Mal im
 * Component zu duplizieren.
 *
 * Dekorativ per Default (aria-hidden) — ein `aria-label` gehört bei
 * Icon-only-Aktionen auf das interaktive Element, nicht auf das Icon selbst
 * (design-concept.md, Ikonografie).
 *
 * Import über den `@assets`-Alias statt eines relativen `../../` (siehe
 * notes_for_conventions im Handoff von PO-2026-09-07-001).
 */
import iconUrl from '@assets/icons/arrow-up.svg'

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

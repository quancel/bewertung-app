<script setup lang="ts">
/**
 * Chevron-Icon — rendert die gebündelte Datei `src/assets/icons/chevron.svg`
 * (Lucide „chevron-down", Outline, ISC), Basisrichtung abwärts (Aufklappen).
 * Drehung für andere Richtungen ist Sache des verwendenden Bausteins (z.B.
 * per CSS `transform` beim Auf-/Zuklappen), nicht dieses Icons.
 *
 * Über eine CSS-Maske eingebunden, damit sie `currentColor` folgt und in
 * Größe (24px Basis, 20px in dichten Listen) frei einstellbar bleibt, ohne
 * die Pfaddaten ein zweites Mal im Component zu duplizieren.
 *
 * Dekorativ per Default (aria-hidden) — ein `aria-label` gehört bei
 * Icon-only-Aktionen auf das interaktive Element, nicht auf das Icon selbst
 * (design-concept.md, Ikonografie).
 *
 * Import über den `@assets`-Alias statt eines relativen `../../` — bei
 * `vite build` mit dieser Rolldown-Version löst ein Parent-Traversal-Import
 * aus dem extrahierten `<script setup>`-Modul einer `.vue`-Datei nicht auf
 * (Modul wird nicht gefunden), Alias-Importe sind davon nicht betroffen.
 * Siehe `notes_for_conventions` im Handoff von PO-2026-09-07-001.
 */
import iconUrl from '@assets/icons/chevron.svg'

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

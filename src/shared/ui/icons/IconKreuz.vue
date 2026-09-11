<script setup lang="ts">
/**
 * Kreuz-Icon („×") — rendert die gebündelte Datei `src/assets/icons/kreuz.svg`
 * (Lucide „x", Outline, ISC). Erster Einsatz: Achse zurücksetzen
 * (PO-2026-09-07-002); dieselbe Optik ist für Tag-Entfernen (-004) und
 * Filter-Zurücksetzen (-004) vorgesehen (design-conventions.md) —
 * Wiedererkennung statt neuem Icon je Verwendung.
 *
 * Über eine CSS-Maske eingebunden, damit sie `currentColor` folgt und in
 * Größe frei einstellbar bleibt, ohne die Pfaddaten ein zweites Mal im
 * Component zu duplizieren.
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
import { computed } from 'vue'
import iconUrl from '@assets/icons/kreuz.svg'

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

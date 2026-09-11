<script setup lang="ts">
/**
 * Stecknadel-Icon — rendert die gebündelte Datei
 * `src/assets/icons/stecknadel.svg` (Lucide „map-pin", Outline, ISC).
 * Einzige Verwendung: die Kurzform der Kartenansicht-Trefferzahl unterhalb
 * 768px Containerbreite (design-conventions.md „Karte" -> „Trefferzahl" ->
 * „Platz") — ersetzt dort das Suffix „mit Koordinaten" durch ein kleines
 * Symbol. Bewusst `--text-muted` und NICHT `--color-accent-500`: Der Akzent
 * bleibt ausschließlich den echten Kartenmarkern vorbehalten
 * (design-concept.md, Constraint „Kartenpin und Kartenauswahl sind der
 * einzige Verwendungszweck der Akzentfarbe"). Die Farbe kommt über
 * `currentColor` vom umgebenden `--text-muted`-Text, kein eigener Wert hier.
 *
 * Bauform identisch zu den übrigen Icon-Wrappern (siehe IconList.vue).
 */
import { computed } from 'vue'
import iconUrl from '@assets/icons/stecknadel.svg'

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

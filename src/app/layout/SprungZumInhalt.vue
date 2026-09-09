<script setup lang="ts">
/**
 * Skip-Link „Zum Hauptinhalt springen" (design-conventions.md, „Navigation &
 * Routing"). Erstes fokussierbares Element im DOM — steht deshalb in
 * `AppRahmen.vue` vor der Bereichsnavigation. Visuell versteckt bis
 * `:focus-visible`, Ziel `#main-content` (vergeben von `AppRahmen.vue`).
 */
</script>

<template>
  <a
    href="#main-content"
    class="sprung-zum-inhalt"
  >Zum Hauptinhalt springen</a>
</template>

<style scoped>
.sprung-zum-inhalt {
  position: absolute;
  top: var(--space-8);
  left: -9999px;
  z-index: 100;
  padding: var(--space-8) var(--space-16);
  border-radius: var(--radius-8);
  background-color: var(--color-primary-600);
  color: var(--text-on-primary);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.sprung-zum-inhalt:focus-visible {
  left: var(--space-8);
}
</style>

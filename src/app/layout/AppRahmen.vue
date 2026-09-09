<script setup lang="ts">
/**
 * App-Rahmen — Komponente, keine Route (ADR-0010). Umschließt den
 * Routen-Inhalt mit Skip-Link, Bereichsnavigation und dem einzigen
 * `<main id="main-content">` der Anwendung. `App.vue` verzweigt VOR dieser
 * Komponente auf die beiden vollflächigen Sperrmeldungen aus
 * `src/persistence/` — die haben dort keine Navigationsebene und
 * durchlaufen diese Komponente gar nicht erst.
 *
 * Kein Zustand hier (kein Store, ADR-0010) — reine Layout-Hülle. Der Inhalt
 * kommt über den Default-Slot (`<router-view>` aus `App.vue`), damit dieser
 * Rahmen nicht selbst aus `features/` oder dem Router importieren muss.
 *
 * Kein `<keep-alive>` um den Slot-Inhalt: der Anzeigezustand (Sortierung,
 * Scrollposition der Liste) lebt im jeweiligen Feature-Store bzw. in der
 * Browser-Historie, nicht hier.
 *
 * `tabindex="-1"` auf dem `<main>`: Der Skip-Link ändert nur den Hash und
 * scrollt, ohne `tabindex` bekäme das Ziel selbst nie den Tastaturfokus
 * (bleibt auf `<body>`) — Screenreader-Nutzer stünden dann weiterhin vor der
 * bereits durchlaufenen Navigation.
 */
import Bereichsnavigation from './Bereichsnavigation.vue'
import SprungZumInhalt from './SprungZumInhalt.vue'
</script>

<template>
  <SprungZumInhalt />
  <Bereichsnavigation />
  <main
    id="main-content"
    class="app-rahmen__inhalt"
    tabindex="-1"
  >
    <slot />
  </main>
</template>

<style scoped>
.app-rahmen__inhalt {
  padding-bottom: calc(var(--bottom-tab-height) + env(safe-area-inset-bottom));
}

/* Ab lg (1024px, siehe --breakpoint-lg): Nav-Rail statt Bottom-Tabs, siehe
   Bereichsnavigation.vue. Der Inhalt rückt um ihre Breite ein, statt einer
   Bottom-Aussparung. */
@media (min-width: 1024px) {
  .app-rahmen__inhalt {
    padding-bottom: 0;
    margin-left: var(--nav-rail-width);
  }
}
</style>

<script setup lang="ts">
/**
 * Bereichsnavigation — mobil (bis `lg`) fixierte Bottom-Tab-Leiste, ab `lg`
 * fixierte linke Nav-Rail (design-conventions.md, „Navigation & Routing").
 * Beide zeigen dasselbe Bereichsregister; nur das CSS unterscheidet die
 * Darstellung, kein zweites Markup.
 *
 * Das Bereichsregister ist eine statische Konstante hier im Rahmen (kein
 * Store, ADR-0010) — aktuell genau ein Eintrag. Ein später ergänzter Bereich
 * (Karte, Daten) wird angehängt, nicht eingefügt oder umsortiert.
 *
 * `RouterLink` mit `custom` + `v-slot`, statt seiner eingebauten
 * `isExactActive`/`aria-current`-Logik zu vertrauen: Die Routen sind laut
 * ADR-0010/0011 flach (`/orte` und `/orte/:ortId` sind zwei unabhängige,
 * nicht verschachtelte Records). RouterLinks eingebauter Aktiv-Zustand
 * würde die Detailadresse deshalb NICHT als „Bereich Orte aktiv" erkennen —
 * `istAktiv` prüft stattdessen den Adress-Präfix selbst.
 */
import { RouterLink, useRoute } from 'vue-router'
import IconList from '../../shared/ui/icons/IconList.vue'

interface Bereichseintrag {
  pfad: string
  label: string
  icon: typeof IconList
}

const bereiche: Bereichseintrag[] = [{ pfad: '/orte', label: 'Orte', icon: IconList }]

const route = useRoute()

function istAktiv(bereich: Bereichseintrag): boolean {
  return route.path === bereich.pfad || route.path.startsWith(`${bereich.pfad}/`)
}
</script>

<template>
  <nav
    class="bereichsnavigation"
    aria-label="Bereiche"
  >
    <ul class="bereichsnavigation__liste">
      <li
        v-for="bereich in bereiche"
        :key="bereich.pfad"
      >
        <RouterLink
          v-slot="{ href, navigate }"
          :to="bereich.pfad"
          custom
        >
          <a
            :href="href"
            class="bereichsnavigation__eintrag"
            :class="{ 'bereichsnavigation__eintrag--aktiv': istAktiv(bereich) }"
            :aria-current="istAktiv(bereich) ? 'page' : undefined"
            @click="navigate"
          >
            <component
              :is="bereich.icon"
              :size="24"
            />
            <span class="bereichsnavigation__label">{{ bereich.label }}</span>
          </a>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.bereichsnavigation {
  position: fixed;
  z-index: 50;
  background-color: var(--surface);
}

/* Mobil (bis --breakpoint-lg): fixierte Bottom-Tab-Leiste. */
.bereichsnavigation {
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(var(--bottom-tab-height) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid var(--border);
}

.bereichsnavigation__liste {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: var(--space-24);
  height: var(--bottom-tab-height);
}

.bereichsnavigation__eintrag {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-width: 64px;
  min-height: 44px;
  padding: var(--space-4) var(--space-8);
  color: var(--text-muted);
  text-decoration: none;
  border-top: 2px solid transparent;
}

.bereichsnavigation__label {
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-normal);
}

.bereichsnavigation__eintrag--aktiv {
  color: var(--text);
  border-top-color: var(--color-primary-600);
}

.bereichsnavigation__eintrag--aktiv .bereichsnavigation__label {
  font-weight: var(--font-weight-semibold);
}

/* Ab lg (1024px, siehe --breakpoint-lg — Custom Properties werden in
   @media nicht ausgewertet): fixierte linke Nav-Rail statt Bottom-Tabs. */
@media (min-width: 1024px) {
  .bereichsnavigation {
    left: 0;
    top: 0;
    bottom: 0;
    right: auto;
    width: var(--nav-rail-width);
    height: auto;
    padding-bottom: 0;
    border-top: none;
    border-right: 1px solid var(--border);
  }

  .bereichsnavigation__liste {
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    height: auto;
    gap: var(--space-16);
    padding-top: var(--space-24);
  }

  .bereichsnavigation__eintrag {
    min-width: 0;
    border-top: none;
    border-left: 2px solid transparent;
  }

  .bereichsnavigation__eintrag--aktiv {
    border-left-color: var(--color-primary-600);
  }
}
</style>

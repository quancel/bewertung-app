<script setup lang="ts">
/**
 * Speichermangel-Banner (design_notes PO-2026-09-07-005, design-
 * conventions.md „Bilder"/„Zustände" → „Warnung"): einziger Anwendungsfall
 * von `--color-warning` im Bilder-Kontext. Manuell schließbar, kein Modal,
 * kein Auto-Dismiss — die Bedingung besteht fort, bis der Nutzer reagiert.
 * Rein präsentational, kennt keinen Store.
 */
import IconKreuz from '../../../shared/ui/icons/IconKreuz.vue'
import IconWarndreieck from '../../../shared/ui/icons/IconWarndreieck.vue'

const emit = defineEmits<{ schliessen: [] }>()
</script>

<template>
  <div
    class="speichermangel-banner"
    role="alert"
  >
    <IconWarndreieck
      :size="20"
      class="speichermangel-banner__icon"
    />
    <p class="speichermangel-banner__text">
      Kein Speicherplatz mehr frei. Lösche ein paar Bilder oder Orte, um weitere hinzuzufügen.
    </p>
    <button
      type="button"
      class="speichermangel-banner__schliessen"
      aria-label="Hinweis schließen"
      @click="emit('schliessen')"
    >
      <IconKreuz :size="18" />
    </button>
  </div>
</template>

<style scoped>
.speichermangel-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-8);
  padding: var(--space-12) var(--space-16);
  margin-bottom: var(--space-16);
  border-radius: var(--radius-8);
  background-color: var(--color-warning);
  color: var(--text-on-primary);
}

.speichermangel-banner__icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.speichermangel-banner__text {
  flex: 1;
  font-size: var(--font-size-14);
}

.speichermangel-banner__schliessen {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-8);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.speichermangel-banner__schliessen:hover {
  background-color: rgb(255 255 255 / 20%);
}
</style>

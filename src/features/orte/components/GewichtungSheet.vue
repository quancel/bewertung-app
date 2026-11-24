<script setup lang="ts">
/**
 * Gewichtungs-Sheet (PO-2026-11-24-001, ADR-0037, design-conventions.md
 * „Gewichtung der Gesamtnote"): Auswahl eines festen Szenarios für die
 * Gesamtnote. Präsentational, kein Store, kein Router — der Zustand gehört
 * `useOrteStore`, `Ortebereich.vue` verdrahtet (code-conventions.md
 * „components/ kennt keinen Store"). Nutzt die `Sheet.vue`-Chrome.
 *
 * Aufbau wie das Sortier-Sheet in `Werkzeugleiste.vue`: Button-Liste mit
 * `aria-pressed`; die aktive Zeile trägt `--color-primary-50` UND ein
 * Haken-Icon (nicht nur Fläche). Eine Auswahl wirkt sofort und schließt das
 * Sheet (feste Szenarien; „Eigene" folgt mit PO-2026-11-24-002).
 */
import IconHaken from '../../../shared/ui/icons/IconHaken.vue'
import Sheet from '../../../shared/ui/Sheet.vue'
import { GEWICHTUNG_SZENARIEN, type GewichtungsSzenario } from '../model/ansicht'

defineProps<{
  offen: boolean
  szenario: GewichtungsSzenario
}>()

const emit = defineEmits<{
  schliessen: []
  'szenario-gewaehlt': [szenario: GewichtungsSzenario]
}>()

function aufGewaehlt(szenario: GewichtungsSzenario): void {
  emit('szenario-gewaehlt', szenario)
  emit('schliessen')
}
</script>

<template>
  <Sheet
    :offen="offen"
    label="Gewichtung der Gesamtnote"
    @schliessen="emit('schliessen')"
  >
    <h2 class="gewichtung-sheet__titel">
      Gewichtung der Gesamtnote
    </h2>
    <p class="gewichtung-sheet__erklaerung">
      Bestimmt, wie stark jede Achse in die Gesamtnote eingeht. Gilt für Liste,
      Detail und Karte.
    </p>

    <ul class="gewichtung-sheet__liste">
      <li
        v-for="eintrag in GEWICHTUNG_SZENARIEN"
        :key="eintrag.schluessel"
      >
        <button
          type="button"
          class="gewichtung-sheet__eintrag"
          :class="{ 'gewichtung-sheet__eintrag--aktiv': eintrag.schluessel === szenario }"
          :aria-pressed="eintrag.schluessel === szenario"
          @click="aufGewaehlt(eintrag.schluessel)"
        >
          <span class="gewichtung-sheet__texte">
            <span class="gewichtung-sheet__name">{{ eintrag.name }}</span>
            <span class="gewichtung-sheet__sekundaer">{{ eintrag.sekundaerzeile }}</span>
          </span>
          <IconHaken
            v-if="eintrag.schluessel === szenario"
            :size="20"
          />
        </button>
      </li>
    </ul>
  </Sheet>
</template>

<style scoped>
.gewichtung-sheet__titel {
  margin-bottom: var(--space-8);
  font-size: var(--font-size-20);
}

.gewichtung-sheet__erklaerung {
  margin-bottom: var(--space-16);
  color: var(--text);
  font-size: var(--font-size-14);
}

.gewichtung-sheet__liste {
  display: flex;
  flex-direction: column;
}

.gewichtung-sheet__eintrag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
  width: 100%;
  min-height: 48px;
  padding: var(--space-8) var(--space-12);
  border: none;
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.gewichtung-sheet__eintrag:hover {
  background-color: var(--surface-muted);
}

.gewichtung-sheet__eintrag--aktiv,
.gewichtung-sheet__eintrag--aktiv:hover {
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
}

.gewichtung-sheet__texte {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.gewichtung-sheet__name {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  overflow-wrap: anywhere;
}

.gewichtung-sheet__sekundaer {
  color: var(--text-muted);
  font-size: var(--font-size-14);
  overflow-wrap: anywhere;
}
</style>

<script setup lang="ts">
/**
 * Löschbestätigung (design_notes PO-2026-09-07-001): nennt die Bezeichnung,
 * kein Undo-Toast. Schwer rückgängig machbarer Verlust → Bestätigungsdialog
 * nach design-conventions.md („Interaktion & Animation").
 */
import TextButton from '../../../shared/ui/TextButton.vue'
import Sheet from './Sheet.vue'

defineProps<{
  offen: boolean
  bezeichnung: string
}>()

const emit = defineEmits<{
  bestaetigen: []
  schliessen: []
}>()
</script>

<template>
  <Sheet
    :offen="offen"
    label="Ort löschen"
    @schliessen="emit('schliessen')"
  >
    <p class="loeschen-dialog__text">
      {{ bezeichnung }} löschen? Bewertungen, Bilder und Kommentare werden mit entfernt.
    </p>

    <div class="loeschen-dialog__aktionen">
      <TextButton
        type="button"
        @click="emit('schliessen')"
      >
        Abbrechen
      </TextButton>
      <button
        type="button"
        class="loeschen-dialog__bestaetigen"
        @click="emit('bestaetigen')"
      >
        Endgültig löschen
      </button>
    </div>
  </Sheet>
</template>

<style scoped>
.loeschen-dialog__text {
  margin-bottom: var(--space-24);
  font-size: var(--font-size-16);
}

.loeschen-dialog__aktionen {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-8);
}

.loeschen-dialog__bestaetigen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--space-12) var(--space-16);
  border: none;
  border-radius: var(--radius-8);
  background-color: var(--color-danger);
  color: var(--text-on-primary);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}
</style>

<script setup lang="ts">
/**
 * Löschbestätigung für ein einzelnes Bild (design_notes PO-2026-09-07-005):
 * schwer rückgängig machbarer Verlust → Bestätigungsdialog nach der
 * bestehenden Konvention (Sheet, 240ms, Radius 16px), Text nennt
 * ausdrücklich, dass das Original nicht mehr vorhanden ist. Rein
 * präsentational, kennt keinen Store.
 */
import TextButton from '../../../shared/ui/TextButton.vue'
import Sheet from '../../../shared/ui/Sheet.vue'

defineProps<{ offen: boolean }>()

const emit = defineEmits<{
  bestaetigen: []
  schliessen: []
}>()
</script>

<template>
  <Sheet
    :offen="offen"
    label="Bild löschen"
    @schliessen="emit('schliessen')"
  >
    <p class="bild-loeschen-dialog__text">
      Bild endgültig löschen? Das Original ist nicht mehr vorhanden — ein gelöschtes Bild lässt sich nicht wiederherstellen.
    </p>

    <div class="bild-loeschen-dialog__aktionen">
      <TextButton
        type="button"
        @click="emit('schliessen')"
      >
        Abbrechen
      </TextButton>
      <button
        type="button"
        class="bild-loeschen-dialog__bestaetigen"
        @click="emit('bestaetigen')"
      >
        Endgültig löschen
      </button>
    </div>
  </Sheet>
</template>

<style scoped>
.bild-loeschen-dialog__text {
  margin-bottom: var(--space-24);
  font-size: var(--font-size-16);
}

.bild-loeschen-dialog__aktionen {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-8);
}

.bild-loeschen-dialog__bestaetigen {
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

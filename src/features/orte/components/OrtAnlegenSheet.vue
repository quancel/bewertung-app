<script setup lang="ts">
/**
 * Anlage-Sheet für einen neuen Ort (design_notes PO-2026-09-07-001): einziges
 * Pflichtfeld Bezeichnung, erzwungen über eine deaktivierte Primär-Aktion —
 * kein Sternchen, keine Inline-Fehlermeldung (design-conventions.md,
 * „Formulare").
 */
import { ref, watch } from 'vue'
import PrimaerButton from '../../../shared/ui/PrimaerButton.vue'
import TextButton from '../../../shared/ui/TextButton.vue'
import Sheet from '../../../shared/ui/Sheet.vue'

const props = defineProps<{ offen: boolean }>()
const emit = defineEmits<{
  anlegen: [bezeichnung: string]
  schliessen: []
}>()

const bezeichnung = ref('')

watch(
  () => props.offen,
  (offen) => {
    if (offen) bezeichnung.value = ''
  },
)

function aufAnlegen(): void {
  const wert = bezeichnung.value.trim()
  if (!wert) return
  emit('anlegen', wert)
}
</script>

<template>
  <Sheet
    :offen="offen"
    label="Neuen Ort anlegen"
    @schliessen="emit('schliessen')"
  >
    <h2 class="anlage-sheet__titel">
      Neuen Ort anlegen
    </h2>

    <div class="anlage-sheet__feld">
      <label for="ort-anlegen-bezeichnung">Bezeichnung</label>
      <input
        id="ort-anlegen-bezeichnung"
        v-model="bezeichnung"
        type="text"
        class="anlage-sheet__eingabe"
        @keydown.enter="aufAnlegen"
      >
    </div>

    <div class="anlage-sheet__aktionen">
      <TextButton
        type="button"
        @click="emit('schliessen')"
      >
        Abbrechen
      </TextButton>
      <PrimaerButton
        type="button"
        :disabled="!bezeichnung.trim()"
        @click="aufAnlegen"
      >
        Ort anlegen
      </PrimaerButton>
    </div>
  </Sheet>
</template>

<style scoped>
.anlage-sheet__titel {
  margin-bottom: var(--space-16);
  font-size: var(--font-size-20);
}

.anlage-sheet__feld {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-bottom: var(--space-24);
}

.anlage-sheet__eingabe {
  min-height: 44px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-16);
}

.anlage-sheet__aktionen {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-8);
}
</style>

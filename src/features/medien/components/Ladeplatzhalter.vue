<script setup lang="ts">
/**
 * Platzhalter-Kachel für ein Bild, das gerade verkleinert/gespeichert wird
 * (design_notes PO-2026-09-07-005): Verkleinern kann bei großen/mehreren
 * Fotos spürbar dauern. Zeigt zunächst nur die stille Kachelfläche; erst ab
 * spürbar > 400 ms (design-conventions.md „Zustände" → „Lädt") erscheint der
 * Spinner — bei den meisten Bildern ist der Vorgang schneller als das und es
 * blitzt nichts auf. Rein präsentational, kennt keinen Store.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const zeigeSpinner = ref(false)
let timerId: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  timerId = setTimeout(() => {
    zeigeSpinner.value = true
  }, 400)
})

onBeforeUnmount(() => {
  clearTimeout(timerId)
})
</script>

<template>
  <div
    class="ladeplatzhalter"
    role="status"
    aria-label="Bild wird hinzugefügt"
  >
    <span
      v-if="zeigeSpinner"
      class="ladeplatzhalter__spinner"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.ladeplatzhalter {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-12);
  background-color: var(--surface-sunken);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ladeplatzhalter__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border);
  border-top-color: var(--color-primary-600);
  border-radius: var(--radius-full);
  animation: ladeplatzhalter-drehen 720ms linear infinite;
}

@keyframes ladeplatzhalter-drehen {
  to {
    transform: rotate(360deg);
  }
}
</style>

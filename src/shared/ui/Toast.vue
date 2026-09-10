<script setup lang="ts">
/**
 * Toast — nicht-modaler Hinweis am unteren Bildschirmrand (PO-2026-09-07-007,
 * design_notes). Zustandslos: Text und Aktionsbeschriftung kommen als Props,
 * ein Klick auf die Aktion geht als Emit nach außen — kein Auto-Dismiss,
 * keine Timer-Logik hier. Der Aufrufer entscheidet, ob/wann der Toast
 * sichtbar ist (`v-if`/`v-show` am Einsatzort), diese Komponente kennt nur
 * ihren Inhalt.
 *
 * Zwei Nutzer ab Freigabe: der Update-Hinweis aus -007 (`app-shell`) und die
 * Export-/Import-Meldungen aus -009 (`datensicherung`) — deshalb hier in
 * `shared/ui/`, nicht im Feature (code-conventions.md „Nach shared/ erst ab
 * zwei Nutzern").
 *
 * `role="status"` + `aria-live="polite"`: ein Update-Hinweis unterbricht
 * nichts (kein `alert`/`assertive`, das wäre für eine Fehlermeldung
 * reserviert wie in PersistenzMeldung.vue), wird aber vorgelesen, sobald er
 * erscheint, auch ohne dass der Fokus dorthin bewegt wird — passend zu
 * „nicht-modal, kein erzwungener Fokuswechsel".
 *
 * Einwortige Prop-Namen (wie in Sheet.vue begründet): vermeidet die
 * Diskrepanz zwischen `vue/attribute-hyphenation` und `vue-tsc` bei
 * kebab-case gebundenen, camelCase deklarierten Props.
 */
import TextButton from './TextButton.vue'

defineProps<{
  text: string
  aktionsbeschriftung: string
}>()

const emit = defineEmits<{ klick: [] }>()
</script>

<template>
  <div
    class="toast"
    role="status"
    aria-live="polite"
  >
    <p class="toast__text">
      {{ text }}
    </p>
    <TextButton
      type="button"
      @click="emit('klick')"
    >
      {{ aktionsbeschriftung }}
    </TextButton>
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  left: var(--space-16);
  right: var(--space-16);
  bottom: calc(var(--bottom-tab-height) + env(safe-area-inset-bottom) + var(--space-16));
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  max-width: 480px;
  margin: 0 auto;
  padding: var(--space-12) var(--space-12) var(--space-12) var(--space-16);
  background-color: var(--surface);
  border-radius: var(--radius-16);
  box-shadow: 0 4px 24px rgb(0 0 0 / 16%);
}

.toast__text {
  color: var(--text);
  font-size: var(--font-size-16);
}

/* Ab lg (1024px): keine Bottom-Tab-Leiste mehr (Nav-Rail links, siehe
   Bereichsnavigation.vue) — der Toast braucht keine Aussparung mehr,
   sondern nur den regulären Abstand zum unteren Bildschirmrand. */
@media (min-width: 1024px) {
  .toast {
    bottom: var(--space-24);
  }
}
</style>

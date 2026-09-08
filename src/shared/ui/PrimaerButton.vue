<script setup lang="ts">
/**
 * Primär-Button — max. eine Hauptaktion pro Ansicht (design-concept.md).
 *
 * Zustände: idle / hover (120ms) / focus-visible (global, base.css) /
 * active (abgedunkelt, kein Extra-Token) / disabled (Fläche neutral-200,
 * Text --text-muted). `disabled` nutzt bewusst `aria-disabled` statt des
 * nativen `disabled`-Attributs: ein nativ deaktivierter Button ist nicht
 * fokussierbar und würde den Fokusring dort verlieren, wo er laut
 * design_notes ausdrücklich sichtbar bleiben soll.
 */
const props = withDefaults(
  defineProps<{
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    disabled: false,
    type: 'button',
  },
)

// Deklariertes 'click'-Emit entfernt onClick aus dem Attribut-Fallthrough
// (Vue-Verhalten) — so bleibt die Sperre unten die einzige Quelle, ob ein
// Klick nach außen dringt.
const emit = defineEmits<{ click: [event: MouseEvent] }>()

function onClick(event: MouseEvent): void {
  if (props.disabled) return
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    class="primaer-button"
    :class="{ 'primaer-button--disabled': disabled }"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<style scoped>
.primaer-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  min-height: 44px;
  padding: var(--space-12) var(--space-16);
  border: none;
  border-radius: var(--radius-8);
  background-color: var(--color-primary-600);
  color: var(--text-on-primary);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--duration-120) var(--ease-out);
}

.primaer-button:hover:not(.primaer-button--disabled) {
  background-color: var(--color-primary-700);
}

.primaer-button:active:not(.primaer-button--disabled) {
  background-color: var(--color-primary-700);
  filter: brightness(0.92);
}

.primaer-button--disabled {
  background-color: var(--color-neutral-200);
  color: var(--text-muted);
  cursor: not-allowed;
}
</style>

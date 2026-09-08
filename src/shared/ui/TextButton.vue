<script setup lang="ts">
/**
 * Text-Button — sekundäre Aktion/Link-artige Aktion in --color-primary-700.
 *
 * Gleiche Disabled-Strategie wie PrimaerButton: `aria-disabled` statt
 * `disabled`, damit der Fokusring auch im deaktivierten Zustand sichtbar
 * bleibt.
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

const emit = defineEmits<{ click: [event: MouseEvent] }>()

function onClick(event: MouseEvent): void {
  if (props.disabled) return
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    class="text-button"
    :class="{ 'text-button--disabled': disabled }"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<style scoped>
.text-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  min-height: 44px;
  padding: var(--space-8) var(--space-12);
  border: none;
  border-radius: var(--radius-8);
  background-color: transparent;
  color: var(--color-primary-700);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--duration-120) var(--ease-out);
}

.text-button:hover:not(.text-button--disabled) {
  background-color: var(--color-primary-50);
}

.text-button:active:not(.text-button--disabled) {
  background-color: var(--color-primary-50);
  filter: brightness(0.96);
}

.text-button--disabled {
  color: var(--text-muted);
  cursor: not-allowed;
}
</style>

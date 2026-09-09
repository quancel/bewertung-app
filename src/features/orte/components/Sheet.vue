<script setup lang="ts">
/**
 * Generische Sheet-Chrome (Radius 16px, 240ms, design-concept.md/-conventions.md):
 * Hintergrund-Backdrop + von unten erscheinendes Panel. Präsentational,
 * kennt keinen Store. Zwei Nutzer ab diesem Paket (Anlage- und
 * Löschbestätigungs-Sheet), deshalb hier im Feature-Ordner statt in
 * `shared/ui/` (code-conventions.md: „Nach shared/ erst ab zwei Nutzern" —
 * die zwei Nutzer sind hier beide im selben Context `orte`).
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  offen: boolean
  /** Einwortiger Prop-Name bewusst gewählt (statt `ariaLabel`) — vermeidet
   * die Diskrepanz zwischen `vue/attribute-hyphenation` (verlangt
   * Kebab-Case im Template) und `vue-tsc`, das eine kebab-case gebundene
   * Prop nicht auf die camelCase-Deklaration abbildet. */
  label: string
}>()

const emit = defineEmits<{ schliessen: [] }>()

const panelRef = ref<HTMLElement | null>(null)

function aufEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('schliessen')
  }
}

watch(
  () => props.offen,
  (offen) => {
    if (offen) {
      // Fokus in das Sheet bewegen (erstes fokussierbares Element).
      requestAnimationFrame(() => {
        const erstesFeld = panelRef.value?.querySelector<HTMLElement>(
          'input, button, select, textarea, [tabindex]',
        )
        erstesFeld?.focus()
      })
    }
  },
)

onMounted(() => document.addEventListener('keydown', aufEscape))
onBeforeUnmount(() => document.removeEventListener('keydown', aufEscape))
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div
        v-if="offen"
        class="sheet-backdrop"
        @click.self="emit('schliessen')"
      >
        <Transition
          name="sheet-slide"
          appear
        >
          <div
            ref="panelRef"
            class="sheet-panel"
            role="dialog"
            aria-modal="true"
            :aria-label="label"
          >
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: rgb(0 0 0 / 40%);
  z-index: 100;
}

.sheet-panel {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background-color: var(--surface);
  border-radius: var(--radius-16) var(--radius-16) 0 0;
  padding: var(--space-24) var(--space-16);
  box-shadow: 0 -4px 24px rgb(0 0 0 / 12%);
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity var(--duration-240) var(--ease-out);
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-slide-enter-active {
  transition: transform var(--duration-240) var(--ease-out);
}

.sheet-slide-leave-active {
  transition: transform var(--duration-240) var(--ease-in);
}

.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translateY(100%);
}
</style>

<script setup lang="ts">
/**
 * Tag-Eingabe am Ort (PO-2026-09-07-004, ADR-0013): Freitext-Feld, vergebene
 * Tags als entfernbare Pills, Vorschlagsliste darunter (max. ~6 Einträge,
 * Teilstring-Treffer case-insensitive, Pfeiltasten + Enter, Escape/Blur/Tap
 * außerhalb schließen). Bereits am Ort vergebene Tags werden aus den Vorschlägen
 * ausgeblendet (design_notes). Präsentational, kennt keinen Store
 * (ADR-0013 Punkt 3) — Identität/Dedup/Kanonisierung laufen ausschließlich
 * im aufrufenden Store (`useOrteStore.fuegeTagHinzu`, ADR-0014); diese
 * Komponente trimmt nur die Eingabe und meldet über Emits zurück.
 *
 * Eingebunden ausschließlich von `features/orte/views/Ortebereich.vue`
 * (ADR-0013 Punkt 5) — kennt `useOrteStore` selbst nicht.
 *
 * Blur/Tap außerhalb schließen die Vorschlagsliste zusätzlich zu Escape
 * (design-conventions.md „Vorschlagsliste (Autocomplete)", Ergänzung
 * PO-2026-09-12-003) über das gemeinsame, in `orte` entschiedene Composable
 * `useSchliesseBeiAussenaktion` (ADR-0024) — reines Anbinden, keine eigene
 * Implementierung dieser Regel in `tags`.
 */
import { computed, ref } from 'vue'
import { useSchliesseBeiAussenaktion } from '../../../shared/composables/useSchliesseBeiAussenaktion'
import IconKreuz from '../../../shared/ui/icons/IconKreuz.vue'

const props = defineProps<{
  /** Am Ort bereits vergebene Tags (kanonische Schreibweise, ADR-0014). */
  tags: string[]
  /** Abgeleitetes Gesamtvokabular des Bestands (ADR-0014), alphabetisch. */
  vokabular: string[]
}>()

const emit = defineEmits<{
  'tag-hinzugefuegt': [tag: string]
  'tag-entfernt': [tag: string]
}>()

const tagCollator = new Intl.Collator('de')

/** Die Reihenfolge im Array trägt keine Bedeutung — angezeigt wird überall
 * alphabetisch über `Intl.Collator('de')` (ADR-0014 Punkt 5). */
const tagsSortiert = computed(() => [...props.tags].sort(tagCollator.compare))

const MAX_VORSCHLAEGE = 6

const feldbereichRef = ref<HTMLElement | null>(null)
const eingabe = ref('')
const aktiverIndex = ref(-1)
// Escape/Blur/Tap außerhalb schließen nur die Vorschlagsliste
// (design-conventions.md „Vorschlagsliste (Autocomplete)"), löschen aber
// nicht die Eingabe — bei erneutem Tippen erscheint die Liste wieder.
const vorschlaegeUnterdrueckt = ref(false)

const vorschlaege = computed(() => {
  if (vorschlaegeUnterdrueckt.value) return []
  const suchtext = eingabe.value.trim().toLocaleLowerCase('de')
  if (suchtext === '') return []
  const bereitsAmOrt = new Set(props.tags.map((tag) => tag.toLocaleLowerCase('de')))
  return props.vokabular
    .filter((tag) => !bereitsAmOrt.has(tag.toLocaleLowerCase('de')))
    .filter((tag) => tag.toLocaleLowerCase('de').includes(suchtext))
    .slice(0, MAX_VORSCHLAEGE)
})

const vorschlagslisteOffen = computed(() => vorschlaege.value.length > 0)

useSchliesseBeiAussenaktion(vorschlagslisteOffen, feldbereichRef, () => {
  vorschlaegeUnterdrueckt.value = true
  aktiverIndex.value = -1
})

function aufEingabeTippen(event: Event): void {
  eingabe.value = (event.target as HTMLInputElement).value
  aktiverIndex.value = -1
  vorschlaegeUnterdrueckt.value = false
}

function commitTag(tag: string): void {
  const bereinigt = tag.trim()
  eingabe.value = ''
  aktiverIndex.value = -1
  if (bereinigt === '') return
  emit('tag-hinzugefuegt', bereinigt)
}

function aufEnter(): void {
  const gewaehlterVorschlag = aktiverIndex.value >= 0 ? vorschlaege.value[aktiverIndex.value] : undefined
  commitTag(gewaehlterVorschlag ?? eingabe.value)
}

function aufPfeilRunter(): void {
  if (vorschlaege.value.length === 0) return
  aktiverIndex.value = (aktiverIndex.value + 1) % vorschlaege.value.length
}

function aufPfeilHoch(): void {
  if (vorschlaege.value.length === 0) return
  aktiverIndex.value = aktiverIndex.value <= 0 ? vorschlaege.value.length - 1 : aktiverIndex.value - 1
}

function aufEscape(): void {
  vorschlaegeUnterdrueckt.value = true
  aktiverIndex.value = -1
}
</script>

<template>
  <div class="tag-eingabe">
    <div
      v-if="tagsSortiert.length > 0"
      class="tag-eingabe__pills"
    >
      <span
        v-for="tag in tagsSortiert"
        :key="tag"
        class="tag-eingabe__pill"
      >
        {{ tag }}
        <button
          type="button"
          class="tag-eingabe__entfernen"
          :aria-label="`${tag} entfernen`"
          @click="emit('tag-entfernt', tag)"
        >
          <IconKreuz :size="14" />
        </button>
      </span>
    </div>

    <div
      ref="feldbereichRef"
      class="tag-eingabe__feldbereich"
    >
      <input
        type="text"
        class="tag-eingabe__feld"
        placeholder="Tag hinzufügen"
        aria-label="Tag hinzufügen"
        autocomplete="off"
        :value="eingabe"
        @input="aufEingabeTippen"
        @keydown.enter.prevent="aufEnter"
        @keydown.down.prevent="aufPfeilRunter"
        @keydown.up.prevent="aufPfeilHoch"
        @keydown.esc="aufEscape"
      >

      <ul
        v-if="vorschlaege.length > 0"
        class="tag-eingabe__vorschlaege"
      >
        <li
          v-for="(vorschlag, index) in vorschlaege"
          :key="vorschlag"
        >
          <button
            type="button"
            class="tag-eingabe__vorschlag"
            :class="{ 'tag-eingabe__vorschlag--aktiv': index === aktiverIndex }"
            @mousedown.prevent="commitTag(vorschlag)"
          >
            {{ vorschlag }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.tag-eingabe {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.tag-eingabe__pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
}

.tag-eingabe__pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  height: 32px;
  padding: 0 var(--space-4) 0 var(--space-12);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background-color: var(--surface-muted);
  color: var(--text);
  font-size: var(--font-size-14);
}

.tag-eingabe__entfernen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.tag-eingabe__entfernen:hover {
  background-color: var(--surface-sunken);
  color: var(--text);
}

.tag-eingabe__feldbereich {
  position: relative;
}

.tag-eingabe__feld {
  width: 100%;
  min-height: 44px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-16);
}

.tag-eingabe__vorschlaege {
  position: absolute;
  z-index: 10;
  top: calc(100% + var(--space-4));
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
}

.tag-eingabe__vorschlag {
  width: 100%;
  min-height: 40px;
  padding: var(--space-4) var(--space-12);
  border: none;
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--text);
  font-size: var(--font-size-16);
  text-align: left;
  cursor: pointer;
}

.tag-eingabe__vorschlag:hover,
.tag-eingabe__vorschlag--aktiv {
  background-color: var(--surface-muted);
}
</style>

<script setup lang="ts">
/**
 * Eine Bewertungsachse in der Ortsdetailansicht: Zahleneingabe ist die
 * primäre, stets sichtbare Bedienung (initial leer, kein Default 0), der
 * Regler daneben ist das barrierefreie Pendant — ohne sichtbaren Thumb,
 * solange kein Wert gesetzt ist, danach bidirektional synchron
 * (design_notes PO-2026-09-07-002). Rein präsentational, kennt keinen Store
 * (code-conventions.md: „components/ kennt keinen Store") — die View
 * bindet über Emits an `useOrteStore.aktualisiereAchse` (ADR-0008).
 *
 * Gültigkeit wird beim Eingeben hergestellt (ADR-0007 Punkt 7): erst runden,
 * dann klemmen — nur bei tatsächlich eingegebenen Zahlen. Ein geleertes
 * Feld wird zu „nicht bewertet" (`null`) und nicht geklemmt.
 *
 * Store-frei zu bleiben ist hier keine Stilfrage: Nur dadurch darf die
 * View `Ortebereich.vue` (Context `orte`, vormals `Ortsdetail.vue` bis
 * PO-2026-09-07-012) diese Komponente importieren, ohne einen verbotenen
 * Import-Zyklus zu öffnen (ADR-0013 Punkt 3).
 */
import { computed, ref, watch } from 'vue'
import Intensitaetsbalken from '../../../shared/ui/Intensitaetsbalken.vue'
import TextButton from '../../../shared/ui/TextButton.vue'
import IconKreuz from '../../../shared/ui/icons/IconKreuz.vue'
import { rundenUndKlemmen } from '../lib/rundenUndKlemmen'

const props = defineProps<{
  /** Kebab-freier, deutscher Kurzname für IDs — z. B. `ambiente`, `preisLeistung`. */
  achseName: string
  label: string
  kurzerklaerung?: string | null
  wert: number | null
  kommentar: string | null
}>()

const emit = defineEmits<{
  'wert-geaendert': [wert: number | null]
  'kommentar-geaendert': [kommentar: string | null]
}>()

const eingabeId = computed(() => `bewertungsachse-${props.achseName}-wert`)
const reglerId = computed(() => `bewertungsachse-${props.achseName}-regler`)

// Lokaler Textzustand der Zahleneingabe — erst bei Commit (Verlassen des
// Feldes/`change`) wird gerundet, geklemmt und emittiert (ADR-0007 Punkt 7).
const eingabe = ref(props.wert === null ? '' : String(props.wert))

watch(
  () => props.wert,
  (neu) => {
    eingabe.value = neu === null ? '' : String(neu)
  },
)

function aufEingabeTippen(event: Event): void {
  eingabe.value = (event.target as HTMLInputElement).value
}

function aufEingabeCommit(): void {
  const roh = eingabe.value.trim()

  if (roh === '') {
    // Ein geleertes Feld ist kein Wert und wird nicht geklemmt — es führt
    // direkt zu „nicht bewertet" (design-conventions.md, „Formulare").
    if (props.wert !== null) emit('wert-geaendert', null)
    return
  }

  const zahl = Number(roh)
  if (!Number.isFinite(zahl)) {
    eingabe.value = props.wert === null ? '' : String(props.wert)
    return
  }

  const bereinigt = rundenUndKlemmen(zahl)
  eingabe.value = String(bereinigt)
  if (bereinigt !== props.wert) emit('wert-geaendert', bereinigt)
}

function aufReglerTippen(event: Event): void {
  eingabe.value = (event.target as HTMLInputElement).value
}

function aufReglerCommit(event: Event): void {
  const wert = rundenUndKlemmen(Number((event.target as HTMLInputElement).value))
  eingabe.value = String(wert)
  if (wert !== props.wert) emit('wert-geaendert', wert)
}

function aufZuruecksetzen(): void {
  eingabe.value = ''
  emit('wert-geaendert', null)
}

// Kommentar: standardmäßig eingeklappt als Text-Link, vorhandener Kommentar
// zeigt sich sofort aufgeklappt (design_notes PO-2026-09-07-002). Bleibt
// erhalten, wenn die Achse zurückgesetzt wird — dafür berührt
// `aufZuruecksetzen` oben ausschließlich `wert-geaendert`, nie den Kommentar.
const kommentarOffen = ref(props.kommentar !== null)
const kommentarEntwurf = ref(props.kommentar ?? '')

watch(
  () => props.kommentar,
  (neu) => {
    kommentarEntwurf.value = neu ?? ''
    if (neu !== null) kommentarOffen.value = true
  },
)

function aufKommentarCommit(): void {
  const bereinigt = kommentarEntwurf.value.trim()
  // Ein geleerter Kommentar wird `null`, nie `""` (ADR-0007 Punkt 4).
  const naechster = bereinigt === '' ? null : bereinigt
  if (naechster !== props.kommentar) emit('kommentar-geaendert', naechster)
}
</script>

<template>
  <div class="bewertungsachse">
    <div class="bewertungsachse__kopf">
      <label
        :for="eingabeId"
        class="bewertungsachse__label"
      >{{ label }}</label>
      <p
        v-if="kurzerklaerung"
        class="bewertungsachse__kurzerklaerung"
      >
        {{ kurzerklaerung }}
      </p>
    </div>

    <div class="bewertungsachse__eingabezeile">
      <input
        :id="eingabeId"
        type="number"
        inputmode="numeric"
        min="0"
        max="10"
        step="1"
        class="bewertungsachse__zahl"
        :value="eingabe"
        placeholder="–"
        @input="aufEingabeTippen"
        @change="aufEingabeCommit"
        @blur="aufEingabeCommit"
      >

      <input
        :id="reglerId"
        type="range"
        min="0"
        max="10"
        step="1"
        class="bewertungsachse__regler"
        :class="{ 'bewertungsachse__regler--leer': wert === null }"
        :aria-label="label"
        :value="wert ?? 0"
        :aria-valuenow="wert ?? undefined"
        :aria-valuetext="wert === null ? 'nicht bewertet' : undefined"
        @input="aufReglerTippen"
        @change="aufReglerCommit"
      >

      <button
        v-if="wert !== null"
        type="button"
        class="bewertungsachse__zuruecksetzen"
        :aria-label="`${label} zurücksetzen`"
        @click="aufZuruecksetzen"
      >
        <IconKreuz :size="16" />
      </button>
    </div>

    <Intensitaetsbalken :wert="wert" />

    <TextButton
      v-if="!kommentarOffen"
      type="button"
      class="bewertungsachse__kommentar-oeffnen"
      @click="kommentarOffen = true"
    >
      Kommentar hinzufügen
    </TextButton>
    <div
      v-else
      class="bewertungsachse__kommentar"
    >
      <textarea
        v-model="kommentarEntwurf"
        class="bewertungsachse__kommentar-feld"
        rows="2"
        :aria-label="`Kommentar zu ${label}`"
        @blur="aufKommentarCommit"
      />
    </div>
  </div>
</template>

<style scoped>
.bewertungsachse {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-16);
  border: 1px solid var(--border);
  border-radius: var(--radius-12);
}

.bewertungsachse__kopf {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.bewertungsachse__label {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  color: var(--text);
}

.bewertungsachse__kurzerklaerung {
  font-size: var(--font-size-14);
  color: var(--text-muted);
}

.bewertungsachse__eingabezeile {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.bewertungsachse__zahl {
  width: 64px;
  min-height: 44px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-16);
  flex-shrink: 0;
}

.bewertungsachse__regler {
  flex: 1;
  min-width: 0;
  accent-color: var(--color-primary-600);
}

.bewertungsachse__regler--leer::-webkit-slider-thumb {
  opacity: 0;
}

.bewertungsachse__regler--leer::-moz-range-thumb {
  opacity: 0;
}

.bewertungsachse__zuruecksetzen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-8);
  background-color: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.bewertungsachse__zuruecksetzen:hover {
  background-color: var(--surface-muted);
  color: var(--text);
}

.bewertungsachse__kommentar-oeffnen {
  align-self: flex-start;
  padding: 0;
  min-height: auto;
}

.bewertungsachse__kommentar-feld {
  width: 100%;
  padding: var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-14);
  resize: vertical;
}
</style>

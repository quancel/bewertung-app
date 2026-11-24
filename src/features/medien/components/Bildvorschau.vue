<script setup lang="ts">
/**
 * Bildvorschau im Vollbild (PO-2026-11-24-006, design-conventions.md
 * „Bildvorschau (Vollbild)", ADR-0036). Modaler Dialog, Teleport nach body.
 *
 * API für -005 (Bildstreifen): `ortId`, `startIndex`, `bezeichnung`,
 * `rueckgabeZiel(bildId)` (liefert das Element, das beim Schließen den Fokus
 * bekommt — die Kachel des ZULETZT gezeigten Bildes) und das Event
 * `schliessen`. Gebunden wird nur an den Medien-Store, Bilderbereich.vue
 * bleibt der einzige nach außen exportierte store-gebundene Baustein dieser
 * Ausbaustufe; wer sie aus einem anderen Context öffnet, muss das über
 * ADR-0016 Punkt 10 klären.
 *
 * Verlaufseintrag: `useVorschauVerlaufseintrag` (ADR-0036). Der Dialog legt
 * beim Einhängen EINEN Eintrag an, Blättern keinen. Wird er durch
 * System-Zurück geschlossen, ist der Eintrag schon weg; „×"/Esc entfernen ihn.
 *
 * Fokusfalle lokal (Sheet.vue hat keine): Tab zirkuliert über die
 * fokussierbaren Elemente des Dialogs. Esc wirkt nur im obersten Dialog:
 * der Handler hängt am Dialog selbst und stoppt die Weitergabe, so dass die
 * `document`-Listener der Sheets (Sheet.vue) nicht mitschließen.
 *
 * Objekt-URL (ADR-0016 Punkt 11): genau eine, für das aktuell gezeigte Bild;
 * beim Blättern und beim Aushängen freigegeben.
 *
 * Wischen: Pointer Events, Sprung ohne Finger-Folgen. `touch-action: pan-y`
 * lässt horizontale Gesten bei den Pointer Events ankommen.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMedienStore } from '../stores/medien.store'
import { useVorschauVerlaufseintrag } from '../composables/useVorschauVerlaufseintrag'
import IconChevron from '../../../shared/ui/icons/IconChevron.vue'
import IconKreuz from '../../../shared/ui/icons/IconKreuz.vue'

const props = defineProps<{
  ortId: string
  startIndex: number
  /** Bezeichnung des Ortes für den Alt-Text; leer = ohne Ortsbezug. */
  bezeichnung: string
  /** Fokus-Rückgabeziel für das zuletzt gezeigte Bild. */
  rueckgabeZiel: (bildId: string) => HTMLElement | null
}>()

const emit = defineEmits<{ schliessen: [] }>()

/** Mindestweg bzw. Mindestgeschwindigkeit der Wischgeste (design-conventions.md). */
const WISCH_MIN_WEG_PX = 48
const WISCH_MIN_TEMPO_PX_PRO_MS = 0.5
/** Untergrenze für die Tempo-Regel, damit ein zittriger Tipp nie blättert. */
const WISCH_MIN_WEG_TEMPO_PX = 10

const store = useMedienStore()
const bilder = computed(() => store.bilderFuerOrt(props.ortId))
const anzahl = computed(() => bilder.value.length)

const index = ref(Math.min(Math.max(props.startIndex, 0), Math.max(anzahl.value - 1, 0)))
const aktuellesBild = computed(() => bilder.value[index.value] ?? null)
const mehrereBilder = computed(() => anzahl.value > 1)
const amAnfang = computed(() => index.value <= 0)
const amEnde = computed(() => index.value >= anzahl.value - 1)

const altText = computed(() => {
  const basis = `Bild ${index.value + 1} von ${anzahl.value}`
  const name = props.bezeichnung.trim()
  return name ? `${basis} von ${name}` : basis
})

const objektUrl = ref<string | null>(null)
watch(
  aktuellesBild,
  (bild) => {
    if (objektUrl.value) URL.revokeObjectURL(objektUrl.value)
    objektUrl.value = bild ? URL.createObjectURL(bild.blob) : null
  },
  { immediate: true },
)

const wurzelRef = ref<HTMLElement | null>(null)
const schliessenRef = ref<HTMLButtonElement | null>(null)
const sichtbar = ref(false)
const schliesst = ref(false)

const verlauf = useVorschauVerlaufseintrag(() => beende())

/** Blendet aus (Fade 180ms); Fokus-Rückgabe und `schliessen` folgen nach dem
 * Ausblenden in `aufAusgeblendet` — bis dahin bleibt der Rest der Seite
 * hinter dem Dialog. */
function beende(): void {
  if (schliesst.value) return
  schliesst.value = true
  letztesBildId = aktuellesBild.value?.id ?? null
  sichtbar.value = false
}

let letztesBildId: string | null = null

function aufAusgeblendet(): void {
  emit('schliessen')
  const bildId = letztesBildId
  void nextTick(() => {
    // preventScroll: die Kachel stand vor dem Öffnen dort, wo sie stand —
    // ein Scroll-Versatz durch die Fokus-Rückgabe wäre ein Reset (ADR-0036 P3).
    if (bildId) props.rueckgabeZiel(bildId)?.focus({ preventScroll: true })
  })
}

function schliesseUeberBedienung(): void {
  verlauf.schliesse()
  beende()
}

function vorheriges(): void {
  if (!amAnfang.value) index.value -= 1
}

function naechstes(): void {
  if (!amEnde.value) index.value += 1
}

function aufTaste(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    schliesseUeberBedienung()
    return
  }
  if (event.key === 'ArrowLeft' && mehrereBilder.value) {
    event.preventDefault()
    vorheriges()
    return
  }
  if (event.key === 'ArrowRight' && mehrereBilder.value) {
    event.preventDefault()
    naechstes()
    return
  }
  if (event.key === 'Tab') {
    const ziele = Array.from(
      wurzelRef.value?.querySelectorAll<HTMLElement>('button') ?? [],
    )
    if (ziele.length === 0) return
    const erstes = ziele[0]!
    const letztes = ziele[ziele.length - 1]!
    const aktiv = document.activeElement
    if (event.shiftKey && (aktiv === erstes || !wurzelRef.value?.contains(aktiv))) {
      event.preventDefault()
      letztes.focus()
    } else if (!event.shiftKey && (aktiv === letztes || !wurzelRef.value?.contains(aktiv))) {
      event.preventDefault()
      erstes.focus()
    }
  }
}

// Wischen -------------------------------------------------------------------

let wischStart: { x: number; y: number; t: number; id: number } | null = null

function aufPointerDown(event: PointerEvent): void {
  if (!mehrereBilder.value) return
  wischStart = { x: event.clientX, y: event.clientY, t: event.timeStamp, id: event.pointerId }
}

function aufPointerUp(event: PointerEvent): void {
  const start = wischStart
  wischStart = null
  if (!start || start.id !== event.pointerId) return
  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  const weg = Math.abs(dx)
  if (weg <= Math.abs(dy)) return
  const dauer = Math.max(event.timeStamp - start.t, 1)
  const schnell = weg >= WISCH_MIN_WEG_TEMPO_PX && weg / dauer > WISCH_MIN_TEMPO_PX_PRO_MS
  if (weg < WISCH_MIN_WEG_PX && !schnell) return
  if (dx < 0) naechstes()
  else vorheriges()
}

function aufPointerAbbruch(): void {
  wischStart = null
}

onMounted(async () => {
  sichtbar.value = true
  await verlauf.oeffne()
  await nextTick()
  schliessenRef.value?.focus({ preventScroll: true })
})

onBeforeUnmount(() => {
  if (objektUrl.value) URL.revokeObjectURL(objektUrl.value)
  objektUrl.value = null
})
</script>

<template>
  <Teleport to="body">
    <Transition
      name="bildvorschau-fade"
      appear
      @after-leave="aufAusgeblendet"
    >
      <div
        v-if="sichtbar"
        ref="wurzelRef"
        class="bildvorschau"
        role="dialog"
        aria-modal="true"
        aria-label="Bildvorschau"
        @keydown="aufTaste"
      >
        <div class="bildvorschau__kopf">
          <button
            ref="schliessenRef"
            type="button"
            class="bildvorschau__knopf"
            aria-label="Vorschau schließen"
            @click="schliesseUeberBedienung"
          >
            <IconKreuz :size="24" />
          </button>
        </div>

        <div
          class="bildvorschau__flaeche"
          @pointerdown="aufPointerDown"
          @pointerup="aufPointerUp"
          @pointercancel="aufPointerAbbruch"
        >
          <img
            v-if="objektUrl"
            :src="objektUrl"
            :alt="altText"
            class="bildvorschau__bild"
            draggable="false"
          >
        </div>

        <div
          v-if="mehrereBilder"
          class="bildvorschau__fuss"
        >
          <button
            type="button"
            class="bildvorschau__knopf bildvorschau__knopf--zurueck"
            :class="{ 'bildvorschau__knopf--inaktiv': amAnfang }"
            aria-label="Vorheriges Bild"
            :aria-disabled="amAnfang"
            @click="vorheriges"
          >
            <IconChevron :size="24" />
          </button>
          <span
            class="bildvorschau__zaehler"
            aria-live="polite"
          >{{ index + 1 }} von {{ anzahl }}</span>
          <button
            type="button"
            class="bildvorschau__knopf bildvorschau__knopf--weiter"
            :class="{ 'bildvorschau__knopf--inaktiv': amEnde }"
            aria-label="Nächstes Bild"
            :aria-disabled="amEnde"
            @click="naechstes"
          >
            <IconChevron :size="24" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bildvorschau {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-900);
  color: var(--color-neutral-0);
}

.bildvorschau__kopf {
  flex: 0 0 56px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 var(--space-8);
}

/* min-height/min-width: 0 — die Bildfläche ist der Rest und darf nie von
   ihrem Inhalt aufgedrückt werden (Bild bleibt vollständig, ADR-0012). */
.bildvorschau__flaeche {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pan-y;
  user-select: none;
}

.bildvorschau__bild {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.bildvorschau__fuss {
  flex: 0 0 auto;
  box-sizing: content-box;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-16);
}

.bildvorschau__zaehler {
  min-width: 6ch;
  text-align: center;
  font-size: var(--font-size-14);
  font-variant-numeric: tabular-nums;
}

.bildvorschau__knopf {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: var(--radius-8);
  background-color: transparent;
  color: var(--color-neutral-0);
  cursor: pointer;
}

/* Dialoglokale Ausnahme der FARBE (nicht der Stärke): Der Standardring
   erreicht auf Dunkelgrau keine 3:1 (design-conventions.md). */
.bildvorschau__knopf:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-neutral-0);
  outline-offset: var(--focus-ring-offset);
}

.bildvorschau__knopf--zurueck :deep(.icon) {
  transform: rotate(90deg);
}

.bildvorschau__knopf--weiter :deep(.icon) {
  transform: rotate(-90deg);
}

.bildvorschau__knopf--inaktiv {
  opacity: 0.4;
  cursor: default;
}

.bildvorschau-fade-enter-active,
.bildvorschau-fade-leave-active {
  transition: opacity var(--duration-180) var(--ease-out);
}

.bildvorschau-fade-enter-from,
.bildvorschau-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .bildvorschau-fade-enter-active,
  .bildvorschau-fade-leave-active {
    transition: none;
  }
}
</style>

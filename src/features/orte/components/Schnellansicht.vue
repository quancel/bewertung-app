<script setup lang="ts">
/**
 * Schnellansicht — das nicht modale Quick-Look-Bottom-Sheet über der Karte
 * (PO-2026-11-24-005, ADR-0039, design-conventions.md „Karte: Quick-Look-Sheet").
 * Ein Marker öffnet sie statt des Ortsdetails; sie zeigt einen Ort nur LESEND.
 *
 * NICHT `shared/ui/Sheet.vue` (ADR-0039 Punkt 8): kein Backdrop, kein
 * `aria-modal` (`role="dialog"` ohne), die Karte bleibt bedienbar — sonst wäre
 * „Tipp auf einen anderen Marker wechselt den Inhalt" unmöglich. Und NICHT
 * `position: fixed`, sondern `absolute` im Kartenbereich (der Elternknoten ist
 * der Containing Block): sonst griffe in `scripts/smoke.mjs` die Ausnahme
 * „fixierte Chrome" und verschluckte jede Überdeckung eines nicht `inert`
 * gesetzten Markers.
 *
 * Präsentational: kennt weder Store noch Router (code-conventions.md).
 * `Ortebereich.vue` leitet den offenen Ort aus der Adresse ab und bindet die
 * Emits an Navigation. Gebunden an einen Store ist nur `Bildstreifen.vue`
 * (`medien`, ADR-0039 Punkt 6) — der zweite store-gebundene Export von `medien`.
 *
 * Zustand (eingeklappt/halb/voll) ist lokal und beginnt nach jedem Mount bei
 * „halb" (ADR-0039 Punkt 4), er steht nicht in der Adresse. Die Höhen kommen
 * aus der Höhe des sichtbaren Kartenbereichs (`lib/schnellansichtHoehen.ts`).
 * Gemeldet wird das verdeckte Maß (`verdeckung-geaendert`) als ZIELHÖHE des
 * Zustands, nicht als animierter Zwischenwert; während einer Ziehgeste wird
 * nichts gemeldet.
 *
 * „Über der Bottom-Tab-Leiste" (design-conventions.md): Reicht die Karte (feste
 * Höhe, `--karte-hoehe`) auf einem niedrigen Telefon unter die feste Tab-Leiste,
 * säße die Fußzeile mit „Bearbeiten" dahinter. Die Fläche wird deshalb um den
 * überstehenden Teil nach oben versetzt (`unterkantenVersatz`) — gemessen als
 * Überstand des Kartenbereichs über den Platz, den `<main>` unten für feste
 * Leisten reserviert (sein `padding-bottom`); der Versatz folgt dem Scrollen.
 * Die Zustände rechnen mit der sichtbaren Höhe (Bereich minus Versatz), das
 * gemeldete Maß enthält den Versatz (er liegt unter der Fläche, ist aber von
 * unten verdeckt).
 *
 * Gesten: Pointer Events nur an Griff und Kopfzeile (`.schnellansicht__kopf-
 * bereich`), nie im scrollenden Inhalt. Eine Bewegung von höchstens
 * `ZIEH_SCHWELLE_PX` bleibt ein Tipp (der Griff-Button schaltet), eine größere
 * ist eine Ziehgeste und unterdrückt den anschließenden Klick.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { OrtDatensatz } from '../../../persistence/schema'
import { formatiereGesamtnote, type GesamtnoteErgebnis } from '../../../shared/lib/gesamtnote'
import Intensitaetsbalken from '../../../shared/ui/Intensitaetsbalken.vue'
import IconKreuz from '../../../shared/ui/icons/IconKreuz.vue'
import Bildstreifen from '../../medien/components/Bildstreifen.vue'
import {
  begrenzeHoehe,
  bestimmeHoehen,
  rasteEin,
  zustandGroesser,
  zustandKleiner,
  zustandNachGriffAktivierung,
  type SchnellansichtZustand,
} from '../lib/schnellansichtHoehen'

const props = defineProps<{
  ort: OrtDatensatz
  /** Fertig berechnete Gesamtnote (ADR-0037 Punkt 7), ohne Zonenfarbe dargestellt. */
  gesamtnote: GesamtnoteErgebnis
}>()

const emit = defineEmits<{
  schliessen: []
  bearbeiten: []
  /** Zielmaß der Überlagerung in px, relativ zum Elternknoten (= Kartenbereich), unten bündig. */
  'verdeckung-geaendert': [verdeckung: { hoehe: number; links: number; rechts: number }]
}>()

/** Bewegung (px) bis zu der ein Pointer-Vorgang noch ein Tipp ist. */
const ZIEH_SCHWELLE_PX = 4
/** Zeitfenster (ms) für die Geschwindigkeit beim Loslassen. */
const TEMPO_FENSTER_MS = 120

const ACHSEN = [
  { schluessel: 'ambiente', label: 'Ambiente' },
  { schluessel: 'zeit', label: 'Zeit (Wartezeit)' },
  { schluessel: 'geschmack', label: 'Geschmack' },
  { schluessel: 'preisLeistung', label: 'Preis/Leistung' },
] as const

const ZUSTAND_TEXT: Record<SchnellansichtZustand, string> = {
  eingeklappt: 'eingeklappt',
  halb: 'halb',
  voll: 'voll',
}

const wurzelRef = ref<HTMLElement | null>(null)
const inhaltRef = ref<HTMLElement | null>(null)
const ueberschriftRef = ref<HTMLElement | null>(null)

const zustand = ref<SchnellansichtZustand>('halb')
/** Sichtbare Höhe des Kartenbereichs (ohne den Teil unter der festen Leiste). */
const bereichHoehe = ref(480)
/** Wie weit die Unterkante der Fläche über der Unterkante des Kartenbereichs steht (px). */
const unterkantenVersatz = ref(0)
/** Höhe während einer Ziehgeste; `null` = die Zielhöhe des Zustands (mit Übergang). */
const ziehHoehe = ref<number | null>(null)

const hoehen = computed(() => bestimmeHoehen(bereichHoehe.value))
const zielHoehe = computed(() => hoehen.value[zustand.value])
const angezeigteHoehe = computed(() => ziehHoehe.value ?? zielHoehe.value)

const bezeichnung = computed(() => props.ort.bezeichnung.trim() || 'Ort ohne Bezeichnung')
const notentext = computed(() =>
  props.gesamtnote.art === 'wert' ? formatiereGesamtnote(props.gesamtnote.zehntel) : null,
)
/** Wortlaut wie im Ortsdetail (design-conventions.md „Gewichtung der Gesamtnote"). */
const ohneNoteText = computed(() => {
  if (props.gesamtnote.art === 'ohne-gewicht') return 'Keine Gesamtnote bei dieser Gewichtung'
  if (props.gesamtnote.art === 'unbewertet') return 'Noch nicht bewertet'
  return null
})

// --- Maß messen und melden -----------------------------------------------------

/** Misst Kartenbereich und den unten von fester Chrome belegten Platz. */
function messe(): void {
  const wurzel = wurzelRef.value
  const eltern = wurzel?.parentElement
  if (!wurzel || !eltern) return
  const reserviert = Number.parseFloat(getComputedStyle(wurzel.closest('main') ?? document.body).paddingBottom) || 0
  const ueberstand = eltern.getBoundingClientRect().bottom - (window.innerHeight - reserviert)
  // Höchstens so viel, dass „eingeklappt" noch in den Bereich passt.
  const versatz = Math.min(Math.max(Math.round(ueberstand), 0), Math.max(eltern.clientHeight - 80, 0))
  unterkantenVersatz.value = versatz
  bereichHoehe.value = eltern.clientHeight - versatz
}

function meldeMass(): void {
  const wurzel = wurzelRef.value
  if (!wurzel || ziehHoehe.value !== null) return
  emit('verdeckung-geaendert', {
    hoehe: zielHoehe.value + unterkantenVersatz.value,
    links: wurzel.offsetLeft,
    rechts: wurzel.offsetLeft + wurzel.offsetWidth,
  })
}

function messeUndMelde(): void {
  messe()
  void nextTick(meldeMass)
}

let beobachter: ResizeObserver | null = null
let messungGeplant = 0

/** Scrollen und Größenänderung verschieben den Versatz: höchstens einmal je Frame messen. */
function planeMessung(): void {
  if (messungGeplant) return
  messungGeplant = requestAnimationFrame(() => {
    messungGeplant = 0
    if (ziehHoehe.value === null) messe()
  })
}

watch([zielHoehe, unterkantenVersatz], () => {
  if (ziehHoehe.value === null) void nextTick(meldeMass)
})

// --- Fokus und Wechsel ---------------------------------------------------------

function fokussiereUeberschrift(): void {
  ueberschriftRef.value?.focus({ preventScroll: true })
}

watch(
  () => props.ort.id,
  async () => {
    // Wechsel auf einen anderen Marker: Inhalt springt, Zustand bleibt (kein
    // Zurücksetzen auf „halb"), aber der Inhalt beginnt oben, und der Fokus
    // folgt auf die Überschrift.
    await nextTick()
    if (inhaltRef.value) inhaltRef.value.scrollTop = 0
    fokussiereUeberschrift()
  },
)

// --- Esc -------------------------------------------------------------------------

/** Esc schließt, solange nichts Modales darüber liegt: Bildvorschau und `Sheet.vue`
 * schließen sich selbst (die Vorschau stoppt die Weitergabe, ein `Sheet` ist
 * `aria-modal`) — das erste Esc gehört dem obersten Dialog. */
function aufEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  if (document.querySelector('[aria-modal="true"]')) return
  emit('schliessen')
}

// --- Griff-Button -------------------------------------------------------------------

let ausDerZiehgeste = false
let ausDerZiehgesteTimer: ReturnType<typeof setTimeout> | null = null

function aufGriffKlick(): void {
  // Ein Klick, der dem Ende einer Ziehgeste folgt, ist keine Aktivierung.
  if (ausDerZiehgeste) {
    ausDerZiehgeste = false
    return
  }
  zustand.value = zustandNachGriffAktivierung(zustand.value)
}

function aufGriffTaste(event: KeyboardEvent): void {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    zustand.value = zustandGroesser(zustand.value)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    zustand.value = zustandKleiner(zustand.value)
  }
}

// --- Ziehgeste (Pointer Events, nur Griff und Kopfzeile) -----------------------------

interface Zugprobe {
  y: number
  t: number
}

let zug: { pointerId: number; startY: number; startHoehe: number; proben: Zugprobe[]; gezogen: boolean } | null = null

function aufPointerDown(event: PointerEvent): void {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  // Das Schließen-„×" ist kein Griff: dort beginnt keine Ziehgeste.
  if ((event.target as HTMLElement).closest('.schnellansicht__schliessen')) return
  ausDerZiehgeste = false
  zug = {
    pointerId: event.pointerId,
    startY: event.clientY,
    startHoehe: angezeigteHoehe.value,
    proben: [{ y: event.clientY, t: event.timeStamp }],
    gezogen: false,
  }
}

function aufPointerMove(event: PointerEvent): void {
  if (!zug || zug.pointerId !== event.pointerId) return
  const weg = zug.startY - event.clientY
  if (!zug.gezogen && Math.abs(weg) <= ZIEH_SCHWELLE_PX) return
  if (!zug.gezogen) {
    // Erst jetzt einfangen: Mit Capture ab `pointerdown` ginge auch ein bloßer
    // Tipp an das einfangende Element, und der Griff-Button bekäme keinen Klick.
    ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  }
  zug.gezogen = true
  zug.proben.push({ y: event.clientY, t: event.timeStamp })
  // Nur das jüngste Zeitfenster zählt für die Geschwindigkeit.
  while (zug.proben.length > 2 && event.timeStamp - zug.proben[0]!.t > TEMPO_FENSTER_MS) zug.proben.shift()
  ziehHoehe.value = begrenzeHoehe(zug.startHoehe + weg, hoehen.value)
}

function beendeZug(event: PointerEvent, abgebrochen: boolean): void {
  if (!zug || zug.pointerId !== event.pointerId) return
  const aktuell = zug
  zug = null
  ;(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId)
  if (!aktuell.gezogen || ziehHoehe.value === null) {
    ziehHoehe.value = null
    return
  }
  ausDerZiehgeste = true
  if (ausDerZiehgesteTimer) clearTimeout(ausDerZiehgesteTimer)
  ausDerZiehgesteTimer = setTimeout(() => {
    ausDerZiehgeste = false
    ausDerZiehgesteTimer = null
  }, 100)
  const erste = aktuell.proben[0]!
  const letzte = aktuell.proben[aktuell.proben.length - 1]!
  const dauer = Math.max(letzte.t - erste.t, 1)
  // Positiv = die Höhe wächst (Finger/Maus nach oben).
  const tempo = abgebrochen ? 0 : (erste.y - letzte.y) / dauer
  const ziel = rasteEin(ziehHoehe.value, hoehen.value, tempo)
  zustand.value = ziel
  ziehHoehe.value = null
}

function aufPointerUp(event: PointerEvent): void {
  beendeZug(event, false)
}

function aufPointerAbbruch(event: PointerEvent): void {
  beendeZug(event, true)
}

// --- Lebenszyklus ---------------------------------------------------------------------

onMounted(() => {
  document.addEventListener('keydown', aufEscape)
  window.addEventListener('scroll', planeMessung, { passive: true })
  window.addEventListener('resize', planeMessung)
  messeUndMelde()
  if (typeof ResizeObserver !== 'undefined' && wurzelRef.value?.parentElement) {
    beobachter = new ResizeObserver(planeMessung)
    beobachter.observe(wurzelRef.value.parentElement)
  }
  void nextTick(fokussiereUeberschrift)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', aufEscape)
  window.removeEventListener('scroll', planeMessung)
  window.removeEventListener('resize', planeMessung)
  if (messungGeplant) cancelAnimationFrame(messungGeplant)
  beobachter?.disconnect()
  beobachter = null
  if (ausDerZiehgesteTimer) clearTimeout(ausDerZiehgesteTimer)
})
</script>

<template>
  <div
    ref="wurzelRef"
    class="schnellansicht"
    :class="[`schnellansicht--${zustand}`, { 'schnellansicht--zieht': ziehHoehe !== null }]"
    role="dialog"
    :aria-label="`Schnellansicht: ${bezeichnung}`"
    :style="{ height: `${angezeigteHoehe}px`, bottom: `${unterkantenVersatz}px` }"
  >
    <div
      class="schnellansicht__kopfbereich"
      @pointerdown="aufPointerDown"
      @pointermove="aufPointerMove"
      @pointerup="aufPointerUp"
      @pointercancel="aufPointerAbbruch"
    >
      <div class="schnellansicht__griffzeile">
        <button
          type="button"
          class="schnellansicht__griff"
          :aria-label="`Größe der Schnellansicht ändern, aktuell ${ZUSTAND_TEXT[zustand]}`"
          @click="aufGriffKlick"
          @keydown="aufGriffTaste"
        >
          <span
            class="schnellansicht__griff-balken"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          class="schnellansicht__schliessen"
          aria-label="Schnellansicht schließen"
          @click="emit('schliessen')"
        >
          <IconKreuz :size="20" />
        </button>
      </div>

      <div class="schnellansicht__kopf">
        <h2
          ref="ueberschriftRef"
          class="schnellansicht__titel"
          tabindex="-1"
        >
          {{ bezeichnung }}
        </h2>
        <span
          v-if="notentext !== null"
          class="schnellansicht__note"
        >{{ notentext }}</span>
      </div>
    </div>

    <div
      ref="inhaltRef"
      class="schnellansicht__inhalt"
      :inert="zustand === 'eingeklappt' && ziehHoehe === null"
    >
      <p
        v-if="ohneNoteText !== null"
        class="schnellansicht__ohne-note"
      >
        {{ ohneNoteText }}
      </p>

      <Bildstreifen
        :ort-id="ort.id"
        :bezeichnung="ort.bezeichnung"
      />

      <p
        v-if="ort.anfangsnotiz"
        class="schnellansicht__text schnellansicht__klemmbar"
      >
        {{ ort.anfangsnotiz }}
      </p>

      <p
        v-if="ort.adresse"
        class="schnellansicht__adresse"
      >
        {{ ort.adresse }}
      </p>

      <ul
        v-if="ort.tags.length > 0"
        class="schnellansicht__tags"
        aria-label="Tags"
      >
        <li
          v-for="tag in ort.tags"
          :key="tag"
          class="schnellansicht__tag"
        >
          {{ tag }}
        </li>
      </ul>

      <ul class="schnellansicht__achsen">
        <li
          v-for="achse in ACHSEN"
          :key="achse.schluessel"
          class="schnellansicht__achse"
        >
          <div class="schnellansicht__achse-kopf">
            <span class="schnellansicht__achse-name">{{ achse.label }}</span>
            <Intensitaetsbalken :wert="ort.bewertungen[achse.schluessel].wert" />
          </div>
          <p
            v-if="ort.bewertungen[achse.schluessel].kommentar"
            class="schnellansicht__text schnellansicht__klemmbar"
          >
            {{ ort.bewertungen[achse.schluessel].kommentar }}
          </p>
        </li>
      </ul>
    </div>

    <div
      v-if="zustand !== 'eingeklappt'"
      class="schnellansicht__fuss"
    >
      <button
        type="button"
        class="schnellansicht__bearbeiten"
        @click="emit('bearbeiten')"
      >
        Bearbeiten
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Im Kartenbereich positioniert, NICHT fixed (ADR-0039 Punkt 8): der
   Elternknoten (`Ortebereich.vue`, `.ortebereich__karte-huelle`) ist der
   Containing Block und gibt die Höhe H vor. z-index 1 legt die Fläche über den
   isolierten Stapelkontext der Karte (`Kartenflaeche.vue`). */
.schnellansicht {
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: var(--radius-16) var(--radius-16) 0 0;
  background-color: var(--surface);
  box-shadow: 0 -4px 24px rgb(0 0 0 / 12%);
  transition: height var(--duration-240) var(--ease-out);
}

/* Bis `md` volle Breite, ab `md` höchstens 480px, linksbündig mit 16px Rand. */
@media (min-width: 768px) { /* --breakpoint-md */
  .schnellansicht {
    left: var(--space-16);
    right: auto;
    width: min(480px, calc(100% - var(--space-32)));
  }
}

.schnellansicht--zieht {
  transition: none;
}

/* Griff und Kopfzeile: die einzige Fläche, an der gezogen wird. `touch-action:
   none`, sonst übernimmt der Browser die Geste als Scrollen. */
.schnellansicht__kopfbereich {
  flex: none;
  touch-action: none;
  user-select: none;
}

.schnellansicht__griffzeile {
  display: flex;
  height: 44px;
}

.schnellansicht__griff {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: grab;
}

.schnellansicht__griff-balken {
  display: block;
  width: 36px;
  height: 4px;
  border-radius: var(--radius-full);
  background-color: var(--border-strong);
}

.schnellansicht__griff:focus-visible,
.schnellansicht__schliessen:focus-visible {
  outline-offset: -2px;
}

.schnellansicht__schliessen {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.schnellansicht__schliessen:hover {
  background-color: var(--surface-muted);
}

.schnellansicht__kopf {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  min-height: 36px;
  padding: 0 var(--space-16);
}

.schnellansicht__titel {
  flex: 1 1 0;
  min-width: 0;
  margin: 0;
  font-size: var(--font-size-20);
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  overflow-wrap: anywhere;
}

/* Eingeklappt bleibt es bei EINER Zeile (80px = Griff 44 + Zeile 36). */
.schnellansicht--eingeklappt .schnellansicht__titel {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schnellansicht__note {
  flex: none;
  color: var(--text);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.schnellansicht__inhalt {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  padding: var(--space-8) var(--space-16) var(--space-16);
  overflow-y: auto;
  overflow-x: hidden;
  /* Die Geste im Inhalt scrollt den Inhalt, nie die Karte oder die Seite dahinter. */
  overscroll-behavior: contain;
}

/* Eingeklappt ist der Inhalt weder sichtbar noch fokussierbar; die Verzögerung
   hält ihn während des Einklappens (240ms) noch sichtbar. */
.schnellansicht--eingeklappt:not(.schnellansicht--zieht) .schnellansicht__inhalt {
  visibility: hidden;
  transition: visibility 0s linear var(--duration-240);
}

.schnellansicht__ohne-note,
.schnellansicht__adresse {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--font-size-14);
  overflow-wrap: anywhere;
}

.schnellansicht__text {
  margin: 0;
  font-size: var(--font-size-16);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

/* Halb: Anfangsnotiz und jeder Kommentar auf 2 Zeilen geklemmt; voll: vollständig. */
.schnellansicht--halb .schnellansicht__klemmbar {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.schnellansicht__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Neutrale Pille, lokal: `tags` exportiert keine lesende Pille (kein Import aus `tags`). */
.schnellansicht__tag {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  height: 28px;
  padding: 0 var(--space-12);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background-color: var(--surface-muted);
  color: var(--text);
  font-size: var(--font-size-14);
  overflow-wrap: anywhere;
}

.schnellansicht__achsen {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  margin: 0;
  padding: 0;
  list-style: none;
}

.schnellansicht__achse {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.schnellansicht__achse-kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4) var(--space-12);
}

.schnellansicht__achse-name {
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
}

/* Fest unten, 56px. */
.schnellansicht__fuss {
  flex: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 var(--space-16);
  border-top: 1px solid var(--border);
  background-color: var(--surface);
}

/* Sekundär-Button (Nutzerentscheidung: nicht primär — die Primäraktion der
   Kartenansicht ist „Ort hinzufügen", höchstens eine je Ansicht). Rahmen-Optik
   lokal: Eine gemeinsame Komponente gibt es nicht, und `shared/` gilt erst ab
   zwei Nutzern. */
.schnellansicht__bearbeiten {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--space-8) var(--space-16);
  border: 1px solid var(--color-primary-600);
  border-radius: var(--radius-8);
  background-color: transparent;
  color: var(--color-primary-700);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--duration-120) var(--ease-out);
}

.schnellansicht__bearbeiten:hover {
  background-color: var(--color-primary-50);
}

/* Öffnen und Schließen (`<Transition name="schnellansicht">` in Ortebereich.vue):
   Slide-up 240ms ease-out, Schließen 240ms ease-in. */
.schnellansicht-enter-active {
  transition: transform var(--duration-240) var(--ease-out);
}

.schnellansicht-leave-active {
  transition: transform var(--duration-240) var(--ease-in);
}

.schnellansicht-enter-from,
.schnellansicht-leave-to {
  transform: translateY(100%);
}

/* Reduzierte Bewegung: Fade 180ms statt Slide. `!important` und die
   Klassenspezifität schlagen die globale Regel in base.css (die jede
   Transition auf 0,01ms setzt) — hier ist der Fade der vorgesehene Ersatz. */
@media (prefers-reduced-motion: reduce) {
  .schnellansicht-enter-active,
  .schnellansicht-leave-active {
    transition: opacity var(--duration-180) var(--ease-out) !important;
  }

  .schnellansicht-enter-from,
  .schnellansicht-leave-to {
    transform: none;
    opacity: 0;
  }
}
</style>

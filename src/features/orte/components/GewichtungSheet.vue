<script setup lang="ts">
/**
 * Gewichtungs-Sheet (PO-2026-11-24-001/-002, ADR-0037, design-conventions.md
 * „Gewichtung der Gesamtnote"): Auswahl eines Szenarios für die Gesamtnote,
 * bei „Eigene" mit vier Gewichtszeilen (Regler + Zahlenfeld). Präsentational,
 * kein Store, kein Router — der Zustand gehört `useOrteStore`,
 * `Ortebereich.vue` verdrahtet (code-conventions.md „components/ kennt keinen
 * Store"). Nutzt die `Sheet.vue`-Chrome (ein abgeschlossener Scroll-Bereich,
 * max 90vh).
 *
 * Aufbau wie das Sortier-Sheet in `Werkzeugleiste.vue`: Button-Liste mit
 * `aria-pressed`; die aktive Zeile trägt `--color-primary-50` UND ein
 * Haken-Icon (nicht nur Fläche). Eine Auswahl wirkt sofort; feste Szenarien
 * schließen das Sheet, „Eigene" lässt es offen und klappt darunter den
 * Gewichtsblock auf.
 *
 * Eigene Gewichte: JEDE Bedienung (Regler und Zahlenfeld) committet auf jedes
 * `input`-Ereignis direkt über `gewicht-geaendert` — kein lokaler Entwurf, kein
 * Enter, kein Feldwechsel. Ein Gewicht bleibt dabei nie „nicht gesetzt": Ein
 * geleertes Zahlenfeld fällt beim Verlassen auf den bisherigen Wert zurück
 * und committet nie `null`. Gültigkeit stellt NICHT diese Komponente her,
 * sondern das Gate im Store-Setter (`lib/gewichtung.ts`); sie zeigt nur, was
 * der Store zurückgibt (der Text im Zahlenfeld folgt nach jedem Commit der
 * Prop).
 */
import { nextTick, ref, watch } from 'vue'
import IconHaken from '../../../shared/ui/icons/IconHaken.vue'
import Regler from '../../../shared/ui/Regler.vue'
import Sheet from '../../../shared/ui/Sheet.vue'
import { anteilInProzent, einzigeZaehlendeAchse } from '../lib/gewichtung'
import {
  ACHSEN_KRITERIEN,
  GEWICHTUNG_SZENARIEN,
  SORTIER_KRITERIUM_LABEL,
  type AchsenKriterium,
  type Gewichte,
  type GewichtungsSzenario,
} from '../model/ansicht'

const props = defineProps<{
  offen: boolean
  szenario: GewichtungsSzenario
  eigeneGewichte: Gewichte
  /** Statuszeile „Mindestens eine Achse muss zählen." (role=status, ohne
   * Timer — die View setzt sie bei einem abgefangenen Versuch und nimmt sie
   * bei der nächsten Gewichtsänderung zurück). */
  mussZaehlenHinweis: boolean
}>()

const emit = defineEmits<{
  schliessen: []
  'szenario-gewaehlt': [szenario: GewichtungsSzenario]
  'gewicht-geaendert': [achse: AchsenKriterium, wert: number]
}>()

function aufGewaehlt(szenario: GewichtungsSzenario): void {
  emit('szenario-gewaehlt', szenario)
  if (szenario !== 'eigene') emit('schliessen')
}

// --- Eigene Gewichte -------------------------------------------------------

function textAus(gewichte: Gewichte): Record<AchsenKriterium, string> {
  return {
    ambiente: String(gewichte.ambiente),
    zeit: String(gewichte.zeit),
    geschmack: String(gewichte.geschmack),
    preisLeistung: String(gewichte.preisLeistung),
  }
}

/** Text der vier Zahlenfelder — folgt der Prop, solange nicht getippt wird. */
const eingabe = ref(textAus(props.eigeneGewichte))

watch(
  () => props.eigeneGewichte,
  (neu) => {
    eingabe.value = textAus(neu)
  },
)

function zahlId(achse: AchsenKriterium): string {
  return `gewichtung-eigene-${achse}-zahl`
}

function aufZahlTippen(achse: AchsenKriterium, event: Event): void {
  const feld = event.target as HTMLInputElement
  eingabe.value[achse] = feld.value
  // Leer oder halb getippt (z. B. „-"): kein Commit, beim Verlassen kehrt das
  // Feld zum bisherigen Wert zurück.
  if (feld.value.trim() === '' || feld.validity.badInput) return
  const zahl = Number(feld.value)
  if (!Number.isFinite(zahl)) return
  emit('gewicht-geaendert', achse, zahl)
  // Nach dem Gate zeigt das Feld, was gilt (geklemmt, bei „muss zählen" 1).
  void nextTick(() => {
    eingabe.value[achse] = String(props.eigeneGewichte[achse])
  })
}

function aufZahlVerlassen(achse: AchsenKriterium): void {
  eingabe.value[achse] = String(props.eigeneGewichte[achse])
}

function aufReglerTippen(achse: AchsenKriterium, event: Event): void {
  emit('gewicht-geaendert', achse, Number((event.target as HTMLInputElement).value))
}

/**
 * Versuch an der Untergrenze der LETZTEN zählenden Achse (design-conventions.md
 * „Letztes Gewicht über 0": die Statuszeile erscheint bei JEDEM Versuch, auch am
 * Regler). Bei `min=1` ändert sich der Wert nicht, es feuert kein `input` — der
 * Versuch wird deshalb an der Geste erkannt (Pfeil links/unten, Pos1, Bild ab am
 * Minimum; Ziehen nach links bis an den linken Rand der Bahn) und als 0 über
 * denselben Emit gemeldet. Das Gate im Store-Setter bleibt der einzige
 * Schreibpfad: es klemmt auf 1 und meldet `mussZaehlen`.
 */
const VERSUCH_TASTEN = new Set(['ArrowLeft', 'ArrowDown', 'Home', 'PageDown'])
/** Halbe Thumb-Breite (24px, `Regler.vue`): Mitte des Thumbs am Minimum. */
const THUMB_HALB_PX = 12
let zeigerStartX: number | null = null

function aufReglerTaste(achse: AchsenKriterium, event: KeyboardEvent): void {
  if (!muessteZaehlen(achse) || !VERSUCH_TASTEN.has(event.key)) return
  if (Number((event.target as HTMLInputElement).value) > 1) return
  emit('gewicht-geaendert', achse, 0)
}

function aufReglerZeigerStart(event: PointerEvent): void {
  zeigerStartX = event.clientX
}

function aufReglerZeigerBewegung(achse: AchsenKriterium, event: PointerEvent): void {
  if (zeigerStartX === null || !muessteZaehlen(achse)) return
  const regler = event.target as HTMLInputElement
  if (Number(regler.value) > 1) return
  if (event.clientX < zeigerStartX && event.clientX <= regler.getBoundingClientRect().left + THUMB_HALB_PX) {
    emit('gewicht-geaendert', achse, 0)
  }
}

function aufReglerZeigerEnde(): void {
  zeigerStartX = null
}

function muessteZaehlen(achse: AchsenKriterium): boolean {
  return einzigeZaehlendeAchse(props.eigeneGewichte) === achse
}

/** „33 %" · bei Gewicht 0 „zählt nicht" · bei der letzten Achse über 0
 * „100 % · muss zählen". */
function anteilText(achse: AchsenKriterium): string {
  if (props.eigeneGewichte[achse] === 0) return 'zählt nicht'
  const prozent = `${anteilInProzent(props.eigeneGewichte, achse)} %`
  return muessteZaehlen(achse) ? `${prozent} · muss zählen` : prozent
}
</script>

<template>
  <Sheet
    :offen="offen"
    label="Gewichtung der Gesamtnote"
    @schliessen="emit('schliessen')"
  >
    <h2 class="gewichtung-sheet__titel">
      Gewichtung der Gesamtnote
    </h2>
    <p class="gewichtung-sheet__erklaerung">
      Bestimmt, wie stark jede Achse in die Gesamtnote eingeht. Gilt für Liste,
      Detail und Karte.
    </p>

    <ul class="gewichtung-sheet__liste">
      <li
        v-for="eintrag in GEWICHTUNG_SZENARIEN"
        :key="eintrag.schluessel"
      >
        <button
          type="button"
          class="gewichtung-sheet__eintrag"
          :class="{ 'gewichtung-sheet__eintrag--aktiv': eintrag.schluessel === szenario }"
          :aria-pressed="eintrag.schluessel === szenario"
          @click="aufGewaehlt(eintrag.schluessel)"
        >
          <span class="gewichtung-sheet__texte">
            <span class="gewichtung-sheet__name">{{ eintrag.name }}</span>
            <span class="gewichtung-sheet__sekundaer">{{ eintrag.sekundaerzeile }}</span>
          </span>
          <IconHaken
            v-if="eintrag.schluessel === szenario"
            :size="20"
          />
        </button>

        <!-- Reveal 180ms ease-out (design-conventions.md „Eigene"): unter der
             Zeile „Eigene". Der Container (`container-type`) sitzt auf
             `.gewicht-eigene`, die Zeilen darin fragen ihn ab (ab 400px
             einzeilig). -->
        <Transition
          v-if="eintrag.schluessel === 'eigene'"
          name="gewicht-reveal"
        >
          <div
            v-if="szenario === 'eigene'"
            class="gewicht-reveal"
          >
            <div class="gewicht-eigene">
              <ul class="gewicht-eigene__liste">
                <li
                  v-for="achse in ACHSEN_KRITERIEN"
                  :key="achse"
                  class="gewicht-zeile"
                >
                  <div class="gewicht-zeile__text">
                    <label
                      :for="zahlId(achse)"
                      class="gewicht-zeile__name"
                    >{{ SORTIER_KRITERIUM_LABEL[achse] }}</label>
                    <span
                      class="gewicht-zeile__anteil"
                      :data-achse="achse"
                    >{{ anteilText(achse) }}</span>
                  </div>
                  <input
                    :id="zahlId(achse)"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    max="10"
                    step="1"
                    class="gewicht-zeile__zahl"
                    :value="eingabe[achse]"
                    @input="aufZahlTippen(achse, $event)"
                    @blur="aufZahlVerlassen(achse)"
                  >
                  <Regler
                    class="gewicht-zeile__regler"
                    :wert="eigeneGewichte[achse]"
                    :min="muessteZaehlen(achse) ? 1 : 0"
                    :aria-label="`Gewicht ${SORTIER_KRITERIUM_LABEL[achse]}`"
                    @input="aufReglerTippen(achse, $event)"
                    @keydown="aufReglerTaste(achse, $event)"
                    @pointerdown="aufReglerZeigerStart"
                    @pointermove="aufReglerZeigerBewegung(achse, $event)"
                    @pointerup="aufReglerZeigerEnde"
                    @pointercancel="aufReglerZeigerEnde"
                  />
                </li>
              </ul>
              <p
                role="status"
                class="gewicht-eigene__status"
              >
                {{ mussZaehlenHinweis ? 'Mindestens eine Achse muss zählen.' : '' }}
              </p>
            </div>
          </div>
        </Transition>
      </li>
    </ul>
  </Sheet>
</template>

<style scoped>
.gewichtung-sheet__titel {
  margin-bottom: var(--space-8);
  font-size: var(--font-size-20);
}

.gewichtung-sheet__erklaerung {
  margin-bottom: var(--space-16);
  color: var(--text);
  font-size: var(--font-size-14);
}

.gewichtung-sheet__liste {
  display: flex;
  flex-direction: column;
}

.gewichtung-sheet__eintrag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
  width: 100%;
  min-height: 48px;
  padding: var(--space-8) var(--space-12);
  border: none;
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.gewichtung-sheet__eintrag:hover {
  background-color: var(--surface-muted);
}

.gewichtung-sheet__eintrag--aktiv,
.gewichtung-sheet__eintrag--aktiv:hover {
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
}

.gewichtung-sheet__texte {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.gewichtung-sheet__name {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  overflow-wrap: anywhere;
}

.gewichtung-sheet__sekundaer {
  color: var(--text-muted);
  font-size: var(--font-size-14);
  overflow-wrap: anywhere;
}

/* Eigene Gewichte (design-conventions.md „Eigene"). Das Reveal animiert die
   Zeilenhöhe über `grid-template-rows` (0fr -> 1fr), nicht über eine
   gemessene Höhe; `overflow: hidden` nur WÄHREND des Übergangs, sonst würde
   es den Fokusring der Regler an den Rändern abschneiden. Reduzierte
   Bewegung: die globale Regel in `base.css`. */
.gewicht-reveal {
  display: grid;
  grid-template-rows: 1fr;
}

.gewicht-reveal-enter-active,
.gewicht-reveal-leave-active {
  transition:
    grid-template-rows var(--duration-180) var(--ease-out),
    opacity var(--duration-180) var(--ease-out);
}

.gewicht-reveal-enter-active > .gewicht-eigene,
.gewicht-reveal-leave-active > .gewicht-eigene {
  overflow: hidden;
}

.gewicht-reveal-enter-from,
.gewicht-reveal-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.gewicht-eigene {
  min-height: 0;
  min-width: 0;
  /* ADR-0012: Container auf einem VORFAHREN der Zeilen, die ihn abfragen. */
  container-type: inline-size;
  padding: var(--space-8) var(--space-12) var(--space-4);
}

.gewicht-eigene__liste {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

/* Unter 400px Containerbreite: Name+Anteil und Zahlenfeld oben, der Regler
   darunter über die volle Breite. */
.gewicht-zeile {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px;
  grid-template-areas:
    'text zahl'
    'regler regler';
  align-items: center;
  column-gap: var(--space-8);
  row-gap: var(--space-4);
}

.gewicht-zeile__text {
  grid-area: text;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.gewicht-zeile__name {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  color: var(--text);
  overflow-wrap: anywhere;
}

.gewicht-zeile__anteil {
  color: var(--text-muted);
  font-size: var(--font-size-14);
  overflow-wrap: anywhere;
}

.gewicht-zeile__zahl {
  grid-area: zahl;
  width: 64px;
  min-width: 0;
  min-height: 44px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-16);
}

.gewicht-zeile__regler {
  grid-area: regler;
  min-width: 0;
}

/* Ab 400px einzeilig: Name 112px · Regler flex · Zahl 64px. */
@container (min-width: 400px) /* Containerbreite, kein Token (code-conventions.md) */ {
  .gewicht-zeile {
    grid-template-columns: 112px minmax(0, 1fr) 64px;
    grid-template-areas: 'text regler zahl';
    column-gap: var(--space-12);
  }
}

.gewicht-eigene__status {
  margin-top: var(--space-8);
  color: var(--text);
  font-size: var(--font-size-14);
  min-height: 0;
}
</style>

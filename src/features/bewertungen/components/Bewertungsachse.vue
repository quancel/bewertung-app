<script setup lang="ts">
/**
 * Eine Bewertungsachse in der Ortsdetailansicht: Zahleneingabe ist die
 * primäre, stets sichtbare Bedienung (initial leer, kein Default 0), der
 * Regler daneben ist das barrierefreie Pendant — bidirektional synchron
 * (design_notes PO-2026-09-07-002), Thumb in JEDEM Zustand sichtbar und
 * bedienbar (PO-2026-09-13-002): „nicht gesetzt"/„gesetzt" unterscheiden
 * sich über `accent-color`, nie über Sichtbarkeit (siehe `<style>` unten).
 * Rein präsentational, kennt keinen Store (code-conventions.md:
 * „components/ kennt keinen Store") — die View bindet über Emits an
 * `useOrteStore.aktualisiereAchse` (ADR-0008).
 *
 * Gültigkeit wird beim Eingeben hergestellt (ADR-0007 Punkt 7): erst runden,
 * dann klemmen — für JEDEN Eingabepfad, auch den Regler (PO-2026-09-13-001,
 * Entscheidung Architekt: `rundenUndKlemmen` gilt hier NICHT nur für die
 * Zahleneingabe). Ein geleertes Feld wird zu „nicht bewertet" (`null`) und
 * nicht geklemmt.
 *
 * Regler-Commit (PO-2026-09-13-001, Korrektur eines Fehlers, bei dem ein
 * `input`-Ereignis nur den lokalen Textzustand schrieb und nie emittierte):
 * Der Regler committet auf JEDES `input`-Ereignis (`aufReglerTippen`) — nicht
 * erst auf `change`. Zusätzlich committet eine ABGESCHLOSSENE Bedienung
 * (`pointerup`, Tastenbedienung mit Wertbezug) den aktuellen Elementwert,
 * solange `props.wert === null` ist (`aufReglerBedienung`): Steht der Regler
 * dabei bereits optisch auf 0 (`:value="wert ?? 0"`), ändert eine Bedienung,
 * die am unteren Anschlag bleibt (Tipp auf das linke Bahnende, Pfeil-runter/
 * Pos1 am Minimum), den nativen Wert NICHT — kein `input`-Ereignis, keine
 * andere Möglichkeit, eine GESETZTE 0 über den Regler zu vergeben. Weder
 * Rendern noch Fokussieren noch Scrollen darf einen Wert erzeugen (ADR-0007) —
 * deshalb hängt keiner der beiden Commit-Pfade an `focus`/`watch(props.wert)`.
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

// Committet auf JEDES `input`-Ereignis (design-conventions.md „Formulare"),
// nicht erst auf `change` — der bestehende Guard bleibt: ein Ziehen über den
// vollen Bereich erzeugt dadurch höchstens 11 Emits, nicht einen je
// Pointer-Bewegung. `rundenUndKlemmen` läuft auch hier (ADR-0007 Punkt 7) —
// die native Klemmung über `min`/`max`/`step` ist Browserverhalten über
// einen String, keine Eigenschaft des Datenmodells.
function aufReglerTippen(event: Event): void {
  const wert = rundenUndKlemmen(Number((event.target as HTMLInputElement).value))
  eingabe.value = String(wert)
  if (wert !== props.wert) emit('wert-geaendert', wert)
}

// Nur relevant, solange noch kein Wert gesetzt ist: Deckt den Fall ab, in
// dem eine abgeschlossene Bedienung den nativen Wert NICHT ändert (Bahn
// bereits optisch auf 0), also kein `input`-Ereignis auslöst und
// `aufReglerTippen` nie feuert. Ist bereits ein Wert gesetzt, hat jede
// Bedienung längst ein `input`-Ereignis ausgelöst — der Aufruf hier liefert
// dann denselben Wert erneut und wird durch den frühen Rücksprung
// unterdrückt, kein doppeltes Emit.
function aufReglerBedienung(event: Event): void {
  if (props.wert !== null) return
  const wert = rundenUndKlemmen(Number((event.target as HTMLInputElement).value))
  eingabe.value = String(wert)
  emit('wert-geaendert', wert)
}

const RELEVANTE_REGLER_TASTEN = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']

function aufReglerTasteLosgelassen(event: KeyboardEvent): void {
  if (!RELEVANTE_REGLER_TASTEN.includes(event.key)) return
  aufReglerBedienung(event)
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
        @pointerup="aufReglerBedienung"
        @keyup="aufReglerTasteLosgelassen"
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

/* Trefferflaeche 44x44px ueber vertikales Padding statt einer optisch
   dickeren Spur oder eines vergroesserten Thumbs (design-conventions.md
   "Werte mit Bereich, bei denen 0 gueltig ist" -> "Regler-Thumb"). Der
   Thumb bleibt dabei in JEDEM Zustand sichtbar und bedienbar (PO-2026-09-
   13-002) -- "nicht gesetzt" und "gesetzt" unterscheiden sich ausschliesslich
   ueber `accent-color`, nie ueber Sichtbarkeit. */
.bewertungsachse__regler {
  flex: 1;
  min-width: 0;
  padding: 14px 0;
  accent-color: var(--color-primary-600);
  transition: accent-color var(--duration-120) var(--ease-out);
}

/* Vorherige Fassung blendete den Thumb bei `null` per `opacity: 0` komplett
   aus -- dadurch war der Regler erst nach mehrfachem zufaelligen Antippen
   auffindbar (Nutzermeldung 2026-09-13). Jetzt uebernimmt `accent-color`
   die Unterscheidung: ungesetzt dieselbe neutrale Farbe wie jede andere
   fehlende Angabe (design-concept.md "Fehlende Daten sind neutral"),
   gesetzt (inkl. 0) der Primaerton (Basisregel oben). */
.bewertungsachse__regler--leer {
  accent-color: var(--text-muted);
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

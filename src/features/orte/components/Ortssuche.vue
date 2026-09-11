<script setup lang="ts">
/**
 * Ortssuche gegen Photon (ADR-0020, PO-2026-09-07-008): präsentational,
 * kennt keinen Store (ADR-0013 Punkt 3) — meldet einen übernommenen Treffer
 * ausschließlich per Emit. Eingebunden ausschließlich von
 * `features/orte/views/Ortebereich.vue`, oberhalb der Felder
 * Adresse/Breite/Länge; nur die View schreibt über `useOrteStore`.
 *
 * Kein Pflichtfeld, keine Validierung (design_notes). Vorschlagsliste unter
 * dem Feld, max. 6 Treffer, Pfeiltasten + Enter, Escape schließt — gleiches
 * Muster wie `features/tags/components/TagEingabe.vue`
 * (design-conventions.md „Vorschlagsliste (Autocomplete)").
 *
 * Netzabhängige Zustände (ADR-0021): Fehlt das Netz bereits beim Öffnen,
 * überstimmt das jeden Zwischenzustand der Suche — der Nutzer erlebt keinen
 * Fehlschlag, bevor er überhaupt getippt hat. Das Feld bleibt in jedem
 * Zustand fokussierbar, nie `disabled`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useNetzzustand } from '../../../shared/composables/useNetzzustand'
import { erstelleOrtssucheClient, type OrtssucheZustand, type Ortsvorschlag, type OrtsvorschlagWerte } from '../lib/geocoding'

const emit = defineEmits<{
  uebernommen: [werte: OrtsvorschlagWerte]
}>()

const { online } = useNetzzustand()

const eingabe = ref('')
const aktiverIndex = ref(-1)
// Escape schließt nur die Ergebnis-/Hinweisfläche (design-conventions.md),
// löscht aber nicht die Eingabe — bei erneutem Tippen erscheint sie wieder.
const unterdrueckt = ref(false)
const clientZustand = ref<OrtssucheZustand>({ status: 'inaktiv' })

const client = erstelleOrtssucheClient((zustand) => {
  clientZustand.value = zustand
})

onBeforeUnmount(() => client.zerstoere())

/** Fehlt das Netz bereits, überstimmt das jeden Client-Zustand — Vorab-
 * Hinweis ohne dass der Nutzer erst tippen und einen Fehlschlag erleben
 * muss (design_notes, ADR-0021 Punkt 2/4). `online.value === true` ist
 * dagegen keine Zusage; in dem Fall zählt ausschließlich das tatsächliche
 * Abrufergebnis aus `clientZustand`. */
const zustand = computed<OrtssucheZustand>(() => {
  if (unterdrueckt.value) return { status: 'inaktiv' }
  if (!online.value) return { status: 'kein_netz' }
  return clientZustand.value
})

const vorschlaege = computed<Ortsvorschlag[]>(() =>
  zustand.value.status === 'treffer' ? zustand.value.vorschlaege : [],
)

const HINWEISTEXT: Partial<Record<OrtssucheZustand['status'], string>> = {
  laedt: 'Suche läuft…',
  keine_treffer: 'Keine Treffer für diese Suche.',
  kein_netz: 'Keine Verbindung für die Suche. Adresse und Koordinaten lassen sich weiterhin von Hand eintragen.',
  fehler: "Suche gerade nicht möglich. Versuch's später erneut oder trag die Daten von Hand ein.",
}

const hinweistext = computed(() => HINWEISTEXT[zustand.value.status] ?? '')

function aufEingabe(event: Event): void {
  eingabe.value = (event.target as HTMLInputElement).value
  aktiverIndex.value = -1
  unterdrueckt.value = false
  client.sucheEingabe(eingabe.value)
}

function uebernehmen(vorschlag: Ortsvorschlag): void {
  emit('uebernommen', vorschlag.werte)
  // Feld bleibt stehen und bleibt für eine neue Suche nutzbar (design_notes)
  // — nur die Ergebnisfläche schließt, die Eingabe wird nicht gelöscht.
  unterdrueckt.value = true
  aktiverIndex.value = -1
}

function aufEnter(): void {
  const gewaehlt = aktiverIndex.value >= 0 ? vorschlaege.value[aktiverIndex.value] : undefined
  if (gewaehlt) uebernehmen(gewaehlt)
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
  unterdrueckt.value = true
  aktiverIndex.value = -1
}
</script>

<template>
  <div class="ortssuche">
    <label for="ortssuche-feld">Adresse oder Ort suchen</label>
    <div class="ortssuche__feldbereich">
      <input
        id="ortssuche-feld"
        type="text"
        class="ortssuche__feld"
        autocomplete="off"
        :value="eingabe"
        @input="aufEingabe"
        @keydown.enter.prevent="aufEnter"
        @keydown.down.prevent="aufPfeilRunter"
        @keydown.up.prevent="aufPfeilHoch"
        @keydown.esc="aufEscape"
      >

      <!-- Eine gemeinsame Fläche für Vorschläge, Ladezustand und die drei
           netzabhängigen Hinweistexte (design_notes: "dieselbe Stelle unter
           dem Feld") — nie zwei konkurrierende Flächen gleichzeitig. -->
      <div
        v-if="zustand.status !== 'inaktiv'"
        class="ortssuche__ergebnisse"
      >
        <template v-if="zustand.status === 'treffer'">
          <ul class="ortssuche__vorschlaege">
            <li
              v-for="(vorschlag, index) in vorschlaege"
              :key="vorschlag.werte.adresse"
            >
              <button
                type="button"
                class="ortssuche__vorschlag"
                :class="{ 'ortssuche__vorschlag--aktiv': index === aktiverIndex }"
                @mousedown.prevent="uebernehmen(vorschlag)"
              >
                {{ vorschlag.anzeige }}
              </button>
            </li>
          </ul>
          <p class="ortssuche__attribution">
            Kartendaten © <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener"
            >OpenStreetMap</a>-Mitwirkende, ODbL
          </p>
        </template>

        <p
          v-else
          class="ortssuche__hinweis"
        >
          {{ hinweistext }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ortssuche {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.ortssuche__feldbereich {
  position: relative;
}

.ortssuche__feld {
  width: 100%;
  min-height: 44px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-16);
}

.ortssuche__ergebnisse {
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

.ortssuche__vorschlaege {
  display: flex;
  flex-direction: column;
}

.ortssuche__vorschlag {
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

.ortssuche__vorschlag:hover,
.ortssuche__vorschlag--aktiv {
  background-color: var(--surface-muted);
}

.ortssuche__attribution {
  margin-top: var(--space-4);
  padding: var(--space-4) var(--space-12) 0;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: var(--font-size-12);
}

.ortssuche__attribution a {
  color: var(--text-muted);
}

/* Netzabhängige Aktion ohne Erfolg / Ladezustand (design-conventions.md):
   gemuteter Text, kein Icon, keine Warn-/Fehlerfarbe — in derselben Fläche
   wie die Vorschlagsliste (design_notes "dieselbe Stelle unter dem Feld"). */
.ortssuche__hinweis {
  padding: var(--space-8) var(--space-12);
  color: var(--text-muted);
  font-size: var(--font-size-14);
}
</style>

<script setup lang="ts">
/**
 * Ortssuche gegen Photon (ADR-0020, PO-2026-09-07-008): präsentational,
 * kennt keinen Store (ADR-0013 Punkt 3) — meldet einen übernommenen Treffer
 * ausschließlich per Emit. Eingebunden ausschließlich von
 * `features/orte/views/Ortebereich.vue`, oberhalb der Felder
 * Adresse/Breite/Länge; nur die View schreibt über `useOrteStore`.
 *
 * Kein Pflichtfeld, keine Validierung (design_notes). Vorschlagsliste unter
 * dem Feld, max. 6 Treffer, Pfeiltasten + Enter, Escape/Blur/Tap außerhalb
 * schließen — gleiches Muster wie `features/tags/components/TagEingabe.vue`
 * (design-conventions.md „Vorschlagsliste (Autocomplete)"), Blur/Tap
 * außerhalb über das gemeinsame Composable `useSchliesseBeiAussenaktion`
 * (ADR-0024).
 *
 * Netzabhängige Zustände (ADR-0021): Fehlt das Netz bereits beim Öffnen,
 * überstimmt das jeden Zwischenzustand der Suche — der Nutzer erlebt keinen
 * Fehlschlag, bevor er überhaupt getippt hat. Das Feld bleibt in jedem
 * Zustand fokussierbar, nie `disabled`.
 *
 * Korrektur (2026-09-12, Abnahmebefund PO-2026-09-12-003, Wiederkehr eines
 * am 2026-09-11 nur für „kein Netz" behobenen Befundes): Die vorherige
 * Fassung hatte NUR den Kein-Netz-Hinweis in den Dokumentfluss verschoben;
 * „lädt"/„keine Treffer"/„Fehler" lagen weiterhin in der überlagernden,
 * absolut positionierten `.ortssuche__ergebnisse`-Fläche und verdeckten dort
 * dauerhaft das Feld „Adresse" — der Fehlerzustand steht, bis erneut
 * getippt wird, und auf einem Touchgerät gibt es kein Escape (verletzt AC4
 * aus PO-2026-09-07-008). Jetzt gilt (design-conventions.md „Netzabhängige
 * Type-ahead-Aktion"):
 * - Die überlagernde Fläche bleibt AUSSCHLIESSLICH der Trefferliste
 *   vorbehalten — ein aktiv bedientes Auswahlmenü.
 * - Alle vier Hinweistexte (lädt/kein Netz/keine Treffer/Fehler) rendern in
 *   EINEM gemeinsamen Slot im Dokumentfluss, ein `v-if` auf dem Inhalt statt
 *   vier Geschwister an verschiedenen Stellen — ein Wechsel zwischen zwei
 *   Zuständen bewegt den Text nicht. „lädt" ist bewusst dabei, obwohl es nur
 *   Millisekunden steht: eine Ausnahme erzeugte beim Übergang lädt → Fehler
 *   einen Sprung zwischen Überlagerung und Fluss.
 * - `kein_netz` ist wieder ein regulärer Wert des wirksamen Zustands
 *   (`wirksamerZustand`) statt eines Sonderflags neben `inaktiv` — Grundlage
 *   für PO-2026-09-12-005, das diesen wirksamen Zustand nach außen meldet.
 * - Escape/Blur/Tap außerhalb schließen weiterhin nur die Trefferliste; der
 *   Kein-Netz-Hinweis ist kein Zwischenergebnis einer Suche, sondern eine
 *   fortbestehende Aussage und bleibt von `unterdrueckt` unabhängig.
 *
 * Zustand über die Komponentengrenze (2026-09-12, PO-2026-09-12-005,
 * ADR-0025 Punkt 1/2): Zusätzlich zum übernommenen Treffer meldet die
 * Komponente per Emit den WIRKSAMEN, tatsächlich angezeigten Zustand
 * (`wirksamerZustand.status`) — kein vorverdichteter Wahrheitswert
 * „erfolglos". `Ortebereich.vue` entscheidet daraus, ob der
 * Koordinaten-Notnagel einrastet; diese Komponente bleibt store- und
 * entscheidungsfrei. `immediate: true` meldet auch den Startzustand einer
 * frischen Instanz sofort — relevant, weil `Ortebereich.vue` diese
 * Komponente mit `:key="ortId"` einbindet (ADR-0025 Punkt 5) und beim
 * Ortswechsel eine neue Instanz entsteht.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useNetzzustand } from '../../../shared/composables/useNetzzustand'
import { useSchliesseBeiAussenaktion } from '../../../shared/composables/useSchliesseBeiAussenaktion'
import { erstelleOrtssucheClient, type OrtssucheZustand, type Ortsvorschlag, type OrtsvorschlagWerte } from '../lib/geocoding'

const emit = defineEmits<{
  uebernommen: [werte: OrtsvorschlagWerte]
  'zustand-geaendert': [status: OrtssucheZustand['status']]
}>()

const { online } = useNetzzustand()

const feldbereichRef = ref<HTMLElement | null>(null)
const eingabe = ref('')
const aktiverIndex = ref(-1)
// Escape/Blur/Tap außerhalb schließen nur die Trefferliste
// (design-conventions.md), löschen aber nicht die Eingabe — bei erneutem
// Tippen erscheint sie wieder.
const unterdrueckt = ref(false)
const clientZustand = ref<OrtssucheZustand>({ status: 'inaktiv' })

const client = erstelleOrtssucheClient((zustand) => {
  clientZustand.value = zustand
})

onBeforeUnmount(() => client.zerstoere())

/** Der wirksame, tatsächlich angezeigte Zustand (Korrektur PO-2026-09-12-003):
 * Fehlt das Netz, überstimmt das jeden Client-Zustand UND `unterdrueckt` —
 * ein Vorab-Hinweis ohne dass der Nutzer erst tippen und einen Fehlschlag
 * erleben muss (ADR-0021 Punkt 2/4), und eine fortbestehende Aussage, die
 * Escape/Blur nicht wegwischen. `online.value === true` ist dagegen keine
 * Zusage; in dem Fall zählt ausschließlich das tatsächliche Abrufergebnis
 * aus `clientZustand`, das `unterdrueckt` auf `inaktiv` zurückfallen lässt. */
const wirksamerZustand = computed<OrtssucheZustand>(() => {
  if (!online.value) return { status: 'kein_netz' }
  if (unterdrueckt.value) return { status: 'inaktiv' }
  return clientZustand.value
})

// ADR-0025 Punkt 1/2: der übliche Rückweg einer Komponente, derselbe wie
// beim übernommenen Treffer — meldet den WIRKSAMEN Zustand, nicht den rohen
// Client-Zustand. `immediate` deckt auch den Startzustand einer frischen,
// per `:key` gemounteten Instanz ab.
watch(
  wirksamerZustand,
  (zustand) => emit('zustand-geaendert', zustand.status),
  { immediate: true },
)

const vorschlaege = computed<Ortsvorschlag[]>(() =>
  wirksamerZustand.value.status === 'treffer' ? wirksamerZustand.value.vorschlaege : [],
)

/** Nur die Trefferliste ist die überlagernde Fläche und damit ein aktiv
 * bedientes Auswahlmenü, das Blur/Tap außerhalb schließen kann
 * (design-conventions.md). */
const trefferlisteOffen = computed(() => wirksamerZustand.value.status === 'treffer')

useSchliesseBeiAussenaktion(trefferlisteOffen, feldbereichRef, () => {
  unterdrueckt.value = true
  aktiverIndex.value = -1
})

const HINWEISTEXT: Partial<Record<OrtssucheZustand['status'], string>> = {
  laedt: 'Suche läuft…',
  keine_treffer: 'Keine Treffer für diese Suche.',
  kein_netz: 'Keine Verbindung für die Suche. Adresse und Koordinaten lassen sich weiterhin von Hand eintragen.',
  fehler: "Suche gerade nicht möglich. Versuch's später erneut oder trag die Daten von Hand ein.",
}

/** Gemeinsamer Hinweistext für alle vier nicht-überlagernden Zustände
 * (lädt/kein Netz/keine Treffer/Fehler) — leer für `treffer`/`inaktiv`, dann
 * zeigt genau dieser eine `v-if` im Template nichts. */
const hinweistext = computed(() => HINWEISTEXT[wirksamerZustand.value.status] ?? '')

function aufEingabe(event: Event): void {
  eingabe.value = (event.target as HTMLInputElement).value
  aktiverIndex.value = -1
  unterdrueckt.value = false
  client.sucheEingabe(eingabe.value)
}

function uebernehmen(vorschlag: Ortsvorschlag): void {
  emit('uebernommen', vorschlag.werte)
  // Feld bleibt stehen und bleibt für eine neue Suche nutzbar (design_notes)
  // — nur die Trefferliste schließt, die Eingabe wird nicht gelöscht.
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
    <div
      ref="feldbereichRef"
      class="ortssuche__feldbereich"
    >
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

      <!-- Ausschließlich die Trefferliste bleibt eine überlagernde,
           absolut positionierte Fläche (design-conventions.md, Korrektur
           PO-2026-09-12-003) — ein aktiv bedientes Auswahlmenü, das
           Escape/Blur/Tap außerhalb schließen. -->
      <div
        v-if="trefferlisteOffen"
        class="ortssuche__ergebnisse"
      >
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
      </div>
    </div>

    <!-- EIN gemeinsamer Slot im Dokumentfluss für alle vier Hinweistexte
         (lädt/kein Netz/keine Treffer/Fehler, Korrektur PO-2026-09-12-003)
         — schiebt nachfolgende Felder nach unten, statt sie zu verdecken.
         `v-if` auf dem Inhalt, nicht vier Geschwister an verschiedenen
         Stellen: ein Wechsel zwischen zwei Zuständen bewegt den Text nicht. -->
    <Transition name="ortssuche-hinweis">
      <p
        v-if="hinweistext"
        class="ortssuche__hinweis"
      >
        {{ hinweistext }}
      </p>
    </Transition>
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

/* Netzabhängige Type-ahead-Aktion (design-conventions.md): gemuteter Text,
   kein Icon, keine Warn-/Fehlerfarbe — jetzt im normalen Dokumentfluss
   unter dem Feldbereich statt in der überlagernden Trefferfläche
   (Korrektur PO-2026-09-12-003). Abstand kommt bereits vom `gap` des
   `.ortssuche`-Flex-Containers, kein `position`. */
.ortssuche__hinweis {
  padding: 0 var(--space-12);
  color: var(--text-muted);
  font-size: var(--font-size-14);
}

/* Ein-/Ausblenden 180ms ease-out/ease-in (design-concept.md „Motion",
   design-conventions.md); globale prefers-reduced-motion-Regel in
   base.css ersetzt die Bewegung durch ein nahezu unmittelbares Umschalten,
   statt sie ersatzlos zu streichen. */
.ortssuche-hinweis-enter-active {
  transition: opacity var(--duration-180) var(--ease-out);
}

.ortssuche-hinweis-leave-active {
  transition: opacity var(--duration-180) var(--ease-in);
}

.ortssuche-hinweis-enter-from,
.ortssuche-hinweis-leave-to {
  opacity: 0;
}
</style>

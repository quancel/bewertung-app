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
 *
 * Commit ohne Enter (PO-2026-09-26-001, ADR-0030, design-conventions.md
 * „Tag-Eingabe: Commit ohne Enter"): Enter, Klick auf einen Vorschlag, „Feld
 * verlassen" (`focusout` mit `relatedTarget`-Containment auf dem
 * Feldbereich, NICHT `@blur` am `<input>`) und die extern über
 * `defineExpose({ uebernimmOffeneEingabe })` abgeholte unbestätigte Eingabe
 * laufen alle durch denselben `commitTag`-Weg und enden im bestehenden Emit
 * `tag-hinzugefuegt` — kein zweites Emit, kein eigener Schreibweg. Verliert
 * das DOKUMENT selbst den Fokus (Tab-/App-/Fensterwechsel), committet
 * „Feld verlassen" NICHT (ADR-0030 Punkt 2): Diese drei externen Auslöser
 * (Route verlassen, `visibilitychange`→`hidden`, `pagehide`) erreichen die
 * Komponente ausschließlich über `uebernimmOffeneEingabe`, die View
 * orchestriert (`Ortebereich.vue`) — diese Komponente registriert dafür
 * KEINEN eigenen Listener auf `document`/`window` für einen Commit (ADR-0030
 * Punkt 4). Der `anlass`-Parameter steuert ausschließlich die
 * Rückkehr-Markierung unten, nie den Commit-Weg selbst (ADR-0030 Punkt 7).
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useSchliesseBeiAussenaktion } from '../../../shared/composables/useSchliesseBeiAussenaktion'
import { normalisiereTagSchluessel } from '../../../shared/lib/tagfilter'
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
  // Endet bei der nächsten Eingabe im Feld (design-conventions.md „Rückkehr
  // aus dem Hintergrund"): kein Timer, keine feste Anzeigedauer.
  rueckkehrMarkierungSchluessel.value = null
  rueckkehrMarkierungSichtbar.value = false
}

/** Einziger Commit-Weg (ADR-0030 Punkt 1): trimmt, leert das Feld, ist bei
 * getrimmt-leerem Wert ein No-op ohne Emit. Liefert den committeten
 * (getrimmten) Text zurück, oder `null` bei No-op — die Rückgabe braucht nur
 * `uebernimmOffeneEingabe` unten, um zu wissen, ob überhaupt etwas passiert
 * ist. */
function commitTag(tag: string): string | null {
  const bereinigt = tag.trim()
  eingabe.value = ''
  aktiverIndex.value = -1
  if (bereinigt === '') return null
  emit('tag-hinzugefuegt', bereinigt)
  return bereinigt
}

function aufEnter(): void {
  const gewaehlterVorschlag = aktiverIndex.value >= 0 ? vorschlaege.value[aktiverIndex.value] : undefined
  commitTag(gewaehlterVorschlag ?? eingabe.value)
}

/**
 * Vierter Auslöser „Feld verlassen" (design-conventions.md „Tag-Eingabe:
 * Commit ohne Enter", ADR-0030 Punkt 2): `focusout` auf dem Feldbereich
 * (Eingabe + Vorschlagsliste) mit `relatedTarget`-Containment — nicht
 * `@blur` am `<input>`, sonst committete bereits das Tabben in die eigene
 * Vorschlagsliste. Verliert das DOKUMENT selbst den Fokus (Tab-/App-/
 * Fensterwechsel), committet dieser Handler NICHT: Im Page Lifecycle kommt
 * `blur` vor `visibilitychange` — ein Commit hier würde das Feld beim
 * Tab-Wechsel bereits leeren und die Rückkehr-Markierung unerreichbar
 * machen (den Commit übernimmt in diesem Fall `visibilitychange`/`pagehide`
 * über `uebernimmOffeneEingabe`, orchestriert von der View). Erkennbar über
 * `document.hasFocus()`: Bleibt das Dokument fokussiert, ist `relatedTarget`
 * ein echtes Ziel innerhalb der Seite; verliert das Dokument den Fokus,
 * meldet `hasFocus()` an dieser Stelle bereits `false`.
 */
function aufFeldbereichVerlassen(event: FocusEvent): void {
  if (!document.hasFocus()) return
  const zielImFeldbereich =
    event.relatedTarget instanceof Node && (feldbereichRef.value?.contains(event.relatedTarget) ?? false)
  if (zielImFeldbereich) return
  commitTag(eingabe.value)
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

// --- Rückkehr-Markierung (design-conventions.md „Tag-Eingabe: Commit ohne
// Enter" -> „Rückkehr aus dem Hintergrund", ADR-0030 Punkt 7) --------------

/** Reiner Sitzungszustand dieser Instanz, nicht persistiert: der
 * normalisierte Schlüssel (`normalisiereTagSchluessel`) des zuletzt aus dem
 * Hintergrund automatisch übernommenen, an diesem Ort NEUEN Tags — `null`,
 * solange keiner. Die Zuordnung zur Pille läuft über diesen Schlüssel, nicht
 * über den rohen Text, weil die sichtbare Pille die kanonische Schreibweise
 * des Bestands trägt (ADR-0030 Punkt 7). */
const rueckkehrMarkierungSchluessel = ref<string | null>(null)
/** Getrennt vom Schlüssel oben: Die Komponente beobachtet die Rückkehr des
 * Dokuments (`visibilitychange`→`visible`) NUR für diese Darstellung, nie
 * für einen Commit (ADR-0030 Punkt 7) — der Fade-in soll erst beim
 * Sichtbarwerden des Tabs laufen, nicht schon während `uebernimmOffeneEingabe`
 * synchron im verborgenen Zustand aufgerufen wird. */
const rueckkehrMarkierungSichtbar = ref(false)

function aufDokumentSichtbarkeitswechsel(): void {
  if (document.visibilityState === 'visible' && rueckkehrMarkierungSchluessel.value !== null) {
    rueckkehrMarkierungSichtbar.value = true
  }
}

onMounted(() => document.addEventListener('visibilitychange', aufDokumentSichtbarkeitswechsel))
onBeforeUnmount(() => document.removeEventListener('visibilitychange', aufDokumentSichtbarkeitswechsel))

function istRueckkehrMarkiert(tag: string): boolean {
  return rueckkehrMarkierungSichtbar.value && normalisiereTagSchluessel(tag) === rueckkehrMarkierungSchluessel.value
}

/**
 * Einzige exponierte Methode (ADR-0030 Punkt 3, code-conventions.md
 * „Einzige Ausnahme vom ‚nur Emits raus'"): synchrone Übernahme des
 * unbestätigten Feldinhalts über denselben Commit-Weg wie Enter — endet im
 * bestehenden Emit `tag-hinzugefuegt`, kein zweites Emit, kein eigener
 * Schreibweg. Übernimmt immer den ROHEN getippten Text (`commitTag` selbst
 * ignoriert `aktiverIndex`), nie eine per Pfeiltaste nur markierte, aber
 * nicht bestätigte Vorschlagszeile. Leeres/Leerzeichen-Feld: No-op. Setzt
 * die Rückkehr-Markierung ausschließlich bei `anlass === 'hintergrund'` und
 * nur, wenn der Tag an diesem Ort tatsächlich NEU war (Prüfung gegen
 * `props.tags` VOR dem Commit, über den normalisierten Schlüssel).
 */
function uebernimmOffeneEingabe(anlass: 'hintergrund' | 'verlassen'): void {
  const bereinigt = eingabe.value.trim()
  if (bereinigt === '') return
  const schluessel = normalisiereTagSchluessel(bereinigt)
  const warNeuAmOrt = !props.tags.some((tag) => normalisiereTagSchluessel(tag) === schluessel)
  commitTag(bereinigt)
  if (anlass === 'hintergrund' && warNeuAmOrt) {
    rueckkehrMarkierungSchluessel.value = schluessel
    rueckkehrMarkierungSichtbar.value = false
  }
}

defineExpose({ uebernimmOffeneEingabe })
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
        :class="{ 'tag-eingabe__pill--uebernommen': istRueckkehrMarkiert(tag) }"
      >
        {{ tag }}<span
          v-if="istRueckkehrMarkiert(tag)"
          class="tag-eingabe__pill-zusatz"
        > · übernommen</span>
        <button
          type="button"
          class="tag-eingabe__entfernen"
          :aria-label="istRueckkehrMarkiert(tag) ? `${tag} (automatisch übernommen) entfernen` : `${tag} entfernen`"
          @click="emit('tag-entfernt', tag)"
        >
          <IconKreuz :size="14" />
        </button>
      </span>
    </div>

    <div
      ref="feldbereichRef"
      class="tag-eingabe__feldbereich"
      @focusout="aufFeldbereichVerlassen"
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
  transition:
    background-color var(--duration-180) var(--ease-out),
    color var(--duration-180) var(--ease-out),
    border-color var(--duration-180) var(--ease-out);
}

/* Rückkehr-Markierung (design-conventions.md „Tag-Eingabe: Commit ohne
   Enter" -> „Rückkehr aus dem Hintergrund", ADR-0030 Punkt 7): dieselbe
   Optik wie ein aktiver Filter-Tag ("Tag-Pills" oben) -- Farbe bleibt nicht
   alleiniger Bedeutungsträger, der Text-Zusatz „· übernommen" trägt die
   Information zusätzlich. Fade-in läuft über die `transition` oben, erst
   ausgelöst, sobald das Dokument wieder sichtbar ist (reine Darstellung,
   kein Commit, siehe Skript-Kommentar); reduzierte Bewegung ersetzt die
   Transition-Dauer projektweit (base.css). */
.tag-eingabe__pill--uebernommen {
  border-color: transparent;
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
}

.tag-eingabe__pill-zusatz {
  color: inherit;
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

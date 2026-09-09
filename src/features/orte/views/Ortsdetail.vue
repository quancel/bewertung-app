<script setup lang="ts">
/**
 * Ortsdetail (`/orte/:ortId`). Kein separater „Bearbeiten"-Modus: Alle
 * Felder sind direkt inline editierbar (design_notes PO-2026-09-07-001).
 * Schreibmodell nach ADR-0005: Autosave onBlur (Text) bzw. sofort bei
 * Wertänderung (Zahl) — plus Routenwechsel, `visibilitychange`, `pagehide`
 * über `useAutosaveBeimVerlassen`.
 */
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import IconPapierkorb from '../../../shared/ui/icons/IconPapierkorb.vue'
import { useAutosaveBeimVerlassen } from '../composables/useAutosaveBeimVerlassen'
import OrtLoeschenDialog from '../components/OrtLoeschenDialog.vue'
import { useOrteStore } from '../stores/orte.store'

const route = useRoute()
const router = useRouter()
const store = useOrteStore()

const ortId = computed(() => route.params.ortId as string)
const ort = computed(() => store.ortNachId(ortId.value))
const schreibfehler = computed(() => store.schreibfehlerFuer(ortId.value).value)
const loeschenOffen = ref(false)

onMounted(async () => {
  await store.sicherstellenGeladen()
  if (!store.ortNachId(ortId.value)) {
    await router.replace('/orte')
  }
})

function persistiereJetzt(): void {
  void store.persistiereOrt(ortId.value)
}

useAutosaveBeimVerlassen(persistiereJetzt)

onBeforeRouteLeave(() => {
  persistiereJetzt()
})

function aufBezeichnungEingabe(event: Event): void {
  const wert = (event.target as HTMLInputElement).value
  store.aktualisiereFeld(ortId.value, { bezeichnung: wert })
}

function aufAdresseEingabe(event: Event): void {
  const wert = (event.target as HTMLInputElement).value
  store.aktualisiereFeld(ortId.value, { adresse: wert === '' ? null : wert })
}

function parseZahlenfeld(wert: string): number | null {
  if (wert.trim() === '') return null
  const zahl = Number(wert)
  return Number.isFinite(zahl) ? zahl : null
}

function aufBreiteEingabe(event: Event): void {
  const wert = (event.target as HTMLInputElement).value
  store.aktualisiereFeld(ortId.value, { breite: parseZahlenfeld(wert) })
}

function aufLaengeEingabe(event: Event): void {
  const wert = (event.target as HTMLInputElement).value
  store.aktualisiereFeld(ortId.value, { laenge: parseZahlenfeld(wert) })
}

async function aufLoeschenBestaetigt(): Promise<void> {
  const erfolg = await store.loescheOrt(ortId.value)
  if (erfolg) {
    await router.push('/orte')
  } else {
    loeschenOffen.value = false
  }
}
</script>

<template>
  <main
    v-if="ort"
    class="ortsdetail"
  >
    <h1 class="ortsdetail__sr-titel">
      {{ ort.bezeichnung || 'Ort bearbeiten' }}
    </h1>

    <div class="ortsdetail__kopf">
      <button
        type="button"
        class="ortsdetail__loeschen"
        aria-label="Ort löschen"
        @click="loeschenOffen = true"
      >
        <IconPapierkorb />
      </button>
    </div>

    <div class="ortsdetail__feld">
      <label for="ortsdetail-bezeichnung">Bezeichnung</label>
      <input
        id="ortsdetail-bezeichnung"
        type="text"
        class="ortsdetail__eingabe"
        :class="{ 'ortsdetail__eingabe--leer': !ort.bezeichnung }"
        :value="ort.bezeichnung"
        placeholder="noch nichts eingetragen"
        @input="aufBezeichnungEingabe"
        @blur="persistiereJetzt"
      >
    </div>

    <div class="ortsdetail__feld">
      <label for="ortsdetail-adresse">Adresse</label>
      <input
        id="ortsdetail-adresse"
        type="text"
        class="ortsdetail__eingabe"
        :class="{ 'ortsdetail__eingabe--leer': !ort.adresse }"
        :value="ort.adresse ?? ''"
        placeholder="noch nichts eingetragen"
        @input="aufAdresseEingabe"
        @blur="persistiereJetzt"
      >
    </div>

    <div class="ortsdetail__koordinaten">
      <div class="ortsdetail__feld">
        <label for="ortsdetail-breite">Breite</label>
        <input
          id="ortsdetail-breite"
          type="number"
          step="any"
          class="ortsdetail__eingabe"
          :class="{ 'ortsdetail__eingabe--leer': ort.breite === null }"
          :value="ort.breite ?? ''"
          placeholder="noch nichts eingetragen"
          @input="aufBreiteEingabe"
          @change="persistiereJetzt"
        >
      </div>

      <div class="ortsdetail__feld">
        <label for="ortsdetail-laenge">Länge</label>
        <input
          id="ortsdetail-laenge"
          type="number"
          step="any"
          class="ortsdetail__eingabe"
          :class="{ 'ortsdetail__eingabe--leer': ort.laenge === null }"
          :value="ort.laenge ?? ''"
          placeholder="noch nichts eingetragen"
          @input="aufLaengeEingabe"
          @change="persistiereJetzt"
        >
      </div>
    </div>

    <p
      v-if="schreibfehler"
      class="ortsdetail__fehler"
      role="alert"
    >
      Speichern ist fehlgeschlagen<span v-if="schreibfehler === 'speicher_voll'">
        — der Gerätespeicher ist voll</span>. Bitte versuche es erneut.
    </p>

    <OrtLoeschenDialog
      :offen="loeschenOffen"
      :bezeichnung="ort.bezeichnung"
      @schliessen="loeschenOffen = false"
      @bestaetigen="aufLoeschenBestaetigt"
    />
  </main>
</template>

<style scoped>
.ortsdetail {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.ortsdetail__sr-titel {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.ortsdetail__kopf {
  display: flex;
  justify-content: flex-end;
}

.ortsdetail__loeschen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.ortsdetail__loeschen:hover {
  background-color: var(--surface-muted);
  color: var(--color-danger);
}

.ortsdetail__feld {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.ortsdetail__koordinaten {
  display: flex;
  gap: var(--space-16);
}

.ortsdetail__koordinaten .ortsdetail__feld {
  flex: 1;
}

.ortsdetail__eingabe {
  min-height: 44px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-16);
}

.ortsdetail__eingabe::placeholder {
  color: var(--text-muted);
}

.ortsdetail__eingabe--leer {
  background-color: var(--surface-muted);
  color: var(--text-muted);
}

.ortsdetail__fehler {
  color: var(--color-danger);
  font-size: var(--font-size-14);
}
</style>

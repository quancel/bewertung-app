<script setup lang="ts">
/**
 * Bildstreifen der Schnellansicht — der ZWEITE store-gebundene Export von
 * `medien` (ADR-0039 Punkt 6, erweitert ADR-0016 Punkt 10 von „genau einen" auf
 * genau zwei; neben `Bilderbereich.vue`). Die Bedingung bleibt dieselbe: er
 * fasst nur den eigenen Store (`useMedienStore`) an und importiert nichts aus
 * `features/orte/`. Ein dritter store-gebundener Export braucht wieder ein ADR.
 *
 * Nur lesend (design-conventions.md „Quick-Look-Sheet" -> „Bildstreifen"):
 * horizontal scrollend, Reihenfolge wie das Raster, jede Kachel ein Button
 * „Bild {n} von {m} vergrößern". Ein Tipp öffnet DIESELBE Bildvorschau wie das
 * Raster (`Bildvorschau.vue`, keine zweite Vorschau) mit Startindex, Blättern
 * über die Bilder dieses Ortes und dem Fokus-Rückgabeziel „Kachel des zuletzt
 * gezeigten Bildes". Ohne Bilder rendert der Streifen NICHTS — kein
 * Platzhalter, keine Lücke.
 *
 * Objekt-URLs: je Kachel in `Streifenkachel.vue` erzeugt und freigegeben
 * (ADR-0016 Punkt 11).
 */
import { computed, ref, watch } from 'vue'
import { useMedienStore } from '../stores/medien.store'
import Bildvorschau from './Bildvorschau.vue'
import Streifenkachel from './Streifenkachel.vue'

const props = defineProps<{
  ortId: string
  /** Bezeichnung des Ortes für den Alt-Text der Vorschau („Bild {n} von {m} von {Bezeichnung}"). */
  bezeichnung?: string
}>()

const store = useMedienStore()
const bilder = computed(() => store.bilderFuerOrt(props.ortId))
const vorschauStartIndex = ref<number | null>(null)
const wurzelRef = ref<HTMLElement | null>(null)

watch(
  () => props.ortId,
  async (ortId) => {
    // Beim Wechsel des Ortes gehört eine offene Vorschau dem alten Ort nicht mehr.
    vorschauStartIndex.value = null
    await store.sicherstellenGeladenFuerOrt(ortId)
  },
  { immediate: true },
)

/** Fokus-Rückgabeziel der Vorschau: die Kachel dieses Bildes im Streifen. */
function kachelFuerBild(bildId: string): HTMLElement | null {
  return wurzelRef.value?.querySelector<HTMLElement>(`[data-bild-id="${CSS.escape(bildId)}"]`) ?? null
}
</script>

<template>
  <div
    v-if="bilder.length > 0"
    ref="wurzelRef"
    class="bildstreifen"
  >
    <ul class="bildstreifen__liste">
      <li
        v-for="(bild, index) in bilder"
        :key="bild.id"
        class="bildstreifen__eintrag"
      >
        <Streifenkachel
          :bild="bild"
          :beschriftung="`Bild ${index + 1} von ${bilder.length} vergrößern`"
          @oeffnen="vorschauStartIndex = index"
        />
      </li>
    </ul>

    <Bildvorschau
      v-if="vorschauStartIndex !== null"
      :ort-id="ortId"
      :start-index="vorschauStartIndex"
      :bezeichnung="bezeichnung ?? ''"
      :rueckgabe-ziel="kachelFuerBild"
      @schliessen="vorschauStartIndex = null"
    />
  </div>
</template>

<style scoped>
.bildstreifen {
  min-width: 0;
}

/* Horizontal scrollender Streifen. Das Innen-Padding (4px) plus der gleich
   große negative Rand lassen den Fokusring der Kacheln (2px + 2px Versatz)
   innerhalb der Scrollfläche sichtbar, ohne die Kante des Inhalts zu
   verschieben. `overscroll-behavior: contain` hält die Geste im Streifen. */
.bildstreifen__liste {
  display: flex;
  gap: var(--space-8);
  margin: calc(var(--space-4) * -1);
  padding: var(--space-4);
  list-style: none;
  /* Nur horizontal: `overflow-y: hidden` macht den Streifen strukturell zu einem
     reinen Horizontal-Scroller (eine benannte Bedingung des Rauchtests,
     `pruefeUeberlauf`/`pruefeVerdeckung`: nicht sichtbarer Teil eines solchen
     Streifens ist kein Überlauf). */
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior: contain;
  scroll-snap-type: x proximity;
  scroll-padding-inline: var(--space-4);
}

.bildstreifen__eintrag {
  flex: none;
}
</style>

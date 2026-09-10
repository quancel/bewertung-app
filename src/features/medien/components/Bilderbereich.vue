<script setup lang="ts">
/**
 * Bilderbereich — der EINE Baustein, den `medien` nach außen exportiert
 * (ADR-0016 Punkt 10): fasst seinen eigenen Store (`useMedienStore`) an und
 * importiert nichts aus `features/orte/`. Genau deshalb darf
 * `Ortebereich.vue` (`orte`) ihn importieren, obwohl er einen Store anfasst
 * — ADR-0013 Punkt 3 schließt das nur für Komponenten aus, die den
 * `orte`-Store anfassen; hier entsteht kein Import-Zyklus. Alles darunter
 * (`Bilderraster.vue`, `Bildkachel.vue`, `SpeichermangelBanner.vue`,
 * `BildLoeschenDialog.vue`, `Ladeplatzhalter.vue`) bleibt store-frei.
 *
 * Breitenlogik (ADR-0012): setzt auf der eigenen Wurzel
 * `container-type: inline-size` — das Raster darunter formuliert seine
 * Spaltenzahl als `@container`. `min-width: 0` vorsorglich mit gesetzt
 * (ADR-0012 Punkt 4): Der umgebende `.ortsdetail__feld` ist Kind einer
 * Flex-Spalte und stretcht die Breite zwar per Default, ein
 * `min-width: 0` verhindert trotzdem zuverlässig, dass Rasterinhalt die
 * Breite auf Inhaltsgröße aufdrückt, statt umzubrechen.
 *
 * Verkleinerung/Speicherfehler je Datei einzeln (ADR-0016 Punkt 6, kein
 * Alles-oder-nichts über eine Mehrfachauswahl): `fuegeDateienHinzu` ruft
 * `store.fuegeBildHinzu` nacheinander je Datei auf, damit eine gescheiterte
 * Datei die übrigen nicht verhindert.
 */
import { ref, watch } from 'vue'
import { useMedienStore } from '../stores/medien.store'
import Bilderraster from './Bilderraster.vue'
import SpeichermangelBanner from './SpeichermangelBanner.vue'
import BildLoeschenDialog from './BildLoeschenDialog.vue'

const props = defineProps<{ ortId: string }>()

const store = useMedienStore()

const inArbeitAnzahl = ref(0)
const speichermangelSichtbar = ref(false)
// 'unbekannt' fasst hier auch 'speicher_nicht_verfuegbar' zusammen — beide
// sind kein Fall für den Speichermangel-Banner (design-conventions.md
// „Bilder": --color-warning ist ausschließlich für den vollen Speicher
// reserviert), sondern für die bestehende, ruhige „Fehler"-Konvention
// (design-conventions.md „Zustände" → „Fehler", gleiches Muster wie der
// Schreibfehler im Ortsdetail).
const allgemeinerFehler = ref(false)
const loeschenAngefragtId = ref<string | null>(null)

async function ladeBilderFuerAktuellenOrt(): Promise<void> {
  // Ephemere UI-Zustände gehören zum jeweils angezeigten Ort — beim Wechsel
  // (Ortebereich.vue hängt diese Komponente NICHT aus, siehe deren eigener
  // Modul-Kommentar zu `onBeforeRouteUpdate`) sollen weder ein
  // Speichermangel-Hinweis noch eine offene Löschbestätigung des
  // vorherigen Ortes stehen bleiben.
  speichermangelSichtbar.value = false
  allgemeinerFehler.value = false
  loeschenAngefragtId.value = null
  await store.sicherstellenGeladenFuerOrt(props.ortId)
}

watch(() => props.ortId, ladeBilderFuerAktuellenOrt, { immediate: true })

async function fuegeDateienHinzu(dateien: File[]): Promise<void> {
  for (const datei of dateien) {
    inArbeitAnzahl.value += 1
    try {
      const ergebnis = await store.fuegeBildHinzu(props.ortId, datei)
      if (ergebnis.status === 'fehlgeschlagen') {
        if (ergebnis.grund === 'speicher_voll') {
          speichermangelSichtbar.value = true
        } else {
          allgemeinerFehler.value = true
        }
      }
    } finally {
      inArbeitAnzahl.value -= 1
    }
  }
}

function aufSpeichermangelSchliessen(): void {
  speichermangelSichtbar.value = false
}

function aufLoeschenAngefragt(bildId: string): void {
  loeschenAngefragtId.value = bildId
}

async function aufLoeschenBestaetigt(): Promise<void> {
  const bildId = loeschenAngefragtId.value
  if (!bildId) return
  loeschenAngefragtId.value = null
  await store.entferneBild(props.ortId, bildId)
}
</script>

<template>
  <div class="bilderbereich">
    <SpeichermangelBanner
      v-if="speichermangelSichtbar"
      @schliessen="aufSpeichermangelSchliessen"
    />

    <p
      v-if="allgemeinerFehler"
      class="bilderbereich__fehler"
      role="alert"
    >
      Bild hinzufügen ist fehlgeschlagen. Bitte versuche es erneut.
    </p>

    <Bilderraster
      :bilder="store.bilderFuerOrt(ortId)"
      :in-arbeit-anzahl="inArbeitAnzahl"
      @dateien-ausgewaehlt="fuegeDateienHinzu"
      @bild-loeschen-angefragt="aufLoeschenAngefragt"
    />

    <BildLoeschenDialog
      :offen="loeschenAngefragtId !== null"
      @schliessen="loeschenAngefragtId = null"
      @bestaetigen="aufLoeschenBestaetigt"
    />
  </div>
</template>

<style scoped>
.bilderbereich {
  container-type: inline-size;
  min-width: 0;
}

.bilderbereich__fehler {
  margin-bottom: var(--space-16);
  color: var(--color-danger);
  font-size: var(--font-size-14);
}
</style>

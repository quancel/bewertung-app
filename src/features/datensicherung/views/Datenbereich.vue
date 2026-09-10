<script setup lang="ts">
/**
 * Datenbereich — die EINE Bereichsansicht für `/daten` (PO-2026-09-07-009,
 * ADR-0017 Punkt 10). Anders als `orte` einspaltig, kein `MasterDetail`
 * (ADR-0011): Export/Import sind zwei Aktionen, keine Detailansicht.
 *
 * Bindet `useOrteStore` NUR für zwei Zwecke an (code-conventions.md Punkt 3,
 * ADR-0017 Punkt 9 — die einzige neue, schmale Context-Beziehung): den
 * aktuellen Bestand als „leer/nicht leer" zu kennen (entscheidet, ob das
 * Ersetzen/Ergänzen-Sheet nötig ist) und nach einem erfolgreichen Import
 * `ladeNeu()`/`ladeAlleNeu()` aufzurufen. Kein Import von `datensicherung`
 * IN `orte`/`medien` — nur diese Richtung.
 *
 * Ladezustand (design-conventions.md „Zustände" → „Lädt"): unter 400 ms kein
 * sichtbarer Ladezustand — der auslösende Button selbst wechselt zu
 * Spinner + Kurztext, kein Vollflächen-Overlay. `zeigeExportSpinner`/
 * `zeigeImportSpinner` schalten erst nach 400 ms um; `exportLaeuft`/
 * `importLaeuft` sperren die Buttons sofort gegen Doppel-Tap.
 */
import { computed, onMounted, ref } from 'vue'
import PrimaerButton from '../../../shared/ui/PrimaerButton.vue'
import Toast from '../../../shared/ui/Toast.vue'
import { useOrteStore } from '../../orte/stores/orte.store'
import { useMedienStore } from '../../medien/stores/medien.store'
import { fuehreExportAus } from '../lib/export'
import { fuehreImportAus, type ImportErgebnis, type ImportModus } from '../lib/import'
import ImportEntscheidenSheet from '../components/ImportEntscheidenSheet.vue'

const orteStore = useOrteStore()
const medienStore = useMedienStore()

onMounted(async () => {
  await orteStore.sicherstellenGeladen()
})

// Nicht geladen zählt als „nicht leer" (konservativ): lieber einmal zu viel
// das Ersetzen/Ergänzen-Sheet zeigen als fälschlich ohne Rückfrage ersetzen.
const bestandLeer = computed(() => orteStore.istGeladen && orteStore.orte.length === 0)

// --- Export -----------------------------------------------------------

const exportLaeuft = ref(false)
const zeigeExportSpinner = ref(false)
const exportFehler = ref(false)
let exportSpinnerTimer: ReturnType<typeof setTimeout> | undefined

async function aufExportTap(): Promise<void> {
  if (exportLaeuft.value) return
  exportLaeuft.value = true
  exportFehler.value = false
  exportSpinnerTimer = setTimeout(() => {
    zeigeExportSpinner.value = true
  }, 400)

  const ergebnis = await fuehreExportAus()

  clearTimeout(exportSpinnerTimer)
  zeigeExportSpinner.value = false
  exportLaeuft.value = false

  if (ergebnis.status === 'heruntergeladen') {
    zeigeToast('Export heruntergeladen.')
  } else {
    exportFehler.value = true
  }
}

// --- Import -------------------------------------------------------------

const dateiInputRef = ref<HTMLInputElement | null>(null)
const sheetOffen = ref(false)
const ausgewaehlteDatei = ref<File | null>(null)

const importLaeuft = ref(false)
const zeigeImportSpinner = ref(false)
// Woher der aktuell laufende Import ausgelöst wurde — steuert, an welchem
// Button der Spinner (nach 400 ms) erscheint.
const importUrsprung = ref<'direkt' | 'sheet' | null>(null)
const modusInArbeit = ref<ImportModus | null>(null)
let importSpinnerTimer: ReturnType<typeof setTimeout> | undefined

type ImportFehlerZustand =
  | { art: 'beschaedigt' }
  | { art: 'zu_neu' }
  | { art: 'schreibfehler'; grund: 'speicher_voll' | 'unbekannt' }

const importFehler = ref<ImportFehlerZustand | null>(null)

const importFehlerText = computed(() => {
  const fehler = importFehler.value
  if (!fehler) return null
  if (fehler.art === 'beschaedigt') {
    return 'Diese Datei konnte nicht gelesen werden. Der bestehende Bestand wurde nicht verändert.'
  }
  if (fehler.art === 'zu_neu') {
    return 'Diese Datei stammt aus einer neueren Version der App und kann nicht importiert werden. Der bestehende Bestand wurde nicht verändert.'
  }
  return fehler.grund === 'speicher_voll'
    ? 'Import ist fehlgeschlagen — der Gerätespeicher ist voll. Der bestehende Bestand wurde nicht verändert.'
    : 'Import ist fehlgeschlagen. Der bestehende Bestand wurde nicht verändert.'
})

// „Andere Datei wählen" nur bei den beiden datei-bezogenen Ausgängen
// (design_notes) — ein Schreibfehler liegt nicht an der Datei.
const zeigeAndereDateiAktion = computed(
  () => importFehler.value?.art === 'beschaedigt' || importFehler.value?.art === 'zu_neu',
)

function oeffneDateiDialog(): void {
  importFehler.value = null
  dateiInputRef.value?.click()
}

async function aufDateiAusgewaehlt(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const datei = input.files?.[0] ?? null
  // Zurücksetzen, damit dieselbe Datei erneut auswählbar bleibt (gleiches
  // Muster wie Bilderraster.vue).
  input.value = ''
  if (!datei) return

  importFehler.value = null

  if (bestandLeer.value) {
    // Nichts zu entscheiden (design_notes): direkt importieren.
    await starteImport(datei, 'ersetzen', 'direkt')
    return
  }

  ausgewaehlteDatei.value = datei
  sheetOffen.value = true
}

async function aufModusGewaehlt(modus: ImportModus): Promise<void> {
  const datei = ausgewaehlteDatei.value
  if (!datei) return
  await starteImport(datei, modus, 'sheet')
  sheetOffen.value = false
  ausgewaehlteDatei.value = null
}

function aufSheetSchliessen(): void {
  // Während ein Import läuft, ist das Sheet nicht schließbar (siehe
  // ImportEntscheidenSheet.vue) — hier kommt das Schließen nur an, wenn
  // wirklich nichts läuft.
  if (modusInArbeit.value !== null) return
  sheetOffen.value = false
  ausgewaehlteDatei.value = null
}

async function starteImport(datei: File, modus: ImportModus, ursprung: 'direkt' | 'sheet'): Promise<void> {
  importLaeuft.value = true
  importUrsprung.value = ursprung
  modusInArbeit.value = modus
  importSpinnerTimer = setTimeout(() => {
    zeigeImportSpinner.value = true
  }, 400)

  const ergebnis = await fuehreImportAus(datei, modus)

  clearTimeout(importSpinnerTimer)
  zeigeImportSpinner.value = false
  importLaeuft.value = false
  importUrsprung.value = null
  modusInArbeit.value = null

  await werteImportErgebnisAus(ergebnis)
}

async function werteImportErgebnisAus(ergebnis: ImportErgebnis): Promise<void> {
  if (ergebnis.status === 'importiert') {
    // Ausdrückliches Neuladen (ADR-0017 Punkt 9) — nur diese Richtung, kein
    // Import von `datensicherung` in `orte`/`medien`.
    await orteStore.ladeNeu()
    medienStore.ladeAlleNeu()
    const anzahl = ergebnis.uebernommeneOrteAnzahl
    zeigeToast(`${anzahl} ${anzahl === 1 ? 'Ort' : 'Orte'} importiert.`)
    return
  }

  if (ergebnis.status === 'beschaedigt') {
    importFehler.value = { art: 'beschaedigt' }
    return
  }

  if (ergebnis.status === 'zu_neu') {
    importFehler.value = { art: 'zu_neu' }
    return
  }

  importFehler.value = {
    art: 'schreibfehler',
    grund: ergebnis.status === 'schreiben_fehlgeschlagen' ? ergebnis.grund : 'unbekannt',
  }
}

// --- Toast ----------------------------------------------------------------

const toastSichtbar = ref(false)
const toastText = ref('')

function zeigeToast(text: string): void {
  toastText.value = text
  toastSichtbar.value = true
}
</script>

<template>
  <div class="datenbereich">
    <h1 class="datenbereich__titel">
      Daten
    </h1>
    <p class="datenbereich__intro">
      Sichere den gesamten Bestand als eine Datei inklusive Bilder oder stelle ihn aus einer vorherigen Sicherung wieder her.
    </p>

    <div class="datenbereich__aktionen">
      <PrimaerButton
        type="button"
        :disabled="exportLaeuft"
        @click="aufExportTap"
      >
        <span
          v-if="zeigeExportSpinner"
          class="datenbereich__spinner-inhalt"
        >
          <span
            class="datenbereich__spinner"
            aria-hidden="true"
          />
          Wird vorbereitet…
        </span>
        <template v-else>
          Daten exportieren
        </template>
      </PrimaerButton>

      <PrimaerButton
        type="button"
        :disabled="importLaeuft"
        @click="oeffneDateiDialog"
      >
        <span
          v-if="zeigeImportSpinner && importUrsprung === 'direkt'"
          class="datenbereich__spinner-inhalt"
        >
          <span
            class="datenbereich__spinner"
            aria-hidden="true"
          />
          Wird importiert…
        </span>
        <template v-else>
          Daten importieren
        </template>
      </PrimaerButton>
    </div>

    <input
      ref="dateiInputRef"
      type="file"
      accept=".zip"
      class="datenbereich__datei-input"
      tabindex="-1"
      aria-hidden="true"
      @change="aufDateiAusgewaehlt"
    >

    <p
      v-if="exportFehler"
      class="datenbereich__fehler"
      role="alert"
    >
      Export ist fehlgeschlagen. Bitte versuche es erneut.
    </p>

    <div
      v-if="importFehlerText"
      class="datenbereich__fehler-block"
    >
      <p
        class="datenbereich__fehler"
        role="alert"
      >
        {{ importFehlerText }}
      </p>
      <PrimaerButton
        v-if="zeigeAndereDateiAktion"
        type="button"
        @click="oeffneDateiDialog"
      >
        Andere Datei wählen
      </PrimaerButton>
    </div>

    <ImportEntscheidenSheet
      :offen="sheetOffen"
      :gesperrt="modusInArbeit !== null"
      :aktiver-modus="zeigeImportSpinner && importUrsprung === 'sheet' ? modusInArbeit : null"
      @schliessen="aufSheetSchliessen"
      @ergaenzen="aufModusGewaehlt('ergaenzen')"
      @ersetzen="aufModusGewaehlt('ersetzen')"
    />

    <Toast
      v-if="toastSichtbar"
      :text="toastText"
      aktionsbeschriftung="Schließen"
      @klick="toastSichtbar = false"
    />
  </div>
</template>

<style scoped>
.datenbereich {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.datenbereich__titel {
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-semibold);
}

.datenbereich__intro {
  max-width: 480px;
  color: var(--text-muted);
  font-size: var(--font-size-16);
}

.datenbereich__aktionen {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  max-width: 320px;
}

.datenbereich__datei-input {
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

.datenbereich__fehler-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-12);
  max-width: 320px;
}

.datenbereich__fehler {
  color: var(--color-danger);
  font-size: var(--font-size-14);
}

.datenbereich__spinner-inhalt {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
}

.datenbereich__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgb(255 255 255 / 40%);
  border-top-color: var(--text-on-primary);
  border-radius: var(--radius-full);
  animation: datenbereich-drehen 720ms linear infinite;
}

@keyframes datenbereich-drehen {
  to {
    transform: rotate(360deg);
  }
}
</style>

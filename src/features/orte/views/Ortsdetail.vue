<script setup lang="ts">
/**
 * Ortsdetail (`/orte/:ortId`). Kein separater „Bearbeiten"-Modus: Alle
 * Felder sind direkt inline editierbar (design_notes PO-2026-09-07-001).
 * Schreibmodell nach ADR-0005: Autosave onBlur (Text) bzw. sofort bei
 * Wertänderung (Zahl) — plus Routenwechsel, `visibilitychange`, `pagehide`
 * über `useAutosaveBeimVerlassen`.
 *
 * Importiert `Bewertungsachse` (Context `bewertungen`) — erlaubt, weil sie
 * store-frei ist und diese View `useOrteStore` anbindet, nicht die
 * importierte Komponente selbst (ADR-0013). Achsenwert/-kommentar ändern
 * ausschließlich über `useOrteStore.aktualisiereAchse` (ADR-0008).
 *
 * Unbekannte Ort-ID (PO-2026-09-07-011, ADR-0010): KEIN Redirect mehr —
 * ein Redirect würde die Adresse austauschen und „gelöscht, dann
 * Browser-Zurück" in einen zweiten Ablauf zwingen. Stattdessen rendert
 * diese View an derselben Adresse `AdresseOhneZiel.vue` aus `shared/ui/`
 * (zweiter Nutzer neben der Sammelroute des Routers).
 *
 * Wurzelelement ist ein `<div>`, kein `<main>` (siehe Ortsliste.vue) — der
 * einzige `<main id="main-content">` liegt jetzt in `AppRahmen.vue`.
 */
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import IconPapierkorb from '../../../shared/ui/icons/IconPapierkorb.vue'
import IconArrowLeft from '../../../shared/ui/icons/IconArrowLeft.vue'
import AdresseOhneZiel from '../../../shared/ui/AdresseOhneZiel.vue'
import Bewertungsachse from '../../bewertungen/components/Bewertungsachse.vue'
import { berechneGesamtnote, formatiereGesamtnote, zaehleAusgefuellteAchsen } from '../../../shared/lib/gesamtnote'
import { useAutosaveBeimVerlassen } from '../composables/useAutosaveBeimVerlassen'
import OrtLoeschenDialog from '../components/OrtLoeschenDialog.vue'
import { useOrteStore, type AchsenName } from '../stores/orte.store'

const route = useRoute()
const router = useRouter()
const store = useOrteStore()

const ortId = computed(() => route.params.ortId as string)
const ort = computed(() => store.ortNachId(ortId.value))
// Erst nach dem Laden entscheidbar: solange `istGeladen` false ist, ist ein
// fehlender Ort noch kein „nicht vorhanden", sondern „noch nicht geprüft".
const unbekannt = computed(() => store.istGeladen && !ort.value)
const schreibfehler = computed(() => store.schreibfehlerFuer(ortId.value).value)
const loeschenOffen = ref(false)

/**
 * Löst denselben History-Schritt aus wie natives Browser-Zurück
 * (design-conventions.md, „Zurück-Aktion"). `history.state.back` ist von
 * `vue-router`s `createWebHistory` gesetzt und `null`, wenn diese Adresse
 * ohne vorherige App-History aufgerufen wurde (Deep-Link) — dann zur
 * frischen Listenansicht statt aus der App heraus.
 */
function aufZurueck(): void {
  const historyState = window.history.state as { back: string | null } | null
  if (historyState?.back) {
    router.back()
  } else {
    void router.push('/orte')
  }
}

const gesamtnote = computed(() => (ort.value ? berechneGesamtnote(ort.value.bewertungen) : null))
const ausgefuellteAchsen = computed(() =>
  ort.value ? zaehleAusgefuellteAchsen(ort.value.bewertungen) : 0,
)

function aufAchsenwertGeaendert(achse: AchsenName, wert: number | null): void {
  store.aktualisiereAchse(ortId.value, achse, { wert })
  persistiereJetzt()
}

function aufAchsenkommentarGeaendert(achse: AchsenName, kommentar: string | null): void {
  store.aktualisiereAchse(ortId.value, achse, { kommentar })
  persistiereJetzt()
}

onMounted(async () => {
  await store.sicherstellenGeladen()
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
  <AdresseOhneZiel v-if="unbekannt" />

  <div
    v-else-if="ort"
    class="ortsdetail"
  >
    <h1 class="ortsdetail__sr-titel">
      {{ ort.bezeichnung || 'Ort bearbeiten' }}
    </h1>

    <div class="ortsdetail__kopf">
      <button
        type="button"
        class="ortsdetail__zurueck"
        @click="aufZurueck"
      >
        <IconArrowLeft :size="20" />
        Zurück
      </button>

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

    <div class="ortsdetail__gesamtnote">
      <span
        v-if="gesamtnote === null"
        class="ortsdetail__gesamtnote-leer"
      >Noch nicht bewertet</span>
      <template v-else>
        <span class="ortsdetail__gesamtnote-wert">{{ formatiereGesamtnote(gesamtnote) }}</span>
        <span
          v-if="ausgefuellteAchsen < 4"
          class="ortsdetail__gesamtnote-zusatz"
        >Ø aus {{ ausgefuellteAchsen }} von 4 Achsen</span>
      </template>
    </div>

    <div class="ortsdetail__bewertungen">
      <Bewertungsachse
        achse-name="ambiente"
        label="Ambiente"
        :wert="ort.bewertungen.ambiente.wert"
        :kommentar="ort.bewertungen.ambiente.kommentar"
        @wert-geaendert="(wert) => aufAchsenwertGeaendert('ambiente', wert)"
        @kommentar-geaendert="(kommentar) => aufAchsenkommentarGeaendert('ambiente', kommentar)"
      />
      <Bewertungsachse
        achse-name="zeit"
        label="Zeit (Wartezeit)"
        kurzerklaerung="10 = keine spürbare Wartezeit"
        :wert="ort.bewertungen.zeit.wert"
        :kommentar="ort.bewertungen.zeit.kommentar"
        @wert-geaendert="(wert) => aufAchsenwertGeaendert('zeit', wert)"
        @kommentar-geaendert="(kommentar) => aufAchsenkommentarGeaendert('zeit', kommentar)"
      />
      <Bewertungsachse
        achse-name="geschmack"
        label="Geschmack"
        :wert="ort.bewertungen.geschmack.wert"
        :kommentar="ort.bewertungen.geschmack.kommentar"
        @wert-geaendert="(wert) => aufAchsenwertGeaendert('geschmack', wert)"
        @kommentar-geaendert="(kommentar) => aufAchsenkommentarGeaendert('geschmack', kommentar)"
      />
      <Bewertungsachse
        achse-name="preisLeistung"
        label="Preis/Leistung"
        :wert="ort.bewertungen.preisLeistung.wert"
        :kommentar="ort.bewertungen.preisLeistung.kommentar"
        @wert-geaendert="(wert) => aufAchsenwertGeaendert('preisLeistung', wert)"
        @kommentar-geaendert="(kommentar) => aufAchsenkommentarGeaendert('preisLeistung', kommentar)"
      />
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
  </div>
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
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 calc(var(--space-16) * -1);
  padding: var(--space-8) var(--space-16);
  background-color: var(--surface);
}

.ortsdetail__zurueck {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  min-height: 44px;
  padding: var(--space-8) var(--space-8) var(--space-8) 0;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
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

.ortsdetail__gesamtnote {
  display: flex;
  align-items: baseline;
  gap: var(--space-8);
}

.ortsdetail__gesamtnote-wert {
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-700);
}

.ortsdetail__gesamtnote-zusatz {
  font-size: var(--font-size-14);
  color: var(--text-muted);
}

.ortsdetail__gesamtnote-leer {
  font-size: var(--font-size-16);
  color: var(--text-muted);
}

.ortsdetail__bewertungen {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}
</style>

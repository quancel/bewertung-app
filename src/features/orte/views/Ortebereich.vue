<script setup lang="ts">
/**
 * Ortebereich — die EINE Bereichsansicht für `/orte` und `/orte/:ortId`
 * (ADR-0011, PO-2026-09-07-012). Bindet `useOrteStore` an, liest
 * `route.params.ortId` und entscheidet über `MasterDetail`, was zu sehen
 * ist: unterhalb `lg` Liste ODER Detail, ab `lg` Liste UND Detail
 * gleichzeitig. `route.params.ortId` ist die einzige Quelle der Auswahl —
 * kein zusätzlicher „ausgewählter Ort"-Zustand daneben (ADR-0011 Punkt 4).
 *
 * Ersetzt die bisher getrennten Views `Ortsliste.vue`/`Ortsdetail.vue`
 * (PO-2026-09-07-001/-011): Beide Routen zeigen jetzt auf diese Komponente,
 * `path`/`name` bleiben unverändert. Der Wechsel zwischen beiden Adressen
 * hängt dieselbe Komponente NICHT aus — deshalb `onBeforeRouteUpdate` statt
 * `onBeforeRouteLeave` für das Autosave beim Schließen/Wechseln der
 * Detailansicht (ADR-0005 Auslöser „Route verlassen"): Ein Wechsel
 * `/orte/:a` -> `/orte` oder `/orte/:a` -> `/orte/:b` ist auf derselben
 * Komponente ein Update, kein Leave. `onBeforeRouteLeave` bleibt zusätzlich
 * für den Fall, dass die App den Bereich Orte tatsächlich verlässt (z. B.
 * künftig Richtung eines anderen Bereichs).
 *
 * Bestand leer (PO-2026-09-07-001) und keine Detailansicht offen: kein
 * Master-Detail-Split, der Leerzustand aus -001 bleibt die einzige Aussage
 * (PO-2026-09-07-012, Kriterium) — eine schmale Listen-Spalte neben einer
 * leeren zweiten Spalte wäre eine zweite, überflüssige Aussage.
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import PrimaerButton from '../../../shared/ui/PrimaerButton.vue'
import MasterDetail from '../../../shared/ui/MasterDetail.vue'
import AdresseOhneZiel from '../../../shared/ui/AdresseOhneZiel.vue'
import IconPlus from '../../../shared/ui/icons/IconPlus.vue'
import IconArrowLeft from '../../../shared/ui/icons/IconArrowLeft.vue'
import IconKreuz from '../../../shared/ui/icons/IconKreuz.vue'
import IconPapierkorb from '../../../shared/ui/icons/IconPapierkorb.vue'
import Bewertungsachse from '../../bewertungen/components/Bewertungsachse.vue'
import { berechneGesamtnote, formatiereGesamtnote, zaehleAusgefuellteAchsen } from '../../../shared/lib/gesamtnote'
import { useAutosaveBeimVerlassen } from '../composables/useAutosaveBeimVerlassen'
import OrtAnlegenSheet from '../components/OrtAnlegenSheet.vue'
import OrtLoeschenDialog from '../components/OrtLoeschenDialog.vue'
import Ortszeile from '../components/Ortszeile.vue'
import { useOrteStore, type AchsenName } from '../stores/orte.store'

const route = useRoute()
const router = useRouter()
const store = useOrteStore()

const sheetOffen = ref(false)
const loeschenOffen = ref(false)

// Einzige Quelle der Auswahl (ADR-0011 Punkt 4): `null` auf `/orte`, sonst
// die Ort-ID aus der Adresse — unabhängig davon, ob sie sich auflöst.
const ortId = computed(() => (route.name === 'ort-detail' ? (route.params.ortId as string) : null))
const detailOffen = computed(() => ortId.value !== null)
const ort = computed(() => (ortId.value ? store.ortNachId(ortId.value) : undefined))
// Erst nach dem Laden entscheidbar: solange `istGeladen` false ist, ist ein
// fehlender Ort noch kein „nicht vorhanden", sondern „noch nicht geprüft".
const unbekannt = computed(() => detailOffen.value && store.istGeladen && !ort.value)
const schreibfehler = computed(() => (ortId.value ? store.schreibfehlerFuer(ortId.value).value : null))

const bestandLeer = computed(() => store.istGeladen && store.orte.length === 0)
// Kriterium PO-2026-09-07-012: kein Master-Detail-Split neben dem
// bestehenden Leerzustand aus -001.
const zeigeNurLeerzustand = computed(() => !detailOffen.value && bestandLeer.value)

const gesamtnote = computed(() => (ort.value ? berechneGesamtnote(ort.value.bewertungen) : null))
const ausgefuellteAchsen = computed(() =>
  ort.value ? zaehleAusgefuellteAchsen(ort.value.bewertungen) : 0,
)

onMounted(async () => {
  await store.sicherstellenGeladen()
  // Direkter Aufruf einer Detailadresse ab lg: Fokus + Listenposition wie
  // bei jedem anderen Öffnen (design_notes PO-2026-09-07-012).
  if (ortId.value) {
    await nextTick()
    fokussiereDetailNachOeffnen()
    scrolleZeileInSicht(ortId.value)
  }
})

// --- Fokusführung + Listen-Scrollposition zwischen den Spalten (ab lg,
// design-conventions.md „Master-Detail (ab lg)" -> „Fokus") ---------------

const zeilenRefs = new Map<string, HTMLElement>()
function setZeilenRef(id: string, el: Element | null): void {
  if (el) zeilenRefs.set(id, el as HTMLElement)
  else zeilenRefs.delete(id)
}

const schliessenButtonRef = ref<HTMLButtonElement | null>(null)
const leerZustandRef = ref<HTMLElement | null>(null)
// Von `aufLoeschenBestaetigt` gesetzt, damit die Fokusrückgabe nach dem
// Löschen die Zeile an der NEUEN Position des gelöschten Eintrags trifft
// (design_notes PO-2026-09-07-012), nicht die alte ID, die es nicht mehr gibt.
const geloeschtVorherigerIndex = ref<number | null>(null)

/** Ab lg sichtbar (nicht per `display: none` durch MasterDetail
 * ausgeblendet) — unterhalb lg sind Fokus-/Scroll-Ziele der jeweils
 * anderen Spalte nicht im sichtbaren Layout vorhanden. */
function istSichtbar(el: HTMLElement | null | undefined): el is HTMLElement {
  return !!el && el.offsetParent !== null
}

function scrolleZeileInSicht(id: string): void {
  const zeile = zeilenRefs.get(id)
  if (istSichtbar(zeile)) {
    // Kein `behavior: 'smooth'` — „ohne Animation gerade so weit, dass die
    // gewählte Zeile sichtbar wird".
    zeile.scrollIntoView({ block: 'nearest' })
  }
}

function fokussiereDetailNachOeffnen(): void {
  if (istSichtbar(schliessenButtonRef.value)) {
    schliessenButtonRef.value?.focus()
  }
}

function fokussiereListeNachSchliessen(vorherigeId: string): void {
  if (geloeschtVorherigerIndex.value !== null) {
    const index = geloeschtVorherigerIndex.value
    geloeschtVorherigerIndex.value = null
    if (zeigeNurLeerzustand.value) {
      leerZustandRef.value?.focus()
      return
    }
    const ersatzOrt = store.orte[Math.min(index, store.orte.length - 1)]
    if (ersatzOrt) {
      zeilenRefs.get(ersatzOrt.id)?.querySelector('a')?.focus()
    }
    return
  }
  zeilenRefs.get(vorherigeId)?.querySelector('a')?.focus()
}

watch(ortId, async (neu, alt) => {
  await nextTick()
  if (neu && !alt) {
    fokussiereDetailNachOeffnen()
    scrolleZeileInSicht(neu)
  } else if (!neu && alt) {
    fokussiereListeNachSchliessen(alt)
  }
})

// --- Anlegen ---------------------------------------------------------------

async function aufAnlegen(bezeichnung: string): Promise<void> {
  const neuerOrt = await store.legeOrtAn(bezeichnung)
  sheetOffen.value = false
  await router.push(`/orte/${neuerOrt.id}`)
}

// --- Schließen/Zurück (dieselbe Aktion, zwei Darstellungen — design-
// conventions.md „Master-Detail (ab lg)" -> „Schließen ab lg") -------------

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

// --- Persistenz (ADR-0005) ---------------------------------------------

function persistiereJetzt(): void {
  if (!ortId.value) return
  void store.persistiereOrt(ortId.value)
}

useAutosaveBeimVerlassen(persistiereJetzt)

// „Route verlassen": Wechsel zwischen `/orte` und `/orte/:ortId` bleibt auf
// dieser Komponente ein Update, kein Leave (siehe Modul-Kommentar oben) —
// deshalb hier statt in `onBeforeRouteLeave` persistiert, und zwar die
// VORHERIGE ID aus `from`, nicht die reaktive `ortId` (die zu diesem
// Zeitpunkt schon den neuen Wert tragen kann).
onBeforeRouteUpdate((_to, from) => {
  const vorherigeId = typeof from.params.ortId === 'string' ? from.params.ortId : null
  if (vorherigeId) {
    void store.persistiereOrt(vorherigeId)
  }
})

onBeforeRouteLeave(() => {
  persistiereJetzt()
})

function aufBezeichnungEingabe(event: Event): void {
  const wert = (event.target as HTMLInputElement).value
  if (ortId.value) store.aktualisiereFeld(ortId.value, { bezeichnung: wert })
}

function aufAdresseEingabe(event: Event): void {
  const wert = (event.target as HTMLInputElement).value
  if (ortId.value) store.aktualisiereFeld(ortId.value, { adresse: wert === '' ? null : wert })
}

function parseZahlenfeld(wert: string): number | null {
  if (wert.trim() === '') return null
  const zahl = Number(wert)
  return Number.isFinite(zahl) ? zahl : null
}

function aufBreiteEingabe(event: Event): void {
  const wert = (event.target as HTMLInputElement).value
  if (ortId.value) store.aktualisiereFeld(ortId.value, { breite: parseZahlenfeld(wert) })
}

function aufLaengeEingabe(event: Event): void {
  const wert = (event.target as HTMLInputElement).value
  if (ortId.value) store.aktualisiereFeld(ortId.value, { laenge: parseZahlenfeld(wert) })
}

function aufAchsenwertGeaendert(achse: AchsenName, wert: number | null): void {
  if (!ortId.value) return
  store.aktualisiereAchse(ortId.value, achse, { wert })
  persistiereJetzt()
}

function aufAchsenkommentarGeaendert(achse: AchsenName, kommentar: string | null): void {
  if (!ortId.value) return
  store.aktualisiereAchse(ortId.value, achse, { kommentar })
  persistiereJetzt()
}

async function aufLoeschenBestaetigt(): Promise<void> {
  const id = ortId.value
  if (!id) return
  const vorherigerIndex = store.orte.findIndex((eintrag) => eintrag.id === id)
  const erfolg = await store.loescheOrt(id)
  if (erfolg) {
    geloeschtVorherigerIndex.value = vorherigerIndex
    await router.push('/orte')
  } else {
    loeschenOffen.value = false
  }
}
</script>

<template>
  <template v-if="store.istGeladen">
    <div
      v-if="zeigeNurLeerzustand"
      ref="leerZustandRef"
      class="ortebereich__leer"
      tabindex="-1"
    >
      <h1 class="ortebereich__sr-titel">
        Orte
      </h1>
      <p class="ortebereich__leer-text">
        Noch keine Orte eingetragen
      </p>
      <PrimaerButton
        type="button"
        @click="sheetOffen = true"
      >
        Ort hinzufügen
      </PrimaerButton>
    </div>

    <MasterDetail
      v-else
      :detail-offen="detailOffen"
    >
      <template #liste>
        <div class="ortebereich__liste-spalte">
          <div class="ortebereich__kopf">
            <h1 class="ortebereich__kopf-titel">
              Orte
            </h1>
            <PrimaerButton
              type="button"
              @click="sheetOffen = true"
            >
              <IconPlus :size="20" />
              Ort hinzufügen
            </PrimaerButton>
          </div>

          <ul class="ortebereich__liste">
            <li
              v-for="ortEintrag in store.orte"
              :key="ortEintrag.id"
              :ref="(el) => setZeilenRef(ortEintrag.id, el as Element | null)"
            >
              <Ortszeile
                :ort="ortEintrag"
                :ausgewaehlt="ortEintrag.id === ortId"
              />
            </li>
          </ul>
        </div>
      </template>

      <template #detail>
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
              ref="schliessenButtonRef"
              type="button"
              class="ortsdetail__schliessen"
              aria-label="Detailansicht schließen"
              @click="aufZurueck"
            >
              <IconKreuz :size="20" />
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

        <p
          v-else
          class="ortebereich__keine-auswahl"
        >
          Wähle einen Ort aus der Liste, um Details zu sehen.
        </p>
      </template>
    </MasterDetail>

    <OrtAnlegenSheet
      :offen="sheetOffen"
      @schliessen="sheetOffen = false"
      @anlegen="aufAnlegen"
    />
  </template>
</template>

<style scoped>
.ortebereich__sr-titel {
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

.ortebereich__leer {
  max-width: var(--container-max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-16);
  padding: var(--space-64) var(--space-16);
  text-align: center;
}

.ortebereich__leer-text {
  color: var(--text);
  font-size: var(--font-size-16);
}

.ortebereich__liste-spalte {
  padding: var(--space-16);
}

.ortebereich__kopf {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  margin-bottom: var(--space-16);
}

.ortebereich__kopf-titel {
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-semibold);
}

.ortebereich__liste {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ortebereich__keine-auswahl {
  padding: var(--space-64) var(--space-16);
  color: var(--text-muted);
  font-size: var(--font-size-16);
  text-align: center;
}

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

/* Ab lg ersetzt das Icon-only-Schließen die „Zurück"-Aktion an derselben
   Stelle — die Liste bleibt daneben sichtbar (design-conventions.md
   „Master-Detail (ab lg)" -> „Schließen ab lg"). */
.ortsdetail__schliessen {
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.ortsdetail__schliessen:hover {
  background-color: var(--surface-muted);
}

@media (min-width: 1024px) {
  .ortsdetail__zurueck {
    display: none;
  }

  .ortsdetail__schliessen {
    display: inline-flex;
  }
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

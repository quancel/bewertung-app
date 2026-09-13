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
 *
 * Sortierung (PO-2026-09-07-003, ADR-0009): `Werkzeugleiste.vue` ist
 * präsentational und ändert nichts selbst — diese View verbindet ihre Emits
 * mit `useOrteStore.setzeSortierKriterium`/`schalteSortierrichtungUm` und
 * rendert `store.sortierErgebnis` (die Partition „mit Wert"/„ohne Wert" aus
 * `shared/lib/sortierung.ts`) statt des rohen `store.orte`. Die
 * Fokusrückgabe nach dem Löschen (siehe unten) bezieht sich deshalb auf
 * `angezeigteOrteSortiert`, die tatsächlich sichtbare Reihenfolge, nicht auf
 * die Einfügereihenfolge in `store.orte`.
 *
 * Bilder (PO-2026-09-07-005, ADR-0016 Punkt 10): `Bilderbereich.vue`
 * (`medien`) ist die einzige Ausnahme, unter der diese View einen Baustein
 * importiert, der SEINEN EIGENEN Store anfasst — erlaubt, weil `medien`
 * nichts aus `features/orte/` importiert (ADR-0016 Punkt 9) und dadurch kein
 * Import-Zyklus entsteht, der einzige Grund, aus dem ADR-0013 Punkt 3 das
 * sonst ausschließt. Kein `persistiereOrt`-Aufruf dafür nötig: Bilder liegen
 * im eigenen Object Store, nicht im Ort-Datensatz (ADR-0016 Punkt 1).
 *
 * Kartenansicht (PO-2026-09-07-006, ADR-0019): vierter Zweig neben Leer /
 * gefiltert-leer / Master-Detail — kein neuer Routen-Eintrag, die Ansicht
 * ist ausschließlich aus `route.query.ansicht` abgeleitet
 * (`../lib/ansichtAusAdresse.ts`, ADR-0019 Punkt 7: kein zweiter
 * Ansichtszustand). `Kartenflaeche.vue` (`karte`) wird ASYNCHRON eingebunden
 * (`defineAsyncComponent`) — `/orte` ist die Startroute, ein statischer
 * Import legte Leaflet ins Einstiegs-Bundle (ADR-0018 Punkt 6/ADR-0019
 * Punkt 12). Gezeichnet wird `store.orteGefiltert`, eingeschränkt auf Orte
 * mit beiden Koordinaten (`../../karte/lib/koordinatenFilter.ts`,
 * ADR-0019 Punkt 9) — die Sortierung bleibt dabei unausgewertet. Marker-Klick
 * navigiert wie ein Listeneintrag auf `ort-detail`; Umschalten Liste↔Karte
 * ist `router.push` (nie `replace`, ADR-0019 Punkt 6), ausgelöst über das
 * `ansicht-umschalten`-Emit von `Werkzeugleiste.vue` (die selbst store- und
 * routerfrei bleibt, Constraint UMSCHALTER).
 */
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
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
import Ortssuche from '../components/Ortssuche.vue'
import Ortszeile from '../components/Ortszeile.vue'
import Werkzeugleiste from '../components/Werkzeugleiste.vue'
import TagFilterleiste from '../../tags/components/TagFilterleiste.vue'
import TagEingabe from '../../tags/components/TagEingabe.vue'
import Bilderbereich from '../../medien/components/Bilderbereich.vue'
import type { OrtsvorschlagWerte } from '../lib/geocoding'
import { SORTIER_KRITERIUM_LABEL, type SortierKriterium, type TagVerknuepfung } from '../model/ansicht'
import { leiteAnsichtAusAdresse } from '../lib/ansichtAusAdresse'
import { filtereOrteMitKoordinaten } from '../../karte/lib/koordinatenFilter'
import { bestimmeKartenLeerzustand } from '../../karte/lib/leerzustand'
import { useOrteStore, type AchsenName } from '../stores/orte.store'

// Asynchron (ADR-0018 Punkt 6/ADR-0019 Punkt 12): siehe Modul-Kommentar oben.
const Kartenflaeche = defineAsyncComponent(() => import('../../karte/components/Kartenflaeche.vue'))

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

// Sortierte Anzeigereihenfolge, so wie sie im <ul> unten gerendert wird
// (mitWert gefolgt von der Gruppe „ohne Wert", ADR-0009) — Grundlage für die
// Fokusrückgabe nach dem Löschen (design-conventions.md „Master-Detail
// (ab lg)" -> „Fokus"): „die an ihrer Position nachrückende Zeile" bezieht
// sich auf die sichtbare, sortierte Position, nicht auf `store.orte`.
const angezeigteOrteSortiert = computed(() => [
  ...store.sortierErgebnis.mitWert,
  ...store.sortierErgebnis.ohneWert,
])

const bestandLeer = computed(() => store.istGeladen && store.orte.length === 0)
// Kriterium PO-2026-09-07-012: kein Master-Detail-Split neben dem
// bestehenden Leerzustand aus -001.
const zeigeNurLeerzustand = computed(() => !detailOffen.value && bestandLeer.value)

// --- Tag-Filter (PO-2026-09-07-004, ADR-0014) -----------------------------

/** Bestand nicht leer, aber die aktive Tag-Auswahl liefert null Treffer —
 * unterscheidet sich von `bestandLeer` (kein Datensatz überhaupt). */
const keineTreffer = computed(() => store.istGeladen && store.orte.length > 0 && store.orteGefiltert.length === 0)
// Analog zu `zeigeNurLeerzustand` (design_notes PO-2026-09-07-004,
// „überspringt den Master-Detail-Split analog zum leeren Bestand"): keine
// leere zweite Spalte neben der Null-Treffer-Meldung, solange kein Ort
// ausgewählt ist. Ist ein Ort ausgewählt, bleibt die Detailspalte offen und
// die Meldung erscheint stattdessen anstelle der (leeren) Liste, siehe
// Template unten.
const zeigeNurGefiltertLeer = computed(() => !detailOffen.value && keineTreffer.value)

// --- Kartenansicht (PO-2026-09-07-006, ADR-0019) --------------------------

/** Ausschließlich aus der Adresse abgeleitet (ADR-0019 Punkt 7) — kein Flag
 * im Store, keine Anzeigeeinstellung. Auf der Detailadresse (`ortId` gesetzt)
 * liefert `route.name !== 'orte'`, die Funktion also immer `'liste'`
 * (ADR-0019 Punkt 2: der Parameter hat dort keine Bedeutung). */
const ansicht = computed(() => leiteAnsichtAusAdresse(route.name, route.query.ansicht))

/** Gezeichnet wird `orteGefiltert`, eingeschränkt auf Orte mit beiden
 * Koordinaten (ADR-0019 Punkt 9) — die Sortierung bleibt unausgewertet. */
const kartenOrte = computed(() => filtereOrteMitKoordinaten(store.orteGefiltert))

/** Dritter Kartenzustand (ADR-0019 Punkt 10c): Filter lässt Orte übrig, aber
 * keiner davon hat Koordinaten. Nur relevant, wenn weder `bestandLeer` noch
 * `keineTreffer` bereits einen der beiden vorgelagerten Zustände zeigen. */
const kartenLeerzustand = computed(() =>
  bestimmeKartenLeerzustand(store.orteGefiltert.length, kartenOrte.value.length),
)

// Kein Master-Detail-Split in der Kartenansicht (ADR-0019 Punkt 5) — die
// Kartenansicht existiert ausschließlich ohne offene Detailansicht
// (ADR-0019 Punkt 6) und tritt hinter den beiden vorgelagerten Leerzuständen
// zurück (die sind ansichtsunabhängig, design-conventions.md „Karte").
const zeigeKartenbereich = computed(
  () => !detailOffen.value && ansicht.value === 'karte' && !bestandLeer.value && !keineTreffer.value,
)

/** Umschalten ist IMMER `push`, nie `replace` (ADR-0019 Punkt 6) — Browser-
 * Zurück muss den Wechsel rückgängig machen können. */
function wechsleZuListe(): void {
  void router.push('/orte')
}

function wechsleZuKarte(): void {
  void router.push('/orte?ansicht=karte')
}

function aufAnsichtUmgeschaltet(): void {
  if (ansicht.value === 'karte') wechsleZuListe()
  else wechsleZuKarte()
}

/** Marker-Klick = push auf die Detailadresse (ADR-0019 Punkt 6) — dieselbe
 * Navigation wie ein Klick auf eine Listenzeile. */
function aufMarkerAusgewaehlt(gewaehlteOrtId: string): void {
  void router.push({ name: 'ort-detail', params: { ortId: gewaehlteOrtId } })
}

function formatiereTagAufzaehlung(tags: readonly string[]): string {
  const namen = tags.map((tag) => `„${tag}“`)
  if (namen.length <= 1) return namen.join('')
  return `${namen.slice(0, -1).join(', ')} und ${namen[namen.length - 1]}`
}

/** Erklärender Hinweis (Kriterium PO-2026-09-07-004): benennt die aktiven
 * Tags, andere Aussage/Aktion als der Leerzustand „noch keine Orte"
 * (design-conventions.md „Leer (gefiltert, kein Treffer)"). Keine Fehler-/
 * Warnfarbe, kein Alarm-Icon — reiner Text wie jeder andere Leerzustand. */
const keineTrefferText = computed(() => {
  const aufzaehlung = formatiereTagAufzaehlung(store.aktiveTags)
  return store.tagfilterEinstellung.verknuepfung === 'und'
    ? `Kein Ort trägt alle ausgewählten Tags: ${aufzaehlung}.`
    : `Kein Ort trägt einen der ausgewählten Tags: ${aufzaehlung}.`
})

function aufTagUmschalten(tag: string): void {
  store.schalteTagAktiv(tag)
}

function aufVerknuepfungGeaendert(verknuepfung: TagVerknuepfung): void {
  store.setzeTagVerknuepfung(verknuepfung)
}

function aufTagfilterZurueckgesetzt(): void {
  store.setzeTagfilterZurueck()
}

function aufTagHinzugefuegt(tag: string): void {
  if (!ortId.value) return
  store.fuegeTagHinzu(ortId.value, tag)
  persistiereJetzt()
}

function aufTagEntfernt(tag: string): void {
  if (!ortId.value) return
  store.entferneTagVonOrt(ortId.value, tag)
  persistiereJetzt()
}

const gesamtnote = computed(() => (ort.value ? berechneGesamtnote(ort.value.bewertungen) : null))
const ausgefuellteAchsen = computed(() =>
  ort.value ? zaehleAusgefuellteAchsen(ort.value.bewertungen) : 0,
)

// --- Werkzeugleiste / Sortierung (PO-2026-09-07-003, ADR-0009) -----------

/**
 * Überschrift der Gruppe „ohne Wert" (design_notes PO-2026-09-07-003):
 * `sortierErgebnis.ohneWert` ist laut `sortiereOrte` nur bei Gesamtnote oder
 * einer Einzelachse überhaupt gefüllt — bei Bezeichnung/Zuletzt geändert hat
 * jeder Ort einen Wert. Das aktuelle Kriterium ist deshalb hier immer
 * entweder `gesamtnote` oder eine Achse, sobald diese Liste nicht leer ist.
 */
const ohneWertUeberschrift = computed(() => {
  const anzahl = store.sortierErgebnis.ohneWert.length
  if (anzahl === 0) return ''
  const orteWort = anzahl === 1 ? 'Ort' : 'Orte'
  const kriterium = store.sortierung.kriterium
  if (kriterium === 'gesamtnote') return `${anzahl} ${orteWort} ohne Bewertung`
  return `${anzahl} ${orteWort} ohne Bewertung in ${SORTIER_KRITERIUM_LABEL[kriterium]}`
})

function aufKriteriumGewaehlt(kriterium: SortierKriterium): void {
  store.setzeSortierKriterium(kriterium)
}

function aufRichtungUmgeschaltet(): void {
  store.schalteSortierrichtungUm()
}

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

// Fokusrückgabe Karte <- Detail (design-conventions.md „Ansichtswechsel
// innerhalb eines Bereichs" -> „Rückkehr aus der Detailansicht"): Der zuvor
// geöffnete Marker existiert erst wieder, NACHDEM `Kartenflaeche.vue` neu
// gemountet hat (Adresswechsel hängt den ganzen Kartenzweig aus/ein,
// ADR-0019 Punkt 11) — deshalb als Prop weitergereicht statt hier direkt
// fokussiert. `Kartenflaeche.vue` meldet die Übernahme per Emit zurück.
const fokusMarkerId = ref<string | null>(null)
const kartenLeerRef = ref<HTMLElement | null>(null)

function aufKartenfokusUebernommen(): void {
  fokusMarkerId.value = null
}

// Fallback, falls der zuvor geöffnete Ort beim Rücksprung keine Koordinaten
// mehr hat (der Marker existiert dann nicht mehr, `Kartenflaeche.vue` wird
// gar nicht gerendert und könnte die Übernahme nie melden): Fokus geht in
// diesem Randfall auf den dritten Kartenleerzustand.
watch(kartenLeerzustand, (zustand) => {
  if (zustand === 'ohne_koordinaten' && fokusMarkerId.value !== null) {
    fokusMarkerId.value = null
    void nextTick(() => kartenLeerRef.value?.focus())
  }
})

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
    if (zeigeNurLeerzustand.value || zeigeNurGefiltertLeer.value) {
      leerZustandRef.value?.focus()
      return
    }
    const ersatzOrt = angezeigteOrteSortiert.value[Math.min(index, angezeigteOrteSortiert.value.length - 1)]
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
    // Rücksprung in die Kartenansicht (design-conventions.md
    // „Ansichtswechsel innerhalb eines Bereichs"): `ansicht` liest zu diesem
    // Zeitpunkt bereits die NEUE Adresse (`ortId` selbst ist von `route`
    // abgeleitet, die Navigation ist also bereits abgeschlossen). Löschen
    // landet immer auf der Liste (`replace('/orte')`, kein Sonderfall) und
    // nimmt diesen Zweig deshalb nie.
    if (ansicht.value === 'karte') {
      fokusMarkerId.value = alt
    } else {
      fokussiereListeNachSchliessen(alt)
    }
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

/**
 * Übernahme eines Ortssuche-Treffers (ADR-0020 Punkt 6, „ÜBERNAHME"):
 * schreibt über dasselbe öffentliche API wie jede andere Feldänderung
 * (`aktualisiereFeld` + `persistiereOrt`, ADR-0005) — vollständiger
 * Datensatz, keine Entprellung. Übernommene Werte sind danach gewöhnliche,
 * einzeln editier- und löschbare Felder, kein Sonderzustand.
 */
function aufOrtssucheUebernommen(werte: OrtsvorschlagWerte): void {
  if (!ortId.value) return
  store.aktualisiereFeld(ortId.value, werte)
  persistiereJetzt()
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
  const vorherigerIndex = angezeigteOrteSortiert.value.findIndex((eintrag) => eintrag.id === id)
  const erfolg = await store.loescheOrt(id)
  if (erfolg) {
    geloeschtVorherigerIndex.value = vorherigerIndex
    await router.replace('/orte')
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

    <div
      v-else-if="zeigeNurGefiltertLeer"
      ref="leerZustandRef"
      class="ortebereich__liste-spalte"
      tabindex="-1"
    >
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

      <Werkzeugleiste
        :sortierung="store.sortierung"
        :angezeigt="store.orteGefiltert.length"
        :gesamt="store.orte.length"
        :ansicht="ansicht"
        :sichtbar-auf-karte="kartenOrte.length"
        @kriterium-gewaehlt="aufKriteriumGewaehlt"
        @richtung-umschalten="aufRichtungUmgeschaltet"
        @ansicht-umschalten="aufAnsichtUmgeschaltet"
      >
        <template
          v-if="store.tagVokabular.length > 0"
          #zeile-2
        >
          <TagFilterleiste
            :vokabular="store.tagVokabular"
            :aktive-tags="store.aktiveTags"
            :verknuepfung="store.tagfilterEinstellung.verknuepfung"
            @tag-umschalten="aufTagUmschalten"
            @verknuepfung-geaendert="aufVerknuepfungGeaendert"
            @zuruecksetzen="aufTagfilterZurueckgesetzt"
          />
        </template>
      </Werkzeugleiste>

      <div class="ortebereich__keine-treffer">
        <p class="ortebereich__keine-treffer-text">
          {{ keineTrefferText }}
        </p>
        <PrimaerButton
          type="button"
          @click="aufTagfilterZurueckgesetzt"
        >
          Filter zurücksetzen
        </PrimaerButton>
      </div>
    </div>

    <!-- Kartenansicht (PO-2026-09-07-006, ADR-0019 Punkt 5): volle
         Inhaltsbreite, kein MasterDetail — Kopfzeile und Werkzeugleiste wie
         in der Liste, darunter die Karte über die volle Breite. -->
    <div
      v-else-if="zeigeKartenbereich"
      class="ortebereich__karte-bereich"
    >
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

      <Werkzeugleiste
        :sortierung="store.sortierung"
        :angezeigt="store.orteGefiltert.length"
        :gesamt="store.orte.length"
        :ansicht="ansicht"
        :sichtbar-auf-karte="kartenOrte.length"
        @kriterium-gewaehlt="aufKriteriumGewaehlt"
        @richtung-umschalten="aufRichtungUmgeschaltet"
        @ansicht-umschalten="aufAnsichtUmgeschaltet"
      >
        <template
          v-if="store.tagVokabular.length > 0"
          #zeile-2
        >
          <TagFilterleiste
            :vokabular="store.tagVokabular"
            :aktive-tags="store.aktiveTags"
            :verknuepfung="store.tagfilterEinstellung.verknuepfung"
            @tag-umschalten="aufTagUmschalten"
            @verknuepfung-geaendert="aufVerknuepfungGeaendert"
            @zuruecksetzen="aufTagfilterZurueckgesetzt"
          />
        </template>
      </Werkzeugleiste>

      <!-- Dritter Kartenleerzustand (ADR-0019 Punkt 10c, design-conventions.md
           „Karte"): Filter lässt Orte übrig, aber keiner hat Koordinaten.
           Ersetzt NUR die Kartenfläche — Kopfzeile/Werkzeugleiste bleiben
           sichtbar (siehe oben). -->
      <div
        v-if="kartenLeerzustand === 'ohne_koordinaten'"
        ref="kartenLeerRef"
        class="ortebereich__karte-leer"
        tabindex="-1"
      >
        <p class="ortebereich__karte-leer-text">
          Keiner der angezeigten Orte hat Koordinaten.
        </p>
        <PrimaerButton
          type="button"
          @click="wechsleZuListe"
        >
          Zur Ortsliste
        </PrimaerButton>
      </div>
      <Kartenflaeche
        v-else
        :orte="kartenOrte"
        :fokussierter-ort-id="fokusMarkerId"
        @ort-ausgewaehlt="aufMarkerAusgewaehlt"
        @fokus-uebernommen="aufKartenfokusUebernommen"
      />
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

          <Werkzeugleiste
            :sortierung="store.sortierung"
            :angezeigt="store.orteGefiltert.length"
            :gesamt="store.orte.length"
            :ansicht="ansicht"
            :sichtbar-auf-karte="kartenOrte.length"
            @kriterium-gewaehlt="aufKriteriumGewaehlt"
            @richtung-umschalten="aufRichtungUmgeschaltet"
            @ansicht-umschalten="aufAnsichtUmgeschaltet"
          >
            <template
              v-if="store.tagVokabular.length > 0"
              #zeile-2
            >
              <TagFilterleiste
                :vokabular="store.tagVokabular"
                :aktive-tags="store.aktiveTags"
                :verknuepfung="store.tagfilterEinstellung.verknuepfung"
                @tag-umschalten="aufTagUmschalten"
                @verknuepfung-geaendert="aufVerknuepfungGeaendert"
                @zuruecksetzen="aufTagfilterZurueckgesetzt"
              />
            </template>
          </Werkzeugleiste>

          <div
            v-if="keineTreffer"
            class="ortebereich__keine-treffer"
          >
            <p class="ortebereich__keine-treffer-text">
              {{ keineTrefferText }}
            </p>
            <PrimaerButton
              type="button"
              @click="aufTagfilterZurueckgesetzt"
            >
              Filter zurücksetzen
            </PrimaerButton>
          </div>

          <ul
            v-else
            class="ortebereich__liste"
          >
            <li
              v-for="ortEintrag in store.sortierErgebnis.mitWert"
              :key="ortEintrag.id"
              :ref="(el) => setZeilenRef(ortEintrag.id, el as Element | null)"
            >
              <Ortszeile
                :ort="ortEintrag"
                :ausgewaehlt="ortEintrag.id === ortId"
                :sortier-kriterium="store.sortierung.kriterium"
              />
            </li>

            <template v-if="store.sortierErgebnis.ohneWert.length > 0">
              <li class="ortebereich__ohne-wert-ueberschrift">
                {{ ohneWertUeberschrift }}
              </li>
              <li
                v-for="ortEintrag in store.sortierErgebnis.ohneWert"
                :key="ortEintrag.id"
                :ref="(el) => setZeilenRef(ortEintrag.id, el as Element | null)"
              >
                <Ortszeile
                  :ort="ortEintrag"
                  :ausgewaehlt="ortEintrag.id === ortId"
                  :sortier-kriterium="store.sortierung.kriterium"
                  :zeige-wert="false"
                />
              </li>
            </template>
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

          <Ortssuche @uebernommen="aufOrtssucheUebernommen" />

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

          <div class="ortsdetail__feld">
            <span>Tags</span>
            <TagEingabe
              :tags="ort.tags"
              :vokabular="store.tagVokabular"
              @tag-hinzugefuegt="aufTagHinzugefuegt"
              @tag-entfernt="aufTagEntfernt"
            />
          </div>

          <div class="ortsdetail__feld">
            <span>Bilder</span>
            <Bilderbereich :ort-id="ort.id" />
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

/* Null-Treffer-Zustand (PO-2026-09-07-004, design-conventions.md „Leer
   (gefiltert, kein Treffer)"): gleiches typografisches Muster wie
   `.ortebereich__leer`, andere Aussage/Aktion, kein Fehler-/Warnton. Sitzt
   innerhalb der Listen-Spalte unter der Werkzeugleiste (Umschalter bleibt
   sichtbar darüber), nicht vollflächig zentriert wie der leere Bestand. */
.ortebereich__keine-treffer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-16);
  padding: var(--space-64) var(--space-16);
  text-align: center;
}

.ortebereich__keine-treffer-text {
  color: var(--text);
  font-size: var(--font-size-16);
}

.ortebereich__leer-text {
  color: var(--text);
  font-size: var(--font-size-16);
}

.ortebereich__liste-spalte {
  padding: var(--space-16);
}

/* Kartenansicht (PO-2026-09-07-006, ADR-0019 Punkt 5): volle
   INHALTSBREITE statt der ~400px schmalen Listen-Spalte — dieselbe
   Kopfzeile/Werkzeugleiste wie oben, nur in einem breiteren Wurzelelement.
   „Volle Inhaltsbreite" heißt die normale Container-Breite der App
   (`--container-max-width`, wie `MasterDetail.vue` sie außen anlegt und wie
   `.ortebereich__leer` es für den anderen Nicht-MasterDetail-Zweig oben
   bereits tut), NICHT die nackte Fensterbreite — `<main>` selbst
   (`AppRahmen.vue`) setzt keine eigene Höchstbreite. */
.ortebereich__karte-bereich {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--space-16);
}

/* Dritter Kartenleerzustand (design-conventions.md „Karte"): gleiches
   typografisches Muster wie die übrigen Leerzustände dieser Datei, ersetzt
   nur die Kartenfläche. */
.ortebereich__karte-leer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-16);
  padding: var(--space-64) var(--space-16);
  text-align: center;
}

.ortebereich__karte-leer-text {
  color: var(--text);
  font-size: var(--font-size-16);
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

/* Gruppe „ohne Wert" ans Ende (design-conventions.md „Listen: Sortieren,
   Filtern, Gruppierung"): großzügiger Abstand zur vorigen Zeile statt einer
   Trennlinie, gemutete Zwischenüberschrift mit Anzahl. Nie eingeklappt —
   diese Zeile ist reiner Text, kein Umschalter. */
.ortebereich__ohne-wert-ueberschrift {
  margin-top: var(--space-32);
  padding: 0 var(--space-16);
  color: var(--text-muted);
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
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

/* Untereinander statt nebeneinander (PO-2026-09-12-002, design-conventions.md
   "Formulare" -> "Zahlenfeld-Paare stehen standardmäßig untereinander"):
   nebeneinander blieben bei 320px Gerätebreite nur ~136px je Feld, zu wenig
   für Extremwerte wie "-179.999999" samt nativem Zahlenfeld-Spinner. Gilt in
   jeder Breite bis zur Container-Obergrenze (640px), bewusst ohne
   Umbruchpunkt/Container Query (ADR-0012 verlangt nur, wie ein
   breitenabhängiges Layout seine Breite erfragt, nicht dass es
   breitenabhängig sein muss). Der Wrapper bleibt als Element/Klasse
   bestehen, da Paket 005 seine ID für aria-controls bindet. */
.ortsdetail__koordinaten {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
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

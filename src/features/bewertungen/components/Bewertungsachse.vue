<script setup lang="ts">
/**
 * Eine Bewertungsachse in der Ortsdetailansicht: Zahleneingabe ist die
 * primäre, stets sichtbare Bedienung (initial leer, kein Default 0), der
 * Regler daneben ist das barrierefreie Pendant — bidirektional synchron
 * (design_notes PO-2026-09-07-002), Thumb in JEDEM Zustand sichtbar und
 * bedienbar (PO-2026-09-13-002): „nicht gesetzt"/„gesetzt" unterscheiden
 * sich über die Rahmen-/Füllfarbe des Thumbs, nie über Sichtbarkeit (siehe
 * `<style>` unten). Bahn und Thumb sind seit PO-2026-09-16-001 (siebte
 * Runde, design-conventions.md „Regler-Bahn und -Thumb") vollständig selbst
 * gezeichnet — `accent-color` entfällt ersatzlos, es hatte ohne native Bahn
 * in keiner Engine mehr eine Wirkung.
 * Rein präsentational, kennt keinen Store (code-conventions.md:
 * „components/ kennt keinen Store") — die View bindet über Emits an
 * `useOrteStore.aktualisiereAchse` (ADR-0008).
 *
 * Gültigkeit wird beim Eingeben hergestellt (ADR-0007 Punkt 7): erst runden,
 * dann klemmen — für JEDEN Eingabepfad, auch den Regler (PO-2026-09-13-001,
 * Entscheidung Architekt: `rundenUndKlemmen` gilt hier NICHT nur für die
 * Zahleneingabe). Ein geleertes Feld wird zu „nicht bewertet" (`null`) und
 * nicht geklemmt.
 *
 * Regler-Commit (PO-2026-09-13-001, Korrektur eines Fehlers, bei dem ein
 * `input`-Ereignis nur den lokalen Textzustand schrieb und nie emittierte):
 * Der Regler committet auf JEDES `input`-Ereignis (`aufReglerTippen`) — nicht
 * erst auf `change`. Zusätzlich committet eine ABGESCHLOSSENE Bedienung
 * (`pointerup`, Tastenbedienung mit Wertbezug) den aktuellen Elementwert,
 * solange `props.wert === null` ist (`aufReglerBedienung`): Steht der Regler
 * dabei bereits optisch auf 0 (`:value="wert ?? 0"`), ändert eine Bedienung,
 * die am unteren Anschlag bleibt (Tipp auf das linke Bahnende, Pfeil-runter/
 * Pos1 am Minimum), den nativen Wert NICHT — kein `input`-Ereignis, keine
 * andere Möglichkeit, eine GESETZTE 0 über den Regler zu vergeben. Weder
 * Rendern noch Fokussieren noch Scrollen darf einen Wert erzeugen (ADR-0007) —
 * deshalb hängt keiner der beiden Commit-Pfade an `focus`/`watch(props.wert)`.
 *
 * Store-frei zu bleiben ist hier keine Stilfrage: Nur dadurch darf die
 * View `Ortebereich.vue` (Context `orte`, vormals `Ortsdetail.vue` bis
 * PO-2026-09-07-012) diese Komponente importieren, ohne einen verbotenen
 * Import-Zyklus zu öffnen (ADR-0013 Punkt 3).
 */
import { computed, ref, watch } from 'vue'
import Intensitaetsbalken from '../../../shared/ui/Intensitaetsbalken.vue'
import TextButton from '../../../shared/ui/TextButton.vue'
import IconKreuz from '../../../shared/ui/icons/IconKreuz.vue'
import { rundenUndKlemmen } from '../lib/rundenUndKlemmen'

const props = defineProps<{
  /** Kebab-freier, deutscher Kurzname für IDs — z. B. `ambiente`, `preisLeistung`. */
  achseName: string
  label: string
  kurzerklaerung?: string | null
  wert: number | null
  kommentar: string | null
}>()

const emit = defineEmits<{
  'wert-geaendert': [wert: number | null]
  'kommentar-geaendert': [kommentar: string | null]
}>()

const eingabeId = computed(() => `bewertungsachse-${props.achseName}-wert`)
const reglerId = computed(() => `bewertungsachse-${props.achseName}-regler`)

// Lokaler Textzustand der Zahleneingabe — erst bei Commit (Verlassen des
// Feldes/`change`) wird gerundet, geklemmt und emittiert (ADR-0007 Punkt 7).
const eingabe = ref(props.wert === null ? '' : String(props.wert))

watch(
  () => props.wert,
  (neu) => {
    eingabe.value = neu === null ? '' : String(neu)
  },
)

function aufEingabeTippen(event: Event): void {
  eingabe.value = (event.target as HTMLInputElement).value
}

function aufEingabeCommit(): void {
  const roh = eingabe.value.trim()

  if (roh === '') {
    // Ein geleertes Feld ist kein Wert und wird nicht geklemmt — es führt
    // direkt zu „nicht bewertet" (design-conventions.md, „Formulare").
    if (props.wert !== null) emit('wert-geaendert', null)
    return
  }

  const zahl = Number(roh)
  if (!Number.isFinite(zahl)) {
    eingabe.value = props.wert === null ? '' : String(props.wert)
    return
  }

  const bereinigt = rundenUndKlemmen(zahl)
  eingabe.value = String(bereinigt)
  if (bereinigt !== props.wert) emit('wert-geaendert', bereinigt)
}

// Committet auf JEDES `input`-Ereignis (design-conventions.md „Formulare"),
// nicht erst auf `change` — der bestehende Guard bleibt: ein Ziehen über den
// vollen Bereich erzeugt dadurch höchstens 11 Emits, nicht einen je
// Pointer-Bewegung. `rundenUndKlemmen` läuft auch hier (ADR-0007 Punkt 7) —
// die native Klemmung über `min`/`max`/`step` ist Browserverhalten über
// einen String, keine Eigenschaft des Datenmodells.
function aufReglerTippen(event: Event): void {
  const wert = rundenUndKlemmen(Number((event.target as HTMLInputElement).value))
  eingabe.value = String(wert)
  if (wert !== props.wert) emit('wert-geaendert', wert)
}

// Nur relevant, solange noch kein Wert gesetzt ist: Deckt den Fall ab, in
// dem eine abgeschlossene Bedienung den nativen Wert NICHT ändert (Bahn
// bereits optisch auf 0), also kein `input`-Ereignis auslöst und
// `aufReglerTippen` nie feuert. Ist bereits ein Wert gesetzt, hat jede
// Bedienung längst ein `input`-Ereignis ausgelöst — der Aufruf hier liefert
// dann denselben Wert erneut und wird durch den frühen Rücksprung
// unterdrückt, kein doppeltes Emit.
function aufReglerBedienung(event: Event): void {
  if (props.wert !== null) return
  const wert = rundenUndKlemmen(Number((event.target as HTMLInputElement).value))
  eingabe.value = String(wert)
  emit('wert-geaendert', wert)
}

const RELEVANTE_REGLER_TASTEN = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']

function aufReglerTasteLosgelassen(event: KeyboardEvent): void {
  if (!RELEVANTE_REGLER_TASTEN.includes(event.key)) return
  aufReglerBedienung(event)
}

function aufZuruecksetzen(): void {
  eingabe.value = ''
  emit('wert-geaendert', null)
}

// Kommentar: standardmäßig eingeklappt als Text-Link, vorhandener Kommentar
// zeigt sich sofort aufgeklappt (design_notes PO-2026-09-07-002). Bleibt
// erhalten, wenn die Achse zurückgesetzt wird — dafür berührt
// `aufZuruecksetzen` oben ausschließlich `wert-geaendert`, nie den Kommentar.
const kommentarOffen = ref(props.kommentar !== null)
const kommentarEntwurf = ref(props.kommentar ?? '')

watch(
  () => props.kommentar,
  (neu) => {
    kommentarEntwurf.value = neu ?? ''
    if (neu !== null) kommentarOffen.value = true
  },
)

function aufKommentarCommit(): void {
  const bereinigt = kommentarEntwurf.value.trim()
  // Ein geleerter Kommentar wird `null`, nie `""` (ADR-0007 Punkt 4).
  const naechster = bereinigt === '' ? null : bereinigt
  if (naechster !== props.kommentar) emit('kommentar-geaendert', naechster)
}
</script>

<template>
  <div class="bewertungsachse">
    <div class="bewertungsachse__kopf">
      <label
        :for="eingabeId"
        class="bewertungsachse__label"
      >{{ label }}</label>
      <p
        v-if="kurzerklaerung"
        class="bewertungsachse__kurzerklaerung"
      >
        {{ kurzerklaerung }}
      </p>
    </div>

    <div class="bewertungsachse__eingabezeile">
      <input
        :id="eingabeId"
        type="number"
        inputmode="numeric"
        min="0"
        max="10"
        step="1"
        class="bewertungsachse__zahl"
        :value="eingabe"
        placeholder="–"
        @input="aufEingabeTippen"
        @change="aufEingabeCommit"
        @blur="aufEingabeCommit"
      >

      <input
        :id="reglerId"
        type="range"
        min="0"
        max="10"
        step="1"
        class="bewertungsachse__regler"
        :class="{ 'bewertungsachse__regler--leer': wert === null }"
        :aria-label="label"
        :value="wert ?? 0"
        :aria-valuenow="wert ?? undefined"
        :aria-valuetext="wert === null ? 'nicht bewertet' : undefined"
        @input="aufReglerTippen"
        @pointerup="aufReglerBedienung"
        @keyup="aufReglerTasteLosgelassen"
      >

      <button
        v-if="wert !== null"
        type="button"
        class="bewertungsachse__zuruecksetzen"
        :aria-label="`${label} zurücksetzen`"
        @click="aufZuruecksetzen"
      >
        <IconKreuz :size="16" />
      </button>
    </div>

    <Intensitaetsbalken :wert="wert" />

    <TextButton
      v-if="!kommentarOffen"
      type="button"
      class="bewertungsachse__kommentar-oeffnen"
      @click="kommentarOffen = true"
    >
      Kommentar hinzufügen
    </TextButton>
    <div
      v-else
      class="bewertungsachse__kommentar"
    >
      <textarea
        v-model="kommentarEntwurf"
        class="bewertungsachse__kommentar-feld"
        rows="2"
        :aria-label="`Kommentar zu ${label}`"
        @blur="aufKommentarCommit"
      />
    </div>
  </div>
</template>

<style scoped>
.bewertungsachse {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-16);
  border: 1px solid var(--border);
  border-radius: var(--radius-12);
}

.bewertungsachse__kopf {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.bewertungsachse__label {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  color: var(--text);
}

.bewertungsachse__kurzerklaerung {
  font-size: var(--font-size-14);
  color: var(--text-muted);
}

.bewertungsachse__eingabezeile {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.bewertungsachse__zahl {
  width: 64px;
  min-height: 44px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-16);
  flex-shrink: 0;
}

/* Regler-Bahn und -Thumb werden vollstaendig selbst gezeichnet
   (design-conventions.md "Werte mit Bereich, bei denen 0 gueltig ist" ->
   "Regler-Bahn und -Thumb", siebte Runde, PO-2026-09-16-001). Anker-Prinzip:
   appearance: none jetzt auch am <input> selbst (nicht nur am
   Thumb-Pseudo-Element wie in der sechsten Runde) UND Rahmen/Radius/
   Hintergrund/Hoehe der Bahn stehen direkt auf diesem Basis-Selektor, nicht
   nur auf den Track-Pseudo-Elementen weiter unten -- faellt ein
   vendor-spezifischer Pseudo-Selektor in einer Engine aus, bleibt die Bahn
   trotzdem sichtbar, ausfallen kann dann nur noch der Thumb.
   `accent-color` entfaellt ersatzlos: ohne native Bahn hat es in keiner
   Engine mehr eine Wirkung.

   Korrektur aus der Abnahme (PO-2026-09-16-001, zwei Befunde): Die
   44x44px-Trefferflaeche entsteht jetzt ueber einen TRANSPARENTEN
   `border-width: 18px 0` statt ueber `padding: 18px 0` -- Masse unveraendert
   (8px Bahn + 2x18px = 44px), nur das Mittel getauscht. Grund: `outline`
   kennt nur EINEN Versatz fuer alle vier Seiten (`outline-offset`); bei
   Padding nur vertikal (18px oben/unten, 0px links/rechts) zog derselbe
   Versatz den Rahmen faelschlich auch an beiden Enden 18px nach innen
   (Befund 1 -- die Bahn endete sichtbar vor dem linken/rechten Ende, obwohl
   die Flaeche volle Breite hatte). Ein inset-`box-shadow` dagegen beginnt
   IMMER an der Innenkante des Rahmens (Padding-Box), unabhaengig davon, ob
   der Rahmen pro Achse unterschiedlich breit ist -- mit 18px oben/unten und
   0px links/rechts faellt diese Innenkante exakt auf die 8px hohe, volle
   Breite messende Bahn, ganz ohne manuellen Versatz-Wert. Der eigentliche
   Bahn-Rahmen steht deshalb weiter unten als `box-shadow`, nicht mehr als
   `outline`. */
.bewertungsachse__regler {
  appearance: none;
  -webkit-appearance: none;
  /* Lokale Ausnahme vom globalen `box-sizing: border-box` (base.css): nur
     im content-box-Modell bleiben Bahnhoehe (8px, deckungsgleich mit
     `.intensitaetsbalken__spur`) und der Rahmen der Trefferflaeche
     unabhaengig rechenbar -- unter border-box wuerde ein zu grosser Rahmen
     die deklarierte Hoehe verdraengen statt sie zu ergaenzen. */
  box-sizing: content-box;
  flex: 1;
  min-width: 0;
  height: 8px;
  padding: 0;
  /* Trefferflaeche 44x44px (design-conventions.md): 2x18px + 8px Bahnhoehe
     = 44px -- ueber einen transparenten Rahmen statt Padding (siehe
     Kommentarblock oben), damit die Innenkante des Rahmens (Padding-Box)
     exakt auf die sichtbare Bahn faellt. Der 24px-Thumb (siehe
     Pseudo-Elemente unten) braucht mit denselben 18px ebenfalls >= 44px,
     ist also nicht der bestimmende Faktor. */
  border-style: solid;
  border-color: transparent;
  border-width: 18px 0;
  margin: 0;
  background-color: var(--surface);
  /* Ohne background-clip wuerde die Flaeche die gesamte Trefferflaeche
     (44px) einfaerben statt nur die 8px hohe Bahn. */
  background-clip: content-box;
  border-radius: var(--radius-full);
  cursor: pointer;
  /* Sichtbarer Bahn-Rahmen, siehe Kommentarblock oben: liegt an der
     Innenkante des transparenten Rahmens an, also exakt um die 8px hohe,
     volle Breite messende Bahn -- in jedem Zustand identisch, keine
     Fuellung (der Intensitaetsbalken darunter zeigt den Fuellstand bereits,
     design-conventions.md). Bewusst OHNE `:focus-visible`-Ausnahme (Befund
     2 der Abnahme): ein `box-shadow` ist eine andere CSS-Eigenschaft als
     der `outline`-Fokusring gleich darunter, beide bleiben deshalb
     gleichzeitig sichtbar, der Fokusring ergaenzt den Bahn-Rahmen statt ihn
     zu ersetzen. */
  box-shadow: inset 0 0 0 1px var(--border);
}

/* Fokusring -- ergaenzt den permanenten Bahn-Rahmen (`box-shadow` oben),
   ersetzt ihn nicht (Befund 2 der Abnahme). Fallback, falls eine
   WebKit-Version den globalen `:focus-visible`-Ring (base.css) bei
   `appearance: none` zusaetzlich unterdrueckt (design-conventions.md
   "Fokusring") -- dieselben Fokusring-Tokens wie die globale Regel, keine
   neuen Werte. Hier nicht verifizierbar: kein WebKit-Testlauf moeglich
   (ADR-0023 Punkt 5, ADR-0029). */
.bewertungsachse__regler:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

/* Track-Pseudo-Elemente bekommen nur einen Reset, kein eigenes Aussehen --
   die Bahn-Optik kommt vom Basis-Selektor oben und soll durchscheinen
   (Anker-Prinzip). Gleiche Hoehe/Radius wie oben, rein informativ fuer die
   interne Boxberechnung der jeweiligen Engine. */
.bewertungsachse__regler::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: var(--radius-full);
  background: transparent;
  border: none;
}

.bewertungsachse__regler::-moz-range-track {
  height: 8px;
  border-radius: var(--radius-full);
  background: transparent;
  border: none;
}

/* Thumb -- Werte aus der sechsten Runde (design-conventions.md), unabhaengig
   von der Bahnfrage: eigener 2px-Rahmen + Fuellfarbe in JEDEM Zustand,
   Groesse/Form aendern sich zwischen den Zustaenden nicht, nur die Farbe.
   24px Durchmesser ist seit der achten Korrektur-Runde (2026-09-17) eine
   benannte Design-Festlegung in design-conventions.md ("Regler-Bahn und
   -Thumb" -> "Thumb"), keine freie Bemessungsgroesse des Frontend-Leads
   mehr: dreimal so hoch wie die 8px-Bahn (damit der Thumb auch im "nicht
   gesetzt"-Zustand als eigenstaendiges Element erkennbar bleibt) und
   zugleich die bestehende Icon-Basisgroesse der Anwendung
   (design-concept.md "Ikonografie") -- kein isolierter, nur hier
   verwendeter Wert. Vorgemerkt als Token-Kandidat fuer tokens.css
   (z. B. `--regler-thumb-groesse`), sobald ein zweiter Verwendungsort
   hinzukommt; bis dahin bleibt der Literalwert hier im Feature-Code.
   Basisregel = "gesetzt" (inkl. 0): Primaerton, Kontrast ca. 6,1:1. */
.bewertungsachse__regler::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  /* WebKit richtet den Thumb sonst an der Oberkante der Bahn aus statt ihn
     zu zentrieren: (Bahnhoehe 8px - Thumb 24px) / 2. */
  margin-top: -8px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary-600);
  background-color: var(--color-primary-600);
  cursor: pointer;
  transition:
    background-color var(--duration-120) var(--ease-out),
    border-color var(--duration-120) var(--ease-out);
}

.bewertungsachse__regler::-moz-range-thumb {
  /* Firefox zentriert den Thumb auf der Bahn automatisch, kein
     margin-top-Ausgleich noetig. */
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary-600);
  background-color: var(--color-primary-600);
  cursor: pointer;
  transition:
    background-color var(--duration-120) var(--ease-out),
    border-color var(--duration-120) var(--ease-out);
}

/* "Nicht gesetzt": neutrale Farbe wie jede andere fehlende Angabe
   (design-concept.md "Fehlende Daten sind neutral"), Kontrast ca. 4,8:1.
   Vorherige Fassung blendete den Thumb bei `null` per `opacity: 0` komplett
   aus -- dadurch war der Regler erst nach mehrfachem zufaelligen Antippen
   auffindbar (Nutzermeldung 2026-09-13); Groesse/Form bleiben deshalb hier
   unangetastet, nur Rahmen-/Fuellfarbe wechseln. */
.bewertungsachse__regler--leer::-webkit-slider-thumb {
  border-color: var(--text-muted);
  background-color: var(--surface);
}

.bewertungsachse__regler--leer::-moz-range-thumb {
  border-color: var(--text-muted);
  background-color: var(--surface);
}

.bewertungsachse__zuruecksetzen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-8);
  background-color: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.bewertungsachse__zuruecksetzen:hover {
  background-color: var(--surface-muted);
  color: var(--text);
}

.bewertungsachse__kommentar-oeffnen {
  align-self: flex-start;
  padding: 0;
  min-height: auto;
}

.bewertungsachse__kommentar-feld {
  width: 100%;
  padding: var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-14);
  resize: vertical;
}
</style>

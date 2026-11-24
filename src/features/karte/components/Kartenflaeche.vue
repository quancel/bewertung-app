<script setup lang="ts">
/**
 * Kartenfläche — Leaflet-Karte mit OSM-Rasterkacheln (ADR-0018, ADR-0019,
 * PO-2026-09-07-006). Rein präsentational: Orte kommen als Prop, eine
 * Markerauswahl geht als Emit zurück — kein Store-Zugriff, kein Import aus
 * `features/orte/` (ADR-0019 Punkt 8). Die eigentliche Leaflet-Verdrahtung
 * liegt in `../composables/useLeafletKarte.ts`, diese Datei bleibt dünnes
 * Template plus Zustand für den Offline-Hinweis.
 *
 * Wird von `Ortebereich.vue` ASYNCHRON eingebunden (`defineAsyncComponent`,
 * ADR-0018 Punkt 6/ADR-0019 Punkt 12) — `/orte` ist die Startroute, ein
 * statischer Import läge Leaflet ins Einstiegs-Bundle. Diese Datei selbst
 * weiß davon nichts; der lazy Import ist Sache des Aufrufers.
 *
 * Gemountet wird dieser Block IMMER per `v-if`, nie per `v-show`
 * (ADR-0019 Punkt 11, Constraint MOUNTING) — das entscheidet ebenfalls der
 * Aufrufer: Leaflet misst seinen Container beim Aufbau, ein zu diesem
 * Zeitpunkt per `display: none` ausgeblendeter Container ergäbe eine
 * 0×0-Karte.
 *
 * NICHT unit-testbar unter `vitest`/`environment: 'node'` — siehe
 * Modul-Kommentar in `useLeafletKarte.ts`.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useNetzzustand } from '../../../shared/composables/useNetzzustand'
import { useLeafletKarte } from '../composables/useLeafletKarte'
import type { KartenOrt } from '../model/karte.types'

const props = defineProps<{
  orte: readonly KartenOrt[]
  /** Ort-ID, deren Marker nach dem Aufbau den Tastaturfokus erhalten soll
   * (design-conventions.md „Ansichtswechsel innerhalb eines Bereichs" ->
   * „Rückkehr aus der Detailansicht"): gesetzt von `Ortebereich.vue`, wenn
   * die Detailansicht ausgehend von einem Marker-Klick geschlossen wurde.
   * `null`/`undefined`, wenn kein Fokus zu übernehmen ist (z. B. erster
   * Aufbau der Kartenansicht). */
  fokussierterOrtId?: string | null
  /** Ort-ID des ausgewählten Markers (größere Scheibe, stärkerer Ring, Etikett
   * immer sichtbar, PO-2026-11-24-004). `Ortebereich.vue` setzt sie erst ab
   * PO-2026-11-24-005 (Schnellansicht), bis dahin `null`/`undefined`. */
  ausgewaehlteOrtId?: string | null
}>()

const emit = defineEmits<{
  'ort-ausgewaehlt': [ortId: string]
  /** Meldet, dass `fokussierterOrtId` verarbeitet wurde — `Ortebereich.vue`
   * setzt seinen Zustand daraufhin zurück, damit derselbe Fokuswunsch nicht
   * bei jedem weiteren Re-Render wiederholt wird. */
  'fokus-uebernommen': []
}>()

const containerRef = ref<HTMLDivElement | null>(null)
// Reine Durchreichung als Ref (nicht `ref()`/`reactive()` über einer Kopie):
// `useLeafletKarte` beobachtet `props.orte` selbst per `watch` (Constraint
// DATENAUSWAHL, „Marker werden aus den Props nachgeführt").
const orteRef = computed(() => props.orte)
const ausgewaehlteOrtIdRef = computed(() => props.ausgewaehlteOrtId ?? null)

const { online } = useNetzzustand()

const { fokussiereMarker } = useLeafletKarte(
  containerRef,
  orteRef,
  (ortId) => emit('ort-ausgewaehlt', ortId),
  online,
  ausgewaehlteOrtIdRef,
)

function uebernehmeFokusWunsch(): void {
  if (!props.fokussierterOrtId) return
  fokussiereMarker(props.fokussierterOrtId)
  emit('fokus-uebernommen')
}

// Läuft NACH dem `onMounted` in `useLeafletKarte` (Vue führt mehrere
// `onMounted`-Hooks derselben Instanz in Registrierungsreihenfolge aus) —
// die Marker existieren an dieser Stelle bereits.
onMounted(uebernehmeFokusWunsch)
watch(() => props.fokussierterOrtId, uebernehmeFokusWunsch)
</script>

<template>
  <div class="karte-wrapper">
    <div
      ref="containerRef"
      class="karte-container"
    />
    <!-- Zustand „Orte vorhanden, aber kein Netz für Kacheln"
         (design-conventions.md „Karte"): Marker bleiben normal farbig und
         anklickbar darüber, kein Vollflächentext, kein Fehler-Rot, kein
         Alarm-Icon, kein „Wiederholen" als Primäraktion — der Hinweis
         verschwindet von selbst, sobald `online` wieder `true` ist. -->
    <p
      v-if="!online"
      class="karte-offline-hinweis"
    >
      Kein Netz — Kartenkacheln erscheinen, sobald wieder eine Verbindung besteht.
    </p>
  </div>
</template>

<style scoped>
.karte-wrapper {
  position: relative;
  /* Eigener Stapelkontext: Leaflets Bedienelemente und Quellenangabe tragen
     z-index 800/1000 und lägen sonst über der festen Tab-Leiste, wenn die
     Karte unter sie reicht (320px) — und finge dort deren Klicks ab. */
  isolation: isolate;
  width: 100%;
  height: var(--karte-hoehe);
}

.karte-container {
  width: 100%;
  height: 100%;
  /* Kachelausfall (Constraint KACHELAUSFALL): einheitliche neutrale Fläche
     statt kaputter Bild-Icons, sichtbar solange keine Kachel geladen ist. */
  background-color: var(--color-neutral-100);
}

.karte-offline-hinweis {
  position: absolute;
  z-index: 1000;
  bottom: var(--space-16);
  left: var(--space-16);
  padding: var(--space-4) var(--space-12);
  border-radius: var(--radius-full);
  background-color: var(--surface);
  color: var(--text-muted);
  font-size: var(--font-size-12);
  box-shadow: 0 1px 4px rgb(0 0 0 / 12%);
}
</style>

<!-- Marker-Styles UNSCOPED (Constraint MARKER, code-conventions.md): von
     Leaflet erzeugtes DOM trägt kein `data-v-*`-Attribut — `<style scoped>`
     würde hier wortlos wirkungslos bleiben. -->
<style>
/* Leaflets `L.divIcon` trägt selbst die Klasse `.leaflet-div-icon` mit
   einer weißen Kachel + grauem Rahmen als Vorgabe (leaflet.css) — genau die
   Bilddatei-Optik, die ADR-0018 Punkt 4 mit `L.divIcon` vermeiden soll.
   `.leaflet-div-icon.karte-marker` (zwei Klassen) schlägt `.leaflet-div-icon`
   allein an Spezifität, unabhängig von der CSS-Ladereihenfolge zwischen
   `leaflet.css` und dieser Datei. */
.leaflet-div-icon.karte-marker {
  background: transparent;
  border: none;
}

/* Marker (PO-2026-11-24-004, design-conventions.md „Karte: Marker, Namen,
   Ausschnitt"): Trefferfläche = Token `--karte-marker-treffer` (Größe setzt
   `useLeafletKarte.ts` per `iconSize`), darin zentriert Scheibe mit Note oder
   Punkt ohne Note. `--marker-koerper` ist der Durchmesser des Körpers im
   aktuellen Zustand und positioniert das Etikett darüber. Keine Zonenfarbe;
   Akzent nur für Ring bzw. Punkt. */
.karte-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  --marker-koerper: var(--karte-marker-punkt);
}

.karte-marker--gewaehlt {
  --marker-koerper: var(--karte-marker-punkt-gewaehlt);
}

.karte-marker--mit-note {
  --marker-koerper: var(--karte-marker-scheibe);
}

.karte-marker--mit-note.karte-marker--gewaehlt {
  --marker-koerper: var(--karte-marker-scheibe-gewaehlt);
}

.karte-marker__koerper {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--marker-koerper);
  height: var(--marker-koerper);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgb(0 0 0 / 35%);
}

/* Weiße Schrift auf Akzent erreicht nur ≈ 4,1:1 — deshalb Scheibe in
   `--surface` mit Akzent-Ring und `--text` als Zahl. */
.karte-marker__scheibe {
  border: var(--karte-marker-ring) solid var(--color-accent-500);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-14);
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.karte-marker--gewaehlt .karte-marker__scheibe {
  border-width: var(--karte-marker-ring-gewaehlt);
}

/* Einziger Verwendungszweck von --color-accent-500 neben dem Ring
   (design-concept.md, ADR-0018 Punkt 4). */
.karte-marker__punkt {
  background-color: var(--color-accent-500);
}

.karte-marker--gewaehlt .karte-marker__punkt {
  box-shadow:
    0 0 0 var(--karte-marker-aussenring) var(--surface),
    0 1px 3px rgb(0 0 0 / 35%);
}

/* Namensetikett: bleibt IMMER im Layout (nur `opacity` blendet es aus), damit
   die Kollisionsprüfung sein gerendertes Rechteck messen kann.
   `pointer-events: none` — ein Etikett verdeckt nie ein Tippziel. */
.karte-marker__label {
  position: absolute;
  bottom: calc(50% + var(--marker-koerper) / 2 + var(--space-4));
  left: 50%;
  box-sizing: border-box;
  width: max-content;
  max-width: var(--karte-marker-etikett);
  padding: var(--karte-marker-etikett-polster);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: color-mix(in srgb, var(--surface) 92%, transparent);
  color: var(--text);
  font-size: var(--font-size-14);
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  opacity: 1;
  pointer-events: none;
  transform: translateX(calc(-50% + var(--karte-marker-etikett-versatz, 0px)));
  transition: opacity var(--duration-180) var(--ease-out);
}

.karte-marker__label--aus {
  opacity: 0;
}

/* Hover, Tastaturfokus oder Auswahl: volle Breite bis 240px, bis 2 Zeilen,
   immer sichtbar. Der Fokusring selbst kommt aus der projektweiten
   `:focus-visible`-Regel in base.css. */
.karte-marker:hover .karte-marker__label,
.karte-marker--vorrang .karte-marker__label {
  display: -webkit-box;
  max-width: var(--karte-marker-etikett-gewaehlt);
  overflow-wrap: anywhere;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  opacity: 1;
}

.karte-marker:hover,
.karte-marker--vorrang {
  z-index: 10000 !important;
}
</style>

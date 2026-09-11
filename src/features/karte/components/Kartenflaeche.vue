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

const { online } = useNetzzustand()

const { fokussiereMarker } = useLeafletKarte(
  containerRef,
  orteRef,
  (ortId) => emit('ort-ausgewaehlt', ortId),
  online,
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

.karte-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.karte-marker__punkt {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  /* Einziger Verwendungszweck von --color-accent-500 (design-concept.md,
     ADR-0018 Punkt 4). */
  background-color: var(--color-accent-500);
  border: 2px solid var(--surface);
  box-shadow: 0 1px 3px rgb(0 0 0 / 35%);
}

.karte-marker__label {
  position: absolute;
  top: -8px;
  left: 20px;
  padding: 2px var(--space-8);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-12);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration-120) var(--ease-out);
}

/* Im Fokus sind Fokusring UND Beschriftung gemeinsam sichtbar
   (design_notes) — der Fokusring selbst kommt unverändert aus der
   projektweiten `:focus-visible`-Regel in base.css. */
.karte-marker:hover .karte-marker__label,
.karte-marker:focus-visible .karte-marker__label {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .karte-marker__label {
    transition-duration: 0.01ms;
  }
}
</style>

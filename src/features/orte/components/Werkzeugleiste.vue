<script setup lang="ts">
/**
 * Werkzeugleiste der Ortsliste (PO-2026-09-07-003, geteilt mit -004,
 * code-conventions.md „Ein Baustein, in den ein anderer Context
 * hineinreicht, bekommt einen benannten Slot statt eines Imports"):
 * besitzt den zweizeiligen Rahmen und den kompletten Inhalt von Zeile 1 —
 * Sortier-Chip (aktuelles Kriterium als Text), direkt angehängter
 * Icon-Button für die Richtung (eigener Tap) sowie rechts die
 * Trefferzahl. Zeile 2 ist der benannte Slot `zeile-2`, gefüllt von
 * `Ortebereich.vue`. Ein leerer Slot wird nicht gerendert (ADR-0013) — so
 * ist „Bestand ohne Tags → Zeile 2 entfällt" (-004) strukturell erfüllt,
 * ohne dass diese Komponente `tags` kennen müsste. Präsentational, kennt
 * keinen Store — Sortierung ändert sich ausschließlich über Emits.
 *
 * Bedienform der sieben Kriterien (design_notes PO-2026-09-07-003): Tippen
 * auf den Chip öffnet ein Sheet (`Sheet.vue` aus -001, wiederverwendet),
 * gruppiert unter „Allgemein" und „Einzelachse". Auswahl wirkt sofort und
 * schließt das Sheet, kein „Anwenden"-Button. Aktive Auswahl als
 * Zeilen-Highlight in `--color-primary-50`.
 *
 * Sticky-Kopf der Listen-Spalte (ADR-0011 Punkt 6, ADR-0012): `position:
 * sticky; top: 0` auf der Wurzel — ab `lg` klebt das INNERHALB des
 * scrollenden Spaltenelements (`.master-detail__liste`, `overflow-y:
 * auto`), unterhalb `lg` klebt es am scrollenden Fenster (kein `overflow`
 * auf einem Vorfahren dazwischen). Kein `@container`-Umbruch nötig: bei
 * der Richwertbreite ~400px (~368px Inhaltsbreite) passen laut design_notes
 * selbst das längste Kriterium („Preis/Leistung") und die längste
 * realistische Trefferzahl („128 von 128 Orten") ohne Umbruch — Zeile 1
 * bekommt deshalb bewusst keine Container Query (ADR-0012 gilt nur, wo
 * tatsächlich umgebrochen wird).
 */
import { computed, ref } from 'vue'
import IconArrowUp from '../../../shared/ui/icons/IconArrowUp.vue'
import {
  ACHSEN_KRITERIEN,
  ALLGEMEIN_KRITERIEN,
  SORTIER_KRITERIUM_LABEL,
  type OrteSortierung,
  type SortierKriterium,
} from '../model/ansicht'
import Sheet from '../../../shared/ui/Sheet.vue'

const props = defineProps<{
  sortierung: OrteSortierung
  /** Anzahl der aktuell angezeigten Orte (nach Filterstufe — bis -004 immer
   * gleich `gesamt`). */
  angezeigt: number
  /** Gesamtzahl der Orte im Bestand, unabhängig vom Filter. */
  gesamt: number
}>()

const emit = defineEmits<{
  'kriterium-gewaehlt': [kriterium: SortierKriterium]
  'richtung-umschalten': []
}>()

const sheetOffen = ref(false)

const richtungsLabel = computed(() =>
  props.sortierung.richtung === 'aufsteigend'
    ? 'Aufsteigend sortiert — zu absteigend wechseln'
    : 'Absteigend sortiert — zu aufsteigend wechseln',
)

// Trefferzahl als Paar von Anfang an (design_notes PO-2026-09-07-003): gleich
// -> „N Orte", sonst -> „M von N Orten" — damit muss -004 beim Einführen des
// Tag-Filters nur noch `angezeigt` von `gesamt` abweichen lassen, kein
// Umbau eines reinen Gesamtzählers.
const trefferzahlText = computed(() => {
  if (props.angezeigt === props.gesamt) {
    return `${props.angezeigt} ${props.angezeigt === 1 ? 'Ort' : 'Orte'}`
  }
  return `${props.angezeigt} von ${props.gesamt} ${props.gesamt === 1 ? 'Ort' : 'Orten'}`
})

function aufKriteriumGewaehlt(kriterium: SortierKriterium): void {
  sheetOffen.value = false
  emit('kriterium-gewaehlt', kriterium)
}
</script>

<template>
  <div class="werkzeugleiste">
    <div class="werkzeugleiste__zeile werkzeugleiste__zeile--eins">
      <div class="werkzeugleiste__sortierung">
        <button
          type="button"
          class="werkzeugleiste__chip"
          aria-haspopup="dialog"
          @click="sheetOffen = true"
        >
          {{ SORTIER_KRITERIUM_LABEL[sortierung.kriterium] }}
        </button>
        <button
          type="button"
          class="werkzeugleiste__richtung"
          :aria-label="richtungsLabel"
          @click="emit('richtung-umschalten')"
        >
          <IconArrowUp
            :size="18"
            class="werkzeugleiste__richtung-icon"
            :class="{ 'werkzeugleiste__richtung-icon--absteigend': sortierung.richtung === 'absteigend' }"
          />
        </button>
      </div>

      <p class="werkzeugleiste__trefferzahl">
        {{ trefferzahlText }}
      </p>
    </div>

    <div
      v-if="$slots['zeile-2']"
      class="werkzeugleiste__zeile werkzeugleiste__zeile--zwei"
    >
      <slot name="zeile-2" />
    </div>

    <Sheet
      :offen="sheetOffen"
      label="Sortierung wählen"
      @schliessen="sheetOffen = false"
    >
      <h2 class="sortier-sheet__titel">
        Sortierung
      </h2>

      <div class="sortier-sheet__gruppe">
        <p class="sortier-sheet__gruppentitel">
          Allgemein
        </p>
        <ul class="sortier-sheet__liste">
          <li
            v-for="kriterium in ALLGEMEIN_KRITERIEN"
            :key="kriterium"
          >
            <button
              type="button"
              class="sortier-sheet__eintrag"
              :class="{ 'sortier-sheet__eintrag--aktiv': kriterium === sortierung.kriterium }"
              @click="aufKriteriumGewaehlt(kriterium)"
            >
              {{ SORTIER_KRITERIUM_LABEL[kriterium] }}
            </button>
          </li>
        </ul>
      </div>

      <div class="sortier-sheet__gruppe">
        <p class="sortier-sheet__gruppentitel">
          Einzelachse
        </p>
        <ul class="sortier-sheet__liste">
          <li
            v-for="kriterium in ACHSEN_KRITERIEN"
            :key="kriterium"
          >
            <button
              type="button"
              class="sortier-sheet__eintrag"
              :class="{ 'sortier-sheet__eintrag--aktiv': kriterium === sortierung.kriterium }"
              @click="aufKriteriumGewaehlt(kriterium)"
            >
              {{ SORTIER_KRITERIUM_LABEL[kriterium] }}
            </button>
          </li>
        </ul>
      </div>
    </Sheet>
  </div>
</template>

<style scoped>
.werkzeugleiste {
  position: sticky;
  top: 0;
  z-index: 5;
  margin: 0 calc(var(--space-16) * -1) var(--space-16);
  padding: var(--space-8) var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  background-color: var(--surface);
}

.werkzeugleiste__zeile--eins {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
}

.werkzeugleiste__sortierung {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-width: 0;
}

.werkzeugleiste__chip {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: var(--space-4) var(--space-12);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background-color: var(--surface-muted);
  color: var(--text);
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  cursor: pointer;
}

.werkzeugleiste__chip:hover {
  background-color: var(--color-primary-50);
}

.werkzeugleiste__richtung {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-8);
  background-color: transparent;
  color: var(--text);
  cursor: pointer;
}

.werkzeugleiste__richtung:hover {
  background-color: var(--surface-muted);
}

.werkzeugleiste__richtung-icon {
  transition: transform var(--duration-180) var(--ease-out);
}

.werkzeugleiste__richtung-icon--absteigend {
  transform: rotate(180deg);
}

.werkzeugleiste__trefferzahl {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: var(--font-size-14);
  white-space: nowrap;
}

.werkzeugleiste__zeile--zwei {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.sortier-sheet__titel {
  margin-bottom: var(--space-16);
  font-size: var(--font-size-20);
}

.sortier-sheet__gruppe + .sortier-sheet__gruppe {
  margin-top: var(--space-16);
}

.sortier-sheet__gruppentitel {
  margin-bottom: var(--space-8);
  color: var(--text-muted);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sortier-sheet__liste {
  display: flex;
  flex-direction: column;
}

.sortier-sheet__eintrag {
  width: 100%;
  min-height: 44px;
  padding: var(--space-8) var(--space-12);
  border: none;
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--text);
  font-size: var(--font-size-16);
  text-align: left;
  cursor: pointer;
}

.sortier-sheet__eintrag:hover {
  background-color: var(--surface-muted);
}

.sortier-sheet__eintrag--aktiv {
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
  font-weight: var(--font-weight-medium);
}
</style>

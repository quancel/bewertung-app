<script setup lang="ts">
/**
 * Werkzeugleiste der Ortsliste (PO-2026-09-07-003, geteilt mit -004/-006,
 * code-conventions.md „Ein Baustein, in den ein anderer Context
 * hineinreicht, bekommt einen benannten Slot statt eines Imports"):
 * besitzt den zweizeiligen Rahmen und den kompletten Inhalt von Zeile 1 —
 * Sortier-Chip (aktuelles Kriterium als Text), direkt angehängter
 * Icon-Button für die Richtung (eigener Tap), die Trefferzahl sowie GANZ
 * RECHTS der Ansichtsumschalter Liste/Karte (PO-2026-09-07-006,
 * ADR-0019). Zeile 2 ist der benannte Slot `zeile-2`, gefüllt von
 * `Ortebereich.vue`. Ein leerer Slot wird nicht gerendert (ADR-0013) — so
 * ist „Bestand ohne Tags → Zeile 2 entfällt" (-004) strukturell erfüllt,
 * ohne dass diese Komponente `tags` kennen müsste. Präsentational, kennt
 * keinen Store — Sortierung UND Ansichtswechsel ändern sich ausschließlich
 * über Emits (Constraint UMSCHALTER, PO-2026-09-07-006): diese Komponente
 * bleibt store- UND routerfrei, `Ortebereich.vue` führt den `router.push`
 * aus.
 *
 * Dieselbe Komponente steht unverändert in BEIDEN Ansichten desselben
 * Bereichs (design-conventions.md „Ansichtswechsel innerhalb eines
 * Bereichs"): in der Listenansicht oben in der ~400px schmalen
 * Listen-Spalte, in der Kartenansicht über die volle Inhaltsbreite
 * (ADR-0019 Punkt 5) — keine zweite Werkzeugleisten-Variante. Was sich
 * unterscheidet, ist ausschließlich der Wortlaut der Trefferzahl (Prop
 * `ansicht`, siehe unten).
 *
 * Bedienform der sieben Kriterien (design_notes PO-2026-09-07-003): Tippen
 * auf den Chip öffnet ein Sheet (`Sheet.vue` aus -001, wiederverwendet),
 * gruppiert unter „Allgemein" und „Einzelachse". Auswahl wirkt sofort und
 * schließt das Sheet, kein „Anwenden"-Button. Aktive Auswahl als
 * Zeilen-Highlight in `--color-primary-50`. In der Kartenansicht bleiben
 * Sortier-Chip und Richtungs-Button sichtbar und bedienbar, obwohl dort
 * ohne sichtbare Wirkung (design-conventions.md „Karte") — diese Komponente
 * unterscheidet nicht danach, `Ortebereich.vue` wertet `sortierErgebnis` in
 * der Kartenansicht schlicht nicht aus (ADR-0019 Punkt 9).
 *
 * Sticky-Kopf der Listen-Spalte (ADR-0011 Punkt 6, ADR-0012): `position:
 * sticky; top: 0` auf der Wurzel — ab `lg` klebt das INNERHALB des
 * scrollenden Spaltenelements (`.master-detail__liste`, `overflow-y:
 * auto`), unterhalb `lg` klebt es am scrollenden Fenster (kein `overflow`
 * auf einem Vorfahren dazwischen).
 *
 * Container Query auf Zeile 1 (NEU seit PO-2026-09-07-006,
 * design-conventions.md „Karte" -> „Trefferzahl" -> „Platz"): Die frühere
 * Einschätzung „passt in jeder Breite ohne Umbruch" galt nur für die
 * ~368px Inhaltsbreite der Listen-Spalte. Die Kartenansicht hat dagegen die
 * volle Inhaltsbreite (ADR-0019 Punkt 5) — auf einem schmalen Telefon kann
 * das WENIGER Platz sein als die Listen-Spalte selbst, und der lange
 * Kartenwortlaut („128 von 128 Orten mit Koordinaten") passt dort nicht
 * mehr ohne Umbruch. `.werkzeugleiste` ist deshalb jetzt selbst ein
 * `@container`-Kontext (ADR-0012): unterhalb 768px Containerbreite
 * (`--breakpoint-md`, als Zahl wörtlich — Custom Properties werten
 * `@container`-Bedingungen nicht aus, ADR-0012 Punkt 5) zeigt die
 * Trefferzahl ihre Kurzform.
 */
import { computed, ref } from 'vue'
import IconArrowUp from '../../../shared/ui/icons/IconArrowUp.vue'
import IconKarte from '../../../shared/ui/icons/IconKarte.vue'
import IconList from '../../../shared/ui/icons/IconList.vue'
import IconStecknadel from '../../../shared/ui/icons/IconStecknadel.vue'
import {
  ACHSEN_KRITERIEN,
  ALLGEMEIN_KRITERIEN,
  SORTIER_KRITERIUM_LABEL,
  type OrteSortierung,
  type SortierKriterium,
} from '../model/ansicht'
import { formatiereKartenTrefferzahl, formatiereListenTrefferzahl } from '../lib/trefferzahlFormat'
import type { OrteAnsicht } from '../lib/ansichtAusAdresse'
import Sheet from '../../../shared/ui/Sheet.vue'

const props = defineProps<{
  sortierung: OrteSortierung
  /** Anzahl der aktuell angezeigten Orte (nach Filterstufe). In der
   * Kartenansicht ist das die „gefilterte" Zahl aus der
   * Zwei-Zahlen-Trefferzahl (Nutzerentscheidung 2026-09-11). */
  angezeigt: number
  /** Gesamtzahl der Orte im Bestand, unabhängig vom Filter. */
  gesamt: number
  /** Aktive Ansicht (PO-2026-09-07-006, ADR-0019) — bestimmt Wortlaut der
   * Trefferzahl und Zustand/Ziel des Ansichtsumschalters. */
  ansicht: OrteAnsicht
  /** Nur in der Kartenansicht gesetzt: Anzahl der tatsächlich gezeichneten
   * Marker (Orte mit beiden Koordinaten) unter den `angezeigt` gefilterten
   * Orten. `undefined` in der Listenansicht. */
  sichtbarAufKarte?: number
}>()

const emit = defineEmits<{
  'kriterium-gewaehlt': [kriterium: SortierKriterium]
  'richtung-umschalten': []
  /** Meldet den Wunsch, die Ansicht zu wechseln — `Ortebereich.vue`
   * entscheidet Ziel-Adresse und führt den `router.push` aus (Constraint
   * UMSCHALTER: diese Komponente bleibt routerfrei). */
  'ansicht-umschalten': []
}>()

const sheetOffen = ref(false)

const richtungsLabel = computed(() =>
  props.sortierung.richtung === 'aufsteigend'
    ? 'Aufsteigend sortiert — zu absteigend wechseln'
    : 'Absteigend sortiert — zu aufsteigend wechseln',
)

const ansichtUmschalterLabel = computed(() =>
  props.ansicht === 'liste'
    ? 'Listenansicht aktiv — zur Kartenansicht wechseln'
    : 'Kartenansicht aktiv — zur Listenansicht wechseln',
)

/**
 * Trefferzahl-Wortlaut (design-conventions.md „Listen: Sortieren, Filtern,
 * Gruppierung" und „Karte" -> „Trefferzahl"): In der Kartenansicht mit
 * bekanntem `sichtbarAufKarte` gilt die Zwei-Zahlen-Form (Nutzerentscheidung
 * 2026-09-11), sonst die gewöhnliche Listen-Form — reine Funktionen aus
 * `../lib/trefferzahlFormat.ts`, hier nur noch ausgewählt.
 */
const trefferzahlText = computed(() => {
  if (props.ansicht === 'karte' && props.sichtbarAufKarte !== undefined) {
    return formatiereKartenTrefferzahl(props.sichtbarAufKarte, props.angezeigt, props.gesamt)
  }
  return formatiereListenTrefferzahl(props.angezeigt, props.gesamt)
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

      <div class="werkzeugleiste__rechts">
        <p
          class="werkzeugleiste__trefferzahl"
          :aria-label="trefferzahlText.lang"
        >
          <span class="werkzeugleiste__trefferzahl-lang">{{ trefferzahlText.lang }}</span>
          <span class="werkzeugleiste__trefferzahl-kurz">
            <IconStecknadel
              v-if="trefferzahlText.kartenKurzform"
              :size="12"
              class="werkzeugleiste__trefferzahl-pin"
            />{{ trefferzahlText.kurz }}
          </span>
        </p>

        <button
          type="button"
          class="werkzeugleiste__ansicht-umschalten"
          :aria-label="ansichtUmschalterLabel"
          @click="emit('ansicht-umschalten')"
        >
          <IconKarte
            v-if="ansicht === 'liste'"
            :size="20"
          />
          <IconList
            v-else
            :size="20"
          />
        </button>
      </div>
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
  /* ADR-0012: eigener Container statt Fensterbreite — Zeile 1 muss sowohl
     in der ~368px schmalen Listen-Spalte als auch über die volle
     Inhaltsbreite der Kartenansicht funktionieren (PO-2026-09-07-006). */
  container-type: inline-size;
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

/* Rechte Gruppe aus Zeile 1: Trefferzahl + Ansichtsumschalter, gemeinsam
   fest am rechten Rand (design-conventions.md „Ansichtsumschalter") — die
   Trefferzahl rückt dafür einen Schritt nach innen, der Umschalter besetzt
   den äußersten rechten Platz. */
.werkzeugleiste__rechts {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  flex-shrink: 0;
}

.werkzeugleiste__trefferzahl {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: var(--font-size-14);
  white-space: nowrap;
}

/* Kurzform-Umschaltung (design-conventions.md „Karte" -> „Trefferzahl" ->
   „Platz"): Lang- und Kurzform stehen beide im DOM, `aria-label` am
   `<p>`-Element trägt den vollen Wortlaut unabhängig von der visuellen
   Form (siehe Template) — CSS entscheidet nur, welche sichtbar ist. */
.werkzeugleiste__trefferzahl-kurz {
  display: none;
  align-items: center;
  gap: var(--space-4);
}

.werkzeugleiste__trefferzahl-pin {
  color: var(--text-muted);
}

/* 768px = --breakpoint-md, wörtlich (ADR-0012 Punkt 5: Custom Properties
   werden in @container-Bedingungen nicht ausgewertet). */
@container (max-width: 767px) {
  .werkzeugleiste__trefferzahl-lang {
    display: none;
  }

  .werkzeugleiste__trefferzahl-kurz {
    display: inline-flex;
  }
}

.werkzeugleiste__ansicht-umschalten {
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

.werkzeugleiste__ansicht-umschalten:hover {
  background-color: var(--surface-muted);
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

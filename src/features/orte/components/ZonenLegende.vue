<script setup lang="ts">
/**
 * Legende der Ortsliste (PO-2026-09-27-003, ADR-0034, design-conventions.md
 * „Ortsliste: Zonenfarben und Hervorhebungs-Schatten"): präsentational, kein
 * Store, kein Router. Öffnet die bestehende `Sheet.vue`-Chrome (wie das
 * Sortierungs-Sheet in `Werkzeugleiste.vue`), kein neues Popover-Muster.
 * `Sheet.vue` hat selbst keinen Schließen-Button — die Aktionszeile hier
 * folgt dem Muster aus `OrtAnlegenSheet.vue`.
 *
 * Ort im Baum (Constraint EINBINDUNG): `Ortebereich.vue` bindet diese
 * Komponente ausschließlich in die beiden Listen-Kopfzeilen ein (Master-
 * Detail-Liste und der Null-Treffer-Zustand) — nicht im Kopf der
 * Kartenansicht (dort gibt es keine Zeilen, also nichts zu erklären).
 */
import { computed, ref } from 'vue'
import { formatiereGesamtnote } from '../../../shared/lib/gesamtnote'
import Sheet from '../../../shared/ui/Sheet.vue'
import TextButton from '../../../shared/ui/TextButton.vue'
import { GESCHMACK_NAME, PREIS_LEISTUNG_NAME, ZONEN } from '../lib/zonen'

const props = defineProps<{
  /** Name des aktiven Gewichtungs-Szenarios, `null` bei Ausgewogen
   * (PO-2026-11-24-001): Der Erklärsatz nennt ihn nur bei Abweichung. */
  gewichtungName?: string | null
}>()

const offen = ref(false)

/** „ (Fokus Geschmack)" bei abweichender Gewichtung, sonst leer. */
const gewichtungZusatz = computed(() => (props.gewichtungName ? ` (${props.gewichtungName})` : ''))
</script>

<template>
  <!-- Beschrifteter Auslöser (PO-2026-11-24-007): sichtbarer Text „Legende",
       kein Icon — ein Icon ohne Text wurde nicht als Legende erkannt.
       `aria-label` enthält den sichtbaren Text (WCAG 2.5.3). -->
  <TextButton
    type="button"
    class="zonen-legende__knopf"
    aria-label="Legende der Zonenfarben und Hervorhebungen"
    aria-haspopup="dialog"
    @click="offen = true"
  >
    Legende
  </TextButton>

  <Sheet
    :offen="offen"
    label="Legende der Zonenfarben und Hervorhebungen"
    @schliessen="offen = false"
  >
    <h2 class="zonen-legende__titel">
      Zonenfarben und Hervorhebungen
    </h2>
    <p class="zonen-legende__erklaerung">
      Gefärbt wird der angezeigte Wert: die Gesamtnote{{ gewichtungZusatz }} bzw. der
      Wert der Achse, nach der du sortierst.
      Ab 8,0 färbt er sich in fünf Stufen; hohe Werte bei Geschmack oder
      Preis-Leistung bekommen zusätzlich einen Schatten.
    </p>

    <ul class="zonen-legende__zonen">
      <li
        v-for="zone in ZONEN"
        :key="zone.schluessel"
        class="zonen-legende__zone"
        :style="{ '--zonen-legende-zonenfarbe': `var(${zone.tokenName})` }"
      >
        <span class="zonen-legende__plakette">{{ formatiereGesamtnote(zone.untergrenzeZehntel) }}</span>
        <span
          class="zonen-legende__spur"
          aria-hidden="true"
        >
          <span
            class="zonen-legende__fuellung"
            :style="{ width: `${zone.untergrenzeZehntel}%` }"
          />
        </span>
        <span>{{ zone.beschriftung }}</span>
      </li>
    </ul>

    <div class="zonen-legende__vorschauen">
      <div class="zonen-legende__vorschau zonen-legende__vorschau--schwach">
        {{ GESCHMACK_NAME }} ab 9
      </div>
      <div class="zonen-legende__vorschau zonen-legende__vorschau--stark">
        {{ PREIS_LEISTUNG_NAME }} ab 9
      </div>
    </div>

    <div class="zonen-legende__aktionen">
      <TextButton
        type="button"
        @click="offen = false"
      >
        Schließen
      </TextButton>
    </div>
  </Sheet>
</template>

<style scoped>
/* Doppelte Klasse statt einer: gleiche Spezifität wie `.text-button` aus
   `TextButton.vue` hinge sonst von der Reihenfolge im Bundle ab. */
.text-button.zonen-legende__knopf {
  flex-shrink: 0;
  min-width: 44px;
  padding: var(--space-8);
  font-size: var(--font-size-14);
  /* Der Text bricht nie innerhalb des Buttons um (pruefeButtonTextUmbruch). */
  white-space: nowrap;
}

.zonen-legende__titel {
  margin-bottom: var(--space-16);
  font-size: var(--font-size-20);
}

.zonen-legende__erklaerung {
  margin-bottom: var(--space-16);
  color: var(--text);
  font-size: var(--font-size-14);
}

.zonen-legende__zonen {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-bottom: var(--space-16);
}

.zonen-legende__zone {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  color: var(--text);
  font-size: var(--font-size-14);
}

/* Plakette, Balken und Schatten wie in `Ortszeile.vue`: dieselben Tokens
   (Zonenfarbe kommt als Custom Property aus der ZONEN-Tabelle), keine Kopie
   der Farbwerte. */
.zonen-legende__plakette {
  flex-shrink: 0;
  min-width: 48px;
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-8);
  background-color: var(--zonen-legende-zonenfarbe);
  color: var(--color-neutral-0);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.zonen-legende__spur {
  display: inline-block;
  width: 64px;
  height: 8px;
  flex-shrink: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background-color: var(--surface);
  overflow: hidden;
}

.zonen-legende__fuellung {
  display: block;
  height: 100%;
  border-radius: var(--radius-full);
  background-color: var(--zonen-legende-zonenfarbe);
}

.zonen-legende__vorschauen {
  display: flex;
  gap: var(--space-8);
  margin-bottom: var(--space-16);
}

.zonen-legende__vorschau {
  flex: 1;
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-12);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-14);
  text-align: center;
}

.zonen-legende__vorschau--schwach {
  box-shadow: var(--shadow-hervorhebung-schwach);
}

.zonen-legende__vorschau--stark {
  box-shadow: var(--shadow-hervorhebung-stark);
}

.zonen-legende__aktionen {
  display: flex;
  justify-content: flex-end;
}
</style>

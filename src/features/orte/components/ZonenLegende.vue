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
import { ref } from 'vue'
import IconInfo from '../../../shared/ui/icons/IconInfo.vue'
import Sheet from '../../../shared/ui/Sheet.vue'
import TextButton from '../../../shared/ui/TextButton.vue'
import { GESCHMACK_NAME, PREIS_LEISTUNG_NAME, ZONEN } from '../lib/zonen'

const offen = ref(false)
</script>

<template>
  <button
    type="button"
    class="zonen-legende__knopf"
    aria-label="Zonenfarben und Hervorhebungen erklären"
    aria-haspopup="dialog"
    @click="offen = true"
  >
    <IconInfo :size="20" />
  </button>

  <Sheet
    :offen="offen"
    label="Zonenfarben und Hervorhebungen erklären"
    @schliessen="offen = false"
  >
    <h2 class="zonen-legende__titel">
      Zonenfarben und Hervorhebungen
    </h2>
    <p class="zonen-legende__erklaerung">
      Der angezeigte Wert einer Zeile färbt sich ab 8,0 in fünf Stufen; hohe
      Werte bei Geschmack oder Preis-Leistung bekommen zusätzlich einen
      Schatten.
    </p>

    <ul class="zonen-legende__zonen">
      <li
        v-for="zone in ZONEN"
        :key="zone.schluessel"
        class="zonen-legende__zone"
      >
        <span
          class="zonen-legende__farbfeld"
          :style="{ backgroundColor: `var(${zone.tokenName})` }"
        />
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
.zonen-legende__knopf {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.zonen-legende__knopf:hover {
  background-color: var(--surface-muted);
  color: var(--text);
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

.zonen-legende__farbfeld {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  /* 4px liegt nicht in der Radius-Skala (tokens.css: 8/12/16/full) — lokaler
     Wert mit Verweis statt eines neuen Tokens (Constraint LEGENDE). */
  border-radius: 4px;
}

.zonen-legende__vorschauen {
  display: flex;
  gap: var(--space-8);
  margin-bottom: var(--space-16);
}

.zonen-legende__vorschau {
  flex: 1;
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-8);
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

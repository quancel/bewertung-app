<script setup lang="ts">
/**
 * MasterDetail — zustandsloser Layout-Baustein für die Zweispaltigkeit ab
 * `lg` (ADR-0011, PO-2026-09-07-012). Kennt weder Orte noch Karte, hält
 * keinen eigenen Zustand und bindet keinen Store an: zwei Slots (`liste`,
 * `detail`) plus das Flag `detailOffen`, das steuert, welcher Slot
 * unterhalb `lg` sichtbar ist. Die Bereichsansicht (`Ortebereich.vue`,
 * künftig `Kartenbereich.vue`) entscheidet, was in die Slots kommt und
 * leitet `detailOffen` ausschließlich aus `route.params` ab (ADR-0011
 * Punkt 4) — dieser Baustein selbst kennt keine Route.
 *
 * Beide Slot-Inhalte bleiben unterhalb `lg` im DOM gemountet (nur per CSS
 * `display` ausgeblendet, kein `v-if`): ein Wechsel der Fensterbreite bei
 * offenem Detail bleibt dadurch ein reiner CSS-Layoutwechsel (ADR-0011
 * Punkt 5, ADR-0012) — kein Aus-/Einhängen, kein Refetch, kein Sprung der
 * Listen-Scrollposition.
 *
 * Ab `lg` (1024px, siehe --breakpoint-lg — Custom Properties werten in
 * @media nicht aus) sind beide Spalten gleichzeitig sichtbar, unabhängig
 * vom Flag `detailOffen`, und scrollen unabhängig voneinander (ADR-0011
 * Punkt 6): die Wurzel bekommt eine feste Höhe von einer vollen
 * Viewporthöhe (dieser Block sitzt ohne Chrome oberhalb von ihm exakt am
 * oberen Fensterrand — Nav-Rail und Bottom-Tabs sind `position: fixed` und
 * nehmen daher keinen Platz im Fluss ein), die Spalten scrollen intern.
 * Unterhalb `lg` scrollt weiterhin das Fenster wie gehabt.
 */
defineProps<{
  /** Entspricht "ist eine Detailadresse aktiv" — unabhängig davon, ob sie
   * sich auf einen vorhandenen Datensatz auflöst (ADR-0011 Punkt 4). */
  detailOffen: boolean
}>()
</script>

<template>
  <div
    class="master-detail"
    :class="{ 'master-detail--detail-offen': detailOffen }"
  >
    <div class="master-detail__liste">
      <slot name="liste" />
    </div>
    <div class="master-detail__detail">
      <slot name="detail" />
    </div>
  </div>
</template>

<style scoped>
.master-detail {
  max-width: var(--container-max-width);
  margin: 0 auto;
}

.master-detail__detail {
  display: none;
}

.master-detail--detail-offen .master-detail__liste {
  display: none;
}

.master-detail--detail-offen .master-detail__detail {
  display: block;
}

/* Ab lg (1024px, siehe --breakpoint-lg): beide Spalten gleichzeitig,
   unabhängig von `detailOffen` — reiner CSS-Layoutwechsel bei gleicher
   Adresse (ADR-0011). Spaltenbreiten/-abstand als Tokens (ADR-0012):
   Listen-Spalte --listen-spalte-breite (~400px), Abstand --space-24,
   Detail-Spalte nimmt den Rest mit min-width: 0, damit sie schrumpfen darf
   (ADR-0012 Punkt 4) statt von ihrem Inhalt aufgedrückt zu werden. */
@media (min-width: 1024px) {
  .master-detail {
    display: grid;
    grid-template-columns: var(--listen-spalte-breite) minmax(0, 1fr);
    align-items: start;
    gap: var(--space-24);
    height: 100vh;
  }

  .master-detail__liste,
  .master-detail__detail {
    display: block;
    min-width: 0;
    height: 100%;
    overflow-y: auto;
  }

  .master-detail__liste {
    border-right: 1px solid var(--border);
  }
}
</style>

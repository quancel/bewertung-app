<script setup lang="ts">
/**
 * Bilder-Raster (design_notes PO-2026-09-07-005): responsives Grid, jede
 * Kachel 4:3/Radius 12px/`object-fit: cover` (an `Bildkachel.vue`
 * delegiert). „Bild hinzufügen" bleibt als eigene Kachel am Ende des
 * Rasters sichtbar — auch wenn `bilder` leer ist, ist damit „leeres Raster"
 * strukturell erfüllt, ohne eigenen Leerzustands-Zweig (kein
 * Platzhaltertext, keine Illustration, design-conventions.md „Bilder").
 * Rein präsentational, kennt keinen Store.
 *
 * Spaltenzahl (ADR-0012, Constraint PO-2026-09-07-005): richtet sich nach
 * der Breite DIESES Rasters selbst, nicht nach dem Fenster. Der Umbruch
 * steht deshalb hier als `@container`, nicht auf `Bilderbereich.vue` (das
 * nur den Containment-Kontext setzt) — beide Umbruchgrenzen sind eigene,
 * für die Kachelgröße gewählte Werte, keine Wiederverwendung der
 * Viewport-Tokens `--breakpoint-md`/`-lg` (die beschreiben die Fensterbreite,
 * nicht die Breite dieses Rasters innerhalb der Detail-Spalte).
 */
import type { BildDatensatz } from '../../../persistence/schema'
import IconPlus from '../../../shared/ui/icons/IconPlus.vue'
import Bildkachel from './Bildkachel.vue'
import Ladeplatzhalter from './Ladeplatzhalter.vue'

defineProps<{
  bilder: BildDatensatz[]
  /** Anzahl der Dateien, die gerade verkleinert/gespeichert werden —
   * erscheinen als Platzhalter-Kacheln vor der „Hinzufügen"-Kachel. */
  inArbeitAnzahl: number
}>()

const emit = defineEmits<{
  'dateien-ausgewaehlt': [dateien: File[]]
  'bild-loeschen-angefragt': [id: string]
}>()

function aufDateiAuswahl(event: Event): void {
  const input = event.target as HTMLInputElement
  const dateien = input.files ? Array.from(input.files) : []
  if (dateien.length > 0) emit('dateien-ausgewaehlt', dateien)
  // Zurücksetzen, damit dieselbe Datei erneut auswählbar bleibt (sonst
  // feuert `change` bei identischer Auswahl kein zweites Mal).
  input.value = ''
}
</script>

<template>
  <div class="bilderraster">
    <Bildkachel
      v-for="bild in bilder"
      :key="bild.id"
      :bild="bild"
      @loeschen-angefragt="emit('bild-loeschen-angefragt', bild.id)"
    />

    <Ladeplatzhalter
      v-for="n in inArbeitAnzahl"
      :key="`in-arbeit-${n}`"
    />

    <label class="bilderraster__hinzufuegen">
      <span class="bilderraster__hinzufuegen-inhalt">
        <IconPlus :size="20" />
        Bild hinzufügen
      </span>
      <input
        type="file"
        accept="image/*"
        multiple
        class="bilderraster__datei-input"
        @change="aufDateiAuswahl"
      >
    </label>
  </div>
</template>

<style scoped>
.bilderraster {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-8);
}

/* Ab ~480px eigener Containerbreite (nicht Fensterbreite, ADR-0012) passen
   drei Kacheln ohne Quetschen — ein für diese Kachelgröße gewählter Wert,
   kein Bezug zu --breakpoint-md (Fensterbreite). */
@container (min-width: 480px) {
  .bilderraster {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Ab ~720px eigener Containerbreite passen vier Kacheln. */
@container (min-width: 720px) {
  .bilderraster {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Primär-Button-Farbsprache (design_notes: "Primär-Button", bleibt aber als
   Kachel im Raster statt als Pille) — Radius/Seitenverhältnis wie jede
   andere Kachel. */
.bilderraster__hinzufuegen {
  position: relative;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-12);
  background-color: var(--color-primary-600);
  color: var(--text-on-primary);
  cursor: pointer;
  transition: background-color var(--duration-120) var(--ease-out);
}

.bilderraster__hinzufuegen:hover {
  background-color: var(--color-primary-700);
}

.bilderraster__hinzufuegen-inhalt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
  text-align: center;
  pointer-events: none;
}

/* Der Datei-Input deckt die GESAMTE Kachel ab (statt visuell versteckt) —
   so liegt der native :focus-visible-Ring (base.css) sichtbar um die ganze
   Kachel, nicht um ein 1px-verstecktes Element. */
.bilderraster__datei-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
</style>

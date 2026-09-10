<script setup lang="ts">
/**
 * Tag-Filterleiste — Zeile 2 der Werkzeugleiste der Ortsliste
 * (PO-2026-09-07-004, ADR-0013/ADR-0014). Präsentational, kennt keinen
 * Store (code-conventions.md „components/ kennt keinen Store") — eingebunden
 * ausschließlich von `features/orte/views/Ortebereich.vue` in den Slot
 * `zeile-2` von `Werkzeugleiste.vue` (ADR-0013 Punkt 5). Diese Komponente
 * kennt `Werkzeugleiste.vue` selbst nicht.
 *
 * Drei Zonen (design_notes PO-2026-09-07-004): links fest der nicht
 * scrollende UND/ODER-Segment-Umschalter, mittig die horizontal scrollbare
 * Tag-Pill-Leiste (gesamtes Vokabular, aktive Tags hervorgehoben), rechts
 * bei aktivem Filter fest die Zurücksetzen-Aktion — nur die Pill-Leiste
 * scrollt. Der Umschalter ist immer Teil der Zeile, unabhängig von der
 * Anzahl aktiver Tags (design_notes) — kein Ein-/Ausblenden, kein
 * „deaktiviert"-Zustand.
 *
 * Ein Tap auf eine aktive Pill schaltet sie wieder aus (`tag-umschalten`) —
 * das ist zugleich der Weg, „einen einzelnen Tag aus dem aktiven Filter zu
 * entfernen, ohne den gesamten Filter zurückzusetzen".
 */
import IconKreuz from '../../../shared/ui/icons/IconKreuz.vue'
import type { TagVerknuepfung } from '../../orte/model/ansicht'

const props = defineProps<{
  /** Alphabetisch sortiertes, abgeleitetes Gesamtvokabular (ADR-0014). */
  vokabular: string[]
  aktiveTags: string[]
  verknuepfung: TagVerknuepfung
}>()

const emit = defineEmits<{
  'tag-umschalten': [tag: string]
  'verknuepfung-geaendert': [verknuepfung: TagVerknuepfung]
  zuruecksetzen: []
}>()

function istAktiv(tag: string): boolean {
  return props.aktiveTags.includes(tag)
}
</script>

<template>
  <div class="tag-filterleiste">
    <div
      class="tag-filterleiste__umschalter"
      role="group"
      aria-label="Verknüpfung der Tag-Auswahl"
    >
      <button
        type="button"
        class="tag-filterleiste__segment"
        :class="{ 'tag-filterleiste__segment--aktiv': verknuepfung === 'und' }"
        :aria-pressed="verknuepfung === 'und'"
        @click="emit('verknuepfung-geaendert', 'und')"
      >
        UND
      </button>
      <button
        type="button"
        class="tag-filterleiste__segment"
        :class="{ 'tag-filterleiste__segment--aktiv': verknuepfung === 'oder' }"
        :aria-pressed="verknuepfung === 'oder'"
        @click="emit('verknuepfung-geaendert', 'oder')"
      >
        ODER
      </button>
    </div>

    <div class="tag-filterleiste__pills">
      <button
        v-for="tag in vokabular"
        :key="tag"
        type="button"
        class="tag-filterleiste__pill"
        :class="{ 'tag-filterleiste__pill--aktiv': istAktiv(tag) }"
        :aria-pressed="istAktiv(tag)"
        @click="emit('tag-umschalten', tag)"
      >
        {{ tag }}
      </button>
    </div>

    <button
      v-if="aktiveTags.length > 0"
      type="button"
      class="tag-filterleiste__zuruecksetzen"
      aria-label="Filter zurücksetzen"
      @click="emit('zuruecksetzen')"
    >
      <IconKreuz :size="16" />
    </button>
  </div>
</template>

<style scoped>
.tag-filterleiste {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  width: 100%;
  min-width: 0;
}

.tag-filterleiste__umschalter {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: 32px;
  padding: 2px;
  border-radius: var(--radius-full);
  background-color: var(--surface-muted);
}

.tag-filterleiste__segment {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 var(--space-12);
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}

.tag-filterleiste__segment--aktiv {
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
}

.tag-filterleiste__pills {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.tag-filterleiste__pill {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--space-12);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background-color: var(--surface-muted);
  color: var(--text);
  font-size: var(--font-size-14);
  white-space: nowrap;
  cursor: pointer;
}

.tag-filterleiste__pill--aktiv {
  border-color: transparent;
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
}

.tag-filterleiste__zuruecksetzen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.tag-filterleiste__zuruecksetzen:hover {
  background-color: var(--surface-sunken);
  color: var(--text);
}
</style>

<script setup lang="ts">
/**
 * Hinweiszeile „Gesamtnote nach Gewichtung „{Name}“ · Ändern"
 * (PO-2026-11-24-001, design-conventions.md „Gewichtung der Gesamtnote",
 * Einstieg 3): steht zwischen Werkzeugleiste und Liste bzw. Karte und
 * erscheint NUR bei einem anderen Szenario als Ausgewogen — `Ortebereich.vue`
 * entscheidet das per `v-if`. Scrollt mit (nicht sticky). Präsentational.
 */
import TextButton from '../../../shared/ui/TextButton.vue'

defineProps<{ name: string }>()

const emit = defineEmits<{ aendern: [] }>()
</script>

<template>
  <p class="gewichtung-hinweis">
    <span class="gewichtung-hinweis__text">Gesamtnote nach Gewichtung „{{ name }}“</span>
    <!-- Trenner und Button umbrechen gemeinsam, nie ein einzelner Punkt in
         einer eigenen Zeile. -->
    <span class="gewichtung-hinweis__aktion">
      <span aria-hidden="true">·</span>
      <TextButton
        type="button"
        class="gewichtung-hinweis__aendern"
        @click="emit('aendern')"
      >
        Ändern
      </TextButton>
    </span>
  </p>
</template>

<style scoped>
.gewichtung-hinweis {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--space-4);
  margin-bottom: var(--space-8);
  color: var(--text-muted);
  font-size: var(--font-size-14);
}

/* 14px wie der Hinweistext; die Trefferfläche bleibt 44px hoch
   (TextButton). */
.gewichtung-hinweis__aktion {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.gewichtung-hinweis__aendern {
  padding: var(--space-8) var(--space-4);
  font-size: var(--font-size-14);
}

.gewichtung-hinweis__text {
  overflow-wrap: anywhere;
}
</style>

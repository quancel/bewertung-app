<script setup lang="ts">
/**
 * Vollflächige, nicht schließbare Sperrmeldung für die beiden Zustände, die
 * jeden Schreibzugriff verbieten (ADR-0004 Punkt 2, context-map.md):
 * unbekannte, neuere Formatversion und nicht verfügbarer Gerätespeicher.
 * Kommt aus `src/persistence/` (über `App.vue`), nicht aus einem Feature —
 * -011/-012 verzweigen später auf denselben Status, ohne aus `features/`
 * zu importieren.
 *
 * design_notes PO-2026-09-07-001 geben den Wortlaut für „version_zu_neu"
 * exakt vor. Für „speicher_nicht_verfuegbar" existiert noch kein
 * abgestimmter Text in design-conventions.md — hier in derselben Tonalität
 * (Deutsch, Du, Aktiv, keine Ausrufezeichen) formuliert; siehe
 * notes_for_learnings im Handoff zur Aufnahme dort.
 */
defineProps<{
  status: 'version_zu_neu' | 'speicher_nicht_verfuegbar'
}>()
</script>

<template>
  <div
    class="persistenz-meldung"
    role="alert"
  >
    <div class="persistenz-meldung__inhalt">
      <h1 class="persistenz-meldung__titel">
        <template v-if="status === 'version_zu_neu'">
          Bestand kann nicht geöffnet werden
        </template>
        <template v-else>
          Gerätespeicher nicht verfügbar
        </template>
      </h1>
      <p class="persistenz-meldung__text">
        <template v-if="status === 'version_zu_neu'">
          Diese Version kann deinen gespeicherten Bestand nicht öffnen. Es wurde
          nichts verändert.
        </template>
        <template v-else>
          Der Gerätespeicher ist auf diesem Gerät nicht verfügbar. Deine Orte
          können hier nicht gespeichert werden.
        </template>
      </p>
    </div>
  </div>
</template>

<style scoped>
.persistenz-meldung {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-24);
}

.persistenz-meldung__inhalt {
  max-width: 480px;
  text-align: center;
}

.persistenz-meldung__titel {
  margin-bottom: var(--space-12);
  color: var(--color-danger);
  font-size: var(--font-size-24);
}

.persistenz-meldung__text {
  color: var(--text);
  font-size: var(--font-size-16);
}
</style>

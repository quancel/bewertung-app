<script setup lang="ts">
/**
 * Token-Showcase — Dev-Werkzeug, nie im Produktions-Bundle (nur unter
 * import.meta.env.DEV geroutet, siehe app/router/index.ts). Importiert
 * bewusst nichts aus src/features/.
 *
 * Belegt, dass Tokens/semantische Ebene greifen: Fläche, Text, Rahmen und
 * ein Button. Nimmt außerdem das Muster für einen leeren Feldwert vorweg
 * (design_notes PO-2026-09-07-010), das PO-2026-09-07-001 wiederverwendet.
 */
import PrimaerButton from '../../shared/ui/PrimaerButton.vue'
import TextButton from '../../shared/ui/TextButton.vue'
</script>

<template>
  <main class="tokenschau">
    <h1 class="tokenschau__title">
      Token-Showcase
    </h1>
    <p class="tokenschau__intro">
      Dev-Werkzeug zum Prüfen der Design-Tokens. Diese Seite ist nie Teil des
      Produktions-Bundles.
    </p>

    <section class="beispielkarte">
      <h2 class="beispielkarte__ueberschrift">
        Beispielkarte
      </h2>
      <p class="beispielkarte__text">
        Fließtext auf der Standardfläche, in --text auf --surface.
      </p>
      <p class="beispielkarte__leerer-wert">
        noch nichts eingetragen
      </p>

      <div class="beispielkarte__aktionen">
        <PrimaerButton>Ort anlegen</PrimaerButton>
        <PrimaerButton disabled>
          Ort anlegen (deaktiviert)
        </PrimaerButton>
        <TextButton>Abbrechen</TextButton>
      </div>
    </section>
  </main>
</template>

<style scoped>
.tokenschau {
  padding: var(--space-24) var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.tokenschau__title {
  font-size: var(--font-size-30);
  font-weight: var(--font-weight-semibold);
  color: var(--text);
}

.tokenschau__intro {
  font-size: var(--font-size-16);
  color: var(--text-muted);
}

.beispielkarte {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-12);
  padding: var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.beispielkarte__ueberschrift {
  font-size: var(--font-size-20);
  font-weight: var(--font-weight-semibold);
  color: var(--text);
}

.beispielkarte__text {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-normal);
  color: var(--text);
}

.beispielkarte__leerer-wert {
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-normal);
  color: var(--text-muted);
  background-color: var(--surface-muted);
  border-radius: var(--radius-8);
  padding: var(--space-4) var(--space-8);
  width: fit-content;
}

.beispielkarte__aktionen {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-12);
  padding-top: var(--space-8);
}
</style>

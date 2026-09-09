<script setup lang="ts">
/**
 * Ortsliste (`/orte`). Bindet den Store an (code-conventions.md: „views/
 * binden Store an"). Kein sichtbarer Ladezustand (design-conventions.md,
 * „Lädt" — lokale Lesevorgänge gelten als synchron schnell genug): bis
 * `istGeladen` true ist, wird nichts gerendert, statt einer falschen
 * Zwischenanzeige des Leerzustands.
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PrimaerButton from '../../../shared/ui/PrimaerButton.vue'
import IconPlus from '../../../shared/ui/icons/IconPlus.vue'
import OrtAnlegenSheet from '../components/OrtAnlegenSheet.vue'
import Ortszeile from '../components/Ortszeile.vue'
import { useOrteStore } from '../stores/orte.store'

const store = useOrteStore()
const router = useRouter()
const sheetOffen = ref(false)

onMounted(() => {
  void store.sicherstellenGeladen()
})

async function aufAnlegen(bezeichnung: string): Promise<void> {
  const neuerOrt = await store.legeOrtAn(bezeichnung)
  sheetOffen.value = false
  await router.push(`/orte/${neuerOrt.id}`)
}
</script>

<template>
  <main
    v-if="store.istGeladen"
    class="ortsliste"
  >
    <div
      v-if="store.orte.length === 0"
      class="ortsliste__leer"
    >
      <h1 class="ortsliste__sr-titel">
        Orte
      </h1>
      <p class="ortsliste__leer-text">
        Noch keine Orte eingetragen
      </p>
      <PrimaerButton
        type="button"
        @click="sheetOffen = true"
      >
        Ort hinzufügen
      </PrimaerButton>
    </div>

    <template v-else>
      <div class="ortsliste__kopf">
        <h1 class="ortsliste__kopf-titel">
          Orte
        </h1>
        <PrimaerButton
          type="button"
          @click="sheetOffen = true"
        >
          <IconPlus :size="20" />
          Ort hinzufügen
        </PrimaerButton>
      </div>

      <ul class="ortsliste__liste">
        <li
          v-for="ort in store.orte"
          :key="ort.id"
        >
          <Ortszeile :ort="ort" />
        </li>
      </ul>
    </template>

    <OrtAnlegenSheet
      :offen="sheetOffen"
      @schliessen="sheetOffen = false"
      @anlegen="aufAnlegen"
    />
  </main>
</template>

<style scoped>
.ortsliste {
  max-width: 1120px;
  margin: 0 auto;
  padding: var(--space-16);
}

.ortsliste__sr-titel {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.ortsliste__leer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-16);
  padding: var(--space-64) var(--space-16);
  text-align: center;
}

.ortsliste__leer-text {
  color: var(--text);
  font-size: var(--font-size-16);
}

.ortsliste__kopf {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  margin-bottom: var(--space-16);
}

.ortsliste__kopf-titel {
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-semibold);
}

.ortsliste__liste {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>

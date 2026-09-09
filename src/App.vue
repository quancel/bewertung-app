<script setup lang="ts">
// Kein App-Layout/Navigationsrahmen in diesem Paket (Nicht-Ziel von
// PO-2026-09-07-010, weiterhin Nicht-Ziel von PO-2026-09-07-001) — der
// Rahmen kommt mit PO-2026-09-07-011.
//
// Was ab -001 hier hinzukommt: die Bestandsinitialisierung läuft vor dem
// ersten Lesezugriff eines Features (ADR-0004 Punkt 9). Liefert sie einen
// der beiden Sperrzustände, ersetzt die vollflächige Meldung den
// Routen-Host vollständig — kein Feature bekommt in diesem Fall je die
// Kontrolle.
import { onMounted, ref } from 'vue'
import { initialisiereBestand, type BestandInitErgebnis } from './persistence/init'
import PersistenzMeldung from './app/PersistenzMeldung.vue'

const initErgebnis = ref<BestandInitErgebnis | null>(null)

onMounted(async () => {
  initErgebnis.value = await initialisiereBestand()
})
</script>

<template>
  <PersistenzMeldung
    v-if="initErgebnis && initErgebnis.status !== 'bereit'"
    :status="initErgebnis.status"
  />
  <router-view v-else-if="initErgebnis" />
</template>

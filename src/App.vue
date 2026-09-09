<script setup lang="ts">
// App-Rahmen (PO-2026-09-07-011, ADR-0010): `App.vue` verzweigt VOR dem
// `<router-view>` — die Bestandsinitialisierung läuft vor dem ersten
// Lesezugriff eines Features (ADR-0004 Punkt 9). Liefert sie einen der
// beiden Sperrzustände, ersetzt die vollflächige Meldung den Routen-Host
// vollständig UND den App-Rahmen: kein `route.meta`-Flag für die
// Chrome-Frage, sonst fiele ein vergessenes Flag erst im Sperrfall auf.
// Sonst umschließt `AppRahmen` (Skip-Link, Bereichsnavigation,
// `<main id="main-content">`) das `<router-view>`.
import { onMounted, ref } from 'vue'
import { initialisiereBestand, type BestandInitErgebnis } from './persistence/init'
import PersistenzMeldung from './app/PersistenzMeldung.vue'
import AppRahmen from './app/layout/AppRahmen.vue'

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
  <AppRahmen v-else-if="initErgebnis">
    <router-view />
  </AppRahmen>
</template>

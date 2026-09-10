<script setup lang="ts">
/**
 * Anbindung des generierten Service Workers an den Toast-Baustein
 * (PO-2026-09-07-007, ADR-0015). Reine Verdrahtung — kein eigener Zustand
 * über das, was `useRegisterSW` liefert, hinaus.
 *
 * `registerType: 'prompt'` (vite.config.ts): `needRefresh` wird erst wahr,
 * wenn ein neuer Service Worker bereits in `waiting` steht. Der Klick auf
 * „Jetzt laden" ruft `updateServiceWorker()` auf — das schickt die
 * Skip-Waiting-Nachricht an genau diesen wartenden Worker, der daraufhin
 * aktiv wird und per `controllerchange` einen (dann durch die Nutzeraktion
 * gedeckten) Reload auslöst. Kein eigener `controllerchange`-Listener und
 * kein `skipWaiting` außerhalb dieses Klicks (ADR-0015 Punkt 5) — das
 * übernimmt `vite-plugin-pwa/vue` intern.
 *
 * `offlineReady` wird bewusst nicht angezeigt: design_notes nennen für die
 * erste Ladephase ausdrücklich „kein sichtbares Sonderverhalten".
 *
 * In `App.vue` außerhalb der Sperr-Verzweigung montiert (Nutzerentscheidung
 * 2026-09-10): sichtbar auch im vollflächigen Sperrzustand aus
 * `src/persistence/`, weil eine neue Version dort genau der Ausweg aus
 * „Bestand aus neuerer Formatversion" ist.
 */
import { useRegisterSW } from 'virtual:pwa-register/vue'
import Toast from '../shared/ui/Toast.vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()

function aufJetztLaden(): void {
  void updateServiceWorker()
}
</script>

<template>
  <Toast
    v-if="needRefresh"
    text="Eine neue Version ist bereit."
    aktionsbeschriftung="Jetzt laden"
    @klick="aufJetztLaden"
  />
</template>

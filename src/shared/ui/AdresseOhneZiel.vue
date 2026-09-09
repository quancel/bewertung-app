<script setup lang="ts">
/**
 * „Adresse ohne Ziel" — ein Text für zwei Ursachen, die zum
 * Anzeigezeitpunkt nicht sicher unterscheidbar sind (design_notes
 * PO-2026-09-07-011, design-conventions.md „Navigation & Routing"):
 * eine Adresse, die zu keinem Bereich gehört (Sammelroute
 * `adresse-ohne-ziel`), und eine Detailadresse zu einem nicht (mehr)
 * vorhandenen Ort (inkl. „Ort gelöscht, danach Browser-Zurück").
 *
 * Zwei Nutzer, beide außerhalb von `app/`: die Sammelroute im Router und
 * `features/orte/views/Ortsdetail.vue` bei unbekannter Ort-ID — deshalb hier
 * in `shared/ui/` (ADR-0010, code-conventions.md „Nach shared/ erst ab zwei
 * Nutzern"). `app-shell` importiert nicht aus `features/`, `features/`
 * nicht aus `app/`; dieser Ort ist der einzige Weg, der beide erreicht.
 *
 * Nennt bewusst keine Ursache, kein Konjunktiv. Rein typografisch wie andere
 * Leerzustände, zentriert; keine Fehler-/Warnfarbe, kein Alarm-Icon. Die
 * Navigation bleibt sichtbar — diese Komponente ersetzt nur den
 * Hauptinhalt, nie den App-Rahmen.
 */
import { useRouter } from 'vue-router'
import PrimaerButton from './PrimaerButton.vue'

const router = useRouter()

function aufZurOrtsliste(): void {
  void router.push('/orte')
}
</script>

<template>
  <div class="adresse-ohne-ziel">
    <p class="adresse-ohne-ziel__text">
      Diese Adresse führt zu keinem Inhalt.
    </p>
    <PrimaerButton
      type="button"
      @click="aufZurOrtsliste"
    >
      Zur Ortsliste
    </PrimaerButton>
  </div>
</template>

<style scoped>
.adresse-ohne-ziel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-16);
  padding: var(--space-64) var(--space-16);
  text-align: center;
}

.adresse-ohne-ziel__text {
  color: var(--text);
  font-size: var(--font-size-16);
}
</style>

/**
 * Netzzustand für genau zwei erlaubte Zwecke (ADR-0021 Punkt 2): einen
 * gemuteten Hinweis unmittelbar an einer netzabhängigen Bedienstelle
 * ein-/ausblenden, und das Wiederholen eines dort bereits sichtbar
 * fehlgeschlagenen Fremd-Abrufs. Kein Reload, keine Navigation, kein Toast,
 * kein globaler Offline-Balken, kein `disabled`-Feld, kein Store-Zustand
 * (ADR-0021 Punkt 3).
 *
 * `online.value === false` ist verlässlich und darf einen Vorab-Hinweis
 * auslösen, BEVOR ein Abruf überhaupt versucht wurde. `true` ist keine
 * Zusage, dass ein Host erreichbar ist — Fehlertexte kommen deshalb nie aus
 * diesem Composable, sondern aus dem tatsächlichen Abrufergebnis
 * (ADR-0021 Punkt 4, ADR-0020 Punkt 4).
 *
 * Zustandslos je Aufrufer, keine Singleton-Instanz (ADR-0021 Punkt 5): kein
 * Pinia-Store, kein globaler Listener in `main.ts`. Listener hängen an der
 * Lebensdauer der aufrufenden Komponente. Gemeinsame Stelle für `karte`
 * (PO-2026-09-07-006) und `orte` (PO-2026-09-07-008), deshalb hier unter
 * `shared/composables/` statt in einem der beiden Features.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useNetzzustand() {
  const online = ref(navigator.onLine)

  function aufOnline(): void {
    online.value = true
  }

  function aufOffline(): void {
    online.value = false
  }

  onMounted(() => {
    window.addEventListener('online', aufOnline)
    window.addEventListener('offline', aufOffline)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', aufOnline)
    window.removeEventListener('offline', aufOffline)
  })

  return { online }
}

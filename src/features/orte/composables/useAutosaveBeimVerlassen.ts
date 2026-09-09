/**
 * Registriert die beiden Auslöser aus ADR-0005, die kein DOM-Event am Feld
 * selbst sind: `visibilitychange` → `hidden` und `pagehide`. Beide sind der
 * Normalfall für „Tab geschlossen, ohne vorher wegzuklicken" — `blur` ist
 * dort nicht verlässlich. Bewusst **kein** `beforeunload` (ADR-0005).
 *
 * Der dritte und vierte Auslöser (Feld verlassen/Wert geändert, Route
 * verlassen) laufen direkt in der View: erster über `@blur`/`@change` an
 * den Feldern, zweiter über `onBeforeRouteLeave`.
 */
import { onBeforeUnmount, onMounted } from 'vue'

export function useAutosaveBeimVerlassen(schreibeJetzt: () => void): void {
  function aufSichtbarkeitswechsel(): void {
    if (document.visibilityState === 'hidden') {
      schreibeJetzt()
    }
  }

  function aufPagehide(): void {
    schreibeJetzt()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', aufSichtbarkeitswechsel)
    window.addEventListener('pagehide', aufPagehide)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', aufSichtbarkeitswechsel)
    window.removeEventListener('pagehide', aufPagehide)
  })
}

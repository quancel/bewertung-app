/**
 * Registriert die beiden Auslöser aus ADR-0005, die kein DOM-Event am Feld
 * selbst sind: `visibilitychange` → `hidden` und `pagehide`. Beide sind der
 * Normalfall für „Tab geschlossen, ohne vorher wegzuklicken" — `blur` ist
 * dort nicht verlässlich. Bewusst **kein** `beforeunload` (ADR-0005).
 *
 * Der dritte und vierte Auslöser (Feld verlassen/Wert geändert, Route
 * verlassen) laufen direkt in der View: erster über `@blur`/`@change` an
 * den Feldern, zweiter über `onBeforeRouteLeave`.
 *
 * Seit ADR-0030 (PO-2026-09-26-001) meldet der Callback zusätzlich, WELCHER
 * der beiden Auslöser feuerte (`'hintergrund'` für `visibilitychange`,
 * `'verlassen'` für `pagehide`) — die View braucht das, um vor dem
 * Persistieren `TagEingabe.uebernimmOffeneEingabe(anlass)` mit dem richtigen
 * `anlass` aufzurufen (steuert dort ausschließlich die Rückkehr-Markierung,
 * nie den Commit-Weg selbst). Seit ADR-0035 (PO-2026-09-27-004) ruft die View
 * über diesen Callback die breitere Orchestrierung
 * `uebernimmOffeneEingabenUndPersistiere` auf, die neben `TagEingabe` auch
 * alle vier `Bewertungsachse`-Instanzen abholt — `anlass` bleibt dabei
 * ausschließlich für `TagEingabe` relevant, `Bewertungsachse.uebernimmOffeneEingabe`
 * kennt den Parameter nicht (keine Rückkehr-Markierung dort, ADR-0035
 * Punkt 2).
 */
import { onBeforeUnmount, onMounted } from 'vue'

export function useAutosaveBeimVerlassen(schreibeJetzt: (anlass: 'hintergrund' | 'verlassen') => void): void {
  function aufSichtbarkeitswechsel(): void {
    if (document.visibilityState === 'hidden') {
      schreibeJetzt('hintergrund')
    }
  }

  function aufPagehide(): void {
    schreibeJetzt('verlassen')
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

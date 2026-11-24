/**
 * Verlaufseintrag OHNE eigene Adresse für einen modalen Vollbild-Zustand
 * (ADR-0036). Gehört `medien`, weil heute nur die Bildvorschau ihn braucht;
 * ein zweiter Dialog in einem anderen Context zieht ihn nach
 * `shared/composables/` um (ADR-0036 Punkt 4, ADR-0024).
 *
 * Mittel (vom Lead verifiziert, learnings.md 2026-09-15): `router.push` mit
 * unveränderter Adresse, `force: true` (sonst `NavigationDuplicated`) und
 * `state: { bildvorschau: true }`. vue-router legt den State in
 * `history.state` ab, `history.state.back` bleibt gesetzt
 * (`Ortebereich.aufZurueck()`), kein rohes `history.pushState`.
 *
 * Normative Eigenschaften (ADR-0036 Punkt 2):
 * (a) System-Zurück schließt nur den Dialog — `popstate` auf einen Eintrag
 *     OHNE Markierung;
 * (b) `schliesse()` ruft `router.back()` NUR, wenn der aktuelle Eintrag die
 *     Markierung trägt;
 * (c) Vorwärts/Neuladen auf einem markierten Eintrag öffnen nie: geöffnet
 *     wird ausschließlich durch `oeffne()`, der Zustand lebt in der
 *     aufrufenden Komponente, die Markierung ist kein Öffnungsbefehl.
 */
import { onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const MARKE = 'bildvorschau'

function eintragIstMarkiert(): boolean {
  const state = window.history.state as Record<string, unknown> | null
  return state?.[MARKE] === true
}

/**
 * @param beiSystemZurueck wird aufgerufen, wenn Zurück den markierten
 *   Eintrag verlassen hat — der Aufrufer schließt nur seinen Zustand.
 */
export function useVorschauVerlaufseintrag(beiSystemZurueck: () => void) {
  const router = useRouter()
  let lauscht = false

  function aufPopstate(): void {
    // Zurück auf den unmarkierten Eintrag darunter. Vorwärts auf einen
    // markierten Eintrag öffnet nichts (der Aufrufer hat dann `offen=false`).
    if (!eintragIstMarkiert()) {
      stoppeLauschen()
      beiSystemZurueck()
    }
  }

  function starteLauschen(): void {
    if (lauscht) return
    window.addEventListener('popstate', aufPopstate)
    lauscht = true
  }

  function stoppeLauschen(): void {
    if (!lauscht) return
    window.removeEventListener('popstate', aufPopstate)
    lauscht = false
  }

  /** Legt genau einen Eintrag mit unveränderter Adresse an. */
  async function oeffne(): Promise<void> {
    const aktuell = router.currentRoute.value
    await router.push({
      path: aktuell.path,
      query: aktuell.query,
      hash: aktuell.hash,
      state: { [MARKE]: true },
      force: true,
    })
    starteLauschen()
  }

  /** Schließt über „×"/Esc: den eigenen Eintrag wieder entfernen. */
  function schliesse(): void {
    stoppeLauschen()
    if (eintragIstMarkiert()) router.back()
  }

  /** Aushängen ohne Navigation (z. B. Komponente wird abgebaut). */
  function loese(): void {
    stoppeLauschen()
  }

  onBeforeUnmount(loese)

  return { oeffne, schliesse, loese }
}

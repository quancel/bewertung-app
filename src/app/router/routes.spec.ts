import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from './routes'

/**
 * Prüft nur die Adressauflösung (PO-2026-09-07-011, ADR-0010): dass die
 * Sammelroute wirklich alles Unbekannte fängt, dass sie als letzter Eintrag
 * steht und dass die bestehenden Adressen aus PO-2026-09-07-001 davon
 * unberührt bleiben. Läuft gegen `createMemoryHistory` statt gegen den
 * exportierten `router` (der `createWebHistory` nutzt und damit `window`
 * braucht — nicht vorhanden im Node-Testrunner).
 *
 * Bewusst nur `router.resolve()`, nie `router.push()`/`router.isReady()`:
 * Eine echte Navigation lädt die per `component: () => import(...)`
 * verknüpften `.vue`-Dateien nach — ohne `@vitejs/plugin-vue` in
 * `vitest.config.ts` (noch keine Component-Test-Infrastruktur, siehe
 * CLAUDE.md) würde das fehlschlagen. `resolve()` matcht nur die
 * Routendefinition, ohne eine Komponente zu laden.
 */
function erzeugeTestRouter() {
  return createRouter({ history: createMemoryHistory(), routes })
}

describe('app/router', () => {
  it('lässt die Sammelroute als letzten Eintrag stehen', () => {
    expect(routes.at(-1)?.name).toBe('adresse-ohne-ziel')
  })

  it('löst /orte weiterhin auf die Ortsliste auf', () => {
    const router = erzeugeTestRouter()
    expect(router.resolve('/orte').name).toBe('orte')
  })

  it('löst /orte/:ortId weiterhin auf die Detailansicht auf', () => {
    const router = erzeugeTestRouter()
    const aufgeloest = router.resolve('/orte/irgendeine-id')
    expect(aufgeloest.name).toBe('ort-detail')
    expect(aufgeloest.params.ortId).toBe('irgendeine-id')
  })

  it('fängt eine Adresse ohne zugehörigen Bereich', () => {
    const router = erzeugeTestRouter()
    expect(router.resolve('/nicht-vorhanden').name).toBe('adresse-ohne-ziel')
  })

  it('fängt eine tief verschachtelte, unbekannte Adresse', () => {
    const router = erzeugeTestRouter()
    expect(router.resolve('/a/b/c').name).toBe('adresse-ohne-ziel')
  })

  it('behält die Root-Weiterleitung auf /orte unverändert (seit PO-2026-09-07-001)', () => {
    expect(routes[0]).toMatchObject({ path: '/', redirect: '/orte' })
  })

  // PO-2026-09-07-006 (ADR-0019): Die Kartenansicht ist KEIN eigener
  // Routen-Eintrag, sondern derselbe Pfad `/orte` mit einem Query-Parameter.
  // Diese Tests sichern genau das ab — kein neuer Eintrag in `routes`, die
  // Query bleibt beim Auflösen erhalten.
  it('legt für die Kartenansicht KEINEN eigenen Routen-Eintrag an (ADR-0019)', () => {
    expect(routes.some((eintrag) => String(eintrag.path).includes('karte'))).toBe(false)
    expect(routes.some((eintrag) => eintrag.name === 'karte')).toBe(false)
  })

  it('löst /orte?ansicht=karte weiterhin auf die Ortsliste-Route auf, Query bleibt erhalten', () => {
    const router = erzeugeTestRouter()
    const aufgeloest = router.resolve('/orte?ansicht=karte')
    expect(aufgeloest.name).toBe('orte')
    expect(aufgeloest.query.ansicht).toBe('karte')
  })

  it('löst /orte mit unbekanntem ansicht-Wert weiterhin auf die Ortsliste-Route auf', () => {
    const router = erzeugeTestRouter()
    expect(router.resolve('/orte?ansicht=unbekannt').name).toBe('orte')
  })
})

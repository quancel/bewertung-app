import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/**
 * Feature-Routen kommen mit den jeweiligen Paketen (ab PO-2026-09-07-001)
 * hinzu. Dieses Paket (PO-2026-09-07-010) liefert bewusst keine
 * Navigationsstruktur und kein App-Layout — nur das Routing-Grundgerüst
 * plus die Dev-Route der Tokenschau.
 */
const routes: RouteRecordRaw[] = []

// Nur im Dev-Build registriert: `import.meta.env.DEV` wird von Vite beim
// Produktions-Build statisch durch `false` ersetzt, wodurch dieser Block
// samt dynamischem Import von Tokenschau.vue aus dem Produktions-Bundle
// herausfällt (code-conventions.md: app/dev/ nie ausgeliefert).
if (import.meta.env.DEV) {
  routes.push({
    path: '/dev/tokenschau',
    name: 'tokenschau',
    component: () => import('../dev/Tokenschau.vue'),
  })
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

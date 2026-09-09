import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/**
 * Feature-Routen kommen mit den jeweiligen Paketen hinzu. Adressschema
 * (code-conventions.md): `/<bereich>` für die Übersicht, `/<bereich>/:<id>`
 * für ein einzelnes Element. `/` leitet auf `/orte`. Kein App-Layout, keine
 * Navigationsleiste und keine Sammelroute für unbekannte Adressen hier —
 * das liefert PO-2026-09-07-011.
 */
const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/orte' },
  {
    path: '/orte',
    name: 'orte',
    component: () => import('../../features/orte/views/Ortsliste.vue'),
  },
  {
    path: '/orte/:ortId',
    name: 'ort-detail',
    component: () => import('../../features/orte/views/Ortsdetail.vue'),
  },
]

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

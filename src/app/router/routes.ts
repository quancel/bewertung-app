import type { RouteRecordRaw } from 'vue-router'

/**
 * Feature-Routen kommen mit den jeweiligen Paketen hinzu. Adressschema
 * (code-conventions.md): `/<bereich>` für die Übersicht, `/<bereich>/:<id>`
 * für ein einzelnes Element. `/` leitet auf `/orte`. `path` und `name` einer
 * einmal angelegten Route werden nie geändert.
 *
 * Die Sammelroute für unbekannte Adressen (`adresse-ohne-ziel`,
 * PO-2026-09-07-011) steht als LETZTER Eintrag — deshalb erst nach dem
 * bedingten Dev-Push angehängt, statt im Literal oben zu stehen. Sie zeigt
 * auf `shared/ui/AdresseOhneZiel.vue`, nicht auf eine Komponente in
 * `features/` oder `app/` (ADR-0010: `app-shell` importiert nicht aus
 * `features/`).
 *
 * In einem eigenen Modul, getrennt von `index.ts`: Diese Datei hat keinen
 * Modul-Seiteneffekt, der `window` braucht. `index.ts` baut daraus den
 * echten Router mit `createWebHistory` (braucht `window`) — `index.spec.ts`
 * importiert stattdessen nur `routes` und prüft die Adressauflösung gegen
 * eine `createMemoryHistory`, ohne `window` im Node-Testrunner zu brauchen
 * (vitest.config.ts, `environment: 'node'`).
 */
export const routes: RouteRecordRaw[] = [
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

// Muss der letzte Eintrag bleiben: `path: '/:pfad(.*)*'` fängt jede Adresse,
// die keiner der Routen oben entspricht — auch eine mit unbekannter
// Ort-ID bleibt bei 'ort-detail' stehen und rendert dort ihren eigenen
// Adresse-ohne-Ziel-Zustand (kein Redirect, siehe Ortsdetail.vue).
routes.push({
  path: '/:pfad(.*)*',
  name: 'adresse-ohne-ziel',
  component: () => import('../../shared/ui/AdresseOhneZiel.vue'),
})

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

// EIN Ladeaufruf, in BEIDEN Routen unten referenziert (ADR-0011,
// PO-2026-09-07-012): Zwei separate `() => import(...)`-Ausdrücke wären zwei
// unterschiedliche Funktionsreferenzen und `vue-router` würde den Wechsel
// zwischen `/orte` und `/orte/:ortId` dann als Aus-/Einhängen behandeln statt
// als Update derselben Komponenteninstanz — genau das, was ADR-0011 (eine
// Bereichsansicht, kein Aus-/Einhängen beim Adresswechsel) ausschließt.
const Ortebereich = () => import('../../features/orte/views/Ortebereich.vue')

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/orte' },
  {
    path: '/orte',
    name: 'orte',
    component: Ortebereich,
  },
  {
    path: '/orte/:ortId',
    name: 'ort-detail',
    component: Ortebereich,
  },
  // Neuer Bereich „Daten" (PO-2026-09-07-009, ADR-0017 Punkt 10): flache
  // Route, VOR der Sammelroute eingetragen. Einspaltig, kein `:id`-Pendant
  // (ADR-0011) — Export/Import sind zwei Aktionen, keine Detailansicht.
  {
    path: '/daten',
    name: 'daten',
    component: () => import('../../features/datensicherung/views/Datenbereich.vue'),
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

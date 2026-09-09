import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Rückkehr aus einer Detailansicht behält die Scrollposition der Liste
  // (Browser-Zurück wie App-eigene Zurück-Aktion); jede andere Navigation
  // beginnt am Seitenanfang.
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Rückkehr aus einer Detailansicht behält die Scrollposition der Liste
  // (Browser-Zurück wie App-eigene Zurück-Aktion); jede andere Navigation
  // beginnt am Seitenanfang.
  // Gleiche `fullPath` bei `to` und `from` (Verlaufseintrag ohne eigene
  // Adresse, ADR-0036 Punkt 3): kein Scroll, weder Rücksprung noch Anfang.
  // Gleicher `path` und gleicher `ansicht`-Wert (PO-2026-11-24-005, ADR-0039):
  // Öffnen, Wechsel und Schließen der Schnellansicht ändern nur den Parameter
  // `ort` derselben Ansicht und verschieben den Fenster-Scroll nicht. Liste <->
  // Karte (anderer `ansicht`-Wert) und jede andere Navigation bleiben unberührt.
  scrollBehavior(to, from, savedPosition) {
    if (to.fullPath === from.fullPath) return false
    if (to.path === from.path && to.query.ansicht === from.query.ansicht && to.name === from.name) return false
    return savedPosition ?? { top: 0 }
  },
})

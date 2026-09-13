import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Rein statisches Bundle (Nutzerentscheidung 2026-09-08: Auslieferung über
// statischen Host). Kein Server-Laufzeitanteil (ADR-0001).
//
// GitHub-Pages-Projektseite liefert unter einem Unterpfad aus
// (https://quancel.github.io/bewertung-app/), deshalb hier fest verdrahtet
// statt '/'. `createWebHistory(import.meta.env.BASE_URL)`
// (src/app/router/index.ts) zieht denselben Wert automatisch — dort keine
// Änderung nötig. `navigateFallback` unten wird bewusst aus derselben
// Konstante gebildet, damit beide nie auseinanderlaufen (siehe dort).
const BASE = '/bewertung-app/'

export default defineConfig({
  base: BASE,
  plugins: [
    vue(),
    // Offline-Auslieferung (PO-2026-09-07-007, ADR-0015): generierter
    // Service Worker über Workbox (`generateSW`), kein handgeschriebener
    // und kein `injectManifest` (keine eigene SW-Logik).
    VitePWA({
      // Kein Web-App-Manifest, keine Installierbarkeit — ein
      // installierbares PWA bräuchte ein App-Icon, das
      // design-concept.md ausschließt (ADR-0001, ADR-0015 Punkt 2).
      manifest: false,
      // Registrierung läuft ausschließlich über `virtual:pwa-register/vue`
      // (`src/app/UpdateHinweis.vue`) — kein zusätzliches, automatisch
      // eingefügtes Registrierungs-Script in `index.html`.
      injectRegister: false,
      // Prompt-Modus, NIE 'autoUpdate': der wartende Service Worker
      // übernimmt ausschließlich auf Nutzeraktion (Klick auf „Jetzt
      // laden" in Toast.vue). Ein automatischer Reload verlöre ein
      // gerade per Inline-Autosave nicht abgeschlossenes Feld
      // (ADR-0005, ADR-0015 Punkt 5).
      registerType: 'prompt',
      workbox: {
        // Vorgabewert (`**/*.{js,css,html,ico,png,svg}`) enthält kein
        // `woff2` — die lokale Inter-Datei (base.css, @font-face) fiele
        // damit aus dem Precache, und der Start ohne Netz zeigte die
        // Systemschrift (ADR-0015 Punkt 3, code-conventions.md „Service
        // Worker"). Ausdrücklich überschrieben, nicht ergänzt.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Tiefenlinks laufen über den App-Einstieg, nicht über eine im
        // Service Worker gepflegte Routenliste (ADR-0015 Punkt 4) — so
        // deckt der Fallback auch später ergänzte Bereiche (-006, -009)
        // ab, ohne dass dieses Paket sie kennen muss. Der App-Einstieg
        // liegt unter GitHub Pages nicht unter `/index.html`, sondern unter
        // dem Unterpfad der Projektseite — ADR-0015 legt den Mechanismus
        // fest (Fallback auf den App-Einstieg statt Routenliste), nicht das
        // Literal; der Pfad folgt deshalb `BASE` statt fest verdrahtet zu
        // sein.
        navigateFallback: `${BASE}index.html`,
        // Versionswechsel leert veraltete Workbox-Caches, fasst
        // IndexedDB nie an (ADR-0004, ADR-0015 Punkt 7) — der
        // Gerätespeicher ist der Datenbestand, nicht Teil der
        // Auslieferung.
        cleanupOutdatedCaches: true,
        // Kein Runtime-Caching für Fremd-Hosts: Kartenkacheln (-006) und
        // Ortssuche (-008) bringen ihren eigenen Ausfallpfad mit
        // (ADR-0015 Punkt 8).
      },
    }),
  ],
  resolve: {
    alias: {
      // Nur für Asset-Importe aus `.vue`-Dateien (Icons, siehe
      // src/shared/ui/icons/): ein relativer `../../`-Import aus dem von
      // @vitejs/plugin-vue extrahierten `<script setup>`-Modul löst unter
      // dieser Rolldown-Version von `vite build` nicht auf (Modul nicht
      // gefunden), ein Alias-Import ist davon nicht betroffen. Kein
      // allgemeiner `@`-Alias für Quellcode-Importe — Ordnerstruktur bleibt
      // wie in code-conventions.md relativ referenziert.
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },
})

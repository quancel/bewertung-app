import { fileURLToPath, URL } from 'node:url'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
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

// GitHub Pages ist ein reiner Dateiserver ohne serverseitiges Rewrite: Für
// einen Tiefenlink, unter dem keine Datei liegt (z. B. `/bewertung-app/orte`
// direkt geöffnet oder dort neu geladen), liefert Pages seine eigene
// 404-Seite aus — die App startet dort gar nicht erst, der vue-router
// bekommt den Pfad nie zu Gesicht. Das betrifft nur das Fenster VOR einem
// aktiven Service Worker: Sobald der kontrolliert, beantwortet
// `navigateFallback` (ADR-0015 Punkt 4) dieselbe Navigation client-seitig,
// ohne den Server je zu fragen — dieses Plugin ändert daran nichts und
// dupliziert auch keine Routenliste, es schließt nur die Lücke davor.
// Übliches Pages-Muster: `404.html` als exakte Kopie von `index.html`
// ausliefern. Pages liefert sie für jeden unbekannten Pfad aus, der Router
// übernimmt danach den Pfad aus der Adresszeile wie gewohnt.
//
// Die Kopie entsteht hier im Build (`writeBundle`, nachdem `index.html` auf
// der Platte liegt), nicht von Hand gepflegt — sonst liefe sie beim
// nächsten Asset-Hash unbemerkt auseinander. Kein zweiter Build-Lauf, kein
// zusätzliches npm-Skript: `writeBundle` ist Teil dieses einen `vite
// build`-Aufrufs, vor dem `closeBundle` von `vite-plugin-pwa`, das die
// Precache-Liste erzeugt (s. `globIgnores` unten).
function pagesTiefenlinkFallback(): Plugin {
  return {
    name: 'pages-tiefenlink-fallback',
    apply: 'build',
    writeBundle(options) {
      const outDir = options.dir ?? resolve(process.cwd(), 'dist')
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// CSS-Minifier-Ziel (ADR-0032 Punkt 2, Nachbesserung PO-2026-09-26-002):
// Ohne explizite Angabe fällt `build.cssTarget` auf `build.target`
// zurück, dessen Vorgabewert in dieser Vite-Version
// `chrome111/edge111/firefox114/safari16.4/ios16.4` ist ("Baseline widely
// available"). Der CSS-Minifier (LightningCSS, hier aktiv, weil
// `build.cssMinify` nicht ausdrücklich auf `'esbuild'` steht) schreibt
// `@media (min-width: …)` für **jeden** Ziel-Browser, der Media-Queries-
// Range-Syntax beherrscht, verlustfrei in `@media (width >= …)` um — ab
// Safari/iOS 16.4 ist das der Fall, und `dist/assets/*.css` bestätigt das
// (`grep -o "@media[^{]*" dist/assets/*.css`). ADR-0032 Punkt 2 verbietet
// genau diese Bereichssyntax im Ergebnis, weil sie in WebKit < 16.4 still
// nie zutrifft. Deshalb hier dieselbe Baseline-Liste, nur mit
// `safari15`/`ios15` statt `16.4` — das hält jeden anderen Browser auf
// seiner Baseline-Version (kein Rückschritt dort) und zwingt den Minifier
// mangels lückenlosem Support unter allen Zielen auf die unveränderte
// `min-width`/`not all and (min-width: …)`-Form. Betrifft nur die
// **CSS**-Ausgabe; `build.target` (JS) bleibt unverändert auf seinem
// Vorgabewert.
const CSS_TARGET = ['chrome111', 'edge111', 'firefox114', 'safari15', 'ios15']

export default defineConfig({
  base: BASE,
  build: {
    cssTarget: CSS_TARGET,
  },
  plugins: [
    vue(),
    // Tiefenlink-Fallback für GitHub Pages (reiner Dateiserver, kein
    // Server-Rewrite) — s. Kommentar bei der Funktion oben.
    pagesTiefenlinkFallback(),
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
        // `404.html` (s. `pagesTiefenlinkFallback` oben) ist byteidentisch
        // mit `index.html` und würde ohne diesen Ausschluss doppelt in die
        // Precache-Liste geraten — ohne jeden Nutzen: Sobald der Service
        // Worker eine Navigation kontrolliert, entscheidet `navigateFallback`
        // auf `index.html`, GitHub Pages' 404-Antwort wird dann nie mehr
        // angefragt. Der Ausschluss hält die Precache-Liste bei ihrer
        // bisherigen Bedeutung: das, was ein Offline-Start tatsächlich
        // braucht.
        globIgnores: ['404.html'],
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

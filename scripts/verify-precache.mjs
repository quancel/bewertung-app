#!/usr/bin/env node
/**
 * Build-Ausgaben-Prüfung für PO-2026-09-07-007 (Offline-Auslieferung,
 * ADR-0015), erweitert um PO-2026-09-07-006 (ADR-0018 Punkt 5). Keine
 * Vitest-Komponente/kein Service-Worker-Mock — die Offline-Kriterien sind im
 * Node-Testrunner nicht sinnvoll simulierbar (`vitest.config.ts`,
 * `environment: 'node'`, keine Browser-Umgebung). Was bleibt, ist die
 * generierte Build-Ausgabe selbst: Läuft nach `npm run build` und prüft
 * `dist/sw.js` auf genau das, was ADR-0015/ADR-0018 verlangen.
 *
 * Kein Bestandteil von `npm run test` (Vitest, reine `src/**\/*.spec.ts`
 * Unit-Tests ohne Build-Abhängigkeit) — dieses Skript braucht ein
 * existierendes `dist/`, `npm run test` nicht. Aufruf: `npm run verify:pwa`
 * (nach `npm run build`).
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir = resolve(import.meta.dirname, '..', 'dist')
const swPfad = resolve(distDir, 'sw.js')

function fehler(text) {
  console.error(`FEHLGESCHLAGEN: ${text}`)
  process.exitCode = 1
}

if (!existsSync(swPfad)) {
  fehler(`${swPfad} existiert nicht — vorher \`npm run build\` ausführen.`)
  process.exit(process.exitCode)
}

const inhalt = readFileSync(swPfad, 'utf-8')

// Die generierte Precache-Liste steht als Argument von
// `precacheAndRoute([...])` im Workbox-Runtime-Code (generateSW-Modus).
const manifestMatch = inhalt.match(/precacheAndRoute\((\[[^\]]*\])/)
if (!manifestMatch) {
  fehler('Kein `precacheAndRoute([...])`-Aufruf in dist/sw.js gefunden.')
  process.exit(process.exitCode)
}

// Workbox erzeugt die Objektliteral-Keys unquotiert (`{url:"...",revision:...}`),
// nicht als JSON — deshalb Regex statt `JSON.parse`.
const urls = [...manifestMatch[1].matchAll(/url:"([^"]+)"/g)].map((m) => m[1])

if (urls.length === 0) {
  fehler('Precache-Liste ist leer.')
}

const hatIndexHtml = urls.includes('index.html')
const hatWoff2 = urls.some((u) => u.endsWith('.woff2'))
const hatJsBundle = urls.some((u) => u.startsWith('assets/') && u.endsWith('.js'))
const hatCssBundle = urls.some((u) => u.startsWith('assets/') && u.endsWith('.css'))
const hatNavigateFallback =
  inhalt.includes('NavigationRoute') && inhalt.includes('createHandlerBoundToURL("/index.html")')
const hatCleanup = inhalt.includes('cleanupOutdatedCaches()')

console.log(`Precache-Einträge (${urls.length}):`)
for (const url of urls) console.log(`  - ${url}`)

if (!hatIndexHtml) fehler('`index.html` fehlt in der Precache-Liste (ADR-0015 Punkt 4).')
if (!hatWoff2)
  fehler('Keine `.woff2`-Datei in der Precache-Liste — globPatterns-Regression (ADR-0015 Punkt 3).')
if (!hatJsBundle) fehler('Kein JS-Bundle in der Precache-Liste.')
if (!hatCssBundle) fehler('Kein CSS-Bundle in der Precache-Liste.')
if (!hatNavigateFallback)
  fehler("`navigateFallback: '/index.html'` nicht im generierten Service Worker gefunden (ADR-0015 Punkt 4).")
if (!hatCleanup) fehler('`cleanupOutdatedCaches()` fehlt (ADR-0015 Punkt 7).')

// ADR-0018 Punkt 5 (PO-2026-09-07-006): Kartenkacheln (tile.openstreetmap.org)
// und Ortssuche (photon.komoot.io, PO-2026-09-07-008) sind Fremd-Hosts, die
// NIE über runtimeCaching in den Service Worker gelangen dürfen — beide
// bringen ihren eigenen Ausfallpfad im jeweiligen Feature mit, kein
// Precache, keine Strategie. Die billigste Absicherung gegen ein späteres,
// versehentliches `runtimeCaching`: der Hostname darf im generierten
// `dist/sw.js` schlicht nicht vorkommen.
const FREMD_HOSTS = ['tile.openstreetmap.org', 'photon.komoot.io']
const gefundeneFremdHosts = FREMD_HOSTS.filter((host) => inhalt.includes(host))
if (gefundeneFremdHosts.length > 0) {
  fehler(
    `Fremd-Host(s) im Service Worker gefunden (ADR-0018 Punkt 5): ${gefundeneFremdHosts.join(', ')} — kein runtimeCaching für Kartenkacheln/Ortssuche erlaubt.`,
  )
}

if (process.exitCode) {
  console.error('\nPrecache-Prüfung fehlgeschlagen.')
} else {
  console.log('\nPrecache-Prüfung erfolgreich: index.html, JS/CSS-Bundle und woff2 sind enthalten.')
}

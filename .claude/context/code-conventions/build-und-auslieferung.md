# Build und Auslieferung (ADR-0001/0015)

> Themendatei von `.claude/context/code-conventions.md` (Abschnitt „Build und
> Auslieferung"). Single-Writer: `architekt`. Maßgeblich ist dieser Wortlaut
> samt Ausnahmen, nicht die Kurzzeile im Register.

- **Rein statisches Bundle über HTTPS**, kein Server-Laufzeitanteil, kein SSR.
  Der Unterpfad der Auslieferung (GitHub Pages) steht **nur** in der
  Konstante `BASE` in `vite.config.ts`. Router (`import.meta.env.BASE_URL`),
  `navigateFallback` sowie `scripts/smoke.mjs` und
  `scripts/verify-precache.mjs` beziehen ihn von dort. Sonst verdrahtet
  nichts im Code einen absoluten Pfad. Damit ist ein sicherer Kontext
  gegeben. Ein Versionswechsel leert **Caches, niemals IndexedDB**.
- **`build.cssTarget` ist eine Kompatibilitätsvorgabe und kein
  Vorgabewert** (ADR-0032 Punkt 2, Nachtrag). Die Konstante `CSS_TARGET` in
  `vite.config.ts` hält Safari/iOS bewusst unter 16.4 (`safari15`/`ios15`),
  alle anderen Browser bleiben auf der Baseline-Version. Der Grund:
  LightningCSS schreibt `@media`-Bedingungen in Bereichssyntax um, sobald
  alle Ziele sie beherrschen, und in WebKit < 16.4 trifft diese Syntax still
  nie zu. Ein Bump von `build.target` oder ein Vite-Update zieht
  `CSS_TARGET` **nicht** mit, und niemand soll den Wert „angleichen". Wer
  `CSS_TARGET` oder `build.cssMinify` ändert oder Vite hebt, prüft
  `grep -o "@media[^{]*" dist/assets/*.css` auf `width <`/`>=`. Das ist heute
  eine Konvention ohne automatischen Check.
- **Service Worker generiert, nicht handgeschrieben**: `vite-plugin-pwa`,
  Modus `generateSW`, `manifest: false`. **`globPatterns` werden
  überschrieben, nicht übernommen** (der Vorgabewert enthält kein `woff2`) —
  jedes Paket, das ein neues Dateiformat ins Bundle bringt, prüft die Liste.
  **Adressen stehen nicht im Service Worker** (`navigateFallback`), ein Paket
  mit neuer Route fasst den `pwa`-Block nicht an. **`registerType: 'prompt'`,
  nie `autoUpdate`** — kein Reload aus `controllerchange` (Inline-Autosave).
  **Kein Runtime-Caching für Fremd-Hosts**; `scripts/verify-precache.mjs`
  prüft, dass in `dist/sw.js` kein Fremd-Host vorkommt.

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Erster Testbedarf: persistierte Migrationen (ADR-0003) und die
// Persistenzschicht (ADR-0004/0005). `environment: 'node'` genügt — es wird
// kein DOM gebraucht, `fake-indexeddb/auto` (siehe vitest.setup.ts) liefert
// eine In-Memory-IndexedDB für Node.
//
// `vue()` (ADR-0027, PO-2026-09-13-001): Component-Specs mit
// `@vue/test-utils` mounten `.vue`-Dateien — ohne den Plugin-Transform kann
// Vitest deren SFC-Syntax nicht parsen. Ändert an `environment: 'node'`
// nichts; eine Komponenten-Spec stellt ihre eigene Umgebung per Docblock
// um (`// @vitest-environment jsdom`).
export default defineConfig({
  plugins: [vue()],
  // Gleicher Alias wie `vite.config.ts` (dort: Asset-Importe aus
  // `<script setup>`-Icon-Wrappern) — ohne ihn löst eine Component-Spec, die
  // eine Icon-Komponente mitmountet (z. B. `IconKreuz.vue`), den Import
  // nicht auf.
  resolve: {
    alias: {
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.spec.ts'],
  },
})

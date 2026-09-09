import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Rein statisches Bundle, base-URL '/' (Nutzerentscheidung 2026-09-08:
// Auslieferung über statischen Host). Kein Server-Laufzeitanteil (ADR-0001).
export default defineConfig({
  base: '/',
  plugins: [vue()],
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

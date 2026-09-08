import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Rein statisches Bundle, base-URL '/' (Nutzerentscheidung 2026-09-08:
// Auslieferung über statischen Host). Kein Server-Laufzeitanteil (ADR-0001).
export default defineConfig({
  base: '/',
  plugins: [vue()],
})

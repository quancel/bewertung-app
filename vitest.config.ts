import { defineConfig } from 'vitest/config'

// Erster Testbedarf: persistierte Migrationen (ADR-0003) und die
// Persistenzschicht (ADR-0004/0005). `environment: 'node'` genügt — es wird
// kein DOM gebraucht, `fake-indexeddb/auto` (siehe vitest.setup.ts) liefert
// eine In-Memory-IndexedDB für Node.
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.spec.ts'],
  },
})

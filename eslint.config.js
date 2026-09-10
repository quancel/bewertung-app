import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    // Node-Skripte außerhalb des Browser-Bundles (Build-Ausgaben-Prüfung,
    // PO-2026-09-07-007) — kein Browser-Kontext, braucht `process`/`console`
    // aus der Node-Laufzeit statt der Browser-Globals oben.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    rules: {
      // ADR-0002: einteilige deutsche Komposita sind ausdrücklich erlaubt
      // (`Ortsliste.vue`) — die Regel schützt vor Kollisionen mit
      // HTML-Elementen, mit denen ein deutsches Kompositum nicht kollidiert.
      // Nicht "korrigieren".
      'vue/multi-word-component-names': 'off',
    },
  },
)

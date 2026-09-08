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
    rules: {
      // ADR-0002: einteilige deutsche Komposita sind ausdrücklich erlaubt
      // (`Ortsliste.vue`) — die Regel schützt vor Kollisionen mit
      // HTML-Elementen, mit denen ein deutsches Kompositum nicht kollidiert.
      // Nicht "korrigieren".
      'vue/multi-word-component-names': 'off',
    },
  },
)

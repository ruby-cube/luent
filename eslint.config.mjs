import { createRequire } from 'node:module'
import tsParser from '@typescript-eslint/parser'
import { createLuexProcessor } from './packages/quarky/scripts/eslint-luex-processor.mjs'

const require = createRequire(import.meta.url)
const muRules = require('./eslint-mu-rules.cjs')

const defaultIgnores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/playwright-report/**',
  '**/test-results/**',
  '**/*.d.ts',
]

export default [
  {
    files: ['**/*.luex'],
    ignores: defaultIgnores,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    processor: createLuexProcessor(),
    rules: {},
  },
  {
    files: ['apps/play/mu-linting/**/*.{ts,tsx}'],
    ignores: [...defaultIgnores, 'apps/play/mu-linting/.tmp-run/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      mu: {
        rules: {
          'mutation-boundary': muRules['mutation-boundary'],
        },
      },
    },
    rules: {
      'mu/mutation-boundary': 'error',
    },
  },
]

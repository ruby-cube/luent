import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts'
    },
    format: 'esm',
    outDir: 'dist',
    clean: true
  },
  {
    entry: {
      transpile: 'src/transpile.ts'
    },
    format: 'esm',
    outDir: 'dist',
    deps: {
      alwaysBundle: [/^@rue\/utils$/, /^@rue\/tree-squirl$/]
    }
  }
])
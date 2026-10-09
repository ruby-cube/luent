import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { createSharedViteConfig } from '../shared/vite.shared.js'

// vite config for island builds (runs before vitepress)

export default defineConfig({
  ...createSharedViteConfig(),
  build: {
    lib: {
      entry: resolve(import.meta.dirname, './src/luent-islands.tsx'),
      formats: ['es'],
      fileName: 'index'
    },
    outDir: '.vitepress/.luent-islands/client',
    emptyOutDir: true
  }
})

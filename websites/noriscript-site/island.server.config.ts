import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { createSharedViteConfig } from '../shared/vite.shared.js'

// vite config for island builds (runs before vitepress)

export default defineConfig({
  ...createSharedViteConfig(),
  build: {
    ssr: resolve(__dirname, './src/luent-islands.tsx'),
    outDir: '.vitepress/.luent-islands/server',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'index.js'
      }
    }
  }
})

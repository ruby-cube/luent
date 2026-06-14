import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import LuentPlugin from '../../plugins/vite-plugin-luent/index.js'

export default defineConfig({
  esbuild: {
    charset: 'utf8'
  },
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.nsx']
  },
  plugins: [
    ...(LuentPlugin() as any[])
  ],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __SSR__: false,
    __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
    __STYLE__: JSON.stringify(process.env.NODE_ENV === 'style')
  },
  build: {
    lib: {
      entry: resolve(__dirname, './src/luent-islands.ts'),
      formats: ['es'],
      fileName: 'index'
    },
    outDir: '.vitepress/.luent-islands/client',
    emptyOutDir: false
  }
})

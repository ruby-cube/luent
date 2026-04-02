import { defineConfig } from 'vite'
// import LuentPlugin from './packages/vite-plugin-luent/index.js'

export default defineConfig({
   esbuild: {
      charset: 'utf8'
   },
   plugins: [
      // ...LuentPlugin()
   ],
   define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __SSR__: false,
      __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
      __STYLE__: JSON.stringify(process.env.NODE_ENV === 'style'),
   },
   // build: {
   //   lib: {
   //     // Could also be a dictionary or array of multiple entry points
   //     entry: resolve(import.meta.url, 'src/index.ts'),
   //     name: '@rue',
   //     // the proper extensions will be added
   //     fileName: 'rue',
   //   },
   // rollupOptions: {
   //   // make sure to externalize deps that shouldn't be bundled
   //   // into your library
   //   external: ['vue'],
   //   output: {
   //     // Provide global variables to use in the UMD build
   //     // for externalized deps
   //     globals: {
   //       vue: 'Vue',
   //     },
   //   },
   // },
   // },
})
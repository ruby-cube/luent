import { defineConfig } from 'vite'
// import LuentPlugin from 'vite-plugin-luent'

export default defineConfig({
  esbuild: {
    charset: 'utf8'
  },
  plugins: [
    // ...LuentPlugin()
  ],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __INTERNAL__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __SSR__: false,
    __TEST__: JSON.stringify(process.env.NODE_ENV === 'test')
  },
  // build: {
  //   lib: {
  //     // Could also be a dictionary or array of multiple entry points
  //     entry: resolve(import.meta.url, 'src/index.ts'),
  //     name: '@luently',
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
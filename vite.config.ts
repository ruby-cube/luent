import { resolve } from "path"
import { defineConfig } from 'vite'
import babel from "vite-plugin-babel"

export default defineConfig({
  server: {
    fs: {
      cachedChecks: false
    }
  },
  plugins: [
   //  babel()
  ],
  resolve: {
    alias: 
    {
    //   // '@rue/utils': resolve(__dirname, 'packages/utils/index.ts'),
    //   '@rue/jsx-runtime': resolve(__dirname, 'packages/jsx-runtime/src/index.ts'),
      // '@rue/jsx-dev-runtime': resolve(__dirname, 'packages/jsx-runtime/jsx-runtime.ts')
    }

  },
  define: {
    __SSR__: false,
    __DEV__: true,
    __TEST__: true,
    __DOCU__: false,
  },
  // build: {
  //   lib: {
  //     // Could also be a dictionary or array of multiple entry points
  //     entry: resolve(__dirname, 'src/index.ts'),
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
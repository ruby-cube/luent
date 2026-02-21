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
         //   // '@rue/utils': resolve(import.meta.url, 'packages/utils/index.ts'),
         //   '@rue/jsx-runtime': resolve(import.meta.url, 'packages/jsx-runtime/src/index.ts'),
         // '@rue/jsx-dev-runtime': resolve(import.meta.url, 'packages/jsx-runtime/jsx-runtime.ts')
      }

   },
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
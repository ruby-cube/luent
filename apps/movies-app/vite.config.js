import { defineConfig } from 'vite'
import lumoPlugin from '../../packages/vite-plugin-lumo/index.js'

export default defineConfig({
   esbuild: {
      charset: 'utf8'
   },
   server: {
      fs: {
         cachedChecks: false
      }
   },
   plugins: [
      ...lumoPlugin()
   ],
   define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __SSR__: false,
      __TEST__: true,
      __DOCU__: false,
   }
})
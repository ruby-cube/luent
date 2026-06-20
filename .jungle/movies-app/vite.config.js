import { defineConfig } from 'vite'
import LuentPlugin from '../../plugins/vite-plugin-luent/index.js'

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
      ...LuentPlugin()
   ],
   define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __SSR__: false,
      __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
      __DOCU__: false,
   }
})
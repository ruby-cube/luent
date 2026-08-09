import { defineConfig } from 'vite'
import luent from '../plugins/vite-plugin-luent/src/index.js'


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
      luent(),
   ],
   define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __INTERNAL__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __SSR__: false,
      __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
   },
})
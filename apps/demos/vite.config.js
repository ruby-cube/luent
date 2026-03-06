import { defineConfig } from 'vite'
import lumoPlugin from '../../packages/vite-plugin-lumo/index.js'


export default defineConfig(async () => {
   const { default: tailwindcss } = await import('@tailwindcss/vite')

   return {
   esbuild: {
      charset: 'utf8'
   },
   server: {
      fs: {
         cachedChecks: false
      }
   },
   plugins: [
      tailwindcss(),
      ...lumoPlugin(),
   ],
   define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __SSR__: false,
      __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
      __STYLE__: JSON.stringify(process.env.NODE_ENV === 'style'),
   },
   }
})
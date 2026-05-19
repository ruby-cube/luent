import { defineConfig } from 'vite'
import LuentPlugin from '../plugins/vite-plugin-luent/index.js'


export default defineConfig(async () => {
   const { default: tailwindcss } = await import('@tailwindcss/vite')

   return {
      resolve: {
         extensions: ['.ts', '.tsx', '.nsx'],
      },
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
         ...LuentPlugin(),
      ],
      define: {
         __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
         __SSR__: false,
         __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
         __STYLE__: JSON.stringify(process.env.NODE_ENV === 'style'),
      },
   }
})
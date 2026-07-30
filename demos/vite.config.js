import { defineConfig } from 'vite'
import LuentPlugin from '../plugins/vite-plugin-luent/index.js'


export default defineConfig(async () => {
  const { default: tailwindcss } = await import('@tailwindcss/vite')

  return {
    resolve: {
      conditions: ['workspace'],
      extensions: ['.ts', '.tsx', '.nsx'],
    },
    oxc: {
      charset: 'utf8',
      jsx: {
        throwIfNamespace: false,
      },
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
import tailwindcss from '@tailwindcss/vite'
import luent from 'vite-plugin-luent'

export function createSharedViteConfig() {
  return {
    esbuild: {
      charset: 'utf8'
    },
    resolve: {
      conditions: ['luentWorkspace'],
      // Keep Vite defaults for extensionless imports and add .nsx for NextScript files.
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.nsx']
    },
    plugins: [
      tailwindcss(),
      luent({ useWorkspace: true })
    ],
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __INTERNAL__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __SSR__: false,
      __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
      __STYLE__: JSON.stringify(process.env.NODE_ENV === 'style')
    }
  }
}
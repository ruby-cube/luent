// @ts-check
import { defineConfig } from 'astro/config';
import luent from 'astro-plugin-luent'
import luentPlugin from 'vite-plugin-luent';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  "vite": {
    oxc: {
      jsx: {
        throwIfNamespace: false,
      },
    },
    resolve: {
      conditions: ['luentWorkspace'],
      // Keep Vite defaults for extensionless imports and add .nsx for NextScript files.
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.nsx']
    },
    plugins: [
      tailwindcss(),
      luentPlugin({ useWorkspace: true })
    ],
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __INTERNAL__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __SSR__: false,
      __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
      __STYLE__: JSON.stringify(process.env.NODE_ENV === 'style')
    }
  },
  "integrations": [luent()]
});

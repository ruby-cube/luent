import { resolve } from "path"
import { defineConfig } from 'vite'
import babelLumoTransform from '../../packages/lumo/babel-plugin/index.js'
import * as babel from '@babel/core';

export default defineConfig({
   server: {
      fs: {
         cachedChecks: false
      }
   },
   plugins: [
      {
         name: 'vite-lumo-plugin-pre',
         enforce: 'pre',
         async transform(code, id) {
            if (!id.endsWith('.jsx') && !id.endsWith('.tsx')) return;

            const result = await babel.transformAsync(code, {
               plugins: [
                  babelLumoTransform,
                  ['@babel/plugin-syntax-typescript', { isTSX: true }]
               ],
               filename: id,
               sourceMaps: true, // Optional, useful for debugging
            });

            return {
               code: result.code,
               map: result.map
            };
         },
      }
   ],
   resolve: {
      alias: {
         '@rue/jsx-dev-runtime': resolve(import.meta.dirname, '../../packages/lumo/jsx-runtime/src/index.ts')
      }
   },
   define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __SSR__: false,
      __TEST__: true,
      __DOCU__: false,
   }
})
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
   plugins: [ // TODO: replace with proper vite lumo plugin
      {
         name: 'vite-lumo-plugin-pre',
         enforce: 'pre',
         async transform(code, id) {
            if (!id.endsWith('.jsx') && !id.endsWith('.tsx')) return;

            const result = await babel.transformAsync(code, {
               // ['@babel/plugin-transform-react-jsx', { 
               //    throwIfNamespace: false, 
               //    runtime: 'automatic',
               //    importSource: '@rue'
               // }], 
               plugins: [
                  // ['@babel/plugin-syntax-jsx', {throwIfNamespace: false}], 
                  babelLumoTransform,
                  ['@babel/plugin-syntax-typescript', { isTSX: true }]
               ],
               // presets: ['@babel/preset-typescript'],
               filename: id,
               sourceMaps: true, // Optional, useful for debugging
            });

            return {
               code: result.code,
               map: result.map
            };
         },
      },
      // {
      //    name: 'vite-lumo-plugin-post',
      //    async transform(code, id) {
      //       if (!id.endsWith('.jsx') && !id.endsWith('.tsx')) return;

      //       const result = await babel.transformAsync(code, {
      //          // ['@babel/plugin-transform-react-jsx', { 
      //          //    throwIfNamespace: false, 
      //          //    runtime: 'automatic',
      //          //    importSource: '@rue'
      //          // }], 
      //          plugins: [
      //             // ['@babel/plugin-syntax-jsx', {throwIfNamespace: false}], 
      //             babelLumoTransform.post,
      //             // ['@babel/plugin-syntax-typescript', {isTSX: true}]
      //          ],
      //          // presets: ['@babel/preset-typescript'],
      //          filename: id,
      //          sourceMaps: true, // Optional, useful for debugging
      //       });

      //       return {
      //          code: result.code,
      //          map: result.map, // Include source maps
      //       };
      //    },
      // }
   ],
   resolve: {
      alias: {
         // //   '@rue/utils': resolve(import.meta.dirname, 'packages/utils/index.ts'),
         //   // '@rue/lumo/jsx-runtime': resolve(import.meta.dirname, 'packages/jsx-runtime/core/jsx-runtime.ts'),
         '@rue/jsx-dev-runtime': resolve(import.meta.dirname, '../../packages/lumo/jsx-runtime/src/index.ts')
      }
      // [
      //   {
      //     find: "@rue/jsx-dev-runtime",
      //     replacement: "./packages/jsx-runtime/src/index.ts",
      //   },
      // ]
   },
   define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __SSR__: false,
      __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
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
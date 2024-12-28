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
   plugins: [ //TODO: replace with proper vite lumo plugin
      {
         name: 'vite-lumo-plugin-pre',
         enforce: 'pre',
         async transform(code, id) {
            if (!id.endsWith('.jsx') && !id.endsWith('.tsx')) return;
            function annotateCodeParentheses(sourceCode) {
               const blockCommentRegex = /\/\*[\s\S]*?\*\//g; // Matches block comments
               let result = "";
               let lastIndex = 0;
             
               // Process each block comment and annotate only outside them
               for (const match of sourceCode.matchAll(blockCommentRegex)) {
                 const [comment] = match;
                 const start = match.index;
                 const end = start + comment.length;
             
                 // Annotate the code before the block comment
                 result += annotateParentheses(sourceCode.slice(lastIndex, start));
             
                 // Add the block comment as-is
                 result += comment;
             
                 // Update the last processed index
                 lastIndex = end;
               }
             
               // Annotate the remaining code after the last block comment
               result += annotateParentheses(sourceCode.slice(lastIndex));
             
               return result;
             }
            function annotateParentheses(sourceCode) {
               return sourceCode
                  .replace(/\(/g, '/*PARENS::OPEN*/(')
                  .replace(/\)/g, ')/*PARENS::CLOSE*/');
            }

            // const result = await babel.transformAsync(code, {
            //             // ['@babel/plugin-transform-react-jsx', { 
            //             //    throwIfNamespace: false, 
            //             //    runtime: 'automatic',
            //             //    importSource: '@rue'
            //             // }], 
            //             plugins: [
            //                // ['@babel/plugin-syntax-jsx', {throwIfNamespace: false}], 
            //                babelLumoTransform,
            //                ['@babel/plugin-syntax-typescript', {isTSX: true}]
            //             ],
            //             // presets: ['@babel/preset-typescript'],
            //             filename: id,
            //             sourceMaps: true, // Optional, useful for debugging
            //          });

            return {
               code: annotateCodeParentheses(code),
            };
         },
      },
      {
         name: 'vite-lumo-plugin-post',
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
                  // ['@babel/plugin-syntax-typescript', {isTSX: true}]
               ],
               // presets: ['@babel/preset-typescript'],
               filename: id,
               sourceMaps: true, // Optional, useful for debugging
            });

            function removeParenthesesAnnotation(sourceCode) {
               return sourceCode
                  .replace('/*PARENS::OPEN*/', '')
                  .replace('/*PARENS::CLOSE*/', '');
            }
            return {
               code: removeParenthesesAnnotation(result.code),
               map: result.map, // Include source maps
            };
         },
      }
   ],
   resolve: {
      alias: {
         // //   '@rue/utils': resolve(__dirname, 'packages/utils/index.ts'),
         //   // '@rue/lumo/jsx-runtime': resolve(__dirname, 'packages/jsx-runtime/core/jsx-runtime.ts'),
         '@rue/jsx-dev-runtime': resolve(__dirname, '../../packages/lumo/jsx-runtime/src/index.ts')
      }
      // [
      //   {
      //     find: "@rue/jsx-dev-runtime",
      //     replacement: "./packages/jsx-runtime/src/index.ts",
      //   },
      // ]
   },
   define: {
      __SSR__: false,
      __DEV__: true,
      __TEST__: true,
      __DOCU__: false,
   },
   // build: {
   //   lib: {
   //     // Could also be a dictionary or array of multiple entry points
   //     entry: resolve(__dirname, 'src/index.ts'),
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
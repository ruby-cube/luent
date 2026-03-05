import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { transformWithEsbuild } from 'vite'
import * as babel from '@babel/core'
import babelLumoTransform from '../lumo/babel-plugin/index.js'
import { transformQuarkySugar } from '../quarky/scripts/transform-quarky-sugar.mjs'

const jsxRuntimePath = fileURLToPath(new URL('../lumo/jsx-runtime/src/index.ts', import.meta.url))

export default function lumoPlugin() {
   /** @type {import('vite').PluginOption[]} */
   const plugins = [
      {
         name: 'vite-lumo-runtime-resolver',
         enforce: 'pre',
         resolveId(id) {
            if (id === '@rue/jsx-runtime' || id === '@rue/jsx-dev-runtime') {
               return jsxRuntimePath
            }
         }
      },
      {
         name: 'vite-qrx-loader',
         enforce: 'pre',
         async load(id) {
            const fileName = id.split('?')[0]
            if (!fileName.endsWith('.qrx')) return

            const code = await readFile(fileName, 'utf8')
            const sugaredCode = transformQuarkySugar({ code, fileName }).code
            const result = await babel.transformAsync(sugaredCode, {
               plugins: [
                  babelLumoTransform,
                  ['@babel/plugin-syntax-typescript', { isTSX: true }]
               ],
               filename: fileName,
               sourceMaps: true,
            })

            const normalized = await transformWithEsbuild(result.code, fileName, {
               loader: 'tsx',
               jsx: 'automatic',
               jsxImportSource: '@rue',
               sourcemap: true
            })

            return {
               code: normalized.code,
               map: normalized.map
            }
         }
      },
      {
         name: 'vite-lumo-plugin-pre',
         enforce: 'pre',
         async transform(code, id) {
            const fileName = id.split('?')[0]
            if (!fileName.endsWith('.jsx') && !fileName.endsWith('.tsx')) return

            const result = await babel.transformAsync(code, {
               plugins: [
                  babelLumoTransform,
                  ['@babel/plugin-syntax-typescript', { isTSX: true }]
               ],
               filename: fileName,
               sourceMaps: true,
            })

            return {
               code: result.code,
               map: result.map
            }
         },
      }
   ]

   return plugins
}
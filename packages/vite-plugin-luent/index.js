import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { transformWithEsbuild } from 'vite'
import * as babel from '@babel/core'
import babelLumoTransform from '@rue/babel-plugin-luent'
import { transformRXSSugar } from '@rue/ruescript/transform'

const jsxRuntimePath = fileURLToPath(new URL('../lumo/jsx-runtime/src/index.ts', import.meta.url))

export default function LuentPlugin() {
   /** @type {import('vite').PluginOption[]} */
   const plugins = [
      {
         name: 'vite-luent-runtime-resolver',
         enforce: 'pre',
         resolveId(id) {
            if (id === '@rue/jsx-runtime' || id === '@rue/jsx-dev-runtime') {
               return jsxRuntimePath
            }
         }
      },
      {
         name: 'vite-rxs-loader',
         enforce: 'pre',
         async load(id) {
            const fileName = id.split('?')[0]
            if (!fileName.endsWith('.rxs')) return

            const code = await readFile(fileName, 'utf8')
            const sugaredCode = transformRXSSugar({ code, fileName }).code
            const result = await babel.transformAsync(sugaredCode, {
               plugins: [
                  babelLumoTransform,
                  ['@babel/plugin-syntax-typescript', { isTSX: true }]
               ],
               filename: fileName,
               sourceMaps: true,
               generatorOpts: {
                  jsescOption: {
                     minimal: true
                  }
               }
            })

            const normalized = await transformWithEsbuild(result.code, fileName, {
               loader: 'tsx',
               jsx: 'automatic',
               jsxImportSource: '@rue',
               sourcemap: true,
               charset: 'utf8'
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
               generatorOpts: {
                  jsescOption: {
                     minimal: true
                  }
               }
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
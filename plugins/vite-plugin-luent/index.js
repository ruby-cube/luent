import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { transformWithOxc } from 'vite'
import * as babel from '@babel/core'
import { luentPreTransform as BabelLuentPlugin } from '@rue/babel-plugin-luent'
import { transpileRueScript } from '@rue/ruescript/transpile'

const require = createRequire(import.meta.url)

function resolveLuentJsxRuntimePath() {
   const luentPackageJsonPath = require.resolve('@rue/luent/package.json')
   return join(dirname(luentPackageJsonPath), 'jsx-runtime/index.ts')
}

let jsxRuntimePath

export default function LuentPlugin() {
   /** @type {import('vite').PluginOption[]} */
   const plugins = [
      {
         name: 'vite-luent-runtime-resolver',
         enforce: 'pre',
         resolveId(id) {
            if (id === '@rue/luent/jsx-runtime' || id === '@rue/luent/jsx-dev-runtime') {
               jsxRuntimePath ??= resolveLuentJsxRuntimePath()
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
            const sugaredCode = transpileRueScript(fileName, code).transpiled.code
            const result = await babel.transformAsync(sugaredCode, {
               plugins: [
                  BabelLuentPlugin,
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

            const normalized = await transformWithOxc(result.code, fileName.replace(/\.rxs$/, '.tsx'), {
               jsx: {
                  runtime: 'automatic',
                  importSource: '@rue/luent'
               },
               sourcemap: true
            })

            return {
               code: normalized.code,
               map: normalized.map
            }
         }
      },
      {
         name: 'vite-luent-plugin-pre',
         enforce: 'pre',
         async transform(code, id) {
            const fileName = id.split('?')[0]
            if (!fileName.endsWith('.jsx') && !fileName.endsWith('.tsx')) return

            const result = await babel.transformAsync(code, {
               plugins: [
                  BabelLuentPlugin,
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
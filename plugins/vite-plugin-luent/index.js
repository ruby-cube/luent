import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { transformWithOxc } from 'vite'
import * as babel from '@babel/core'
import { luentPreTransform as BabelLuentPlugin } from '@rue/babel-plugin-luent'
import { transpileNextScript } from '@rue/nextscript/transpile'

const require = createRequire(import.meta.url)

function resolveLuentJsxRuntimePath(id) {
  return require.resolve(id)
}

function isLuentJsxRuntimeId(id) {
  return id === '@rue/luent/jsx-runtime' || id === '@rue/luent/jsx-dev-runtime'
}

let luentJsxRuntimePath

export default function LuentPlugin() {
  /** @type {import('vite').PluginOption[]} */
  const plugins = [
    {
      name: 'vite-luent-jsx-runtime-resolver',
      enforce: 'pre',
      resolveId(id) {
        if (isLuentJsxRuntimeId(id)) {
          luentJsxRuntimePath ??= resolveLuentJsxRuntimePath('@rue/luent/jsx-runtime')
          return luentJsxRuntimePath
        }
      }
    },
    {
      name: 'vite-nsx-loader',
      enforce: 'pre',
      async load(id) {
        const fileName = id.split('?')[0]
        if (!fileName.endsWith('.nsx')) return

        const code = await readFile(fileName, 'utf8')
        const sugaredCode = transpileNextScript(fileName, code).transpiled.code
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

        const normalized = await transformWithOxc(result.code, fileName.replace(/\.nsx$/, '.tsx'), {
          jsx: {
            runtime: 'automatic',
            importSource: '@rue/luent',
            throwIfNamespace: false
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

        const normalized = await transformWithOxc(result.code, fileName, {
          jsx: {
            runtime: 'automatic',
            importSource: '@rue/luent',
            throwIfNamespace: false
          },
          sourcemap: true
        })

        return {
          code: normalized.code,
          map: normalized.map
        }
      },
    }
  ]

  return plugins
}
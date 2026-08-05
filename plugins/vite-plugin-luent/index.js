import { readFile } from 'node:fs/promises'
import { transformWithOxc } from 'vite'
import * as babel from '@babel/core'
import { luentPreTransform as BabelLuentPlugin } from '@luent/babel-plugin-luent'
import { transpileNextScript } from '@luent/nextscript/transpile'

export default function LuentPlugin(options = {}) {
  /** @type {import('vite').PluginOption[]} */
  const plugins = [
    ...(options.useWorkspaceCondition ? [{
      name: 'vite-luent-conditions',
      enforce: 'pre',
      config(config) {
        const existingConditions = config.resolve?.conditions ?? []
        const nextConditions = ['workspace', ...existingConditions.filter(c => c !== 'workspace')]

        return {
          resolve: {
            conditions: nextConditions,
          },
        }
      }
    }] : []),
    {
      name: 'vite-nsx-loader',
      enforce: 'pre',
      async load(id) {
        const fileName = id.split('?')[0]
        if (!fileName.endsWith('.nsx')) return

        const code = await readFile(fileName, 'utf8')
        const { transpiled, sourceMap } = transpileNextScript(fileName, code)
        const result = await babel.transformAsync(transpiled.code, {
          plugins: [
            BabelLuentPlugin,
            ['@babel/plugin-syntax-typescript', { isTSX: true }]
          ],
          filename: fileName,
          inputSourceMap: sourceMap,
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
            importSource: 'luent',
            throwIfNamespace: false
          },
          sourcemap: true
        }, result.map)

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

        // const transformed = transformLuentJSX(code)

        const normalized = await transformWithOxc(result.code, fileName, {
          jsx: {
            runtime: 'automatic',
            importSource: 'luent',
            throwIfNamespace: false
          },
          sourcemap: true
        }, result.map)

        return {
          code: normalized.code,
          map: normalized.map
        }
      },
    }
  ]

  return plugins
}
import { readFile } from 'node:fs/promises'
import { transformWithOxc } from 'vite'
import * as babel from '@babel/core'
import { luentPreTransform as BabelLuentPlugin } from '@luent/babel-plugin-luent'
import { transpileNextScript } from '@luent/nextscript/transpile'

export default function LuentPlugin(options = {}) {

  return {
    name: 'luent',
    enforce: 'pre',

    config(userConfig, { command, ssrBuild }) {
      const conditions = userConfig.resolve?.conditions ?? []
      return {
        resolve: {
          conditions: options.useWorkspace ? composeList('luentWorkspace', conditions) : conditions,
        },
        extensions: ['.ts', '.jsx', '.tsx', '.ns', '.nsx'],
        oxc: {
          ...userConfig.resolve?.oxc ?? {},
          jsx: {
            ...userConfig.resolve?.oxc?.jsx ?? {},
            throwIfNamespace: false,
          },
        },
        define: {
          __INTERNAL__: false,
          __TEST__: false,
          ...userConfig.resolve?.define ?? {},
          __DEV__: command !== 'build',
          __SSR__: !!ssrBuild
        }
      }
    },

    // TODO: simplify pipeline
    async load(id) {
      const fileName = id.split('?')[0]
      if (!fileName.endsWith('.nsx')) {
        return;
      }

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
    },

    async transform(code, id) {
      const fileName = id.split('?')[0]
      if (!fileName.endsWith('.jsx') && !fileName.endsWith('.tsx')) {
        return;
      }

      // TODO: migrate to oxc
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
}

function composeList(item, existing) {
  return [item, ...existing.filter(c => c !== item)]
}

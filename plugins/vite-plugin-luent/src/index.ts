import { transformWithOxc } from 'vite'
import type { ConfigEnv, Plugin, UserConfig } from 'vite'
import * as babel from '@babel/core'
import { luentPreTransform as BabelLuentPlugin } from '@luent/babel-plugin-luent'

interface LuentPluginOptions {
  useWorkspace?: boolean
}

// [] generate html from html.tsx

// const VIRTUAL_PREFIX = '\0luent:'

// interface Page {
//   id: string
//   route: string
// }

// interface ClientModule {
//   id: string
//   sourceId: string
// }


export default function LuentPlugin(options: LuentPluginOptions = {}): Plugin {
  // const pages = new Map<string, Page>()
  // const clientModules = new Map<string, ClientModule>()
  // let server: ViteDevServer

  return {
    name: 'luent',
    enforce: 'pre',

    // configureServer(devServer) {
    //   server = devServer
    // },

    async config(userConfig: UserConfig, env: ConfigEnv) {
      const { command, isSsrBuild } = env
      const conditions = userConfig.resolve?.conditions ?? []
      const workspaceConditions = options.useWorkspace
        ? composeList('luentWorkspace', conditions)
        : conditions
      const configuredExtensions = userConfig.resolve?.extensions
      const optimizeDeps = userConfig.optimizeDeps
      const ssrOptions = typeof userConfig.ssr === 'object' && userConfig.ssr !== null ? userConfig.ssr : undefined

      // const input = await discoverPages({
      //   forEach(id, route) {
      //     pages.set(id, { id, route })
      //   }
      // })

      return {
        resolve: {
          ...userConfig.resolve,
          conditions: workspaceConditions,
          ...(configuredExtensions
            ? { extensions: composeList('.nsx', composeList('.ns', configuredExtensions)) }
            : {}),
        },
        ...(options.useWorkspace
          ? {
              optimizeDeps: {
                ...optimizeDeps,
                rolldownOptions: {
                  ...(optimizeDeps?.rolldownOptions ?? {}),
                  resolve: {
                    ...(optimizeDeps?.rolldownOptions?.resolve ?? {}),
                    conditionNames: composeList(
                      'luentWorkspace',
                      optimizeDeps?.rolldownOptions?.resolve?.conditionNames ?? []
                    ),
                  },
                },
              },
              ssr: {
                ...ssrOptions,
                noExternal: composeNoExternal(ssrOptions?.noExternal),
                resolve: {
                  ...(ssrOptions?.resolve ?? {}),
                  conditions: composeList(
                    'luentWorkspace',
                    ssrOptions?.resolve?.conditions ?? []
                  ),
                  externalConditions: composeList(
                    'luentWorkspace',
                    ssrOptions?.resolve?.externalConditions ?? []
                  ),
                },
              },
            }
          : {}),
        oxc: {
          ...(userConfig.oxc || {}),
          jsx: {
            throwIfNamespace: false,
            pure: false,
          },
        },
        define: {
          ...(userConfig.define ?? {}),
          __INTERNAL__: false,
          __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
          __DEV__: command !== 'build',
          __SSR__: Boolean(isSsrBuild),
        },
        // build: {
        //   rolldownOptions: {
        //     input
        //   }
        // }
      }
    },

    // buildStart() {
    //   for (const page of pages.values()) {
    //     const clientEntry = `${VIRTUAL_PREFIX}page:${page.id}`

    //     this.emitFile({
    //       type: 'chunk',
    //       id: clientEntry,
    //       name: `${page.route || 'index'}.client`,
    //     })
    //   }
    // },

    // TODO: move .nsx transform to transform()
    // async load(id) {
    //   const fileName = id.split('?')[0]
    //   if (!fileName.endsWith('.nsx')) {
    //     return null
    //   }

    //   const { transpileNextScript } = await import('@luent/noriscript/transpile')

    //   const code = await readFile(fileName, 'utf8')
    //   const { transpiled } = transpileNextScript(fileName, code)

    //   const result = await babel.transformAsync(transpiled.code, {
    //     plugins: [
    //       BabelLuentPlugin,
    //       ['@babel/plugin-syntax-typescript', { isTSX: true }]
    //     ],
    //     filename: fileName,
    //     sourceMaps: true,
    //     generatorOpts: {
    //       jsescOption: {
    //         minimal: true
    //       }
    //     }
    //   })

    //   if (!result?.code) {
    //     return null
    //   }

    //   const normalized = await transformWithOxc(result.code, fileName.replace(/\.nsx$/, '.tsx'), {
    //     jsx: {
    //       runtime: 'automatic',
    //       importSource: 'luent',
    //       throwIfNamespace: false
    //     },
    //     sourcemap: true
    //   }, result.map)

    //   return {
    //     code: normalized.code,
    //     map: normalized.map
    //   }
    // },

    async transform(code, id) {
      const fileName = id.split('?')[0]
      if (!fileName.endsWith('.jsx') && !fileName.endsWith('.tsx')) {
        return null
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

      if (!result?.code) {
        return null
      }

      const normalized = await transformWithOxc(result.code, fileName, {
        jsx: {
          runtime: 'automatic',
          importSource: 'luent',
          throwIfNamespace: false,
          pure: false
        },
        sourcemap: true
      }, result.map)

      return {
        code: normalized.code,
        map: normalized.map
      }
    },

    // generateBundle() {
    //   for (const page of pages) {
    //     const Page = await loadPage(server, page)

    //     const html = renderToString(Page)

    //     const extracted = extractPortals(html)
    //     const finalHtml = injectPortals(extracted)

    //     // Write finalHtml to dist/...
    //   }
    // }
  }
}

function composeList(item: string, existing: string[]): string[] {
  return [item, ...existing.filter((c) => c !== item)]
}

function composeNoExternal(
  existing: true | string | RegExp | (string | RegExp)[] | undefined
): true | (string | RegExp)[] {
  const workspacePackages = /^(luent|@luent\/)/

  if (existing === true) {
    return true
  }

  if (existing === undefined) {
    return [workspacePackages]
  }

  const list = Array.isArray(existing) ? existing : [existing]
  if (list.some((item) => item instanceof RegExp && item.source === workspacePackages.source)) {
    return list
  }

  return [...list, workspacePackages]
}

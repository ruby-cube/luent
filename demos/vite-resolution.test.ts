import { describe, expect, it } from 'vitest'
import { createServer } from 'vite'
import path from 'node:path'

describe('demos resolution', () => {
  it('resolves luent and jsx runtime to workspace source', async () => {
    const root = path.resolve(process.cwd(), 'demos')
    const rawConfigModule = await import('./vite.config.js')
    const rawConfig = rawConfigModule.default
    const config = typeof rawConfig === 'function' ? await rawConfig() : rawConfig

    const server = await createServer({
      ...config,
      root,
      logLevel: 'silent',
    })

    try {
      const importer = path.resolve(root, 'main.tsx')
      const luentResolved = await server.pluginContainer.resolveId('luent', importer)
      const jsxResolved = await server.pluginContainer.resolveId('luent/jsx-runtime', importer)

      expect(luentResolved?.id).toContain('/packages/luent/src/')
      expect(luentResolved?.id).not.toContain('/packages/luent/dist/')

      expect(jsxResolved?.id).toContain('/packages/luent/src/jsx-runtime/index.ts')
      expect(jsxResolved?.id).not.toContain('/packages/luent/dist/')
    } finally {
      await server.close()
    }
  })
})

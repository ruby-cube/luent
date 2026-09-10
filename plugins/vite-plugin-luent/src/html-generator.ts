import { resolve, relative } from 'node:path'
import glob from 'fast-glob'

const PAGE_RE = /\.html\.tsx$/

/**
 * during config
 */
export async function discoverPages({ forEach }: { forEach: (id: string, route: string) => void }) {
  const root = resolve('src/pages')

  const files = await glob('**/*.html.tsx', {
    cwd: root,
    absolute: true,
  })

  const input: Record<string, string> = {}

  for (const id of files) {
    const relativePath = relative(root, id)
    const route = relativePath.replace(/\.html\.tsx$/, '')

    forEach(id, route)

    input[route || 'index'] = id
  }
  return input;
}

/**
 * during transform
 * - generate island id
 */
export function transformHTMLTSX(id: string, code: string) {
  if (!PAGE_RE.test(id)) {
    return null
  }

  // TODO: add island ids

  return {
    code,
    map: null,
    islands: []
  }
}
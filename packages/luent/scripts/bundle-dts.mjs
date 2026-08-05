import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

const packageRoot = resolve(process.cwd())
const repoRoot = resolve(packageRoot, '../..')
const inDir = resolve(packageRoot, 'dist/types')
const outDir = resolve(packageRoot, 'dist')

const remap = new Map([
  ['@luent/flask', resolve(outDir, '_deps/flask/index.d.ts')],
  ['@luent/quarky', resolve(outDir, '_deps/quarky/index.d.ts')],
  ['@luent/quarky/core', resolve(outDir, '_deps/quarky/core/index.d.ts')],
  ['@luent/nextscript', resolve(outDir, '_deps/nextscript/index.d.ts')],
  ['@luent/types', resolve(outDir, '_deps/types/index.d.ts')],
  ['@luent/utils', resolve(outDir, '_deps/utils/index.d.ts')]
])

const depSourceRoots = new Map([
  ['@luent/flask', resolve(repoRoot, 'packages/flask/dist/types')],
  ['@luent/quarky', resolve(repoRoot, 'packages/quarky/dist/types')],
  ['@luent/nextscript', resolve(repoRoot, 'packages/nextscript/dist/types')],
  ['@luent/types', resolve(repoRoot, 'packages/types/dist/types')],
  ['@luent/utils', resolve(repoRoot, 'packages/utils/dist/types')]
])

await mkdir(outDir, { recursive: true })

await copyTree(inDir, outDir, transformLuentDts)
await copyFileIfExists(resolve(packageRoot, 'src/jsx-runtime/global.d.ts'), resolve(outDir, 'jsx-runtime/global.d.ts'))

for (const [pkgName, srcRoot] of depSourceRoots.entries()) {
  await copyTree(srcRoot, resolve(outDir, '_deps', pkgName.replace('@luent/', '')), text => text)
}

await rm(inDir, { recursive: true, force: true })
await rm(resolve(outDir, '.tsbuildinfo'), { recursive: true, force: true })

async function transformLuentDts(content, srcPath) {
  const relativeFromIn = relative(inDir, srcPath)
  const outFilePath = resolve(outDir, relativeFromIn)
  const outFileDir = dirname(outFilePath)
  let next = content

  for (const [from, absoluteTarget] of remap) {
    const relImport = toRelativeImportPath(relative(outFileDir, absoluteTarget).replace(/\.d\.ts$/, ''))
    next = next
      .replaceAll(`from \"${from}\"`, `from \"${relImport}\"`)
      .replaceAll(`from '${from}'`, `from '${relImport}'`)
      .replaceAll(`export * from \"${from}\"`, `export * from \"${relImport}\"`)
      .replaceAll(`export * from '${from}'`, `export * from '${relImport}'`)
      .replaceAll(`} from \"${from}\"`, `} from \"${relImport}\"`)
      .replaceAll(`} from '${from}'`, `} from '${relImport}'`)
  }

  return next
}

async function copyTree(srcRoot, destRoot, transform) {
  const entries = await readdir(srcRoot, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(srcRoot, entry.name)
    const destPath = join(destRoot, entry.name)

    if (entry.isDirectory()) {
      await copyTree(srcPath, destPath, transform)
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.d.ts')) {
      continue
    }

    const raw = await readFile(srcPath, 'utf8')
    const next = await transform(raw, srcPath)
    await mkdir(dirname(destPath), { recursive: true })
    await writeFile(destPath, next, 'utf8')
  }
}

async function copyFileIfExists(srcFile, destFile) {
  try {
    const data = await readFile(srcFile, 'utf8')
    await mkdir(dirname(destFile), { recursive: true })
    await writeFile(destFile, data, 'utf8')
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return
    }
    throw err
  }
}

for (const [_pkgName, absoluteTarget] of remap) {
  const rel = relative(outDir, absoluteTarget)
  if (!rel || rel.startsWith('..')) {
    throw new Error(`Invalid remap target outside dist: ${absoluteTarget}`)
  }
}

function toRelativeImportPath(pathLike) {
  const normalized = pathLike.replaceAll('\\', '/')
  if (normalized.startsWith('.')) {
    return normalized
  }
  return `./${normalized}`
}

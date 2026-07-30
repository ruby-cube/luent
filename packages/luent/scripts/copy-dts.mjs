import { copyFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'

const srcRoot = path.resolve('src')
const distRoot = path.resolve('dist')

async function copyDeclarations(dir) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await copyDeclarations(srcPath)
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.d.ts')) {
      continue
    }

    const relativePath = path.relative(srcRoot, srcPath)
    const outPath = path.join(distRoot, relativePath)

    await mkdir(path.dirname(outPath), { recursive: true })
    await copyFile(srcPath, outPath)
  }
}

await copyDeclarations(srcRoot)
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'

const srcRoot = path.resolve('src')
const distRoot = path.resolve('dist')

async function copyDeclarations(dir) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await copyDeclarations(srcPath)
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.d.ts')) {
      continue
    }

    const relativePath = path.relative(srcRoot, srcPath)
    const outPath = path.join(distRoot, relativePath)

    await mkdir(path.dirname(outPath), { recursive: true })
    await copyFile(srcPath, outPath)
  }
}

await copyDeclarations(srcRoot)

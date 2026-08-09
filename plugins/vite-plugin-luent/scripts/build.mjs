import { mkdir, rm, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const srcDir = resolve(projectRoot, 'src')
const distDir = resolve(projectRoot, 'dist')

async function build() {
  await rm(distDir, { recursive: true, force: true })
  await mkdir(distDir, { recursive: true })

  const sourcePath = resolve(srcDir, 'index.js')
  const targetPath = resolve(distDir, 'index.js')
  const source = await readFile(sourcePath, 'utf8')
  await writeFile(targetPath, source)
}

build().catch((error) => {
  console.error(error)
  process.exit(1)
})

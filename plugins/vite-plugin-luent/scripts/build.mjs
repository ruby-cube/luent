import { spawn } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const distDir = resolve(projectRoot, 'dist')

async function runTsc() {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json'], {
      cwd: projectRoot,
      stdio: 'inherit',
    })

    child.on('error', rejectPromise)
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(new Error(`TypeScript build failed with exit code ${code ?? 'unknown'}`))
    })
  })
}

async function build() {
  await rm(distDir, { recursive: true, force: true })
  await runTsc()
}

build().catch((error) => {
  console.error(error)
  process.exit(1)
})

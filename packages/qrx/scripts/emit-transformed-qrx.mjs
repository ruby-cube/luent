import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { transformQRXSugar } from './transform-qrx-sugar.mjs'

function usage() {
  console.log('Usage: node packages/qrx/scripts/emit-transformed-qrx.mjs <input.qrk|input.qrx> [--out <output-file>] [--stdout]')
  console.log('Examples:')
  console.log('  node packages/qrx/scripts/emit-transformed-qrx.mjs apps/play/src/Counter.qrx')
  console.log('  node packages/qrx/scripts/emit-transformed-qrx.mjs apps/play/src/Counter.qrx --out apps/play/src/Counter.transformed.tsx')
  console.log('  node packages/qrx/scripts/emit-transformed-qrx.mjs apps/play/src/Counter.qrx --stdout')
}

function parseArgs(argv) {
  let inputPath
  let outputPath
  let useStdout = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === '--') continue

    if (arg === '--help' || arg === '-h') {
      return { help: true }
    }

    if (arg === '--stdout') {
      useStdout = true
      continue
    }

    if ((arg === '--out' || arg === '-o') && argv[index + 1]) {
      outputPath = argv[index + 1]
      index += 1
      continue
    }

    if (!inputPath) {
      inputPath = arg
      continue
    }
  }

  return {
    help: false,
    inputPath,
    outputPath,
    useStdout,
  }
}

function getDefaultOutputPath(absoluteInputPath) {
  if (absoluteInputPath.endsWith('.qrx')) {
    return absoluteInputPath.replace(/\.qrx$/, '.transformed.tsx')
  }
  if (absoluteInputPath.endsWith('.qrk')) {
    return absoluteInputPath.replace(/\.qrk$/, '.transformed.ts')
  }
  return `${absoluteInputPath}.transformed.ts`
}

async function run() {
  const { help, inputPath, outputPath, useStdout } = parseArgs(process.argv.slice(2))

  if (help || !inputPath) {
    usage()
    if (!help) process.exit(1)
    return
  }

  const absoluteInputPath = path.resolve(inputPath)
  if (!absoluteInputPath.endsWith('.qrx') && !absoluteInputPath.endsWith('.qrk')) {
    console.error(`Expected a .qrx or .qrk input file, got: ${absoluteInputPath}`)
    process.exit(1)
  }

  const source = await fs.readFile(absoluteInputPath, 'utf8')
  const transformed = transformQRXSugar({
    code: source,
    fileName: absoluteInputPath,
  })

  if (useStdout) {
    process.stdout.write(transformed.code)
    return
  }

  const absoluteOutputPath = path.resolve(outputPath || getDefaultOutputPath(absoluteInputPath))
  await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true })
  await fs.writeFile(absoluteOutputPath, transformed.code, 'utf8')

  const relativeOutputPath = path.relative(process.cwd(), absoluteOutputPath)
  console.log(`Wrote transformed file: ${relativeOutputPath || absoluteOutputPath}`)
}

run().catch((error) => {
  console.error(error && error.message ? error.message : String(error))
  process.exit(1)
})

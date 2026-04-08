import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { transformRXSSugar } from './transform-rxs-sugar.mjs'

function usage() {
  console.log('Usage: node packages/rxs/scripts/emit-transformed-rxs.mjs <input.rxs> [--out <output-file>] [--stdout]')
  console.log('Examples:')
  console.log('  node packages/rxs/scripts/emit-transformed-rxs.mjs apps/play/src/Counter.rxs')
  console.log('  node packages/rxs/scripts/emit-transformed-rxs.mjs apps/play/src/Counter.rxs --out apps/play/src/Counter.transformed.tsx')
  console.log('  node packages/rxs/scripts/emit-transformed-rxs.mjs apps/play/src/Counter.rxs --stdout')
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
  if (absoluteInputPath.endsWith('.rxs')) {
    return absoluteInputPath.replace(/\.rxs$/, '.transformed.tsx')
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
  if (!absoluteInputPath.endsWith('.rxs')) {
    console.error(`Expected a .rxs input file, got: ${absoluteInputPath}`)
    process.exit(1)
  }

  const source = await fs.readFile(absoluteInputPath, 'utf8')
  const transformed = transformRXSSugar({
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

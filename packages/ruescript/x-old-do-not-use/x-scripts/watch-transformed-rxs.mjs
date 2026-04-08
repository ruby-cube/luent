import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { transformRXSSugar } from './transform-rxs-sugar.mjs'

function usage() {
  console.log('Usage: node packages/rxs/scripts/watch-transformed-rxs.mjs <input.rxs> [--out <output-file>]')
  console.log('Examples:')
  console.log('  node packages/rxs/scripts/watch-transformed-rxs.mjs apps/play/src/Counter.rxs')
  console.log('  node packages/rxs/scripts/watch-transformed-rxs.mjs apps/play/src/Counter.rxs --out apps/play/src/Counter.transformed.tsx')
}

function parseArgs(argv) {
  let inputPath
  let outputPath

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === '--') continue

    if (arg === '--help' || arg === '-h') {
      return { help: true }
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
  }
}

function getDefaultOutputPath(absoluteInputPath) {
  if (absoluteInputPath.endsWith('.rxs')) {
    return absoluteInputPath.replace(/\.rxs$/, '.transformed.tsx')
  }
  return `${absoluteInputPath}.transformed.ts`
}

async function emitTransformedFile(absoluteInputPath, absoluteOutputPath) {
  const source = await fs.readFile(absoluteInputPath, 'utf8')
  const transformed = transformRXSSugar({
    code: source,
    fileName: absoluteInputPath,
  })
  await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true })
  await fs.writeFile(absoluteOutputPath, transformed.code, 'utf8')
}

async function run() {
  const { help, inputPath, outputPath } = parseArgs(process.argv.slice(2))

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

  const absoluteOutputPath = path.resolve(outputPath || getDefaultOutputPath(absoluteInputPath))
  const relativeInputPath = path.relative(process.cwd(), absoluteInputPath) || absoluteInputPath
  const relativeOutputPath = path.relative(process.cwd(), absoluteOutputPath) || absoluteOutputPath

  let pendingTimer = undefined
  let writing = false

  const scheduleEmit = (reason) => {
    if (pendingTimer) {
      clearTimeout(pendingTimer)
    }

    pendingTimer = setTimeout(async () => {
      if (writing) return
      writing = true
      try {
        await emitTransformedFile(absoluteInputPath, absoluteOutputPath)
        console.log(`[rxs-watch] updated (${reason}): ${relativeOutputPath}`)
      } catch (error) {
        console.error(`[rxs-watch] transform failed (${reason}):`, error && error.message ? error.message : String(error))
      } finally {
        writing = false
      }
    }, 80)
  }

  await emitTransformedFile(absoluteInputPath, absoluteOutputPath)
  console.log(`[rxs-watch] initial emit: ${relativeOutputPath}`)
  console.log(`[rxs-watch] watching: ${relativeInputPath}`)

  fsSync.watch(absoluteInputPath, { persistent: true }, (eventType) => {
    if (eventType === 'rename' || eventType === 'change') {
      scheduleEmit(eventType)
    }
  })
}

run().catch((error) => {
  console.error(error && error.message ? error.message : String(error))
  process.exit(1)
})

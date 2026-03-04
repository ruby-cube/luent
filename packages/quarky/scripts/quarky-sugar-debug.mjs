import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as ts from 'typescript'
import { transformQuarkySugar } from './transform-quarky-sugar.mjs'

function parseArgs(argv) {
  let projectPath
  let targetPath
  let showCode = true
  let outputMode = 'text'

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if ((arg === '-p' || arg === '--project') && argv[index + 1]) {
      projectPath = argv[index + 1]
      index += 1
      continue
    }

    if (arg === '--no-code') {
      showCode = false
      continue
    }

    if (arg === '--json') {
      outputMode = 'json'
      continue
    }

    if (!arg.startsWith('-') && !targetPath) {
      targetPath = arg
    }
  }

  return {
    projectPath,
    targetPath,
    showCode,
    outputMode,
  }
}

function normalizeAbsolute(filePath) {
  return path.resolve(filePath)
}

function isLueFile(fileName) {
  return fileName.endsWith('.lue') || fileName.endsWith('.luex')
}

function getVirtualExtension(fileName) {
  return fileName.endsWith('.luex') ? '.tsx' : '.ts'
}

function getScriptKindFromFileName(fileName) {
  if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX
  if (fileName.endsWith('.js')) return ts.ScriptKind.JS
  if (fileName.endsWith('.mjs')) return ts.ScriptKind.JS
  if (fileName.endsWith('.cjs')) return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

function formatMessage(messageText) {
  return ts.flattenDiagnosticMessageText(messageText, '\n')
}

function formatLineCol(file, pos) {
  const { line, character } = file.getLineAndCharacterOfPosition(pos)
  return `${line + 1}:${character + 1}`
}

function printCodeWithLineNumbers(code) {
  const lines = code.split('\n')
  const width = String(lines.length).length
  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = String(index + 1).padStart(width, ' ')
    console.log(`${lineNo} | ${lines[index]}`)
  }
}

function run() {
  const { projectPath, targetPath, showCode, outputMode } = parseArgs(process.argv.slice(2))

  if (!targetPath) {
    console.error('Usage: quarky-sugar-debug <file.lue|file.luex> [-p tsconfig.json] [--no-code] [--json]')
    process.exit(1)
  }

  const targetAbs = normalizeAbsolute(targetPath)
  if (!isLueFile(targetAbs)) {
    console.error(`Expected a .lue or .luex file, got: ${targetAbs}`)
    process.exit(1)
  }

  if (!fs.existsSync(targetAbs)) {
    console.error(`File not found: ${targetAbs}`)
    process.exit(1)
  }

  const configPath = projectPath
    ? normalizeAbsolute(projectPath)
    : ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json')

  if (!configPath) {
    console.error('quarky-sugar-debug: tsconfig not found. Use -p <path>.')
    process.exit(1)
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  if (configFile.error) {
    console.error(formatMessage(configFile.error.messageText))
    process.exit(1)
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  )

  if (parsedConfig.errors.length > 0) {
    for (const error of parsedConfig.errors) {
      console.error(formatMessage(error.messageText))
    }
    process.exit(1)
  }

  const originalToVirtual = new Map()
  const virtualToOriginal = new Map()
  const transformCache = new Map()
  const originalSourceFileCache = new Map()

  function registerLueFile(originalPath) {
    const normalizedOriginal = normalizeAbsolute(originalPath)
    const existing = originalToVirtual.get(normalizedOriginal)
    if (existing) return existing

    const virtualPath = normalizedOriginal + getVirtualExtension(normalizedOriginal)
    originalToVirtual.set(normalizedOriginal, virtualPath)
    virtualToOriginal.set(virtualPath, normalizedOriginal)
    return virtualPath
  }

  function getTransformForOriginal(originalPath) {
    const normalizedOriginal = normalizeAbsolute(originalPath)
    const cached = transformCache.get(normalizedOriginal)
    if (cached) return cached

    const source = ts.sys.readFile(normalizedOriginal)
    if (source == null) {
      throw new Error(`Unable to read source: ${normalizedOriginal}`)
    }

    const result = transformQuarkySugar({
      code: source,
      fileName: normalizedOriginal,
    })

    transformCache.set(normalizedOriginal, result)
    return result
  }

  function getOriginalSourceFile(originalPath) {
    const normalizedOriginal = normalizeAbsolute(originalPath)
    const cached = originalSourceFileCache.get(normalizedOriginal)
    if (cached) return cached

    const originalCode = ts.sys.readFile(normalizedOriginal) ?? ''
    const sourceFile = ts.createSourceFile(
      normalizedOriginal,
      originalCode,
      ts.ScriptTarget.Latest,
      true,
      getScriptKindFromFileName(normalizedOriginal.endsWith('.luex') ? `${normalizedOriginal}.tsx` : `${normalizedOriginal}.ts`),
    )

    originalSourceFileCache.set(normalizedOriginal, sourceFile)
    return sourceFile
  }

  const virtualTarget = registerLueFile(targetAbs)
  const transformedTarget = getTransformForOriginal(targetAbs)

  if (showCode && outputMode === 'text') {
    console.log(`\n=== Transformed: ${targetAbs} ===\n`)
    printCodeWithLineNumbers(transformedTarget.code)
    console.log('')
  }

  const options = {
    ...parsedConfig.options,
    noEmit: true,
  }

  const baseHost = ts.createCompilerHost(options, true)

  const host = {
    ...baseHost,
    fileExists(fileName) {
      if (virtualToOriginal.has(fileName)) return true
      return baseHost.fileExists(fileName)
    },
    readFile(fileName) {
      const original = virtualToOriginal.get(fileName)
      if (original) {
        return getTransformForOriginal(original).code
      }
      return baseHost.readFile(fileName)
    },
    getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
      const original = virtualToOriginal.get(fileName)
      if (!original) {
        return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile)
      }

      return ts.createSourceFile(
        fileName,
        getTransformForOriginal(original).code,
        languageVersion,
        true,
        getScriptKindFromFileName(fileName),
      )
    },
    resolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference, compilerOptions) {
      return moduleNames.map((moduleName) => {
        const defaultResolution = ts.resolveModuleName(
          moduleName,
          containingFile,
          compilerOptions,
          host,
          redirectedReference,
        ).resolvedModule

        if (defaultResolution) return defaultResolution

        if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) return undefined

        const containingOriginal = virtualToOriginal.get(containingFile) ?? containingFile
        const containingDir = path.dirname(containingOriginal)

        const probeCandidates = []
        if (moduleName.endsWith('.lue') || moduleName.endsWith('.luex')) {
          probeCandidates.push(moduleName)
        } else {
          probeCandidates.push(`${moduleName}.lue`, `${moduleName}.luex`)
        }

        for (const candidate of probeCandidates) {
          const absoluteCandidate = normalizeAbsolute(path.resolve(containingDir, candidate))
          if (!ts.sys.fileExists(absoluteCandidate)) continue

          const virtualFileName = registerLueFile(absoluteCandidate)
          return {
            resolvedFileName: virtualFileName,
            extension: virtualFileName.endsWith('.tsx') ? ts.Extension.Tsx : ts.Extension.Ts,
            isExternalLibraryImport: false,
          }
        }

        return undefined
      })
    },
  }

  const rootNames = [
    ...parsedConfig.fileNames,
    virtualTarget,
  ]

  const program = ts.createProgram({
    rootNames,
    options,
    host,
    projectReferences: parsedConfig.projectReferences,
  })

  const diagnostics = ts.getPreEmitDiagnostics(program)

  const reports = diagnostics
    .filter((diagnostic) => diagnostic.file?.fileName === virtualTarget)
    .map((diagnostic) => {
      const transformedFile = diagnostic.file
      const transformedStart = diagnostic.start ?? 0
      const transformedEnd = transformedStart + (diagnostic.length ?? 0)
      const transformedRange = `${formatLineCol(transformedFile, transformedStart)}-${formatLineCol(transformedFile, transformedEnd)}`
      const transformedStartLoc = transformedFile.getLineAndCharacterOfPosition(transformedStart)
      const transformedEndLoc = transformedFile.getLineAndCharacterOfPosition(transformedEnd)

      const mapper = transformedTarget.mapper
      const originalFile = getOriginalSourceFile(targetAbs)
      const originalStart = Math.max(0, mapper.toOriginalPos(transformedStart))
      const originalEnd = Math.max(originalStart, mapper.toOriginalPos(transformedEnd))
      const originalRange = `${formatLineCol(originalFile, originalStart)}-${formatLineCol(originalFile, originalEnd)}`
      const originalStartLoc = originalFile.getLineAndCharacterOfPosition(originalStart)
      const originalEndLoc = originalFile.getLineAndCharacterOfPosition(originalEnd)

      return {
        code: diagnostic.code,
        category: ts.DiagnosticCategory[diagnostic.category],
        message: formatMessage(diagnostic.messageText),
        transformedRange,
        originalRange,
        transformedStart: {
          offset: transformedStart,
          line: transformedStartLoc.line + 1,
          column: transformedStartLoc.character + 1,
        },
        transformedEnd: {
          offset: transformedEnd,
          line: transformedEndLoc.line + 1,
          column: transformedEndLoc.character + 1,
        },
        originalStart: {
          offset: originalStart,
          line: originalStartLoc.line + 1,
          column: originalStartLoc.character + 1,
        },
        originalEnd: {
          offset: originalEnd,
          line: originalEndLoc.line + 1,
          column: originalEndLoc.character + 1,
        },
      }
    })

  if (outputMode === 'json') {
    const payload = {
      filePath: targetAbs,
      transformedFilePath: virtualTarget,
      diagnosticsCount: reports.length,
      transformedCode: showCode ? transformedTarget.code : undefined,
      diagnostics: reports,
    }

    console.log(JSON.stringify(payload, null, 2))
    process.exit(reports.length > 0 ? 1 : 0)
  }

  console.log(`=== Diagnostics for ${targetAbs} ===`)

  if (reports.length === 0) {
    console.log('No diagnostics for this sugar file after transform.')
    process.exit(0)
  }

  for (const report of reports) {
    console.log(`\n[${report.category} TS${report.code}] ${report.message}`)
    console.log(`  transformed: ${report.transformedRange}`)
    console.log(`  original:    ${report.originalRange}`)
  }

  process.exit(1)
}

run()

import path from 'node:path'
import process from 'node:process'
import * as ts from 'typescript'
import { transformRXSSugar } from './transform-rxs-sugar.mjs'

function parseArgs(argv) {
  let projectPath

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if ((arg === '-p' || arg === '--project') && argv[i + 1]) {
      projectPath = argv[i + 1]
      i += 1
    }
  }

  return { projectPath }
}

function getVirtualExtension(fileName) {
  return fileName.endsWith('.rxs') ? '.tsx' : '.ts'
}

function getScriptKindFromFileName(fileName) {
  if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX
  if (fileName.endsWith('.js')) return ts.ScriptKind.JS
  if (fileName.endsWith('.mjs')) return ts.ScriptKind.JS
  if (fileName.endsWith('.cjs')) return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

function normalizeAbsolute(filePath) {
  return path.resolve(filePath)
}

function createRXSCompilerContext(configPath, parsedConfig) {
  const originalToVirtual = new Map()
  const virtualToOriginal = new Map()
  const transformCache = new Map()
  const originalSourceFileCache = new Map()

  function registerRXSFile(originalPath) {
    const normalizedOriginal = normalizeAbsolute(originalPath)
    const existing = originalToVirtual.get(normalizedOriginal)
    if (existing) return existing

    const virtualPath = normalizedOriginal + getVirtualExtension(normalizedOriginal)
    originalToVirtual.set(normalizedOriginal, virtualPath)
    virtualToOriginal.set(virtualPath, normalizedOriginal)
    return virtualPath
  }

  const configDirectory = path.dirname(configPath)
  const includePatterns = Array.isArray(parsedConfig.raw?.include)
    ? parsedConfig.raw.include
    : undefined
  const excludePatterns = Array.isArray(parsedConfig.raw?.exclude)
    ? parsedConfig.raw.exclude
    : undefined

  const discoveredRXSFiles = ts.sys.readDirectory(
    configDirectory,
    ['.rxs'],
    excludePatterns,
    includePatterns,
  )

  for (const fileName of discoveredRXSFiles) {
    registerRXSFile(fileName)
  }

  function getTransformForOriginal(originalPath) {
    const normalizedOriginal = normalizeAbsolute(originalPath)
    const source = ts.sys.readFile(normalizedOriginal)
    if (source == null) {
      throw new Error(`Unable to read source: ${normalizedOriginal}`)
    }

    const cached = transformCache.get(normalizedOriginal)
    if (cached && cached.originalCode === source) return cached

    const transformed = transformRXSSugar({
      code: source,
      fileName: normalizedOriginal,
    })

    const enriched = {
      ...transformed,
      originalCode: source,
    }

    transformCache.set(normalizedOriginal, enriched)
    return enriched
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
      getScriptKindFromFileName(normalizedOriginal.endsWith('.rxs') ? `${normalizedOriginal}.tsx` : `${normalizedOriginal}.ts`),
    )

    originalSourceFileCache.set(normalizedOriginal, sourceFile)
    return sourceFile
  }

  function remapDiagnostic(diagnostic) {
    if (!diagnostic.file) return diagnostic

    const originalPath = virtualToOriginal.get(diagnostic.file.fileName)
    if (!originalPath) return diagnostic

    const start = diagnostic.start ?? 0
    const length = diagnostic.length ?? 0

    const transformResult = getTransformForOriginal(originalPath)
    const mappedStart = Math.max(0, transformResult.mapper.toOriginalPos(start))
    const mappedEnd = Math.max(mappedStart, transformResult.mapper.toOriginalPos(start + length))

    return {
      ...diagnostic,
      file: getOriginalSourceFile(originalPath),
      start: mappedStart,
      length: mappedEnd - mappedStart,
      relatedInformation: Array.isArray(diagnostic.relatedInformation)
        ? diagnostic.relatedInformation.map(remapDiagnostic)
        : diagnostic.relatedInformation,
    }
  }

  return {
    originalToVirtual,
    virtualToOriginal,
    registerRXSFile,
    getTransformForOriginal,
    remapDiagnostic,
  }
}

function resolveConfigPath(projectPath) {
  const configPath = projectPath
    ? normalizeAbsolute(projectPath)
    : ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json')

  if (!configPath) {
    console.error('rxs-tsc: tsconfig not found. Use -p <path>.')
    process.exit(1)
  }

  return configPath
}

function readAndParseConfig(configPath) {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  if (configFile.error) {
    const host = {
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: (f) => f,
      getNewLine: () => ts.sys.newLine,
    }
    console.error(ts.formatDiagnosticsWithColorAndContext([configFile.error], host))
    return { ok: false }
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  )

  if (parsedConfig.errors.length > 0) {
    const host = {
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: (f) => f,
      getNewLine: () => ts.sys.newLine,
    }
    console.error(ts.formatDiagnosticsWithColorAndContext(parsedConfig.errors, host))
    return { ok: false }
  }

  return { ok: true, parsedConfig }
}

function runTypecheck(configPath) {
  const parsed = readAndParseConfig(configPath)
  if (!parsed.ok) return false

  const { parsedConfig } = parsed
  const rxsContext = createRXSCompilerContext(configPath, parsedConfig)

  const options = {
    ...parsedConfig.options,
    noEmit: true,
  }

  const baseHost = ts.createCompilerHost(options, true)

  const host = {
    ...baseHost,
    fileExists(fileName) {
      if (rxsContext.virtualToOriginal.has(fileName)) return true
      return baseHost.fileExists(fileName)
    },
    readFile(fileName) {
      const original = rxsContext.virtualToOriginal.get(fileName)
      if (original) {
        return rxsContext.getTransformForOriginal(original).code
      }
      return baseHost.readFile(fileName)
    },
    getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
      const original = rxsContext.virtualToOriginal.get(fileName)
      if (!original) {
        return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile)
      }

      const transformed = rxsContext.getTransformForOriginal(original).code
      return ts.createSourceFile(
        fileName,
        transformed,
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

        if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
          return undefined
        }

        const containingOriginal = rxsContext.virtualToOriginal.get(containingFile) ?? containingFile
        const containingDir = path.dirname(containingOriginal)

        const probeCandidates = []
        if (moduleName.endsWith('.rxs')) {
          probeCandidates.push(moduleName)
        } else {
          probeCandidates.push(`${moduleName}.rxs`)
        }

        for (const candidate of probeCandidates) {
          const absoluteCandidate = normalizeAbsolute(path.resolve(containingDir, candidate))
          if (!ts.sys.fileExists(absoluteCandidate)) continue

          const virtualFileName = rxsContext.registerRXSFile(absoluteCandidate)
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
    ...Array.from(rxsContext.virtualToOriginal.keys()),
  ]

  const program = ts.createProgram({
    rootNames,
    options,
    host,
    projectReferences: parsedConfig.projectReferences,
  })

  const diagnostics = ts.getPreEmitDiagnostics(program)
  const remappedDiagnostics = diagnostics.map(rxsContext.remapDiagnostic)

  if (remappedDiagnostics.length > 0) {
    const formatHost = {
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: (f) => f,
      getNewLine: () => ts.sys.newLine,
    }

    console.error(ts.formatDiagnosticsWithColorAndContext(remappedDiagnostics, formatHost))
    return false
  }

  console.log('rxs-tsc: no type errors')
  return true
}

function run() {
  const { projectPath } = parseArgs(process.argv.slice(2))
  const configPath = resolveConfigPath(projectPath)

  const ok = runTypecheck(configPath)
  if (!ok) {
    process.exit(1)
  }
}

run()

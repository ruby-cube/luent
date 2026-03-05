import path from 'node:path'
import process from 'node:process'
import * as ts from 'typescript'
import { transformQuarkySugar } from './transform-quarky-sugar.mjs'

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

function isLueFile(fileName) {
  return fileName.endsWith('.lue') || fileName.endsWith('.qrx')
}

function getVirtualExtension(fileName) {
  return fileName.endsWith('.qrx') ? '.tsx' : '.ts'
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

function createLueCompilerContext(configPath, parsedConfig) {
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

  const configDirectory = path.dirname(configPath)
  const includePatterns = Array.isArray(parsedConfig.raw?.include)
    ? parsedConfig.raw.include
    : undefined
  const excludePatterns = Array.isArray(parsedConfig.raw?.exclude)
    ? parsedConfig.raw.exclude
    : undefined

  const discoveredLueFiles = ts.sys.readDirectory(
    configDirectory,
    ['.lue', '.qrx'],
    excludePatterns,
    includePatterns,
  )

  for (const fileName of discoveredLueFiles) {
    registerLueFile(fileName)
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
      getScriptKindFromFileName(normalizedOriginal.endsWith('.qrx') ? normalizedOriginal + '.tsx' : normalizedOriginal + '.ts'),
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

    const remapped = {
      ...diagnostic,
      file: getOriginalSourceFile(originalPath),
      start: mappedStart,
      length: mappedEnd - mappedStart,
    }

    return remapped
  }

  return {
    originalToVirtual,
    virtualToOriginal,
    registerLueFile,
    getTransformForOriginal,
    remapDiagnostic,
  }
}

function run() {
  const { projectPath } = parseArgs(process.argv.slice(2))

  const configPath = projectPath
    ? normalizeAbsolute(projectPath)
    : ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json')

  if (!configPath) {
    console.error('quarky-tsc: tsconfig not found. Use -p <path>.')
    process.exit(1)
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  if (configFile.error) {
    const host = {
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: (f) => f,
      getNewLine: () => ts.sys.newLine,
    }
    console.error(ts.formatDiagnosticsWithColorAndContext([configFile.error], host))
    process.exit(1)
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
    process.exit(1)
  }

  const lueContext = createLueCompilerContext(configPath, parsedConfig)

  const options = {
    ...parsedConfig.options,
    noEmit: true,
  }

  const baseHost = ts.createCompilerHost(options, true)

  const host = {
    ...baseHost,
    fileExists(fileName) {
      if (lueContext.virtualToOriginal.has(fileName)) return true
      return baseHost.fileExists(fileName)
    },
    readFile(fileName) {
      const original = lueContext.virtualToOriginal.get(fileName)
      if (original) {
        return lueContext.getTransformForOriginal(original).code
      }
      return baseHost.readFile(fileName)
    },
    getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
      const original = lueContext.virtualToOriginal.get(fileName)
      if (!original) {
        return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile)
      }

      const transformed = lueContext.getTransformForOriginal(original).code
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

        if (defaultResolution) {
          return defaultResolution
        }

        if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
          return undefined
        }

        const containingOriginal = lueContext.virtualToOriginal.get(containingFile) ?? containingFile
        const containingDir = path.dirname(containingOriginal)

        const probeCandidates = []
        if (moduleName.endsWith('.lue') || moduleName.endsWith('.qrx')) {
          probeCandidates.push(moduleName)
        } else {
          probeCandidates.push(`${moduleName}.lue`, `${moduleName}.qrx`)
        }

        for (const candidate of probeCandidates) {
          const absoluteCandidate = normalizeAbsolute(path.resolve(containingDir, candidate))
          if (!ts.sys.fileExists(absoluteCandidate)) continue

          const virtualFileName = lueContext.registerLueFile(absoluteCandidate)
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
    ...Array.from(lueContext.virtualToOriginal.keys()),
  ]

  const program = ts.createProgram({
    rootNames,
    options,
    host,
    projectReferences: parsedConfig.projectReferences,
  })

  const diagnostics = ts.getPreEmitDiagnostics(program)
  const remappedDiagnostics = diagnostics.map(lueContext.remapDiagnostic)

  if (remappedDiagnostics.length > 0) {
    const formatHost = {
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: (f) => f,
      getNewLine: () => ts.sys.newLine,
    }

    console.error(ts.formatDiagnosticsWithColorAndContext(remappedDiagnostics, formatHost))
    process.exit(1)
  }

  console.log('quarky-tsc: no type errors')
}

run()

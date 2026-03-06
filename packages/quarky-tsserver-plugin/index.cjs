const path = require('node:path')
const { transformQuarkySugar } = require('./transform-quarky-sugar.cjs')

const SUGAR_IDENTIFIER_RE = /^ø[A-Za-z_$][\w$]*$/

function init(modules) {
  const ts = modules.typescript

  function isSugarFile(fileName) {
    return fileName.endsWith('.qrk') || fileName.endsWith('.qrx')
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

  function create(info) {
    const languageService = info.languageService
    const host = info.languageServiceHost
    const project = info.project

    const logger = project.projectService.logger
    const pluginConfig = info.config || {}
    const profilingEnabled = Boolean(pluginConfig.profile)
    const slowOperationThresholdMs = Number.isFinite(pluginConfig.slowMs)
      ? Math.max(0, Number(pluginConfig.slowMs))
      : 12
    const semanticDiagnosticsCooldownMs = Number.isFinite(pluginConfig.semanticCooldownMs)
      ? Math.max(0, Number(pluginConfig.semanticCooldownMs))
      : 300
    const diagnosticsCache = new Map()
    const transientLsCache = new Map()
    const semanticDiagnosticsState = new Map()
    const parsedConfigCache = new Map()
    const discoveredSugarFilesCache = new Map()
    const transientDocumentRegistry = ts.createDocumentRegistry()
    const globalOriginalToVirtual = new Map()
    const globalVirtualToOriginal = new Map()
    const globalTransformCache = new Map()

    function registerGlobalSugarFile(originalPath) {
      const normalizedOriginal = normalizeAbsolute(originalPath)
      const existing = globalOriginalToVirtual.get(normalizedOriginal)
      if (existing) return existing

      const virtualPath = normalizedOriginal + getVirtualExtension(normalizedOriginal)
      globalOriginalToVirtual.set(normalizedOriginal, virtualPath)
      globalVirtualToOriginal.set(virtualPath, normalizedOriginal)
      return virtualPath
    }

    function getGlobalTransformForOriginal(originalPath) {
      const normalizedOriginal = normalizeAbsolute(originalPath)
      const sourceText = getSnapshotText(normalizedOriginal)
      const source = typeof sourceText === 'string'
        ? sourceText
        : (ts.sys.readFile(normalizedOriginal) || '')
      const cached = globalTransformCache.get(normalizedOriginal)
      if (cached && cached.originalCode === source) return cached

      const result = profile(`global-transform:${path.basename(normalizedOriginal)}`, () => transformQuarkySugar({
        code: source,
        fileName: normalizedOriginal,
      }))

      const enrichedResult = {
        ...result,
        originalCode: source,
      }

      globalTransformCache.set(normalizedOriginal, enrichedResult)
      return enrichedResult
    }

    function resolveSugarModule(moduleName, containingFile, compilerOptions) {
      if (!moduleName || typeof moduleName !== 'string') return undefined

      const moduleResolutionHost = {
        fileExists: (candidate) => {
          if (globalVirtualToOriginal.has(candidate)) return true
          return ts.sys.fileExists(candidate)
        },
        readFile: (candidate) => {
          const original = globalVirtualToOriginal.get(candidate)
          if (original) return getGlobalTransformForOriginal(original).code
          return ts.sys.readFile(candidate)
        },
        directoryExists: ts.sys.directoryExists,
        getDirectories: ts.sys.getDirectories,
        realpath: ts.sys.realpath,
        getCurrentDirectory: () => host.getCurrentDirectory(),
        useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
      }

      const defaultResolution = ts.resolveModuleName(
        moduleName,
        containingFile,
        compilerOptions || project.getCompilationSettings(),
        moduleResolutionHost,
      ).resolvedModule

      if (defaultResolution) return defaultResolution

      if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
        return undefined
      }

      const containingOriginal = globalVirtualToOriginal.get(containingFile) || containingFile
      const containingDir = path.dirname(containingOriginal)

      const probeCandidates = []
      if (moduleName.endsWith('.qrk') || moduleName.endsWith('.qrx')) {
        probeCandidates.push(moduleName)
      } else {
        probeCandidates.push(`${moduleName}.qrk`, `${moduleName}.qrx`)
      }

      for (const candidate of probeCandidates) {
        const absoluteCandidate = normalizeAbsolute(path.resolve(containingDir, candidate))
        if (!ts.sys.fileExists(absoluteCandidate)) continue

        const resolvedVirtual = registerGlobalSugarFile(absoluteCandidate)
        return {
          resolvedFileName: resolvedVirtual,
          extension: resolvedVirtual.endsWith('.tsx') ? ts.Extension.Tsx : ts.Extension.Ts,
          isExternalLibraryImport: false,
        }
      }

      return undefined
    }

    const originalHostFileExists = typeof host.fileExists === 'function'
      ? host.fileExists.bind(host)
      : undefined
    const originalHostReadFile = typeof host.readFile === 'function'
      ? host.readFile.bind(host)
      : undefined
    const originalHostGetScriptSnapshot = typeof host.getScriptSnapshot === 'function'
      ? host.getScriptSnapshot.bind(host)
      : undefined
    const originalHostGetScriptVersion = typeof host.getScriptVersion === 'function'
      ? host.getScriptVersion.bind(host)
      : undefined
    const originalHostGetProjectVersion = typeof host.getProjectVersion === 'function'
      ? host.getProjectVersion.bind(host)
      : undefined
    const originalHostResolveModuleNames = typeof host.resolveModuleNames === 'function'
      ? host.resolveModuleNames.bind(host)
      : undefined

    host.fileExists = (fileName) => {
      if (globalVirtualToOriginal.has(fileName)) return true
      if (originalHostFileExists) return originalHostFileExists(fileName)
      return ts.sys.fileExists(fileName)
    }

    host.readFile = (fileName) => {
      const original = globalVirtualToOriginal.get(fileName)
      if (original) {
        return getGlobalTransformForOriginal(original).code
      }

      if (originalHostReadFile) return originalHostReadFile(fileName)
      return ts.sys.readFile(fileName)
    }

    host.getScriptSnapshot = (fileName) => {
      const original = globalVirtualToOriginal.get(fileName)
      if (original) {
        const transformed = getGlobalTransformForOriginal(original).code
        return ts.ScriptSnapshot.fromString(transformed)
      }

      if (originalHostGetScriptSnapshot) return originalHostGetScriptSnapshot(fileName)

      const text = ts.sys.readFile(fileName)
      if (typeof text !== 'string') return undefined
      return ts.ScriptSnapshot.fromString(text)
    }

    host.getScriptVersion = (fileName) => {
      const original = globalVirtualToOriginal.get(fileName)
      if (original && originalHostGetScriptVersion) {
        return originalHostGetScriptVersion(original)
      }

      if (originalHostGetScriptVersion) return originalHostGetScriptVersion(fileName)
      return '0'
    }

    host.resolveModuleNames = (moduleNames, containingFile, reusedNames, redirectedReference, compilerOptions) => {
      const prior = originalHostResolveModuleNames
        ? originalHostResolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference, compilerOptions)
        : []

      return moduleNames.map((moduleName, index) => {
        const priorResolved = Array.isArray(prior) ? prior[index] : undefined
        if (priorResolved) return priorResolved
        return resolveSugarModule(moduleName, containingFile, compilerOptions)
      })
    }

    function evictStaleFileCacheEntries(cache, cachePrefix, onDelete) {
      for (const [entryKey, entryValue] of cache.entries()) {
        if (!entryKey.startsWith(cachePrefix)) continue
        cache.delete(entryKey)
        if (typeof onDelete === 'function') {
          try {
            onDelete(entryValue)
          } catch {
            // ignore cleanup failures
          }
        }
      }
    }

    function log(message) {
      logger.info(`[quarky-tsserver-plugin] ${message}`)
    }

    function profile(label, fn) {
      if (!profilingEnabled) return fn()
      const start = Date.now()
      try {
        return fn()
      } finally {
        const duration = Date.now() - start
        if (duration >= slowOperationThresholdMs) {
          log(`[perf] ${label} ${duration}ms`)
        }
      }
    }

    function getConfigPath() {
      const projectName = project.getProjectName && project.getProjectName()
      if (projectName && projectName.endsWith('.json')) {
        return normalizeAbsolute(projectName)
      }
      return ts.findConfigFile(host.getCurrentDirectory(), ts.sys.fileExists, 'tsconfig.json')
    }

    function getSnapshotText(fileName) {
      const snapshot = host.getScriptSnapshot(fileName)
      if (!snapshot) return undefined
      return snapshot.getText(0, snapshot.getLength())
    }

    function getProjectVersion() {
      let value

      if (originalHostGetProjectVersion) {
        value = originalHostGetProjectVersion()
      } else if (project && typeof project.getProjectVersion === 'function') {
        value = project.getProjectVersion()
      }

      if (value === undefined || value === null) return ''
      return String(value)
    }

    function getConfigMtimeMs(configPath) {
      if (typeof ts.sys.getModifiedTime !== 'function') return -1
      const modified = ts.sys.getModifiedTime(configPath)
      if (!modified) return -1
      return modified.valueOf()
    }

    function getParsedConfigForPath(configPath) {
      const normalizedConfigPath = normalizeAbsolute(configPath)
      const mtimeMs = getConfigMtimeMs(normalizedConfigPath)
      const cached = parsedConfigCache.get(normalizedConfigPath)
      if (cached && (mtimeMs === -1 || cached.mtimeMs === mtimeMs)) {
        return cached
      }

      const configFile = ts.readConfigFile(normalizedConfigPath, ts.sys.readFile)
      if (configFile.error) return undefined

      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(normalizedConfigPath),
      )

      if (parsedConfig.errors.length > 0) return undefined

      const parsed = {
        parsedConfig,
        mtimeMs,
      }

      parsedConfigCache.set(normalizedConfigPath, parsed)
      return parsed
    }

    function getDiscoveredSugarFiles(configPath, parsedConfig) {
      const normalizedConfigPath = normalizeAbsolute(configPath)
      const configDirectory = path.dirname(normalizedConfigPath)
      const includePatterns = Array.isArray(parsedConfig.raw && parsedConfig.raw.include)
        ? parsedConfig.raw.include
        : undefined
      const excludePatterns = Array.isArray(parsedConfig.raw && parsedConfig.raw.exclude)
        ? parsedConfig.raw.exclude
        : undefined
      const signature = `${JSON.stringify(includePatterns || [])}|${JSON.stringify(excludePatterns || [])}`
      const mtimeMs = getConfigMtimeMs(normalizedConfigPath)

      const cached = discoveredSugarFilesCache.get(normalizedConfigPath)
      if (cached && cached.signature === signature && (mtimeMs === -1 || cached.mtimeMs === mtimeMs)) {
        return cached.files
      }

      const files = ts.sys.readDirectory(
        configDirectory,
        ['.qrk', '.qrx'],
        excludePatterns,
        includePatterns,
      )

      discoveredSugarFilesCache.set(normalizedConfigPath, {
        files,
        signature,
        mtimeMs,
      })

      return files
    }

    function createQrkCompilerContext(configPath, parsedConfig, discoveredQrkFiles, targetPath, getTargetSourceText) {
      const normalizedTarget = normalizeAbsolute(targetPath)
      const originalToVirtual = new Map()
      const virtualToOriginal = new Map()
      const transformCache = new Map()
      const originalSourceFileCache = new Map()

      function registerQrkFile(originalPath) {
        const normalizedOriginal = normalizeAbsolute(originalPath)
        const existing = originalToVirtual.get(normalizedOriginal)
        if (existing) return existing

        const virtualPath = normalizedOriginal + getVirtualExtension(normalizedOriginal)
        originalToVirtual.set(normalizedOriginal, virtualPath)
        virtualToOriginal.set(virtualPath, normalizedOriginal)
        return virtualPath
      }

      for (const fileName of discoveredQrkFiles) {
        registerQrkFile(fileName)
      }

      registerQrkFile(normalizedTarget)

      function getOriginalSourceText(originalPath) {
        const normalized = normalizeAbsolute(originalPath)
        if (normalized === normalizedTarget && typeof getTargetSourceText === 'function') {
          const targetText = getTargetSourceText()
          if (typeof targetText === 'string') return targetText
        }
        return ts.sys.readFile(normalized) || ''
      }

      function getTransformForOriginal(originalPath) {
        const normalizedOriginal = normalizeAbsolute(originalPath)
        const cached = transformCache.get(normalizedOriginal)
        const source = getOriginalSourceText(normalizedOriginal)
        if (cached && cached.originalCode === source) return cached

        const result = profile(`transform:${path.basename(normalizedOriginal)}`, () => transformQuarkySugar({
          code: source,
          fileName: normalizedOriginal,
        }))

        const enrichedResult = {
          ...result,
          originalCode: source,
        }

        transformCache.set(normalizedOriginal, enrichedResult)
        return enrichedResult
      }

      function getOriginalSourceFile(originalPath) {
        const normalizedOriginal = normalizeAbsolute(originalPath)
        if (normalizedOriginal === normalizedTarget) {
          const originalCode = getOriginalSourceText(normalizedOriginal)
          return ts.createSourceFile(
            normalizedOriginal,
            originalCode,
            ts.ScriptTarget.Latest,
            true,
            getScriptKindFromFileName(normalizedOriginal.endsWith('.qrx') ? `${normalizedOriginal}.tsx` : `${normalizedOriginal}.ts`),
          )
        }

        const cached = originalSourceFileCache.get(normalizedOriginal)
        if (cached) return cached

        const originalCode = getOriginalSourceText(normalizedOriginal)
        const sourceFile = ts.createSourceFile(
          normalizedOriginal,
          originalCode,
          ts.ScriptTarget.Latest,
          true,
          getScriptKindFromFileName(normalizedOriginal.endsWith('.qrx') ? `${normalizedOriginal}.tsx` : `${normalizedOriginal}.ts`),
        )

        originalSourceFileCache.set(normalizedOriginal, sourceFile)
        return sourceFile
      }

      function remapDiagnostic(diagnostic) {
        if (!diagnostic.file) return diagnostic

        const originalPath = virtualToOriginal.get(diagnostic.file.fileName)
        if (!originalPath) return diagnostic

        const transformResult = getTransformForOriginal(originalPath)
        const hasSpan = typeof diagnostic.start === 'number' && typeof diagnostic.length === 'number'
        const mappedSpan = hasSpan
          ? mapDiagnosticSpanToOriginal({ start: diagnostic.start, length: diagnostic.length }, transformResult)
          : null

        const relatedInformation = Array.isArray(diagnostic.relatedInformation)
          ? diagnostic.relatedInformation.map((relatedDiagnostic) => remapDiagnostic(relatedDiagnostic))
          : diagnostic.relatedInformation

        return {
          ...diagnostic,
          file: getOriginalSourceFile(originalPath),
          ...(mappedSpan ? {
            start: mappedSpan.start,
            length: mappedSpan.length,
          } : {}),
          ...(relatedInformation ? { relatedInformation } : {}),
        }
      }

      return {
        originalToVirtual,
        virtualToOriginal,
        registerQrkFile,
        getTransformForOriginal,
        remapDiagnostic,
      }
    }

    function toTransformedPos(transformResult, originalPos) {
      if (transformResult && transformResult.mapper && typeof transformResult.mapper.toTransformedPos === 'function') {
        return transformResult.mapper.toTransformedPos(originalPos)
      }

      const codeLength = transformResult.code.length
      let bestPos = 0
      let bestDistance = Number.POSITIVE_INFINITY

      for (let transformedPos = 0; transformedPos <= codeLength; transformedPos += 1) {
        const mappedOriginal = transformResult.mapper.toOriginalPos(transformedPos)
        const distance = Math.abs(mappedOriginal - originalPos)
        if (distance < bestDistance) {
          bestDistance = distance
          bestPos = transformedPos
          if (distance === 0) break
        }
      }

      return bestPos
    }

    function withNearbyPositions(centerPos, maxPos, radius) {
      const positions = []
      const seen = new Set()

      function add(pos) {
        const safePos = Math.max(0, Math.min(maxPos, pos))
        if (seen.has(safePos)) return
        seen.add(safePos)
        positions.push(safePos)
      }

      add(centerPos)
      for (let delta = 1; delta <= radius; delta += 1) {
        add(centerPos + delta)
        add(centerPos - delta)
      }

      return positions
    }

    function mapDiagnosticSpanToOriginal(span, transformResult) {
      if (!span) return span

      const transformedStart = Math.max(0, span.start || 0)
      const transformedLength = Math.max(0, span.length || 0)
      const transformedCode = transformResult && typeof transformResult.code === 'string'
        ? transformResult.code
        : ''
      const originalCode = transformResult && typeof transformResult.originalCode === 'string'
        ? transformResult.originalCode
        : ''
      const transformedSlice = transformedCode.slice(transformedStart, transformedStart + transformedLength)

      const correctedIdentifierRange = findBestNearbyOriginalIdentifierRange(
        originalCode,
        transformedSlice,
        transformResult.mapper.toOriginalPos(transformedStart),
      )
      if (correctedIdentifierRange) {
        return correctedIdentifierRange
      }

      return mapMatchingTransformedRangeToOriginal(transformResult, transformedStart, transformedLength)
        || mapTextSpanToOriginal({
          start: transformedStart,
          length: transformedLength,
        }, transformResult)
    }

    function mapTextSpanToOriginal(span, transformResult) {
      if (!span) return span

      if (span.length <= 0) {
        const start = transformResult.mapper.toOriginalPos(span.start)
        return {
          start,
          length: 0,
        }
      }

      const transformedStart = Math.max(0, span.start)
      const transformedEnd = transformedStart + Math.max(0, span.length)

      let firstMapped = null
      let lastMapped = null

      for (let transformedPos = transformedStart; transformedPos < transformedEnd; transformedPos += 1) {
        const mappedOriginal = transformResult.mapper.toOriginalPos(transformedPos)
        if (firstMapped == null) firstMapped = mappedOriginal
        lastMapped = mappedOriginal
      }

      if (firstMapped == null || lastMapped == null) {
        const start = transformResult.mapper.toOriginalPos(span.start)
        const end = transformResult.mapper.toOriginalPos(span.start + span.length)
        return {
          start,
          length: Math.max(0, end - start),
        }
      }

      const mappedStart = Math.min(firstMapped, lastMapped)
      const mappedEnd = Math.max(firstMapped, lastMapped)

      return {
        start: mappedStart,
        length: Math.max(1, mappedEnd - mappedStart + 1),
      }
    }

    function toTransformedTextSpan(transformResult, span) {
      if (!span) return span
      const transformedStart = toTransformedPos(transformResult, span.start)
      const transformedEnd = toTransformedPos(transformResult, span.start + span.length)
      const start = Math.min(transformedStart, transformedEnd)
      const end = Math.max(transformedStart, transformedEnd)
      return {
        start,
        length: Math.max(0, end - start),
      }
    }

    function mapClassifiedSpansToOriginal(spans, transformResult) {
      if (!Array.isArray(spans)) return spans

      const mapped = []
      for (const classifiedSpan of spans) {
        if (!classifiedSpan || !classifiedSpan.textSpan) continue
        const mappedTextSpan = mapClassificationTextSpanToOriginal(classifiedSpan.textSpan, transformResult)
        if (!mappedTextSpan) continue
        mapped.push({
          ...classifiedSpan,
          textSpan: mappedTextSpan,
        })
      }

      return mapped
    }

    function getTransformSourcePair(transformResult) {
      return {
        transformedCode: transformResult && typeof transformResult.code === 'string'
          ? transformResult.code
          : '',
        originalCode: transformResult && typeof transformResult.originalCode === 'string'
          ? transformResult.originalCode
          : '',
      }
    }

    function findBestNearbyOriginalIdentifierRange(originalCode, transformedSlice, approximateStart) {
      if (typeof transformedSlice !== 'string') return null
      if (!SUGAR_IDENTIFIER_RE.test(transformedSlice)) return null

      const identifier = transformedSlice.slice(1)
      const windowStart = Math.max(0, approximateStart - 80)
      const windowEnd = Math.min(originalCode.length, approximateStart + 80)
      const candidates = []

      function collect(token, includeAt) {
        let index = originalCode.indexOf(token, windowStart)
        while (index >= 0 && index < windowEnd) {
          candidates.push({
            start: index,
            length: includeAt ? identifier.length + 1 : identifier.length,
            distance: Math.abs(index - approximateStart),
            priority: includeAt ? 0 : 1,
          })
          index = originalCode.indexOf(token, index + 1)
        }
      }

      collect(`${identifier}@`, true)
      collect(identifier, false)

      if (candidates.length === 0) return null

      candidates.sort((left, right) => {
        if (left.priority !== right.priority) return left.priority - right.priority
        if (left.distance !== right.distance) return left.distance - right.distance
        return left.start - right.start
      })

      const best = candidates[0]
      return {
        start: best.start,
        length: best.length,
      }
    }

    function mapMatchingTransformedRangeToOriginal(transformResult, transformedStart, transformedLength, options = {}) {
      if (transformedLength <= 0) {
        return {
          start: transformResult.mapper.toOriginalPos(transformedStart),
          length: 0,
        }
      }

      const minMatchRatio = Number.isFinite(options.minMatchRatio)
        ? Math.max(0, Math.min(1, options.minMatchRatio))
        : 0

      const { transformedCode, originalCode } = getTransformSourcePair(transformResult)
      const transformedEnd = transformedStart + transformedLength

      let firstMapped = null
      let lastMapped = null
      let matchedCount = 0

      for (let transformedPos = transformedStart; transformedPos < transformedEnd; transformedPos += 1) {
        const transformedChar = transformedCode[transformedPos]
        if (typeof transformedChar !== 'string') continue

        const mappedOriginal = transformResult.mapper.toOriginalPos(transformedPos)
        if (mappedOriginal < 0 || mappedOriginal >= originalCode.length) continue

        const originalChar = originalCode[mappedOriginal]
        if (transformedChar !== originalChar) continue

        matchedCount += 1
        if (firstMapped == null) firstMapped = mappedOriginal
        lastMapped = mappedOriginal
      }

      if (matchedCount === 0 || firstMapped == null || lastMapped == null) {
        return null
      }

      if (transformedLength > 0 && (matchedCount / transformedLength) < minMatchRatio) {
        return null
      }

      const mappedStart = Math.min(firstMapped, lastMapped)
      let mappedEnd = Math.max(firstMapped, lastMapped)

      const transformedSlice = transformedCode.slice(transformedStart, transformedEnd)
      const transformedLooksLikeSugarIdentifier = SUGAR_IDENTIFIER_RE.test(transformedSlice)
      if (
        transformedLooksLikeSugarIdentifier
        && mappedEnd + 1 < originalCode.length
        && originalCode[mappedEnd + 1] === '@'
      ) {
        mappedEnd += 1
      }

      return {
        start: mappedStart,
        length: Math.max(1, mappedEnd - mappedStart + 1),
      }
    }

    function mapClassificationTextSpanToOriginal(span, transformResult) {
      if (!span || span.length <= 0) return mapTextSpanToOriginal(span, transformResult)

      const transformedStart = Math.max(0, span.start)
      const transformedLength = Math.max(0, span.length)
      return mapMatchingTransformedRangeToOriginal(transformResult, transformedStart, transformedLength, {
        minMatchRatio: 0.5,
      })
    }

    function mapEncodedClassificationsToOriginal(classifications, transformResult) {
      if (!classifications || !Array.isArray(classifications.spans)) return classifications

      const mappedSpans = []
      const inputSpans = classifications.spans
      for (let index = 0; index + 2 < inputSpans.length; index += 3) {
        const transformedStart = inputSpans[index]
        const transformedLength = inputSpans[index + 1]
        const classification = inputSpans[index + 2]

        const mappedSpan = mapMatchingTransformedRangeToOriginal(
          transformResult,
          transformedStart,
          transformedLength,
          {
            minMatchRatio: 0.5,
          },
        )

        if (!mappedSpan || mappedSpan.length <= 0) continue

        mappedSpans.push(mappedSpan.start, mappedSpan.length, classification)
      }

      return {
        ...classifications,
        spans: mappedSpans,
      }
    }

    function removeWhitespace(value) {
      return typeof value === 'string' ? value.replace(/\s+/g, '') : ''
    }

    function reflowWhitespacePattern(sourceText, patternText) {
      const source = typeof sourceText === 'string' ? sourceText : ''
      const pattern = typeof patternText === 'string' ? patternText : ''

      const sourceNonWhitespaceChars = []
      for (const char of source) {
        if (!/\s/.test(char)) sourceNonWhitespaceChars.push(char)
      }

      const chunks = []
      let currentWhitespace = ''
      for (const char of pattern) {
        if (/\s/.test(char)) {
          currentWhitespace += char
        } else {
          chunks.push(currentWhitespace)
          currentWhitespace = ''
        }
      }
      chunks.push(currentWhitespace)

      const patternNonWhitespaceLength = Math.max(0, chunks.length - 1)
      if (sourceNonWhitespaceChars.length !== patternNonWhitespaceLength) return null

      let result = chunks[0] || ''
      for (let index = 0; index < sourceNonWhitespaceChars.length; index += 1) {
        result += sourceNonWhitespaceChars[index]
        result += chunks[index + 1] || ''
      }

      return result
    }

    function mapFormattingChangeToOriginal(change, transformResult) {
      if (!change || !change.span) return null

      const transformedStart = change.span.start
      const transformedLength = Math.max(0, change.span.length)
      const transformedEnd = transformedStart + transformedLength
      const transformedOldText = transformResult.code.slice(transformedStart, transformedEnd)
      const transformedNewText = typeof change.newText === 'string' ? change.newText : ''

      const nonWhitespaceOld = removeWhitespace(transformedOldText)
      const nonWhitespaceNew = removeWhitespace(transformedNewText)
      if (nonWhitespaceOld !== nonWhitespaceNew) return null

      let mappedSpan = mapMatchingTransformedRangeToOriginal(
        transformResult,
        transformedStart,
        transformedLength,
      )

      if (!mappedSpan) {
        const fallbackStart = transformResult.mapper.toOriginalPos(transformedStart)
        const fallbackEnd = transformResult.mapper.toOriginalPos(transformedEnd)
        mappedSpan = {
          start: Math.min(fallbackStart, fallbackEnd),
          length: Math.max(0, Math.abs(fallbackEnd - fallbackStart)),
        }
      }

      const originalStart = mappedSpan.start
      const originalEnd = originalStart + mappedSpan.length
      const originalOldText = transformResult.originalCode.slice(originalStart, originalEnd)

      const reflowed = reflowWhitespacePattern(originalOldText, transformedNewText)
      if (reflowed === null) return null

      if (removeWhitespace(originalOldText) !== nonWhitespaceOld) return null

      return {
        span: {
          start: originalStart,
          length: mappedSpan.length,
        },
        newText: reflowed,
      }
    }

    function mapFormattingChangesToOriginal(changes, transformResult) {
      if (!Array.isArray(changes) || changes.length === 0) return []

      const mapped = []
      for (const change of changes) {
        const mappedChange = mapFormattingChangeToOriginal(change, transformResult)
        if (!mappedChange) continue
        mapped.push(mappedChange)
      }

      if (mapped.length <= 1) return mapped

      mapped.sort((left, right) => {
        if (left.span.start !== right.span.start) return left.span.start - right.span.start
        return left.span.length - right.span.length
      })

      const nonOverlapping = []
      let lastEnd = -1
      for (const change of mapped) {
        const start = change.span.start
        const end = start + change.span.length
        if (start < lastEnd) continue
        nonOverlapping.push(change)
        lastEnd = end
      }

      return nonOverlapping
    }

    function mapDefinitionToOriginal(definition, qrkContext) {
      const originalFile = qrkContext.virtualToOriginal.get(definition.fileName)
      if (!originalFile) return definition

      const transformResult = qrkContext.getTransformForOriginal(originalFile)
      return {
        ...definition,
        fileName: originalFile,
        textSpan: mapTextSpanToOriginal(definition.textSpan, transformResult),
        contextSpan: mapTextSpanToOriginal(definition.contextSpan, transformResult),
        originalTextSpan: mapTextSpanToOriginal(definition.originalTextSpan, transformResult),
      }
    }

    function mapReferenceEntryToOriginal(referenceEntry, qrkContext) {
      const originalFile = qrkContext.virtualToOriginal.get(referenceEntry.fileName)
      if (!originalFile) return referenceEntry

      const transformResult = qrkContext.getTransformForOriginal(originalFile)
      return {
        ...referenceEntry,
        fileName: originalFile,
        textSpan: mapTextSpanToOriginal(referenceEntry.textSpan, transformResult),
        contextSpan: mapTextSpanToOriginal(referenceEntry.contextSpan, transformResult),
      }
    }

    function mapRenameLocationToOriginal(location, qrkContext) {
      const originalFile = qrkContext.virtualToOriginal.get(location.fileName)
      if (!originalFile) return location

      const transformResult = qrkContext.getTransformForOriginal(originalFile)
      return {
        ...location,
        fileName: originalFile,
        textSpan: mapTextSpanToOriginal(location.textSpan, transformResult),
        contextSpan: mapTextSpanToOriginal(location.contextSpan, transformResult),
      }
    }

    function mapDocumentHighlightsToOriginal(documentHighlights, qrkContext) {
      if (!Array.isArray(documentHighlights)) return documentHighlights

      return documentHighlights.map((highlightEntry) => {
        if (!highlightEntry || typeof highlightEntry.fileName !== 'string') return highlightEntry

        const originalFile = qrkContext.virtualToOriginal.get(highlightEntry.fileName)
        if (!originalFile) return highlightEntry

        const transformResult = qrkContext.getTransformForOriginal(originalFile)
        const highlightSpans = Array.isArray(highlightEntry.highlightSpans)
          ? highlightEntry.highlightSpans.map((highlightSpan) => {
            if (!highlightSpan || !highlightSpan.textSpan) return highlightSpan
            return {
              ...highlightSpan,
              textSpan: mapTextSpanToOriginal(highlightSpan.textSpan, transformResult),
              contextSpan: mapTextSpanToOriginal(highlightSpan.contextSpan, transformResult),
            }
          })
          : highlightEntry.highlightSpans

        return {
          ...highlightEntry,
          fileName: originalFile,
          highlightSpans,
        }
      })
    }

    function getSourceTextForFile(fileName) {
      const snapshot = host.getScriptSnapshot(fileName)
      if (snapshot) return snapshot.getText(0, snapshot.getLength())
      return ts.sys.readFile(fileName)
    }

    function getIdentifierPrefixAtPosition(text, position) {
      if (typeof text !== 'string') return ''
      const safePos = Math.max(0, Math.min(text.length, position))
      let start = safePos
      while (start > 0) {
        const ch = text.charCodeAt(start - 1)
        const isWord = (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 || ch === 36 || ch === 968
        if (!isWord) break
        start -= 1
      }
      return text.slice(start, safePos)
    }

    function remapCompletionEntriesToSugar(entries, originalPrefix) {
      if (!Array.isArray(entries)) return entries
      if (typeof originalPrefix === 'string' && originalPrefix.startsWith('ø')) return entries

      return entries.map((entry) => {
        if (!entry || typeof entry.name !== 'string') return entry
        if (!entry.name.startsWith('ø')) return entry
        if (!SUGAR_IDENTIFIER_RE.test(entry.name)) return entry

        const sugarName = `${entry.name.slice(1)}@`
        const insertText = typeof entry.insertText === 'string'
          ? entry.insertText.replace(/^ø([A-Za-z_$][\w$]*)$/, '$1@')
          : sugarName

        return {
          ...entry,
          name: sugarName,
          insertText,
          filterText: sugarName,
        }
      })
    }

    function isLikelyDestructuringContext(text, position) {
      if (typeof text !== 'string') return false
      const safePos = Math.max(0, Math.min(text.length, position))
      const before = text.slice(Math.max(0, safePos - 200), safePos)
      const after = text.slice(safePos, Math.min(text.length, safePos + 140))
      if (!/\b(const|let|var)\s*\{[^}]*$/.test(before)) return false
      if (!after.includes('}')) return false
      if (!after.includes('=')) return false
      return true
    }

    function selectClosestNonEmptyCompletion(candidates, centerPos) {
      const valid = candidates.filter((candidate) => candidate && candidate.completions && Array.isArray(candidate.completions.entries) && candidate.completions.entries.length > 0)
      if (valid.length === 0) return undefined

      valid.sort((left, right) => {
        const leftDistance = Math.abs(left.position - centerPos)
        const rightDistance = Math.abs(right.position - centerPos)
        if (leftDistance !== rightDistance) return leftDistance - rightDistance
        return right.completions.entries.length - left.completions.entries.length
      })

      return valid[0].completions
    }

    function prioritizeDestructuredSugarEntries(entries) {
      if (!Array.isArray(entries)) return entries
      const sugarEntries = entries.filter((entry) => entry && typeof entry.name === 'string' && entry.name.endsWith('@'))
      if (sugarEntries.length === 0) return entries
      return sugarEntries
    }

    function createTransientLanguageService(fileName) {
      const normalizedFile = normalizeAbsolute(fileName)
      const scriptVersion = host.getScriptVersion(normalizedFile) || host.getScriptVersion(fileName) || ''
      const projectVersion = getProjectVersion()
      const configPath = getConfigPath()
      if (!configPath) return undefined

      const parsedConfigResult = getParsedConfigForPath(configPath)
      if (!parsedConfigResult) return undefined

      const parsedConfig = parsedConfigResult.parsedConfig
      const discoveredQrkFiles = getDiscoveredSugarFiles(configPath, parsedConfig)
      const configSignature = `${normalizeAbsolute(configPath)}:${parsedConfigResult.mtimeMs}`

      const cached = transientLsCache.get(normalizedFile)
      if (
        cached
        && cached.configSignature === configSignature
        && cached.scriptVersion === scriptVersion
        && cached.projectVersion === projectVersion
      ) {
        return cached
      }

      const sourceText = getSnapshotText(fileName)
      if (typeof sourceText !== 'string') return undefined

      const qrkContext = createQrkCompilerContext(
        configPath,
        parsedConfig,
        discoveredQrkFiles,
        normalizedFile,
        () => getSnapshotText(normalizedFile),
      )
      const virtualFileName = qrkContext.originalToVirtual.get(normalizedFile)
      if (!virtualFileName) return undefined

      const compilerOptions = {
        ...parsedConfig.options,
        noEmit: true,
      }

      const scriptFileNames = [virtualFileName]

      const languageServiceHost = {
        getScriptFileNames() {
          return scriptFileNames
        },
        getScriptVersion(scriptName) {
          const normalizedScriptName = normalizeAbsolute(scriptName)
          if (normalizedScriptName === normalizedFile) return scriptVersion
          const originalForVirtual = qrkContext.virtualToOriginal.get(scriptName)
          if (originalForVirtual && normalizeAbsolute(originalForVirtual) === normalizedFile) {
            return scriptVersion
          }

          if (originalForVirtual) {
            return host.getScriptVersion(originalForVirtual) || '0'
          }

          return host.getScriptVersion(scriptName) || '0'
        },
        getScriptSnapshot(scriptName) {
          const original = qrkContext.virtualToOriginal.get(scriptName)
          if (original) {
            const transformed = qrkContext.getTransformForOriginal(original).code
            return ts.ScriptSnapshot.fromString(transformed)
          }

          const text = getSourceTextForFile(scriptName)
          if (typeof text !== 'string') return undefined
          return ts.ScriptSnapshot.fromString(text)
        },
        getCurrentDirectory() {
          return host.getCurrentDirectory()
        },
        getCompilationSettings() {
          return compilerOptions
        },
        getDefaultLibFileName(options) {
          return ts.getDefaultLibFilePath(options)
        },
        useCaseSensitiveFileNames() {
          return ts.sys.useCaseSensitiveFileNames
        },
        readFile(filePath) {
          return ts.sys.readFile(filePath)
        },
        fileExists(filePath) {
          if (qrkContext.virtualToOriginal.has(filePath)) return true
          return ts.sys.fileExists(filePath)
        },
        readDirectory(rootDir, extensions, excludes, includes, depth) {
          return ts.sys.readDirectory(rootDir, extensions, excludes, includes, depth)
        },
        directoryExists(dirPath) {
          return ts.sys.directoryExists(dirPath)
        },
        getDirectories(dirPath) {
          return ts.sys.getDirectories(dirPath)
        },
        realpath(p) {
          return ts.sys.realpath ? ts.sys.realpath(p) : p
        },
        getNewLine() {
          return ts.sys.newLine
        },
        resolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference, compilerOptionsInner) {
          const moduleResolutionHost = {
            fileExists: (candidate) => {
              if (qrkContext.virtualToOriginal.has(candidate)) return true
              return ts.sys.fileExists(candidate)
            },
            readFile: (candidate) => {
              const original = qrkContext.virtualToOriginal.get(candidate)
              if (original) return qrkContext.getTransformForOriginal(original).code
              return ts.sys.readFile(candidate)
            },
            directoryExists: ts.sys.directoryExists,
            getDirectories: ts.sys.getDirectories,
            realpath: ts.sys.realpath,
            getCurrentDirectory: () => host.getCurrentDirectory(),
            useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
          }

          return moduleNames.map((moduleName) => {
            const defaultResolution = ts.resolveModuleName(
              moduleName,
              containingFile,
              compilerOptionsInner,
              moduleResolutionHost,
              redirectedReference,
            ).resolvedModule

            if (defaultResolution) return defaultResolution

            if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
              return undefined
            }

            const containingOriginal = qrkContext.virtualToOriginal.get(containingFile) || containingFile
            const containingDir = path.dirname(containingOriginal)

            const probeCandidates = []
            if (moduleName.endsWith('.qrk') || moduleName.endsWith('.qrx')) {
              probeCandidates.push(moduleName)
            } else {
              probeCandidates.push(`${moduleName}.qrk`, `${moduleName}.qrx`)
            }

            for (const candidate of probeCandidates) {
              const absoluteCandidate = normalizeAbsolute(path.resolve(containingDir, candidate))
              if (!ts.sys.fileExists(absoluteCandidate)) continue

              const resolvedVirtual = qrkContext.registerQrkFile(absoluteCandidate)
              return {
                resolvedFileName: resolvedVirtual,
                extension: resolvedVirtual.endsWith('.tsx') ? ts.Extension.Tsx : ts.Extension.Ts,
                isExternalLibraryImport: false,
              }
            }

            return undefined
          })
        },
      }

      const languageServiceForTransforms = profile(`create-ls:${path.basename(normalizedFile)}`, () => ts.createLanguageService(
        languageServiceHost,
        transientDocumentRegistry,
      ))

      const entry = {
        languageService: languageServiceForTransforms,
        qrkContext,
        virtualFileName,
        configSignature,
        scriptVersion,
        projectVersion,
        get transformResult() {
          return qrkContext.getTransformForOriginal(normalizedFile)
        },
      }

      if (cached && cached.languageService && typeof cached.languageService.dispose === 'function') {
        cached.languageService.dispose()
      }

      transientLsCache.set(normalizedFile, entry)
      return entry
    }

    function getTransformedDiagnosticsByKind(fileName, kind) {
      const normalizedFile = normalizeAbsolute(fileName)
      const scriptVersion = host.getScriptVersion(fileName) || ''
      const projectVersion = getProjectVersion()
      const cacheKey = `${kind}:${normalizedFile}:${scriptVersion}:${projectVersion}`
      const cached = diagnosticsCache.get(cacheKey)
      if (cached) return cached

      if (kind === 'semantic') {
        const lastSemantic = semanticDiagnosticsState.get(normalizedFile)
        const now = Date.now()
        if (
          lastSemantic
          && Array.isArray(lastSemantic.diagnostics)
          && lastSemantic.projectVersion === projectVersion
          && now - lastSemantic.computedAt < semanticDiagnosticsCooldownMs
        ) {
          return lastSemantic.diagnostics
        }
      }

      const sourceText = getSnapshotText(fileName)
      if (typeof sourceText !== 'string') {
        return []
      }

      if (kind === 'syntactic') {
        try {
          const transformResult = profile(`transform:syntactic:${path.basename(normalizedFile)}`, () => transformQuarkySugar({
            code: sourceText,
            fileName: normalizedFile,
          }))

          const virtualFileName = normalizedFile + getVirtualExtension(normalizedFile)
          const transformedSourceFile = profile(`parse:syntactic:${path.basename(normalizedFile)}`, () => ts.createSourceFile(
            virtualFileName,
            transformResult.code,
            ts.ScriptTarget.Latest,
            true,
            getScriptKindFromFileName(virtualFileName),
          ))

          const originalSourceFile = ts.createSourceFile(
            normalizedFile,
            sourceText,
            ts.ScriptTarget.Latest,
            true,
            getScriptKindFromFileName(virtualFileName),
          )

          const diagnostics = (transformedSourceFile.parseDiagnostics || []).map((diag) => {
            const start = diag.start || 0
            const length = diag.length || 0
            const mappedSpan = mapDiagnosticSpanToOriginal({ start, length }, transformResult)

            return {
              ...diag,
              file: originalSourceFile,
              start: mappedSpan.start,
              length: mappedSpan.length,
            }
          })

          evictStaleFileCacheEntries(diagnosticsCache, `syntactic:${normalizedFile}:`)
          diagnosticsCache.set(cacheKey, diagnostics)
          return diagnostics
        } catch (error) {
          log(`syntactic diagnostics failed for ${fileName}: ${error && error.message ? error.message : String(error)}`)
          evictStaleFileCacheEntries(diagnosticsCache, `syntactic:${normalizedFile}:`)
          diagnosticsCache.set(cacheKey, [])
          return []
        }
      }

      try {
        const transient = createTransientLanguageService(fileName)
        if (!transient) {
          diagnosticsCache.set(cacheKey, [])
          return []
        }

        const diagnostics = profile(`diagnostics:${kind}:${path.basename(normalizedFile)}`, () => {
          let rawDiagnostics = []
          if (kind === 'syntactic') {
            rawDiagnostics = transient.languageService.getSyntacticDiagnostics(transient.virtualFileName) || []
          } else if (kind === 'semantic') {
            rawDiagnostics = transient.languageService.getSemanticDiagnostics(transient.virtualFileName) || []
          } else if (kind === 'suggestion') {
            rawDiagnostics = transient.languageService.getSuggestionDiagnostics
              ? transient.languageService.getSuggestionDiagnostics(transient.virtualFileName) || []
              : []
          }

          return rawDiagnostics
            .map((diag) => transient.qrkContext.remapDiagnostic(diag))
            .filter((diag) => {
              if (!diag.file) return false
              return normalizeAbsolute(diag.file.fileName) === normalizedFile
            })
        })

        evictStaleFileCacheEntries(diagnosticsCache, `syntactic:${normalizedFile}:`)
        evictStaleFileCacheEntries(diagnosticsCache, `semantic:${normalizedFile}:`)
        evictStaleFileCacheEntries(diagnosticsCache, `suggestion:${normalizedFile}:`)
        diagnosticsCache.set(cacheKey, diagnostics)
        if (kind === 'semantic') {
          semanticDiagnosticsState.set(normalizedFile, {
            diagnostics,
            computedAt: Date.now(),
            projectVersion,
          })
        }
        return diagnostics
      } catch (error) {
        log(`transform diagnostics failed for ${fileName}: ${error && error.message ? error.message : String(error)}`)
        evictStaleFileCacheEntries(diagnosticsCache, `syntactic:${normalizedFile}:`)
        evictStaleFileCacheEntries(diagnosticsCache, `semantic:${normalizedFile}:`)
        evictStaleFileCacheEntries(diagnosticsCache, `suggestion:${normalizedFile}:`)
        diagnosticsCache.set(cacheKey, [])
        if (kind === 'semantic') {
          const lastSemantic = semanticDiagnosticsState.get(normalizedFile)
          if (
            lastSemantic
            && Array.isArray(lastSemantic.diagnostics)
            && lastSemantic.projectVersion === projectVersion
          ) {
            return lastSemantic.diagnostics
          }
        }
        return []
      }
    }

    const proxy = Object.create(null)
    for (const key of Object.keys(languageService)) {
      proxy[key] = (...args) => languageService[key](...args)
    }

    proxy.getSyntacticDiagnostics = (fileName) => {
      if (!isSugarFile(fileName)) {
        return languageService.getSyntacticDiagnostics(fileName)
      }
      return getTransformedDiagnosticsByKind(fileName, 'syntactic')
    }

    proxy.getSemanticDiagnostics = (fileName) => {
      if (!isSugarFile(fileName)) {
        return languageService.getSemanticDiagnostics(fileName)
      }
      return getTransformedDiagnosticsByKind(fileName, 'semantic')
    }

    proxy.getSuggestionDiagnostics = (fileName) => {
      if (!isSugarFile(fileName)) {
        return languageService.getSuggestionDiagnostics(fileName)
      }
      return getTransformedDiagnosticsByKind(fileName, 'suggestion')
    }

    proxy.getSemanticClassifications = (fileName, span) => {
      if (typeof languageService.getSemanticClassifications !== 'function') {
        return []
      }

      if (!isSugarFile(fileName)) {
        return languageService.getSemanticClassifications(fileName, span)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) {
        return languageService.getSemanticClassifications(fileName, span)
      }

      const transformedSpan = toTransformedTextSpan(transient.transformResult, span)
      const classifications = transient.languageService.getSemanticClassifications(
        transient.virtualFileName,
        transformedSpan,
      )

      return mapClassifiedSpansToOriginal(classifications, transient.transformResult) || []
    }

    proxy.getSyntacticClassifications = (fileName, span) => {
      if (typeof languageService.getSyntacticClassifications !== 'function') {
        return []
      }

      if (!isSugarFile(fileName)) {
        return languageService.getSyntacticClassifications(fileName, span)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) {
        return languageService.getSyntacticClassifications(fileName, span)
      }

      const transformedSpan = toTransformedTextSpan(transient.transformResult, span)
      const classifications = transient.languageService.getSyntacticClassifications(
        transient.virtualFileName,
        transformedSpan,
      )

      return mapClassifiedSpansToOriginal(classifications, transient.transformResult) || []
    }

    proxy.getEncodedSemanticClassifications = (fileName, span, format) => {
      if (typeof languageService.getEncodedSemanticClassifications !== 'function') {
        return { spans: [], endOfLineState: ts.EndOfLineState.None }
      }

      if (!isSugarFile(fileName)) {
        return languageService.getEncodedSemanticClassifications(fileName, span, format)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) {
        return languageService.getEncodedSemanticClassifications(fileName, span, format)
      }

      const transformedSpan = toTransformedTextSpan(transient.transformResult, span)
      const classifications = transient.languageService.getEncodedSemanticClassifications(
        transient.virtualFileName,
        transformedSpan,
        format,
      )

      return mapEncodedClassificationsToOriginal(classifications, transient.transformResult) || {
        spans: [],
        endOfLineState: ts.EndOfLineState.None,
      }
    }

    proxy.getEncodedSyntacticClassifications = (fileName, span) => {
      if (typeof languageService.getEncodedSyntacticClassifications !== 'function') {
        return { spans: [], endOfLineState: ts.EndOfLineState.None }
      }

      if (!isSugarFile(fileName)) {
        return languageService.getEncodedSyntacticClassifications(fileName, span)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) {
        return languageService.getEncodedSyntacticClassifications(fileName, span)
      }

      const transformedSpan = toTransformedTextSpan(transient.transformResult, span)
      const classifications = transient.languageService.getEncodedSyntacticClassifications(
        transient.virtualFileName,
        transformedSpan,
      )

      return mapEncodedClassificationsToOriginal(classifications, transient.transformResult) || {
        spans: [],
        endOfLineState: ts.EndOfLineState.None,
      }
    }

    proxy.getQuickInfoAtPosition = (fileName, position) => {
      if (!isSugarFile(fileName)) {
        return languageService.getQuickInfoAtPosition(fileName, position)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getQuickInfoAtPosition(fileName, position)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const sourceText = getSnapshotText(fileName) || ''
      const originalPrefix = getIdentifierPrefixAtPosition(sourceText, position)
      const nearbyPositions = withNearbyPositions(
        transformedPosition,
        transient.transformResult.code.length,
        24,
      )

      let quickInfo
      for (const candidatePos of nearbyPositions) {
        quickInfo = transient.languageService.getQuickInfoAtPosition(
          transient.virtualFileName,
          candidatePos,
        )
        if (quickInfo) break
      }

      if (!quickInfo) return quickInfo

      return {
        ...quickInfo,
        textSpan: mapTextSpanToOriginal(quickInfo.textSpan, transient.transformResult),
      }
    }

    proxy.getDefinitionAtPosition = (fileName, position) => {
      if (!isSugarFile(fileName)) {
        return languageService.getDefinitionAtPosition(fileName, position)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getDefinitionAtPosition(fileName, position)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const definitions = transient.languageService.getDefinitionAtPosition(
        transient.virtualFileName,
        transformedPosition,
      )

      if (!definitions) return definitions
      return definitions.map((definition) => mapDefinitionToOriginal(definition, transient.qrkContext))
    }

    proxy.getDefinitionAndBoundSpan = (fileName, position) => {
      if (!isSugarFile(fileName)) {
        return languageService.getDefinitionAndBoundSpan(fileName, position)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getDefinitionAndBoundSpan(fileName, position)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const value = transient.languageService.getDefinitionAndBoundSpan(
        transient.virtualFileName,
        transformedPosition,
      )

      if (!value) return value

      return {
        ...value,
        textSpan: mapTextSpanToOriginal(value.textSpan, transient.transformResult),
        definitions: value.definitions
          ? value.definitions.map((definition) => mapDefinitionToOriginal(definition, transient.qrkContext))
          : value.definitions,
      }
    }

    proxy.getCompletionsAtPosition = (fileName, position, options, formattingSettings) => {
      if (!isSugarFile(fileName)) {
        return languageService.getCompletionsAtPosition(fileName, position, options, formattingSettings)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getCompletionsAtPosition(fileName, position, options, formattingSettings)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const sourceText = getSnapshotText(fileName) || ''
      const originalPrefix = getIdentifierPrefixAtPosition(sourceText, position)
      const inDestructuringContext = isLikelyDestructuringContext(sourceText, position)

      const exactCompletions = profile(`completions:${path.basename(normalizeAbsolute(fileName))}`, () => transient.languageService.getCompletionsAtPosition(
        transient.virtualFileName,
        transformedPosition,
        options,
        formattingSettings,
      ))

      let bestCompletions = exactCompletions
      const exactEntryCount = bestCompletions && Array.isArray(bestCompletions.entries)
        ? bestCompletions.entries.length
        : 0

      if (exactEntryCount === 0) {
        const searchRadius = inDestructuringContext ? 10 : 24
        const nearbyPositions = withNearbyPositions(
          transformedPosition,
          transient.transformResult.code.length,
          searchRadius,
        )

        const candidates = []
        for (const candidatePos of nearbyPositions) {
          if (candidatePos === transformedPosition) continue
          const completions = profile(`completions:${path.basename(normalizeAbsolute(fileName))}`, () => transient.languageService.getCompletionsAtPosition(
            transient.virtualFileName,
            candidatePos,
            options,
            formattingSettings,
          ))
          candidates.push({ position: candidatePos, completions })
        }

        bestCompletions = selectClosestNonEmptyCompletion(candidates, transformedPosition)
      }

      if (bestCompletions) {
        const mappedOptionalReplacementSpan = bestCompletions.optionalReplacementSpan
          ? mapTextSpanToOriginal(bestCompletions.optionalReplacementSpan, transient.transformResult)
          : bestCompletions.optionalReplacementSpan

        const mappedEntries = Array.isArray(bestCompletions.entries)
          ? bestCompletions.entries.map((entry) => ({
            ...entry,
            replacementSpan: entry.replacementSpan
              ? mapTextSpanToOriginal(entry.replacementSpan, transient.transformResult)
              : entry.replacementSpan,
          }))
          : bestCompletions.entries

        const remappedEntries = remapCompletionEntriesToSugar(mappedEntries, originalPrefix)
        const contextEntries = inDestructuringContext
          ? prioritizeDestructuredSugarEntries(remappedEntries)
          : remappedEntries

        return {
          ...bestCompletions,
          optionalReplacementSpan: mappedOptionalReplacementSpan,
          entries: contextEntries,
        }
      }

      return languageService.getCompletionsAtPosition(fileName, position, options, formattingSettings)
    }

    proxy.getCompletionEntryDetails = (fileName, position, entryName, formatOptions, source, preferences, data) => {
      if (!isSugarFile(fileName)) {
        return languageService.getCompletionEntryDetails(
          fileName,
          position,
          entryName,
          formatOptions,
          source,
          preferences,
          data,
        )
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) {
        return languageService.getCompletionEntryDetails(
          fileName,
          position,
          entryName,
          formatOptions,
          source,
          preferences,
          data,
        )
      }

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      let transformedEntryName = entryName
      if (typeof transformedEntryName === 'string' && /[A-Za-z_$][\w$]*@$/.test(transformedEntryName)) {
        transformedEntryName = `ø${transformedEntryName.slice(0, -1)}`
      }

      let transformedData = data
      if (transformedData && typeof transformedData === 'object' && typeof transformedData.name === 'string' && /[A-Za-z_$][\w$]*@$/.test(transformedData.name)) {
        transformedData = {
          ...transformedData,
          name: `ø${transformedData.name.slice(0, -1)}`,
        }
      }

      return transient.languageService.getCompletionEntryDetails(
        transient.virtualFileName,
        transformedPosition,
        transformedEntryName,
        formatOptions,
        source,
        preferences,
        transformedData,
      )
    }

    proxy.getFormattingEditsForDocument = (fileName, formatOptions, preferences) => {
      if (!isSugarFile(fileName) || typeof languageService.getFormattingEditsForDocument !== 'function') {
        return languageService.getFormattingEditsForDocument
          ? languageService.getFormattingEditsForDocument(fileName, formatOptions, preferences)
          : []
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) {
        return languageService.getFormattingEditsForDocument(fileName, formatOptions, preferences)
      }

      const edits = transient.languageService.getFormattingEditsForDocument(
        transient.virtualFileName,
        formatOptions,
        preferences,
      )

      return mapFormattingChangesToOriginal(edits, transient.transformResult)
    }

    proxy.getFormattingEditsForRange = (fileName, start, end, formatOptions, preferences) => {
      if (!isSugarFile(fileName) || typeof languageService.getFormattingEditsForRange !== 'function') {
        return languageService.getFormattingEditsForRange
          ? languageService.getFormattingEditsForRange(fileName, start, end, formatOptions, preferences)
          : []
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) {
        return languageService.getFormattingEditsForRange(fileName, start, end, formatOptions, preferences)
      }

      const transformedStart = toTransformedPos(transient.transformResult, start)
      const transformedEnd = toTransformedPos(transient.transformResult, end)

      const edits = transient.languageService.getFormattingEditsForRange(
        transient.virtualFileName,
        Math.min(transformedStart, transformedEnd),
        Math.max(transformedStart, transformedEnd),
        formatOptions,
        preferences,
      )

      return mapFormattingChangesToOriginal(edits, transient.transformResult)
    }

    proxy.getFormattingEditsAfterKeystroke = (fileName, position, key, formatOptions, preferences) => {
      if (!isSugarFile(fileName) || typeof languageService.getFormattingEditsAfterKeystroke !== 'function') {
        return languageService.getFormattingEditsAfterKeystroke
          ? languageService.getFormattingEditsAfterKeystroke(fileName, position, key, formatOptions, preferences)
          : []
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) {
        return languageService.getFormattingEditsAfterKeystroke(fileName, position, key, formatOptions, preferences)
      }

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const edits = transient.languageService.getFormattingEditsAfterKeystroke(
        transient.virtualFileName,
        transformedPosition,
        key,
        formatOptions,
        preferences,
      )

      return mapFormattingChangesToOriginal(edits, transient.transformResult)
    }

    proxy.getReferencesAtPosition = (fileName, position) => {
      if (!isSugarFile(fileName)) {
        return languageService.getReferencesAtPosition(fileName, position)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getReferencesAtPosition(fileName, position)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const references = transient.languageService.getReferencesAtPosition(
        transient.virtualFileName,
        transformedPosition,
      )

      if (!references) return references
      return references.map((reference) => mapReferenceEntryToOriginal(reference, transient.qrkContext))
    }

    proxy.getDocumentHighlights = (fileName, position, filesToSearch) => {
      if (typeof languageService.getDocumentHighlights !== 'function') {
        return []
      }

      if (!isSugarFile(fileName)) {
        return languageService.getDocumentHighlights(fileName, position, filesToSearch)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getDocumentHighlights(fileName, position, filesToSearch)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const transformedFilesToSearch = Array.isArray(filesToSearch)
        ? filesToSearch.map((searchFile) => {
          if (!isSugarFile(searchFile)) return searchFile
          const normalized = normalizeAbsolute(searchFile)
          return transient.qrkContext.originalToVirtual.get(normalized)
            || transient.qrkContext.registerQrkFile(normalized)
        })
        : filesToSearch

      const highlights = transient.languageService.getDocumentHighlights(
        transient.virtualFileName,
        transformedPosition,
        transformedFilesToSearch,
      )

      return mapDocumentHighlightsToOriginal(highlights, transient.qrkContext)
    }

    proxy.getOccurrencesAtPosition = (fileName, position) => {
      if (typeof languageService.getOccurrencesAtPosition !== 'function') {
        return []
      }

      if (!isSugarFile(fileName)) {
        return languageService.getOccurrencesAtPosition(fileName, position)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getOccurrencesAtPosition(fileName, position)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const occurrences = transient.languageService.getOccurrencesAtPosition(
        transient.virtualFileName,
        transformedPosition,
      )

      if (!occurrences) return occurrences
      return occurrences.map((occurrence) => mapReferenceEntryToOriginal(occurrence, transient.qrkContext))
    }

    proxy.findRenameLocations = (fileName, position, findInStrings, findInComments, preferences) => {
      if (!isSugarFile(fileName)) {
        return languageService.findRenameLocations(fileName, position, findInStrings, findInComments, preferences)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) {
        return languageService.findRenameLocations(fileName, position, findInStrings, findInComments, preferences)
      }

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const locations = transient.languageService.findRenameLocations(
        transient.virtualFileName,
        transformedPosition,
        findInStrings,
        findInComments,
        preferences,
      )

      if (!locations) return locations
      return locations.map((location) => mapRenameLocationToOriginal(location, transient.qrkContext))
    }

    proxy.getRenameInfo = (fileName, position, options) => {
      if (!isSugarFile(fileName)) {
        return languageService.getRenameInfo(fileName, position, options)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getRenameInfo(fileName, position, options)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const renameInfo = transient.languageService.getRenameInfo(
        transient.virtualFileName,
        transformedPosition,
        options,
      )

      if (!renameInfo || !renameInfo.canRename) return renameInfo

      return {
        ...renameInfo,
        triggerSpan: mapTextSpanToOriginal(renameInfo.triggerSpan, transient.transformResult),
      }
    }

    proxy.getSignatureHelpItems = (fileName, position, options) => {
      if (!isSugarFile(fileName)) {
        return languageService.getSignatureHelpItems(fileName, position, options)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getSignatureHelpItems(fileName, position, options)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const signatureHelp = transient.languageService.getSignatureHelpItems(
        transient.virtualFileName,
        transformedPosition,
        options,
      )

      if (!signatureHelp) return signatureHelp

      return {
        ...signatureHelp,
        applicableSpan: mapTextSpanToOriginal(signatureHelp.applicableSpan, transient.transformResult),
      }
    }

    proxy.getImplementationAtPosition = (fileName, position) => {
      if (!isSugarFile(fileName)) {
        return languageService.getImplementationAtPosition(fileName, position)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getImplementationAtPosition(fileName, position)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const implementations = transient.languageService.getImplementationAtPosition(
        transient.virtualFileName,
        transformedPosition,
      )

      if (!implementations) return implementations
      return implementations.map((implementation) => mapDefinitionToOriginal(implementation, transient.qrkContext))
    }

    proxy.getTypeDefinitionAtPosition = (fileName, position) => {
      if (!isSugarFile(fileName)) {
        return languageService.getTypeDefinitionAtPosition(fileName, position)
      }

      const transient = createTransientLanguageService(fileName)
      if (!transient) return languageService.getTypeDefinitionAtPosition(fileName, position)

      const transformedPosition = toTransformedPos(transient.transformResult, position)
      const typeDefinitions = transient.languageService.getTypeDefinitionAtPosition(
        transient.virtualFileName,
        transformedPosition,
      )

      if (!typeDefinitions) return typeDefinitions
      return typeDefinitions.map((typeDefinition) => mapDefinitionToOriginal(typeDefinition, transient.qrkContext))
    }

    log('initialized')
    return proxy
  }

  function getExternalFiles(project) {
    const configPath = project.getProjectName && project.getProjectName()
    if (!configPath || !configPath.endsWith('.json')) return []

    const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
    if (configFile.error) return []

    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath))
    if (parsed.errors.length > 0) return []

    const includePatterns = Array.isArray(parsed.raw && parsed.raw.include) ? parsed.raw.include : undefined
    const excludePatterns = Array.isArray(parsed.raw && parsed.raw.exclude) ? parsed.raw.exclude : undefined

    return ts.sys.readDirectory(path.dirname(configPath), ['.qrk', '.qrx'], excludePatterns, includePatterns)
  }

  return {
    create,
    getExternalFiles,
  }
}

module.exports = init

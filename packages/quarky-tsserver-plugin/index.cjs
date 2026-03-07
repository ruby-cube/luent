const path = require('node:path')
const {
  mapTextSpanFromSourceMap,
  toTransformedPosFromSourceMap,
  toOriginalPosFromSourceMap,
  transformQuarkySugar,
} = require('./transform-quarky-sugar.cjs')

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
    return ts.ScriptKind.TS
  }

  function create(info) {
    const languageService = info.languageService
    const host = info.languageServiceHost
    const transformCache = new Map()
    const HIDDEN_HELPERS = ['absorbØ', 'destructureØ', 'πø']

    const proxy = Object.create(null)
    for (const key of Object.keys(languageService)) {
      proxy[key] = (...args) => languageService[key](...args)
    }

    function getSnapshotText(fileName) {
      const snapshot = host.getScriptSnapshot(fileName)
      if (!snapshot) return ''
      return snapshot.getText(0, snapshot.getLength())
    }

    function toOriginalSugarFileName(fileName) {
      if (typeof fileName !== 'string') return fileName
      if (fileName.endsWith('.qrx.tsx')) return fileName.slice(0, -4)
      if (fileName.endsWith('.qrk.ts')) return fileName.slice(0, -3)
      return fileName
    }

    function isIdentifierChar(ch) {
      if (typeof ch !== 'string' || ch.length === 0) return false
      return /[A-Za-z0-9_$]/.test(ch)
    }

    function rangesIntersect(startA, endA, startB, endB) {
      return startA < endB && startB < endA
    }

    function transformedSpanIntersectsSyntheticSegment(sourceMap, start, length) {
      if (!sourceMap || !Array.isArray(sourceMap.segments) || sourceMap.segments.length === 0) return false

      const spanStart = Math.max(0, Number.isFinite(start) ? Math.floor(start) : 0)
      const rawEnd = spanStart + Math.max(0, Number.isFinite(length) ? Math.floor(length) : 0)
      const spanEnd = Math.max(spanStart + 1, rawEnd)

      for (const segment of sourceMap.segments) {
        if (!segment || segment.step !== 0) continue
        const generatedStart = Math.max(0, Number.isFinite(segment.generatedStart) ? Math.floor(segment.generatedStart) : 0)
        const generatedEnd = Math.max(generatedStart, Number.isFinite(segment.generatedEnd) ? Math.floor(segment.generatedEnd) : generatedStart)
        if (rangesIntersect(spanStart, spanEnd, generatedStart, generatedEnd)) return true
      }

      return false
    }

    function transformedSpanIntersectsHiddenHelper(transformedCode, sourceMap, start, length) {
      if (typeof transformedCode !== 'string' || transformedCode.length === 0) return false

      const spanStart = Math.max(0, Number.isFinite(start) ? Math.floor(start) : 0)
      const rawEnd = spanStart + Math.max(0, Number.isFinite(length) ? Math.floor(length) : 0)
      const spanEnd = Math.max(spanStart + 1, rawEnd)

      const probeStart = Math.max(0, spanStart - 64)
      const probeEnd = Math.min(transformedCode.length, spanEnd + 64)

      for (const helperName of HIDDEN_HELPERS) {
        let helperIndex = transformedCode.indexOf(helperName, probeStart)
        while (helperIndex >= 0 && helperIndex < probeEnd) {
          const helperEnd = helperIndex + helperName.length
          const before = helperIndex > 0 ? transformedCode[helperIndex - 1] : ''
          const after = helperEnd < transformedCode.length ? transformedCode[helperEnd] : ''
          const bounded = !isIdentifierChar(before) && !isIdentifierChar(after)
          if (bounded && rangesIntersect(spanStart, spanEnd, helperIndex, helperEnd)) {
            return true
          }
          helperIndex = transformedCode.indexOf(helperName, helperIndex + 1)
        }
      }

      return transformedSpanIntersectsSyntheticSegment(sourceMap, spanStart, spanEnd - spanStart)
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

    function spanContainsPosition(span, position) {
      if (!span || typeof span.start !== 'number' || typeof span.length !== 'number') return false
      if (span.length <= 0) return span.start === position
      return position >= span.start && position < (span.start + span.length)
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

    function toOriginalPos(transformed, transformedPos) {
      if (!transformed || !transformed.sourceMap) return Math.max(0, transformedPos || 0)
      return toOriginalPosFromSourceMap(transformed.sourceMap, transformedPos)
    }

    function getTransformForSugarFile(fileName) {
      const source = getSnapshotText(fileName)
      const cached = transformCache.get(fileName)
      if (cached && cached.source === source) return cached.transformed

      const transformedCore = transformQuarkySugar({ code: source, fileName })
      const transformed = {
        ...transformedCore,
        originalCode: source,
      }
      transformCache.set(fileName, { source, transformed })
      return transformed
    }

    function toTransformedPos(transformed, originalPos) {
      if (!transformed || !transformed.sourceMap) return Math.max(0, originalPos || 0)

      const safeOriginalPos = Math.max(0, originalPos || 0)
      const transformedLength = transformed && typeof transformed.code === 'string' ? transformed.code.length : 0
      const basePos = Math.max(0, Math.min(transformedLength, toTransformedPosFromSourceMap(transformed.sourceMap, safeOriginalPos)))

      if (!transformedSpanIntersectsHiddenHelper(transformed.code, transformed.sourceMap, basePos, 1)) {
        return basePos
      }

      let bestPos = basePos
      let bestOriginalDistance = Math.abs(toOriginalPos(transformed, basePos) - safeOriginalPos)
      let bestTransformedDistance = 0

      const radius = 96
      for (let delta = 1; delta <= radius; delta += 1) {
        const candidates = [basePos - delta, basePos + delta]
        for (const candidate of candidates) {
          if (candidate < 0 || candidate > transformedLength) continue
          if (transformedSpanIntersectsHiddenHelper(transformed.code, transformed.sourceMap, candidate, 1)) continue

          const originalDistance = Math.abs(toOriginalPos(transformed, candidate) - safeOriginalPos)
          const transformedDistance = Math.abs(candidate - basePos)
          if (
            originalDistance < bestOriginalDistance
            || (originalDistance === bestOriginalDistance && transformedDistance < bestTransformedDistance)
          ) {
            bestPos = candidate
            bestOriginalDistance = originalDistance
            bestTransformedDistance = transformedDistance
          }
        }
      }

      return bestPos
    }

    function toTransformedTextSpan(transformed, span) {
      if (!span) return span
      const transformedStart = toTransformedPos(transformed, span.start)
      const transformedEnd = toTransformedPos(transformed, span.start + span.length)
      const start = Math.min(transformedStart, transformedEnd)
      const end = Math.max(transformedStart, transformedEnd)
      return {
        start,
        length: Math.max(0, end - start),
      }
    }

    function mapTextSpanToOriginal(span, transformed) {
      if (!span) return span

      const transformedStart = Math.max(0, span.start || 0)
      const transformedLength = Math.max(0, span.length || 0)
      if (transformedLength <= 0) {
        return {
          start: toOriginalPos(transformed, transformedStart),
          length: 0,
        }
      }

      const transformedCode = transformed && typeof transformed.code === 'string' ? transformed.code : ''
      const transformedSlice = transformedCode.slice(transformedStart, transformedStart + transformedLength)

      if (/\b(?:destructureØ|absorbØ|πø)\b/.test(transformedSlice)) {
        return {
          start: toOriginalPos(transformed, transformedStart),
          length: 0,
        }
      }

      if (!transformed || !transformed.sourceMap) {
        return {
          start: transformedStart,
          length: transformedLength,
        }
      }

      const mapped = mapTextSpanFromSourceMap(transformed.sourceMap, {
        start: transformedStart,
        length: transformedLength,
      })

      // Extend span to include a trailing '@' in the original source.
      // Reactive sugar identifiers appear as 'øname' in transformed code and 'name@' in the original.
      // The '@' is not part of the TS token, so mapped spans stop one char short of it.
      const originalCode = transformed && transformed.originalCode ? transformed.originalCode : ''
      if (mapped && typeof mapped.start === 'number' && typeof mapped.length === 'number' && mapped.length > 0) {
        const spanEnd = mapped.start + mapped.length
        if (originalCode[spanEnd] === '@') {
          return { start: mapped.start, length: mapped.length + 1 }
        }
      }

      return mapped
    }

    function clampMappedSpanToOriginal(span, transformed) {
      if (!span || typeof span.start !== 'number' || typeof span.length !== 'number') return null
      const originalLength = transformed && transformed.originalCode ? transformed.originalCode.length : 0
      const safeStart = Math.max(0, Math.min(originalLength, span.start))
      const safeEnd = Math.max(safeStart, Math.min(originalLength, span.start + span.length))
      const safeLength = Math.max(0, safeEnd - safeStart)
      if (safeLength <= 0) return null
      return {
        start: safeStart,
        length: safeLength,
      }
    }

    function remapFileAndSpan(fileName, span, defaultOriginalFileName, defaultTransformed) {
      const mappedFileName = toOriginalSugarFileName(fileName)
      if (!isSugarFile(mappedFileName)) {
        return {
          fileName,
          textSpan: span,
        }
      }

      const transformed = mappedFileName === defaultOriginalFileName
        ? defaultTransformed
        : getTransformForSugarFile(mappedFileName)

      return {
        fileName: mappedFileName,
        textSpan: mapTextSpanToOriginal(span, transformed),
      }
    }

    function withTransientLanguageService(fileName, fn) {
      const transformed = getTransformForSugarFile(fileName)
      const virtualFileName = fileName + getVirtualExtension(fileName)

      const compilerOptions = {
        ...(typeof host.getCompilationSettings === 'function' ? host.getCompilationSettings() : {}),
        noEmit: true,
      }

      const transientHost = {
        getScriptFileNames() {
          return [virtualFileName]
        },
        getScriptVersion() {
          return (typeof host.getScriptVersion === 'function' ? host.getScriptVersion(fileName) : '0') || '0'
        },
        getScriptSnapshot(scriptName) {
          if (scriptName === virtualFileName) {
            return ts.ScriptSnapshot.fromString(transformed.code)
          }

          const originalSugarFile = toOriginalSugarFileName(scriptName)
          if (isSugarFile(originalSugarFile)) {
            const sugarTransformed = getTransformForSugarFile(originalSugarFile)
            return ts.ScriptSnapshot.fromString(sugarTransformed.code)
          }

          const snapshot = typeof host.getScriptSnapshot === 'function' ? host.getScriptSnapshot(scriptName) : undefined
          if (snapshot) return snapshot
          const text = ts.sys.readFile(scriptName)
          return typeof text === 'string' ? ts.ScriptSnapshot.fromString(text) : undefined
        },
        getCurrentDirectory() {
          return typeof host.getCurrentDirectory === 'function' ? host.getCurrentDirectory() : process.cwd()
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
          const originalSugarFile = toOriginalSugarFileName(filePath)
          if (isSugarFile(originalSugarFile)) {
            return getTransformForSugarFile(originalSugarFile).code
          }
          return ts.sys.readFile(filePath)
        },
        fileExists(filePath) {
          if (filePath === virtualFileName) return true
          if (isSugarFile(toOriginalSugarFileName(filePath))) return true
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
        resolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference, compilerOptions) {
          if (typeof host.resolveModuleNames === 'function') {
            const resolved = host.resolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference, compilerOptions)
            if (Array.isArray(resolved)) return resolved
          }

          return moduleNames.map((moduleName) => {
            const resolutionHost = {
              fileExists: (candidate) => {
                if (isSugarFile(toOriginalSugarFileName(candidate))) return true
                return ts.sys.fileExists(candidate)
              },
              readFile: (candidate) => {
                const originalSugarFile = toOriginalSugarFileName(candidate)
                if (isSugarFile(originalSugarFile)) return getTransformForSugarFile(originalSugarFile).code
                return ts.sys.readFile(candidate)
              },
              directoryExists: ts.sys.directoryExists,
              getDirectories: ts.sys.getDirectories,
              realpath: ts.sys.realpath,
              getCurrentDirectory: () => (typeof host.getCurrentDirectory === 'function' ? host.getCurrentDirectory() : process.cwd()),
              useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
            }

            return ts.resolveModuleName(
              moduleName,
              containingFile,
              compilerOptions || {},
              resolutionHost,
              redirectedReference,
            ).resolvedModule
          })
        },
      }

      const ls = ts.createLanguageService(transientHost)
      try {
        return fn({ ls, transformed, virtualFileName })
      } finally {
        ls.dispose()
      }
    }

    function remapDiagnostic(diagnostic, originalFileName, sourceText, transformed) {
      if (!diagnostic) return diagnostic
      const start = typeof diagnostic.start === 'number' ? diagnostic.start : 0
      const length = typeof diagnostic.length === 'number' ? diagnostic.length : 0
      const mappedStart = toOriginalPos(transformed, start)
      const mappedEnd = toOriginalPos(transformed, start + length)

      const originalSource = ts.createSourceFile(
        originalFileName,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        getScriptKindFromFileName(originalFileName.endsWith('.qrx') ? `${originalFileName}.tsx` : `${originalFileName}.ts`),
      )

      return {
        ...diagnostic,
        file: originalSource,
        start: mappedStart,
        length: Math.max(0, mappedEnd - mappedStart),
        relatedInformation: Array.isArray(diagnostic.relatedInformation)
          ? diagnostic.relatedInformation.map((item) => remapDiagnostic(item, originalFileName, sourceText, transformed))
          : diagnostic.relatedInformation,
      }
    }

    function remapDefinitionLike(entry, originalFileName, transformed) {
      if (!entry || typeof entry.fileName !== 'string') return entry
      if (entry.fileName === `${originalFileName}${getVirtualExtension(originalFileName)}` && transformedSpanIntersectsHiddenHelper(transformed.code, transformed.sourceMap, entry.textSpan && entry.textSpan.start, entry.textSpan && entry.textSpan.length)) {
        return null
      }
      const remapped = remapFileAndSpan(entry.fileName, entry.textSpan, originalFileName, transformed)
      return {
        ...entry,
        fileName: remapped.fileName,
        textSpan: remapped.textSpan,
        contextSpan: mapTextSpanToOriginal(entry.contextSpan, transformed),
        originalTextSpan: mapTextSpanToOriginal(entry.originalTextSpan, transformed),
      }
    }

    function remapReferenceLike(entry, originalFileName, transformed) {
      if (!entry || typeof entry.fileName !== 'string') return entry
      if (entry.fileName === `${originalFileName}${getVirtualExtension(originalFileName)}` && transformedSpanIntersectsHiddenHelper(transformed.code, transformed.sourceMap, entry.textSpan && entry.textSpan.start, entry.textSpan && entry.textSpan.length)) {
        return null
      }
      const remapped = remapFileAndSpan(entry.fileName, entry.textSpan, originalFileName, transformed)
      return {
        ...entry,
        fileName: remapped.fileName,
        textSpan: remapped.textSpan,
        contextSpan: mapTextSpanToOriginal(entry.contextSpan, transformed),
      }
    }

    function remapRenameLocation(entry, originalFileName, transformed) {
      if (!entry || typeof entry.fileName !== 'string') return entry
      if (entry.fileName === `${originalFileName}${getVirtualExtension(originalFileName)}` && transformedSpanIntersectsHiddenHelper(transformed.code, transformed.sourceMap, entry.textSpan && entry.textSpan.start, entry.textSpan && entry.textSpan.length)) {
        return null
      }
      const remapped = remapFileAndSpan(entry.fileName, entry.textSpan, originalFileName, transformed)
      return {
        ...entry,
        fileName: remapped.fileName,
        textSpan: remapped.textSpan,
        contextSpan: mapTextSpanToOriginal(entry.contextSpan, transformed),
      }
    }

    function remapClassifiedSpansToOriginal(spans, transformed) {
      if (!Array.isArray(spans)) return spans
      const mapped = []
      for (const item of spans) {
        if (!item || !item.textSpan) continue
        const { start, length } = item.textSpan
        const spanText = typeof transformed.code === 'string'
          ? transformed.code.slice(start, start + length)
          : ''
        // ø-prefixed reactive identifiers: the ø is a synthetic prefix char that
        // maps to a step=0 segment, so the full span would be filtered by the
        // hidden-helper check. Instead, remap just the identifier chars (skip ø).
        if (/^ø[A-Za-z_$][\w$]*$/.test(spanText)) {
          const textSpan = clampMappedSpanToOriginal(
            mapTextSpanToOriginal({ start: start + 1, length: length - 1 }, transformed),
            transformed,
          )
          if (!textSpan) continue
          mapped.push({ ...item, textSpan })
          continue
        }
        if (transformedSpanIntersectsHiddenHelper(transformed.code, transformed.sourceMap, start, length)) continue
        const textSpan = clampMappedSpanToOriginal(
          mapTextSpanToOriginal(item.textSpan, transformed),
          transformed,
        )
        if (!textSpan) continue
        mapped.push({
          ...item,
          textSpan,
        })
      }
      mapped.sort((left, right) => {
        if (left.textSpan.start !== right.textSpan.start) {
          return left.textSpan.start - right.textSpan.start
        }
        return left.textSpan.length - right.textSpan.length
      })
      return mapped
    }

    function remapEncodedClassificationsToOriginal(classifications, transformed) {
      if (!classifications || !Array.isArray(classifications.spans)) return classifications
      const outputEntries = []
      for (let index = 0; index + 2 < classifications.spans.length; index += 3) {
        const start = classifications.spans[index]
        const length = classifications.spans[index + 1]
        const kind = classifications.spans[index + 2]
        const spanText = typeof transformed.code === 'string'
          ? transformed.code.slice(start, start + length)
          : ''
        // ø-prefixed reactive identifiers: the ø is a synthetic prefix char that
        // maps to a step=0 segment, so the full span would be filtered by the
        // hidden-helper check. Instead, remap just the identifier chars (skip ø).
        if (/^ø[A-Za-z_$][\w$]*$/.test(spanText)) {
          const mapped = clampMappedSpanToOriginal(
            mapTextSpanToOriginal({ start: start + 1, length: length - 1 }, transformed),
            transformed,
          )
          if (mapped) outputEntries.push({ start: mapped.start, length: mapped.length, kind })
          continue
        }
        if (transformedSpanIntersectsHiddenHelper(transformed.code, transformed.sourceMap, start, length)) continue
        const mapped = clampMappedSpanToOriginal(
          mapTextSpanToOriginal({ start, length }, transformed),
          transformed,
        )
        if (!mapped) continue
        outputEntries.push({ start: mapped.start, length: mapped.length, kind })
      }
      outputEntries.sort((left, right) => {
        if (left.start !== right.start) return left.start - right.start
        return left.length - right.length
      })
      const outputSpans = []
      for (const entry of outputEntries) {
        outputSpans.push(entry.start, entry.length, entry.kind)
      }
      return {
        ...classifications,
        spans: outputSpans,
      }
    }

    // Remap TypeScript display-part arrays: strip 'ø' prefix from identifiers, add '@' suffix for
    // reactive references, and change 'const'/'let'/'var' to 'get' for reactive declarations.
    function remapDisplayPartsToSugar(displayParts) {
      if (!Array.isArray(displayParts)) return displayParts
      const result = []
      let nextIdentIsDeclaration = false
      for (let i = 0; i < displayParts.length; i += 1) {
        const part = displayParts[i]
        if (!part || typeof part.text !== 'string') {
          nextIdentIsDeclaration = false
          result.push(part)
          continue
        }
        // Change 'const'/'let'/'var' to 'get' when the next part is an ø-prefixed identifier
        if (
          (part.text === 'const' || part.text === 'let' || part.text === 'var') &&
          i + 1 < displayParts.length &&
          typeof displayParts[i + 1].text === 'string' &&
          /^ø[A-Za-z_$][\w$]*$/.test(displayParts[i + 1].text)
        ) {
          result.push({ ...part, text: 'get' })
          nextIdentIsDeclaration = true
          continue
        }
        // Handle a bare ø-prefixed identifier
        if (/^ø[A-Za-z_$][\w$]*$/.test(part.text)) {
          const baseName = part.text.slice(1)
          // Declarations use 'get name' (no '@'); references use 'name@'
          result.push({ ...part, text: nextIdentIsDeclaration ? baseName : baseName + '@' })
          nextIdentIsDeclaration = false
          continue
        }
        // Handle ø embedded in longer text (e.g. "(property) øcount" in a single text chunk)
        const remappedText = part.text.replace(/ø([A-Za-z_$][\w$]*)/g, (_, name) => {
          if (nextIdentIsDeclaration) { nextIdentIsDeclaration = false; return name }
          return name + '@'
        })
        result.push(remappedText !== part.text ? { ...part, text: remappedText } : part)
        nextIdentIsDeclaration = false
      }
      return result
    }

    function remapCompletionEntriesToSugar(entries, originalPrefix) {
      if (!Array.isArray(entries)) return entries
      if (typeof originalPrefix === 'string' && originalPrefix.startsWith('ø')) return entries

      const remappedEntries = []

      for (const entry of entries) {
        if (!entry || typeof entry.name !== 'string') {
          remappedEntries.push(entry)
          continue
        }

        if (entry.name === 'ø' || HIDDEN_HELPERS.includes(entry.name)) {
          continue
        }

        if (!entry.name.startsWith('ø') || !/^ø[A-Za-z_$][\w$]*$/.test(entry.name)) {
          remappedEntries.push(entry)
          continue
        }

        const sugarName = `${entry.name.slice(1)}@`
        const insertText = typeof entry.insertText === 'string'
          ? entry.insertText.replace(/^ø([A-Za-z_$][\w$]*)$/, '$1@')
          : sugarName

        remappedEntries.push({
          ...entry,
          name: sugarName,
          insertText,
          filterText: sugarName,
        })
      }

      return remappedEntries
    }

    proxy.getSyntacticDiagnostics = (fileName) => {
      if (!isSugarFile(fileName)) return languageService.getSyntacticDiagnostics(fileName)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const sourceText = getSnapshotText(fileName)
        const diagnostics = ls.getSyntacticDiagnostics(virtualFileName) || []
        return diagnostics.map((diag) => remapDiagnostic(diag, fileName, sourceText, transformed))
      })
    }

    proxy.getSemanticDiagnostics = (fileName) => {
      if (!isSugarFile(fileName)) return languageService.getSemanticDiagnostics(fileName)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const sourceText = getSnapshotText(fileName)
        const diagnostics = ls.getSemanticDiagnostics(virtualFileName) || []
        return diagnostics.map((diag) => remapDiagnostic(diag, fileName, sourceText, transformed))
      })
    }

    proxy.getSuggestionDiagnostics = (fileName) => {
      if (!isSugarFile(fileName)) return languageService.getSuggestionDiagnostics(fileName)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const sourceText = getSnapshotText(fileName)
        const diagnostics = typeof ls.getSuggestionDiagnostics === 'function'
          ? ls.getSuggestionDiagnostics(virtualFileName) || []
          : []
        return diagnostics.map((diag) => remapDiagnostic(diag, fileName, sourceText, transformed))
      })
    }

    proxy.getQuickInfoAtPosition = (fileName, position) => {
      if (!isSugarFile(fileName)) return languageService.getQuickInfoAtPosition(fileName, position)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const candidatePositions = withNearbyPositions(
          transformedPosition,
          transformed && typeof transformed.code === 'string' ? transformed.code.length : transformedPosition,
          24,
        )

        const candidates = []
        for (const candidatePos of candidatePositions) {
          const quickInfo = ls.getQuickInfoAtPosition(virtualFileName, candidatePos)
          if (!quickInfo || !quickInfo.textSpan) continue
          if (transformedSpanIntersectsHiddenHelper(transformed.code, transformed.sourceMap, quickInfo.textSpan.start, quickInfo.textSpan.length)) {
            continue
          }

          const mappedTextSpan = mapTextSpanToOriginal(quickInfo.textSpan, transformed)
          if (!mappedTextSpan) continue

          candidates.push({
            quickInfo,
            mappedTextSpan,
            distance: Math.abs(candidatePos - transformedPosition),
            containsCursor: spanContainsPosition(mappedTextSpan, position),
          })
        }

        if (candidates.length === 0) return undefined

        candidates.sort((left, right) => {
          if (left.containsCursor !== right.containsCursor) {
            return left.containsCursor ? -1 : 1
          }
          if (left.distance !== right.distance) {
            return left.distance - right.distance
          }
          return (left.mappedTextSpan.length || 0) - (right.mappedTextSpan.length || 0)
        })

        const best = candidates[0]
        return {
          ...best.quickInfo,
          displayParts: remapDisplayPartsToSugar(best.quickInfo.displayParts),
          documentation: remapDisplayPartsToSugar(best.quickInfo.documentation),
          textSpan: best.mappedTextSpan,
        }
      })
    }

    proxy.getCompletionsAtPosition = (fileName, position, options, formattingSettings) => {
      if (!isSugarFile(fileName)) return languageService.getCompletionsAtPosition(fileName, position, options, formattingSettings)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const sourceText = getSnapshotText(fileName)
        const originalPrefix = getIdentifierPrefixAtPosition(sourceText, position)
        const completions = ls.getCompletionsAtPosition(virtualFileName, transformedPosition, options, formattingSettings)
        if (!completions) return completions

        const mappedEntries = Array.isArray(completions.entries)
          ? completions.entries.map((entry) => ({
            ...entry,
            replacementSpan: mapTextSpanToOriginal(entry.replacementSpan, transformed),
          }))
          : completions.entries

        const remappedEntries = remapCompletionEntriesToSugar(mappedEntries, originalPrefix)

        return {
          ...completions,
          optionalReplacementSpan: mapTextSpanToOriginal(completions.optionalReplacementSpan, transformed),
          entries: remappedEntries,
        }
      })
    }

    proxy.getCompletionEntryDetails = (fileName, position, entryName, formatOptions, source, preferences, data) => {
      if (!isSugarFile(fileName)) {
        return languageService.getCompletionEntryDetails(fileName, position, entryName, formatOptions, source, preferences, data)
      }

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)

        let transformedEntryName = entryName
        if (typeof transformedEntryName === 'string' && /[A-Za-z_$][\w$]*@$/.test(transformedEntryName)) {
          transformedEntryName = `ø${transformedEntryName.slice(0, -1)}`
        }

        const transformedData = data && typeof data === 'object' && typeof data.name === 'string' && /[A-Za-z_$][\w$]*@$/.test(data.name)
          ? {
            ...data,
            name: `ø${data.name.slice(0, -1)}`,
          }
          : data

        const details = ls.getCompletionEntryDetails(
          virtualFileName,
          transformedPosition,
          transformedEntryName,
          formatOptions,
          source,
          preferences,
          transformedData,
        )
        if (!details) return details
        return {
          ...details,
          displayParts: remapDisplayPartsToSugar(details.displayParts),
          documentation: remapDisplayPartsToSugar(details.documentation),
        }
      })
    }

    proxy.getDefinitionAtPosition = (fileName, position) => {
      if (!isSugarFile(fileName)) return languageService.getDefinitionAtPosition(fileName, position)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const definitions = ls.getDefinitionAtPosition(virtualFileName, transformedPosition)
        if (!definitions) return definitions
        return definitions
          .map((entry) => remapDefinitionLike(entry, fileName, transformed))
          .filter(Boolean)
      })
    }

    proxy.getDefinitionAndBoundSpan = (fileName, position) => {
      if (!isSugarFile(fileName)) return languageService.getDefinitionAndBoundSpan(fileName, position)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const value = ls.getDefinitionAndBoundSpan(virtualFileName, transformedPosition)
        if (!value) return value
        return {
          ...value,
          textSpan: mapTextSpanToOriginal(value.textSpan, transformed),
          definitions: Array.isArray(value.definitions)
            ? value.definitions
              .map((entry) => remapDefinitionLike(entry, fileName, transformed))
              .filter(Boolean)
            : value.definitions,
        }
      })
    }

    proxy.getTypeDefinitionAtPosition = (fileName, position) => {
      if (!isSugarFile(fileName)) return languageService.getTypeDefinitionAtPosition(fileName, position)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const definitions = ls.getTypeDefinitionAtPosition(virtualFileName, transformedPosition)
        if (!definitions) return definitions
        return definitions
          .map((entry) => remapDefinitionLike(entry, fileName, transformed))
          .filter(Boolean)
      })
    }

    proxy.getImplementationAtPosition = (fileName, position) => {
      if (!isSugarFile(fileName)) return languageService.getImplementationAtPosition(fileName, position)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const implementations = ls.getImplementationAtPosition(virtualFileName, transformedPosition)
        if (!implementations) return implementations
        return implementations
          .map((entry) => remapDefinitionLike(entry, fileName, transformed))
          .filter(Boolean)
      })
    }

    proxy.getReferencesAtPosition = (fileName, position) => {
      if (!isSugarFile(fileName)) return languageService.getReferencesAtPosition(fileName, position)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const references = ls.getReferencesAtPosition(virtualFileName, transformedPosition)
        if (!references) return references
        return references
          .map((entry) => remapReferenceLike(entry, fileName, transformed))
          .filter(Boolean)
      })
    }

    proxy.getOccurrencesAtPosition = (fileName, position) => {
      if (typeof languageService.getOccurrencesAtPosition !== 'function') return []
      if (!isSugarFile(fileName)) return languageService.getOccurrencesAtPosition(fileName, position)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const occurrences = ls.getOccurrencesAtPosition(virtualFileName, transformedPosition)
        if (!occurrences) return occurrences
        return occurrences
          .map((entry) => remapReferenceLike(entry, fileName, transformed))
          .filter(Boolean)
      })
    }

    proxy.getDocumentHighlights = (fileName, position, filesToSearch) => {
      if (typeof languageService.getDocumentHighlights !== 'function') return []
      if (!isSugarFile(fileName)) return languageService.getDocumentHighlights(fileName, position, filesToSearch)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const highlights = ls.getDocumentHighlights(virtualFileName, transformedPosition, filesToSearch)
        if (!highlights) return highlights
        return highlights.map((group) => ({
          ...group,
          fileName: toOriginalSugarFileName(group.fileName),
          highlightSpans: Array.isArray(group.highlightSpans)
            ? group.highlightSpans
              .filter((span) => !transformedSpanIntersectsHiddenHelper(transformed.code, transformed.sourceMap, span && span.textSpan && span.textSpan.start, span && span.textSpan && span.textSpan.length))
              .map((span) => ({
                ...span,
                textSpan: mapTextSpanToOriginal(span.textSpan, transformed),
                contextSpan: mapTextSpanToOriginal(span.contextSpan, transformed),
              }))
            : group.highlightSpans,
        }))
      })
    }

    proxy.getRenameInfo = (fileName, position, options) => {
      if (!isSugarFile(fileName)) return languageService.getRenameInfo(fileName, position, options)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const renameInfo = ls.getRenameInfo(virtualFileName, transformedPosition, options)
        if (!renameInfo || !renameInfo.canRename) return renameInfo
        return {
          ...renameInfo,
          triggerSpan: mapTextSpanToOriginal(renameInfo.triggerSpan, transformed),
        }
      })
    }

    proxy.findRenameLocations = (fileName, position, findInStrings, findInComments, preferences) => {
      if (!isSugarFile(fileName)) {
        return languageService.findRenameLocations(fileName, position, findInStrings, findInComments, preferences)
      }

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const locations = ls.findRenameLocations(virtualFileName, transformedPosition, findInStrings, findInComments, preferences)
        if (!locations) return locations
        return locations
          .map((entry) => remapRenameLocation(entry, fileName, transformed))
          .filter(Boolean)
      })
    }

    proxy.getSignatureHelpItems = (fileName, position, options) => {
      if (!isSugarFile(fileName)) return languageService.getSignatureHelpItems(fileName, position, options)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedPosition = toTransformedPos(transformed, position)
        const signature = ls.getSignatureHelpItems(virtualFileName, transformedPosition, options)
        if (!signature) return signature
        return {
          ...signature,
          applicableSpan: mapTextSpanToOriginal(signature.applicableSpan, transformed),
        }
      })
    }

    proxy.getSyntacticClassifications = (fileName, span) => {
      if (typeof languageService.getSyntacticClassifications !== 'function') return []
      if (!isSugarFile(fileName)) return languageService.getSyntacticClassifications(fileName, span)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedSpan = toTransformedTextSpan(transformed, span)
        const classifications = ls.getSyntacticClassifications(virtualFileName, transformedSpan)
        return remapClassifiedSpansToOriginal(classifications, transformed)
      })
    }

    proxy.getSemanticClassifications = (fileName, span) => {
      if (typeof languageService.getSemanticClassifications !== 'function') return []
      if (!isSugarFile(fileName)) return languageService.getSemanticClassifications(fileName, span)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedSpan = toTransformedTextSpan(transformed, span)
        const classifications = ls.getSemanticClassifications(virtualFileName, transformedSpan)
        return remapClassifiedSpansToOriginal(classifications, transformed)
      })
    }

    proxy.getEncodedSyntacticClassifications = (fileName, span) => {
      if (typeof languageService.getEncodedSyntacticClassifications !== 'function') {
        return { spans: [], endOfLineState: ts.EndOfLineState.None }
      }
      if (!isSugarFile(fileName)) return languageService.getEncodedSyntacticClassifications(fileName, span)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedSpan = toTransformedTextSpan(transformed, span)
        const classifications = ls.getEncodedSyntacticClassifications(virtualFileName, transformedSpan)
        return remapEncodedClassificationsToOriginal(classifications, transformed)
      })
    }

    proxy.getEncodedSemanticClassifications = (fileName, span, format) => {
      if (typeof languageService.getEncodedSemanticClassifications !== 'function') {
        return { spans: [], endOfLineState: ts.EndOfLineState.None }
      }
      if (!isSugarFile(fileName)) return languageService.getEncodedSemanticClassifications(fileName, span, format)

      return withTransientLanguageService(fileName, ({ ls, transformed, virtualFileName }) => {
        const transformedSpan = toTransformedTextSpan(transformed, span)
        const classifications = ls.getEncodedSemanticClassifications(virtualFileName, transformedSpan, format)
        return remapEncodedClassificationsToOriginal(classifications, transformed)
      })
    }

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

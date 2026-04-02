      // Preprocess 'get' property sugar to valid property before formatting
      function preprocessGetPropertySugar(source) {
         // Replace 'get <name>:' with '__get_<name>:' for formatting
         return source.replace(/(^|[,{\s])get\s+([a-zA-Z0-9_]+)\s*:/gm, (m, pre, name) => `${pre}__get_${name}:`)
      }

      // Restore 'get' property sugar after formatting
      function postprocessGetPropertySugar(formatted, original) {
         // Only restore if the original had 'get <name>:'
         // This is a best-effort whitespace-preserving remap
         const getPropRegex = /(^|[,{\s])__get_([a-zA-Z0-9_]+)\s*:/gm
         return formatted.replace(getPropRegex, (m, pre, name) => {
            // Try to match the original's whitespace for this property
            const origMatch = new RegExp(`(^|[,{\s])get\\s+${name}\\s*:`,'m').exec(original)
            if (origMatch) {
               // Use the exact whitespace from the original
               return origMatch[0]
            }
            // Fallback: 'get <name>:'
            return `${pre}get ${name}:`
         })
      }
const path = require('node:path')
const {
   mapTextSpanFromSourceMap,
   toTransformedPosFromSourceMap,
   toOriginalPosFromSourceMap,
   transformRXSSugar,
} = require('./transform-rxs-sugar.cjs')

const SUGAR_IDENTIFIER_RE = /^æ[A-Za-z_$][\w$]*$/

function init(modules) {
   const ts = modules.typescript

   function isSugarFile(fileName) {
      return fileName.endsWith('.rxs')
   }

   function getVirtualExtension(fileName) {
      return fileName.endsWith('.rxs') ? '.tsx' : '.ts'
   }

   function getScriptKindFromFileName(fileName) {
      if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX
      if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX
      if (fileName.endsWith('.js')) return ts.ScriptKind.JS
      return ts.ScriptKind.TS
   }

   function normalizeAbsolute(filePath) {
      return path.resolve(filePath)
   }

   function create(info) {
      const languageService = info.languageService
      const host = info.languageServiceHost
      const transformCache = new Map()
      const HIDDEN_HELPERS = ['absorbØ', 'destructureØ', 'πæ', 'æ']
      const project = info.project
      const parsedConfigCache = new Map()
      const discoveredSugarFilesCache = new Map()
      const transientLsCache = new Map()
      const pluginConfig = info.config || {}
      const profilingEnabled = Boolean(pluginConfig.profile)
      const transientDocumentRegistry = ts.createDocumentRegistry()

      const proxy = Object.create(null)
      for (const key of Object.keys(languageService)) {
         proxy[key] = (...args) => languageService[key](...args)
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

      function getConfigPath() {
         const projectName = project.getProjectName && project.getProjectName()
         if (projectName && projectName.endsWith('.json')) {
            return normalizeAbsolute(projectName)
         }
         return ts.findConfigFile(host.getCurrentDirectory(), ts.sys.fileExists, 'tsconfig.json')
      }

      function getConfigMtimeMs(configPath) {
         if (typeof ts.sys.getModifiedTime !== 'function') return -1
         const modified = ts.sys.getModifiedTime(configPath)
         if (!modified) return -1
         return modified.valueOf()
      }


      function createLueCompilerContext(configPath, parsedConfig, discoveredLueFiles, targetPath, getTargetSourceText) {
         const normalizedTarget = normalizeAbsolute(targetPath)
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

         for (const fileName of discoveredLueFiles) {
            registerLueFile(fileName)
         }

         registerLueFile(normalizedTarget)

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

            const result = profile(`transform:${path.basename(normalizedOriginal)}`, () => transformRXSSugar({
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
                  getScriptKindFromFileName(normalizedOriginal.endsWith('.rxs') ? `${normalizedOriginal}.tsx` : `${normalizedOriginal}.ts`),
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
               getScriptKindFromFileName(normalizedOriginal.endsWith('.rxs') ? `${normalizedOriginal}.tsx` : `${normalizedOriginal}.ts`),
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
            registerLueFile,
            getTransformForOriginal,
            remapDiagnostic,
         }
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
            ['.rxs'],
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


      function mapFormattingChangeToOriginal(change, transformResult) {
         if (!change || !change.span) return null

         const transformedStart = change.span.start
         const transformedLength = Math.max(0, change.span.length)
         const transformedEnd = transformedStart + transformedLength
         let transformedOldText = transformResult.code.slice(transformedStart, transformedEnd)
         let transformedNewText = typeof change.newText === 'string' ? change.newText : ''

         // If the transform was for formatting, preprocess get property sugar
         if (transformResult._formattingPreprocessSource) {
            transformedOldText = postprocessGetPropertySugar(transformedOldText, transformResult._formattingPreprocessSource)
            transformedNewText = postprocessGetPropertySugar(transformedNewText, transformResult._formattingPreprocessSource)
         }

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

      function getSnapshotText(fileName) {
         const snapshot = host.getScriptSnapshot(fileName)
         if (!snapshot) return ''
         return snapshot.getText(0, snapshot.getLength())
      }

      function toOriginalSugarFileName(fileName) {
         if (typeof fileName !== 'string') return fileName
         if (fileName.endsWith('.rxs.tsx')) return fileName.slice(0, -4)
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

         const spanText = transformedCode.slice(spanStart, spanEnd)
         if (/^(?:æ|πæ)[A-Za-z_$][\w$]*$/.test(spanText)) {
            return false
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

      function getIdentifierAtPosition(text, position) {
         if (typeof text !== 'string') return ''
         const safePos = Math.max(0, Math.min(text.length, position))
         let start = safePos
         let end = safePos

         while (start > 0) {
            const ch = text.charCodeAt(start - 1)
            const isWord = (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 || ch === 36 || ch === 968
            if (!isWord) break
            start -= 1
         }

         while (end < text.length) {
            const ch = text.charCodeAt(end)
            const isWord = (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 || ch === 36 || ch === 968
            if (!isWord) break
            end += 1
         }

         return text.slice(start, end)
      }

      function getIdentifierSpanAtPosition(text, position) {
         if (typeof text !== 'string' || text.length === 0) return null

         const maxIndex = Math.max(0, text.length - 1)
         let cursor = Math.max(0, Math.min(maxIndex, position))
         if (text[cursor] === '@' && cursor > 0) cursor -= 1

         const isWordAt = (index) => {
            if (index < 0 || index >= text.length) return false
            const ch = text.charCodeAt(index)
            return (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 || ch === 36
         }

         if (!isWordAt(cursor)) return null

         let start = cursor
         let end = cursor + 1

         while (start > 0 && isWordAt(start - 1)) start -= 1
         while (end < text.length && isWordAt(end)) end += 1

         return {
            start,
            length: end - start,
         }
      }

      function getDeclarationTokenSpanAtPosition(text, position) {
         if (typeof text !== 'string' || text.length === 0) return null
         const identifierSpan = getIdentifierSpanAtPosition(text, position)
         if (!identifierSpan || identifierSpan.length <= 0) return null

         const identStart = identifierSpan.start
         const identEnd = identStart + identifierSpan.length
         const before = text.slice(Math.max(0, identStart - 64), identStart)

         if (/\bget\s*$/.test(before)) {
            return identifierSpan
         }

         if (/\b(?:const|let|var)\s*$/.test(before)) {
            if (text[identEnd] === '@') {
               return {
                  start: identStart,
                  length: identifierSpan.length + 1,
               }
            }
            return identifierSpan
         }

         return null
      }

      function quickInfoLooksLikeArrowFunction(quickInfo) {
         if (!quickInfo) return false
         const displayText = Array.isArray(quickInfo.displayParts)
            ? quickInfo.displayParts.map((part) => (part && typeof part.text === 'string' ? part.text : '')).join('')
            : ''
         return /=>/.test(displayText)
      }

      function collectDerivationArrowProbePositions(transformed, originalPos, centerPos) {
         if (!transformed || typeof transformed.code !== 'string' || transformed.code.length === 0) return []
         if (!Number.isFinite(originalPos)) return []

         const transformedCode = transformed.code
         const transformedLength = transformedCode.length
         const safeCenter = Math.max(0, Math.min(transformedLength, Number.isFinite(centerPos) ? Math.floor(centerPos) : 0))
         const windowRadius = 160
         const scanStart = Math.max(0, safeCenter - windowRadius)
         const scanEnd = Math.min(transformedLength - 1, safeCenter + windowRadius)

         const output = []
         const seen = new Set()
         const add = (pos) => {
            const safePos = Math.max(0, Math.min(transformedLength, pos))
            if (seen.has(safePos)) return
            seen.add(safePos)
            output.push(safePos)
         }

         for (let index = scanStart; index < scanEnd; index += 1) {
            if (transformedCode[index] !== '=' || transformedCode[index + 1] !== '>') continue
            const mappedLeft = toOriginalPos(transformed, index)
            const mappedRight = toOriginalPos(transformed, index + 1)
            if (mappedLeft !== originalPos && mappedRight !== originalPos) continue

            add(index)
            add(index + 1)
            add(index - 1)
            add(index + 2)
         }

         return output
      }

      function quickInfoMatchesDerivationArrowProbe(quickInfo, transformedCode, derivationArrowProbeSet) {
         if (!quickInfo || !quickInfo.textSpan || !(derivationArrowProbeSet instanceof Set) || derivationArrowProbeSet.size === 0) {
            return false
         }

         const start = Math.max(0, quickInfo.textSpan.start || 0)
         const length = Math.max(0, quickInfo.textSpan.length || 0)
         const end = Math.max(start, start + length)

         for (const probePos of derivationArrowProbeSet) {
            if (probePos >= start && probePos < end) return true
         }

         if (typeof transformedCode === 'string' && length > 0) {
            const spanText = transformedCode.slice(start, end)
            if (spanText.includes('=>')) return true
         }

         return false
      }

      function createDerivationArrowDisplayParts(quickInfo) {
         const fallback = [{ kind: 'text', text: '() => …' }]
         if (!quickInfo || !Array.isArray(quickInfo.displayParts) || quickInfo.displayParts.length === 0) {
            return fallback
         }

         const text = quickInfo.displayParts
            .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
            .join('')
         const returnTypeMatch = text.match(/:\s*([^\n]+)$/)
         if (returnTypeMatch && returnTypeMatch[1]) {
            return [{ kind: 'text', text: `() => ${returnTypeMatch[1].trim()}` }]
         }

         return fallback
      }

      function isCursorOnAccessorToken(text, position) {
         if (typeof text !== 'string' || text.length === 0) return false
         const safePos = Math.max(0, Math.min(text.length, position))
         if (text[safePos] === '@') return true

         let start = safePos
         let end = safePos

         while (start > 0) {
            const ch = text.charCodeAt(start - 1)
            const isWord = (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 || ch === 36
            if (!isWord) break
            start -= 1
         }

         while (end < text.length) {
            const ch = text.charCodeAt(end)
            const isWord = (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 || ch === 36
            if (!isWord) break
            end += 1
         }

         return end < text.length && text[end] === '@' && safePos >= start && safePos <= end
      }

      function normalizeAccessorHoverSpan(span, sourceText) {
         if (!span || typeof span.start !== 'number' || typeof span.length !== 'number') return span
         if (typeof sourceText !== 'string' || sourceText.length === 0) return span

         const spanStart = Math.max(0, Math.min(sourceText.length, span.start))
         const spanEnd = Math.max(spanStart, Math.min(sourceText.length, span.start + span.length))
         let start = spanStart
         let end = spanEnd

         if (start < end && sourceText[start] === '.') start += 1
         if (end <= sourceText.length && sourceText[end - 1] !== '@' && end < sourceText.length && sourceText[end] === '@') {
            end += 1
         }

         const length = Math.max(0, end - start)
         return {
            start,
            length,
         }
      }

      function getAccessorTokenSpanAtPosition(text, position) {
         if (typeof text !== 'string' || text.length === 0) return null

         const safePos = Math.max(0, Math.min(text.length, position))
         let identStart = safePos
         let identEnd = safePos

         if (safePos > 0 && text[safePos] === '@') {
            identEnd = safePos
            identStart = safePos
            while (identStart > 0) {
               const ch = text.charCodeAt(identStart - 1)
               const isWord = (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 || ch === 36
               if (!isWord) break
               identStart -= 1
            }
         } else {
            while (identStart > 0) {
               const ch = text.charCodeAt(identStart - 1)
               const isWord = (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 || ch === 36
               if (!isWord) break
               identStart -= 1
            }

            while (identEnd < text.length) {
               const ch = text.charCodeAt(identEnd)
               const isWord = (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 || ch === 36
               if (!isWord) break
               identEnd += 1
            }
         }

         if (identStart >= identEnd) return null
         if (identEnd >= text.length || text[identEnd] !== '@') return null

         return {
            start: identStart,
            length: (identEnd - identStart) + 1,
         }
      }

      function toOriginalPos(transformed, transformedPos) {
         if (!transformed || !transformed.sourceMap) return Math.max(0, transformedPos || 0)
         return toOriginalPosFromSourceMap(transformed.sourceMap, transformedPos)
      }

      function getTransformForSugarFile(fileName) {
         const source = getSnapshotText(fileName)
         const cached = transformCache.get(fileName)
         if (cached && cached.source === source) return cached.transformed

         const transformedCore = transformRXSSugar({ code: source, fileName })
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
         let bestTransformedDistance = Number.POSITIVE_INFINITY

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

         if (/\b(?:destructureØ|absorbØ|πæ)\b/.test(transformedSlice)) {
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
         // Accessor sugar identifiers appear as 'æname' in transformed code and 'name@' in the original.
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
            getScriptKindFromFileName(originalFileName.endsWith('.rxs') ? `${originalFileName}.tsx` : `${originalFileName}.ts`),
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
            // æ-prefixed accessor identifiers: the æ is a synthetic prefix char that
            // maps to a step=0 segment, so the full span would be filtered by the
            // hidden-helper check. Instead, remap just the identifier chars (skip æ).
            if (/^æ[A-Za-z_$][\w$]*$/.test(spanText)) {
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
            // æ-prefixed accessor identifiers: the æ is a synthetic prefix char that
            // maps to a step=0 segment, so the full span would be filtered by the
            // hidden-helper check. Instead, remap just the identifier chars (skip æ).
            if (/^æ[A-Za-z_$][\w$]*$/.test(spanText)) {
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

      // Remap TypeScript display-part arrays: strip 'æ' prefix from identifiers, add '@' suffix for
      // accessor references, and change 'const'/'let'/'var' to 'get' for accessor declarations.
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
            // Change 'const'/'let'/'var' to 'get' when the next part is an æ-prefixed identifier
            if (
               (part.text === 'const' || part.text === 'let' || part.text === 'var') &&
               i + 1 < displayParts.length &&
               typeof displayParts[i + 1].text === 'string' &&
               /^æ[A-Za-z_$][\w$]*$/.test(displayParts[i + 1].text)
            ) {
               result.push({ ...part, text: 'get' })
               nextIdentIsDeclaration = true
               continue
            }
            // Handle a bare æ-prefixed identifier
            if (/^æ[A-Za-z_$][\w$]*$/.test(part.text)) {
               const baseName = part.text.slice(1)
               // Declarations use 'get name' (no '@'); references use 'name@'
               result.push({ ...part, text: nextIdentIsDeclaration ? baseName : baseName + '@' })
               nextIdentIsDeclaration = false
               continue
            }
            // Handle æ embedded in longer text (e.g. "(property) æcount" in a single text chunk)
            const remappedText = part.text.replace(/æ([A-Za-z_$][\w$]*)/g, (_, name) => {
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
         if (typeof originalPrefix === 'string' && originalPrefix.startsWith('æ')) return entries

         const remappedEntries = []

         for (const entry of entries) {
            if (!entry || typeof entry.name !== 'string') {
               remappedEntries.push(entry)
               continue
            }

            if (entry.name === 'æ' || HIDDEN_HELPERS.includes(entry.name)) {
               continue
            }

            if (!entry.name.startsWith('æ') || !/^æ[A-Za-z_$][\w$]*$/.test(entry.name)) {
               remappedEntries.push(entry)
               continue
            }

            const sugarName = `${entry.name.slice(1)}@`
            const insertText = typeof entry.insertText === 'string'
               ? entry.insertText.replace(/^æ([A-Za-z_$][\w$]*)$/, '$1@')
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


      function createTransientLanguageService(fileName) {
         const normalizedFile = normalizeAbsolute(fileName)
         const scriptVersion = host.getScriptVersion(normalizedFile) || host.getScriptVersion(fileName) || ''
         const configPath = getConfigPath()
         if (!configPath) return undefined

         const parsedConfigResult = getParsedConfigForPath(configPath)
         if (!parsedConfigResult) return undefined

         const parsedConfig = parsedConfigResult.parsedConfig
         const discoveredLueFiles = getDiscoveredSugarFiles(configPath, parsedConfig)
         const configSignature = `${normalizeAbsolute(configPath)}:${parsedConfigResult.mtimeMs}`

         const cached = transientLsCache.get(normalizedFile)
         if (
            cached
            && cached.configSignature === configSignature
            && cached.scriptVersion === scriptVersion
         ) {
            return cached
         }

         const sourceText = getSnapshotText(fileName)
         if (typeof sourceText !== 'string') return undefined

         const lueContext = createLueCompilerContext(
            configPath,
            parsedConfig,
            discoveredLueFiles,
            normalizedFile,
            () => getSnapshotText(normalizedFile),
         )
         const virtualFileName = lueContext.originalToVirtual.get(normalizedFile)
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
               if (normalizeAbsolute(scriptName) === normalizedFile) return scriptVersion
               const originalForVirtual = lueContext.virtualToOriginal.get(scriptName)
               if (originalForVirtual && normalizeAbsolute(originalForVirtual) === normalizedFile) {
                  return scriptVersion
               }
               return '0'
            },
            getScriptSnapshot(scriptName) {
               const original = lueContext.virtualToOriginal.get(scriptName)
               if (original) {
                  const transformed = lueContext.getTransformForOriginal(original).code
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
               if (lueContext.virtualToOriginal.has(filePath)) return true
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
                     if (lueContext.virtualToOriginal.has(candidate)) return true
                     return ts.sys.fileExists(candidate)
                  },
                  readFile: (candidate) => {
                     const original = lueContext.virtualToOriginal.get(candidate)
                     if (original) return lueContext.getTransformForOriginal(original).code
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

                  const containingOriginal = lueContext.virtualToOriginal.get(containingFile) || containingFile
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

                     const resolvedVirtual = lueContext.registerLueFile(absoluteCandidate)
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
            lueContext,
            virtualFileName,
            configSignature,
            scriptVersion,
            get transformResult() {
               return lueContext.getTransformForOriginal(normalizedFile)
            },
         }

         if (cached && cached.languageService && typeof cached.languageService.dispose === 'function') {
            cached.languageService.dispose()
         }

         transientLsCache.set(normalizedFile, entry)
         return entry
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
            const sourceText = getSnapshotText(fileName)
            const originalPrefix = getIdentifierPrefixAtPosition(sourceText, position)
            const originalIdentifier = getIdentifierAtPosition(sourceText, position)
            const declarationTokenSpan = getDeclarationTokenSpanAtPosition(sourceText, position)
            const sourceChar = typeof sourceText === 'string' ? sourceText[position] : ''
            const cursorOnDerivationOpenParen = sourceChar === '('
            const cursorOnAccessorToken = isCursorOnAccessorToken(sourceText, position)
            const accessorTokenSpan = cursorOnAccessorToken ? getAccessorTokenSpanAtPosition(sourceText, position) : null
            const transformedPosition = toTransformedPos(transformed, position)
            const baseCandidatePositions = withNearbyPositions(
               transformedPosition,
               transformed && typeof transformed.code === 'string' ? transformed.code.length : transformedPosition,
               96,
            )
            const derivationArrowProbePositions = cursorOnDerivationOpenParen
               ? collectDerivationArrowProbePositions(transformed, position, transformedPosition)
               : []
            const derivationArrowProbeSet = new Set(derivationArrowProbePositions)
            const isDerivationParenHover = cursorOnDerivationOpenParen && derivationArrowProbePositions.length > 0
            const candidatePositions = [
               ...derivationArrowProbePositions,
               ...baseCandidatePositions,
            ]

            const candidates = []
            for (const candidatePos of candidatePositions) {
               const quickInfo = ls.getQuickInfoAtPosition(virtualFileName, candidatePos)
               if (!quickInfo || !quickInfo.textSpan) continue
               const isDirectDerivationProbe = cursorOnDerivationOpenParen && derivationArrowProbeSet.has(candidatePos)
               const isDerivationArrowCandidate = cursorOnDerivationOpenParen
                  && (isDirectDerivationProbe || quickInfoMatchesDerivationArrowProbe(quickInfo, transformed.code, derivationArrowProbeSet))
               if (transformedSpanIntersectsHiddenHelper(transformed.code, transformed.sourceMap, quickInfo.textSpan.start, quickInfo.textSpan.length)) {
                  if (cursorOnDerivationOpenParen && (quickInfoLooksLikeArrowFunction(quickInfo) || isDerivationArrowCandidate)) {
                     // allow synthetic arrow-function quick info when hovering derivation shorthand '('
                  } else {
                     continue
                  }
               }

               const mappedTextSpan = mapTextSpanToOriginal(quickInfo.textSpan, transformed)
               if (!mappedTextSpan) continue

               const mappedText = typeof sourceText === 'string'
                  ? sourceText.slice(mappedTextSpan.start, mappedTextSpan.start + mappedTextSpan.length)
                  : ''
               const prefixMatches = originalPrefix.length === 0 || mappedText.includes(originalPrefix)
               const displayText = Array.isArray(quickInfo.displayParts)
                  ? quickInfo.displayParts.map((part) => (part && typeof part.text === 'string' ? part.text : '')).join('')
                  : ''
               const displayMatchesPrefix = originalPrefix.length === 0 || displayText.includes(originalPrefix)
               const mappedMatchesIdentifier = originalIdentifier.length > 0 && mappedText.includes(originalIdentifier)
               const displayMatchesIdentifier = originalIdentifier.length > 0
                  && (displayText.includes(originalIdentifier) || displayText.includes(`æ${originalIdentifier}`) || displayText.includes(`${originalIdentifier}@`))
               const identifierMatches = mappedMatchesIdentifier || displayMatchesIdentifier
               const mappedEnd = mappedTextSpan.start + mappedTextSpan.length
               const mapsToAccessorToken = mappedText.includes('@') || sourceText[mappedEnd] === '@'
               const normalizedSpan = cursorOnAccessorToken && mapsToAccessorToken
                  ? normalizeAccessorHoverSpan(mappedTextSpan, sourceText)
                  : mappedTextSpan
               const matchesAccessorTokenSpan = !!(
                  accessorTokenSpan
                  && normalizedSpan
                  && normalizedSpan.start === accessorTokenSpan.start
                  && normalizedSpan.length === accessorTokenSpan.length
               )
               const isArrowFunctionQuickInfo = quickInfoLooksLikeArrowFunction(quickInfo) || isDerivationArrowCandidate

               candidates.push({
                  quickInfo,
                  mappedTextSpan: normalizedSpan,
                  prefixMatches,
                  displayMatchesPrefix,
                  identifierMatches,
                  mapsToAccessorToken,
                  matchesAccessorTokenSpan,
                  isArrowFunctionQuickInfo,
                  isDerivationArrowCandidate,
                  distance: Math.abs(candidatePos - transformedPosition),
                  containsCursor: spanContainsPosition(normalizedSpan, position),
               })
            }

            if (candidates.length === 0) return undefined

            candidates.sort((left, right) => {
               if (cursorOnDerivationOpenParen && left.isArrowFunctionQuickInfo !== right.isArrowFunctionQuickInfo) {
                  return left.isArrowFunctionQuickInfo ? -1 : 1
               }
               if (cursorOnDerivationOpenParen && left.isDerivationArrowCandidate !== right.isDerivationArrowCandidate) {
                  return left.isDerivationArrowCandidate ? -1 : 1
               }
               if (left.identifierMatches !== right.identifierMatches) {
                  return left.identifierMatches ? -1 : 1
               }
               if (cursorOnAccessorToken && left.matchesAccessorTokenSpan !== right.matchesAccessorTokenSpan) {
                  return left.matchesAccessorTokenSpan ? -1 : 1
               }
               if (cursorOnAccessorToken && left.mapsToAccessorToken !== right.mapsToAccessorToken) {
                  return left.mapsToAccessorToken ? -1 : 1
               }
               if (left.containsCursor !== right.containsCursor) {
                  return left.containsCursor ? -1 : 1
               }
               if (left.displayMatchesPrefix !== right.displayMatchesPrefix) {
                  return left.displayMatchesPrefix ? -1 : 1
               }
               if (left.prefixMatches !== right.prefixMatches) {
                  return left.prefixMatches ? -1 : 1
               }
               if (left.distance !== right.distance) {
                  return left.distance - right.distance
               }
               const leftLength = left.mappedTextSpan.length || 0
               const rightLength = right.mappedTextSpan.length || 0
               const leftZeroLength = leftLength <= 0
               const rightZeroLength = rightLength <= 0
               if (leftZeroLength !== rightZeroLength) {
                  return leftZeroLength ? 1 : -1
               }
               return leftLength - rightLength
            })

            const best = candidates[0]
            const finalTextSpan = cursorOnAccessorToken && accessorTokenSpan
               ? accessorTokenSpan
               : declarationTokenSpan
                  ? declarationTokenSpan
                  : isDerivationParenHover
                     ? { start: position, length: 1 }
                     : best.mappedTextSpan
            const finalDisplayParts = isDerivationParenHover
               ? createDerivationArrowDisplayParts(best.quickInfo)
               : remapDisplayPartsToSugar(best.quickInfo.displayParts)
            return {
               ...best.quickInfo,
               displayParts: finalDisplayParts,
               documentation: remapDisplayPartsToSugar(best.quickInfo.documentation),
               textSpan: finalTextSpan,
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
               transformedEntryName = `æ${transformedEntryName.slice(0, -1)}`
            }

            const transformedData = data && typeof data === 'object' && typeof data.name === 'string' && /[A-Za-z_$][\w$]*@$/.test(data.name)
               ? {
                  ...data,
                  name: `æ${data.name.slice(0, -1)}`,
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

      function getPreprocessedFormattingEdits(transient, kind, ...args) {
         // Preprocess get property sugar for formatting
         const preSource = preprocessGetPropertySugar(transient.transformResult.code)
         const preTransformResult = {
            ...transient.transformResult,
            code: preSource,
            _formattingPreprocessSource: transient.transformResult.code
         }
         // Use a temporary language service for the preprocessed code
         const tsmod = transient.languageServiceHost.ts || require('typescript')
         const tempLSHost = {
            ...transient.languageServiceHost,
            getScriptSnapshot: (fileName) => {
               if (fileName === transient.virtualFileName) {
                  return tsmod.ScriptSnapshot.fromString(preSource)
               }
               return transient.languageServiceHost.getScriptSnapshot(fileName)
            }
         }
         const tempLS = tsmod.createLanguageService(tempLSHost, transient.languageServiceHost.transientDocumentRegistry)
         let edits = []
         if (kind === 'document') {
            edits = tempLS.getFormattingEditsForDocument(transient.virtualFileName, ...args)
         } else if (kind === 'range') {
            edits = tempLS.getFormattingEditsForRange(transient.virtualFileName, ...args)
         } else if (kind === 'keystroke') {
            edits = tempLS.getFormattingEditsAfterKeystroke(transient.virtualFileName, ...args)
         }
         return mapFormattingChangesToOriginal(edits, preTransformResult)
      }

      proxy.getFormattingEditsForDocument = (fileName, formatOptions, preferences) => {
         log(`[DEBUG] getFormattingEditsForDocument called for: ${fileName}`)
         if (!isSugarFile(fileName) || typeof languageService.getFormattingEditsForDocument !== 'function') {
            return languageService.getFormattingEditsForDocument
               ? languageService.getFormattingEditsForDocument(fileName, formatOptions, preferences)
               : []
         }
         const transient = createTransientLanguageService(fileName)
         if (!transient) {
            return languageService.getFormattingEditsForDocument(fileName, formatOptions, preferences)
         }
         return getPreprocessedFormattingEdits(transient, 'document', formatOptions, preferences)
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
         // Map range to preprocessed code
         return getPreprocessedFormattingEdits(transient, 'range', start, end, formatOptions, preferences)
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
         return getPreprocessedFormattingEdits(transient, 'keystroke', position, key, formatOptions, preferences)
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

      return ts.sys.readDirectory(path.dirname(configPath), ['.rxs'], excludePatterns, includePatterns)
   }

   return {
      create,
      getExternalFiles,
   }
}

module.exports = init

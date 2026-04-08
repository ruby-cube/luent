const ts = require('typescript')

const IDENTIFIER_PREFIX = 'æ'
const GETTER_ACCESS_HELPER = 'πæ'
const DESTRUCTURE_HELPER = 'destructureØ'
const ABSORB_HELPER = 'absorbØ'

function isAssignmentOperatorAt(text, index) {
  const operatorCandidates = ['&&=', '||=', '??=', '>>>=', '<<=', '>>=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '=']
  for (const candidate of operatorCandidates) {
    if (text.startsWith(candidate, index)) {
      if (candidate === '=' && (text.startsWith('==', index) || text.startsWith('=>', index))) return false
      return true
    }
  }
  return false
}

function isLikelyAssignmentTarget(text, endPos) {
  let cursor = endPos
  while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1

  if (cursor < text.length && isAssignmentOperatorAt(text, cursor)) return true
  if (text.startsWith('++', cursor) || text.startsWith('--', cursor)) return true

  return false
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function splitTopLevelCommaList(text) {
  const parts = []
  let start = 0
  let parenDepth = 0
  let bracketDepth = 0
  let braceDepth = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const prev = i > 0 ? text[i - 1] : ''

    if (!inDouble && !inTemplate && ch === '\'' && prev !== '\\') {
      inSingle = !inSingle
      continue
    }
    if (!inSingle && !inTemplate && ch === '"' && prev !== '\\') {
      inDouble = !inDouble
      continue
    }
    if (!inSingle && !inDouble && ch === '`' && prev !== '\\') {
      inTemplate = !inTemplate
      continue
    }
    if (inSingle || inDouble || inTemplate) continue

    if (ch === '(') parenDepth += 1
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1)
    else if (ch === '[') bracketDepth += 1
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1)
    else if (ch === '{') braceDepth += 1
    else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1)
    else if (ch === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }

  parts.push(text.slice(start))
  return parts
}

function findMatchingBrace(text, openBraceIndex) {
  if (openBraceIndex < 0 || openBraceIndex >= text.length || text[openBraceIndex] !== '{') return -1

  let depth = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false

  for (let index = openBraceIndex; index < text.length; index += 1) {
    const ch = text[index]
    const prev = index > 0 ? text[index - 1] : ''

    if (!inDouble && !inTemplate && ch === '\'' && prev !== '\\') {
      inSingle = !inSingle
      continue
    }
    if (!inSingle && !inTemplate && ch === '"' && prev !== '\\') {
      inDouble = !inDouble
      continue
    }
    if (!inSingle && !inDouble && ch === '`' && prev !== '\\') {
      inTemplate = !inTemplate
      continue
    }

    if (inSingle || inDouble || inTemplate) continue

    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }

  return -1
}

function findMatchingParen(text, openParenIndex) {
  if (openParenIndex < 0 || openParenIndex >= text.length || text[openParenIndex] !== '(') return -1

  let depth = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false

  for (let index = openParenIndex; index < text.length; index += 1) {
    const ch = text[index]
    const prev = index > 0 ? text[index - 1] : ''

    if (!inDouble && !inTemplate && ch === '\'' && prev !== '\\') {
      inSingle = !inSingle
      continue
    }
    if (!inSingle && !inTemplate && ch === '"' && prev !== '\\') {
      inDouble = !inDouble
      continue
    }
    if (!inSingle && !inDouble && ch === '`' && prev !== '\\') {
      inTemplate = !inTemplate
      continue
    }

    if (inSingle || inDouble || inTemplate) continue

    if (ch === '(') depth += 1
    else if (ch === ')') {
      depth -= 1
      if (depth === 0) return index
    }
  }

  return -1
}

function findTopLevelCommaInParens(text, openParenIndex, closeParenIndex) {
  let parenDepth = 0
  let bracketDepth = 0
  let braceDepth = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false

  for (let index = openParenIndex + 1; index < closeParenIndex; index += 1) {
    const ch = text[index]
    const prev = index > 0 ? text[index - 1] : ''

    if (!inDouble && !inTemplate && ch === '\'' && prev !== '\\') {
      inSingle = !inSingle
      continue
    }
    if (!inSingle && !inTemplate && ch === '"' && prev !== '\\') {
      inDouble = !inDouble
      continue
    }
    if (!inSingle && !inDouble && ch === '`' && prev !== '\\') {
      inTemplate = !inTemplate
      continue
    }

    if (inSingle || inDouble || inTemplate) continue

    if (ch === '(') parenDepth += 1
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1)
    else if (ch === '[') bracketDepth += 1
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1)
    else if (ch === '{') braceDepth += 1
    else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1)
    else if (ch === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return index
    }
  }

  return -1
}

function extractSimpleObjectKey(entry) {
  const trimmed = entry.trim()
  if (!trimmed) return null

  const shorthand = trimmed.match(/^([A-Za-z_$][\w$]*)$/)
  if (shorthand && shorthand[1]) return shorthand[1]

  const property = trimmed.match(/^([A-Za-z_$][\w$]*)\s*:/)
  if (property && property[1]) return property[1]

  const method = trimmed.match(/^([A-Za-z_$][\w$]*)\s*\(/)
  if (method && method[1]) return method[1]

  const quoted = trimmed.match(/^["']([^"']+)["']\s*:/)
  if (quoted && quoted[1]) return quoted[1]

  return null
}

class MutableCode {
  constructor(code) {
    this.code = code
    this.map = new Array(code.length + 1)
    for (let i = 0; i <= code.length; i += 1) this.map[i] = i
  }

  toOriginalPos(pos) {
    if (pos <= 0) return 0
    if (pos >= this.map.length) return this.map[this.map.length - 1]
    return this.map[pos]
  }

  toTransformedPos(originalPos) {
    if (originalPos <= 0) return 0

    const lastIndex = this.map.length - 1
    const lastOriginalPos = this.map[lastIndex]
    if (originalPos >= lastOriginalPos) return lastIndex

    let low = 0
    let high = lastIndex
    while (low < high) {
      const mid = (low + high) >> 1
      if (this.map[mid] < originalPos) {
        low = mid + 1
      } else {
        high = mid
      }
    }

    const upper = low
    const lower = Math.max(0, upper - 1)

    if (this.map[upper] === originalPos) {
      let leftmost = upper
      while (leftmost - 1 >= 0 && this.map[leftmost - 1] === originalPos) {
        leftmost -= 1
      }
      return leftmost
    }

    const upperDistance = Math.abs(this.map[upper] - originalPos)
    const lowerDistance = Math.abs(this.map[lower] - originalPos)
    return lowerDistance <= upperDistance ? lower : upper
  }

  replaceRange(start, end, replacement, anchor, explicitMapping) {
    const safeStart = Math.max(0, start)
    const safeEnd = Math.max(safeStart, end)
    const anchorPos = anchor != null ? anchor : this.toOriginalPos(safeStart)
    const replacedOriginalSlice = this.code.slice(safeStart, safeEnd)

    const beforeCode = this.code.slice(0, safeStart)
    const afterCode = this.code.slice(safeEnd)
    this.code = beforeCode + replacement + afterCode

    const beforeMap = this.map.slice(0, safeStart)
    const afterMap = this.map.slice(safeEnd)
    const replacementMap = new Array(replacement.length)
    const originalSpanLength = Math.max(0, safeEnd - safeStart)

    if (replacement.length > 0) {
      if (Array.isArray(explicitMapping) && explicitMapping.length === replacement.length) {
        for (let i = 0; i < replacement.length; i += 1) replacementMap[i] = explicitMapping[i]
      } else if (originalSpanLength === 0) {
        for (let i = 0; i < replacement.length; i += 1) replacementMap[i] = anchorPos
      } else {
        const originalStartPos = this.toOriginalPos(safeStart)
        const alignedMap = buildAlignedReplacementMap(replacedOriginalSlice, replacement, originalStartPos)
        for (let i = 0; i < replacement.length; i += 1) replacementMap[i] = alignedMap[i]
      }
    }

    this.map = [...beforeMap, ...replacementMap, ...afterMap]
  }

  applyEdits(edits) {
    const sorted = [...edits].sort((a, b) => b.start - a.start)
    for (const edit of sorted) {
      this.replaceRange(edit.start, edit.end, edit.replacement, edit.anchor, edit.mapping)
    }
  }
}

function buildAlignedReplacementMap(originalText, replacementText, originalStartPos) {
  const result = new Array(replacementText.length)
  if (replacementText.length === 0) return result

  if (originalText.length === 0) {
    for (let i = 0; i < replacementText.length; i += 1) result[i] = originalStartPos
    return result
  }

  let originalIndex = 0
  let lastMapped = originalStartPos
  let matchedCount = 0

  for (let replacementIndex = 0; replacementIndex < replacementText.length; replacementIndex += 1) {
    const replacementChar = replacementText[replacementIndex]
    let matchedAt = -1

    for (let probe = originalIndex; probe < originalText.length; probe += 1) {
      if (originalText[probe] === replacementChar) {
        matchedAt = probe
        break
      }
    }

    if (matchedAt >= 0) {
      lastMapped = originalStartPos + matchedAt
      result[replacementIndex] = lastMapped
      originalIndex = matchedAt + 1
      matchedCount += 1
    } else {
      result[replacementIndex] = lastMapped
    }
  }

  const alignmentRatio = replacementText.length > 0 ? matchedCount / replacementText.length : 1
  if (alignmentRatio < 0.3) {
    return buildProportionalReplacementMap(originalText.length, replacementText.length, originalStartPos)
  }

  return result
}

function buildProportionalReplacementMap(originalLength, replacementLength, originalStartPos) {
  const result = new Array(replacementLength)
  if (replacementLength === 0) return result

  if (originalLength <= 1 || replacementLength <= 1) {
    for (let i = 0; i < replacementLength; i += 1) result[i] = originalStartPos
    return result
  }

  const originalSpanMax = originalLength - 1
  const replacementSpanMax = replacementLength - 1

  for (let i = 0; i < replacementLength; i += 1) {
    const offset = Math.floor((i * originalSpanMax) / replacementSpanMax)
    result[i] = originalStartPos + offset
  }

  return result
}

function isIdentifierBoundaryChar(ch) {
  if (typeof ch !== 'string' || ch.length === 0) return true
  return !/[A-Za-z0-9_$]/.test(ch)
}

/**
 * Build a precise per-character position mapping for a replacement of the form
 * `<syntheticPrefix><identifier>` where the identifier chars map 1:1 to the
 * original identifier (starting at `originalIdentStart`) and any synthetic
 * prefix chars (e.g. "æ" or "const " or "let ") map to `prefixAnchor`.
 *
 * @param {string} syntheticPrefix - Text before the identifier in replacement (e.g. "const æ" or "æ")
 * @param {string} identifierName  - The identifier characters in the replacement
 * @param {string} suffix          - Text after the identifier (e.g. " =" or "()"); mapped to `suffixAnchor`
 * @param {number} prefixAnchor    - Original position that all synthetic prefix chars map to
 * @param {number} originalIdentStart - Original position of the first char of the identifier
 * @param {number} suffixAnchor    - Original position that all suffix chars map to
 * @returns {number[]}
 */
function buildPrefixedIdentifierMapping(syntheticPrefix, identifierName, suffix, prefixAnchor, originalIdentStart, suffixAnchor) {
  const mapping = []
  for (let i = 0; i < syntheticPrefix.length; i += 1) mapping.push(prefixAnchor)
  for (let i = 0; i < identifierName.length; i += 1) mapping.push(originalIdentStart + i)
  for (let i = 0; i < suffix.length; i += 1) mapping.push(suffixAnchor)
  return mapping
}

function collapseHiddenHelperMappings(state) {
  if (!state || typeof state.code !== 'string' || !Array.isArray(state.map) || state.map.length === 0) return

  const helperNames = [GETTER_ACCESS_HELPER, DESTRUCTURE_HELPER, ABSORB_HELPER]
  const code = state.code

  for (const helperName of helperNames) {
    let index = code.indexOf(helperName)
    while (index >= 0) {
      const start = index
      const end = index + helperName.length
      const before = start > 0 ? code[start - 1] : ''
      const after = end < code.length ? code[end] : ''
      const bounded = isIdentifierBoundaryChar(before) && isIdentifierBoundaryChar(after)

      if (bounded) {
        const anchor = state.map[start] != null ? state.map[start] : (start > 0 ? state.map[start - 1] : 0)
        for (let pos = start; pos < end; pos += 1) {
          state.map[pos] = anchor
        }

        let cursor = end
        while (cursor < code.length && /\s/.test(code[cursor])) cursor += 1
        if (cursor < code.length && code[cursor] === '(') {
          const closeParenIndex = findMatchingParen(code, cursor)
          if (closeParenIndex > cursor) {
            const firstCommaIndex = findTopLevelCommaInParens(code, cursor, closeParenIndex)
            if (firstCommaIndex > cursor) {
              for (let pos = firstCommaIndex; pos <= closeParenIndex; pos += 1) {
                state.map[pos] = anchor
              }
            }
          }
        }
      }

      index = code.indexOf(helperName, index + 1)
    }
  }
}

function ensureNamedImportFromModule(state, importName, module='ruescript') {
  const namedImportRegex = new RegExp(`import\s*\{([^}]*)\}\s*from\s*['"]@rue\/${module}['"]`, 'm')
  const match = state.code.match(namedImportRegex)

  if (match) {
    const full = match[0]
    const named = match[1] || ''
    const importNameRegex = new RegExp(`(^|\\s|,)${escapeRegExp(importName)}(\\s|,|$)`)
    if (importNameRegex.test(named)) return

    const insertionPoint = full.lastIndexOf('}')
    if (insertionPoint < 0) return

    const absoluteStart = (match.index || 0) + insertionPoint
    const prefix = named.trim().length === 0 ? '' : ', '
    state.replaceRange(absoluteStart, absoluteStart, `${prefix}${importName}`, state.toOriginalPos(absoluteStart))
    return
  }

  state.replaceRange(0, 0, `import { ${importName} } from "@rue/${module}"\n`, 0)
}

function rewriteGetterAccessSugar(state) {
  const identStart = '[A-Za-z_$æπ]'
  const identBody = '[\\w$æπ]*'
  const exprPrefix = `(${identStart}${identBody}(?:\\([^\\n\\r)]*\\)|\\[[^\\n\\r\\]]*\\]|\\.${identStart}${identBody})*)`
  const prop = `(${identStart}${identBody})`
  const dotChainPropertyRegex = new RegExp(`(${identStart}${identBody}(?:\\.${identStart}${identBody}@?)*)\\.${prop}@`, 'g')
  const callResultPropertyRegex = new RegExp(`(${identStart}${identBody}\\([^\\n\\r]*\\))\\.${prop}@`, 'g')
  const optionalPropertyRegex = new RegExp(`${exprPrefix}\\?\\.${prop}@`, 'g')

  let helperUsed = false

  function collectEdits(regex, makeReplacement) {
    const edits = []
    for (const match of state.code.matchAll(regex)) {
      const full = match[0]
      const targetExpr = match[1]
      const key = match[2]
      if (!full || !targetExpr || !key) continue

      const start = match.index || 0
      const end = start + full.length
      if (isLikelyAssignmentTarget(state.code, end)) continue

      edits.push({
        start,
        end,
        replacement: makeReplacement(targetExpr, key),
        anchor: state.toOriginalPos(start),
      })
    }

    if (edits.length > 0) {
      helperUsed = true
      state.applyEdits(edits)
      return true
    }

    return false
  }

  function buildDotChainPropertyReplacement(receiverExpr, key) {
    const parts = receiverExpr.split('.')
    const root = parts[0] || ''
    const segments = parts.slice(1)

    const leftParts = [root]
    let helperReceiver = root

    for (const segment of segments) {
      const markedMatch = segment.match(/^([A-Za-z_$æπ][\\w$æπ]*)@$/)
      if (markedMatch && markedMatch[1]) {
        const markedName = markedMatch[1]
        leftParts.push(`${IDENTIFIER_PREFIX}${markedName}`)
        helperReceiver = `${GETTER_ACCESS_HELPER}(${helperReceiver}, '${markedName}')`
        continue
      }

      leftParts.push(segment)
      helperReceiver = `${helperReceiver}.${segment}`
    }

    leftParts.push(`${IDENTIFIER_PREFIX}${key}`)
    return `(${leftParts.join('.')}, ${GETTER_ACCESS_HELPER}(${helperReceiver}, '${key}'))`
  }

  let changed = false
  let iteration = 0
  do {
    changed = false
    iteration += 1

    if (collectEdits(optionalPropertyRegex, (targetExpr, key) => `${targetExpr} == null ? undefined : ${GETTER_ACCESS_HELPER}(${targetExpr}, '${key}')`)) {
      changed = true
    }
    if (collectEdits(callResultPropertyRegex, (targetExpr, key) => `${GETTER_ACCESS_HELPER}(${targetExpr}, '${key}')`)) {
      changed = true
    }
    if (collectEdits(dotChainPropertyRegex, (targetExpr, key) => buildDotChainPropertyReplacement(targetExpr, key))) {
      changed = true
    }
  } while (changed && iteration < 8)

  if (helperUsed) {
    ensureNamedImportFromModule(state, GETTER_ACCESS_HELPER)
  }
}

function rewriteDestructuredBindings(state, getVars) {
  const declarationRegex = /(^|\n)([ \t]*)(const|let|var|get)\s*\{([^{}]*)\}\s*=\s*([^;\n]+)(;?)/g
  const edits = []
  let shouldImport = false

  for (const match of state.code.matchAll(declarationRegex)) {
    const lineStart = match[1] || ''
    const indent = match[2] || ''
    const declKind = match[3]
    const patternBody = match[4] || ''
    const rhs = match[5] || ''
    const semi = match[6] || ''

    if (!declKind || !rhs) continue

    // Compute absolute start of this declaration (skip lineStart newline)
    const absoluteStart = (match.index || 0) + lineStart.length
    // The matched text without the leading newline
    const matchedText = match[0].slice(lineStart.length)

    // Find the offset of patternBody within matchedText (after `declKind\s*{`)
    const patternBodyOffsetInMatch = matchedText.indexOf(patternBody)

    const properties = splitTopLevelCommaList(patternBody)
    const bindingEntries = []
    const keyEntries = []
    // Each binding entry gets a mapping: array of [name, originalPos] for precise æ-prefix mapping
    // We track: for each output binding token, the original absolute position of its identifier start
    const bindingMappingData = [] // { name: string, originalIdentAbsPos: number, isTransformed: boolean }
    let changed = false

    // Track cursor within patternBody to find each property's position
    let patternCursor = 0

    for (const property of properties) {
      const trimmed = property.trim()
      // Find this property's position within patternBody
      const propOffsetInPattern = patternBody.indexOf(property, patternCursor)
      patternCursor = propOffsetInPattern + property.length

      if (!trimmed) continue

      // Absolute position of the trimmed identifier start in the original code
      const trimOffset = property.indexOf(trimmed)
      const propAbsoluteStart = absoluteStart + (patternBodyOffsetInMatch >= 0 ? patternBodyOffsetInMatch : 0) + (propOffsetInPattern >= 0 ? propOffsetInPattern : 0) + trimOffset
      const originalIdentAbsPos = state.toOriginalPos(propAbsoluteStart)

      const getterMarked = trimmed.match(/^([A-Za-z_$][\w$]*)@$/)
      const plainIdentifier = trimmed.match(/^([A-Za-z_$][\w$]*)$/)

      if (getterMarked && getterMarked[1]) {
        const name = getterMarked[1]
        getVars.add(name)
        bindingEntries.push(`${IDENTIFIER_PREFIX}${name}`)
        keyEntries.push(`'${IDENTIFIER_PREFIX}${name}'`)
        bindingMappingData.push({ name, originalIdentAbsPos, isTransformed: true })
        changed = true
        continue
      }

      if (declKind === 'get' && plainIdentifier && plainIdentifier[1]) {
        const name = plainIdentifier[1]
        getVars.add(name)
        bindingEntries.push(`${IDENTIFIER_PREFIX}${name}`)
        keyEntries.push(`'${IDENTIFIER_PREFIX}${name}'`)
        bindingMappingData.push({ name, originalIdentAbsPos, isTransformed: true })
        changed = true
        continue
      }

      bindingEntries.push(trimmed)
      bindingMappingData.push({ name: trimmed, originalIdentAbsPos, isTransformed: false })

      const aliasMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s*:/)
      const keyName = aliasMatch && aliasMatch[1]
        ? aliasMatch[1]
        : plainIdentifier && plainIdentifier[1]
          ? plainIdentifier[1]
          : null
      if (keyName) keyEntries.push(`'${keyName}'`)
    }

    if (!changed) continue

    // Build replacement string
    const replacement = `const { ${bindingEntries.join(', ')} } = ${DESTRUCTURE_HELPER}(${rhs}, ${keyEntries.join(', ')})${semi || ';'}`

    // Build explicit character mapping for the replacement
    // Anchor for structural parts (keywords, helpers, synthetic args) = start of the declaration
    const anchor = state.toOriginalPos(absoluteStart)
    // Find offset of rhs in matchedText to compute original rhs position
    const rhsOffsetInMatch = matchedText.lastIndexOf(rhs)
    const originalRhsAbsPos = rhsOffsetInMatch >= 0 ? state.toOriginalPos(absoluteStart + rhsOffsetInMatch) : anchor

    // Build explicit mapping character by character
    const mapping = []

    // Helper to push `count` copies of `pos`
    function pushN(pos, count) { for (let i = 0; i < count; i += 1) mapping.push(pos) }

    // `const { ` prefix (8 chars)
    pushN(anchor, 'const { '.length)

    // For each binding entry, separated by `, `
    for (let bi = 0; bi < bindingEntries.length; bi += 1) {
      if (bi > 0) pushN(anchor, ', '.length)
      const token = bindingEntries[bi]
      const data = bindingMappingData[bi]
      if (data && data.isTransformed) {
        // `æ` prefix -> invisible (maps to identifier start), then identifier chars 1:1
        pushN(data.originalIdentAbsPos, IDENTIFIER_PREFIX.length)
        for (let ci = 0; ci < data.name.length; ci += 1) mapping.push(data.originalIdentAbsPos + ci)
      } else {
        // Untransformed binding: map each char to its original position
        for (let ci = 0; ci < token.length; ci += 1) mapping.push(data ? data.originalIdentAbsPos + ci : anchor)
      }
    }

    // ` } = destructureØ(` -> anchor (synthetic)
    const midPart = ` } = ${DESTRUCTURE_HELPER}(`
    pushN(anchor, midPart.length)

    // rhs chars: map each char to original rhs position
    for (let ci = 0; ci < rhs.length; ci += 1) mapping.push(originalRhsAbsPos + ci)

    // synthetic args `, 'ækey', ...` and closing `)` and semi -> anchor
    const syntheticTail = `, ${keyEntries.join(', ')})${semi || ';'}`
    pushN(anchor, syntheticTail.length)

    const absoluteEnd = absoluteStart + matchedText.length

    edits.push({ start: absoluteStart, end: absoluteEnd, replacement, anchor, mapping })

    shouldImport = true
  }

  if (edits.length > 0) {
    state.applyEdits(edits)
  }

  if (shouldImport) {
    ensureNamedImportFromModule(state, DESTRUCTURE_HELPER)
  }
}

function rewriteGetAndReactiveDeclarations(state, getVars) {
  const declarationEdits = []

  // `get varname =` --> `const ævarname =`
  // pm: synthetic `const æ` maps to anchor of `get`, identifier chars map 1:1 to original identifier, ` =` maps to original ` =`
  const getDeclRegex = /(^|[^\w$])get\s+([A-Za-z_$][\w$]*)\s*(=)/gm
  for (const match of state.code.matchAll(getDeclRegex)) {
    const prefix = match[1] || ''
    const varName = match[2]
    if (!varName) continue

    getVars.add(varName)

    const fullStart = match.index || 0
    const start = fullStart + prefix.length
    // Find the identifier start: indexOf(varName) within the matched text after the prefix
    const matchedText = match[0].slice(prefix.length)
    const getKwEnd = matchedText.indexOf(varName)
    const originalIdentStart = state.toOriginalPos(start + getKwEnd)
    // The `=` is the last character of the matched text (match[3]='=')
    const end = start + matchedText.length
    const originalEqPos = state.toOriginalPos(end - 1)
    const replacement = `const ${IDENTIFIER_PREFIX}${varName} =`
    // `const æ` (7 chars) -> anchor; identifier (varName.length chars) -> 1:1; ` =` (2 chars) -> eq pos
    const syntheticPrefix = `const ${IDENTIFIER_PREFIX}`
    const mapping = buildPrefixedIdentifierMapping(
      syntheticPrefix, varName, ' =',
      state.toOriginalPos(start), originalIdentStart, originalEqPos
    )
    declarationEdits.push({ start, end, replacement, anchor: state.toOriginalPos(start), mapping })
  }

  // `const|let varname@ =` --> `const|let ævarname =`
  // pm: `const ` / `let ` maps to anchor; `æ` (prefix) maps to identifier start; identifier chars 1:1; ` =` maps to original `@ =` position
  const constLetRegex = /\b(const|let)\s+([A-Za-z_$][\w$]*)@(\s*=)/g
  for (const match of state.code.matchAll(constLetRegex)) {
    const decl = match[1]
    const varName = match[2]
    const eqPart = match[3]
    if (!decl || !varName || !eqPart) continue

    getVars.add(varName)
    const start = match.index || 0
    const end = start + match[0].length
    // Positions in original: decl keyword at `start`, identifier at `start + decl.length + 1`
    const originalDeclAnchor = state.toOriginalPos(start)
    const originalIdentStart = state.toOriginalPos(start + decl.length + 1)
    // `@` is at start + decl.length + 1 + varName.length; ` =` follows
    const originalAtPos = state.toOriginalPos(start + decl.length + 1 + varName.length) // the `@` char, dropped
    const replacement = `${decl} ${IDENTIFIER_PREFIX}${varName}${eqPart}`
    // `decl + ' ' + æ` -> anchor for decl+space, then æ also anchors to identStart;
    // then identifier chars -> 1:1; then eqPart -> original @-and-eq position
    const syntheticPrefix = `${decl} ${IDENTIFIER_PREFIX}`
    const mapping = buildPrefixedIdentifierMapping(
      syntheticPrefix, varName, eqPart,
      originalDeclAnchor, originalIdentStart, originalAtPos
    )
    declarationEdits.push({ start, end, replacement, anchor: originalDeclAnchor, mapping })
  }

  // `varname@` in param position --> `ævarname`
  // pm: `æ` -> varname start; identifier chars -> 1:1
  const reactiveParamRegex = /([\(,\{]\s*)([A-Za-z_$][\w$]*)@(?=\s*[:?,\)\}])/gm
  for (const match of state.code.matchAll(reactiveParamRegex)) {
    const full = match[0]
    const pfx = match[1] || ''
    const varName = match[2]
    if (!full || !varName) continue

    getVars.add(varName)
    const start = (match.index || 0) + pfx.length
    const end = start + varName.length + 1 // +1 for `@`
    const originalIdentStart = state.toOriginalPos(start)
    // `æ` prefix -> maps to identifier start; identifier chars -> 1:1
    const replacement = `${IDENTIFIER_PREFIX}${varName}`
    const mapping = buildPrefixedIdentifierMapping(
      IDENTIFIER_PREFIX, varName, '',
      originalIdentStart, originalIdentStart, originalIdentStart
    )
    declarationEdits.push({ start, end, replacement, anchor: originalIdentStart, mapping })
  }

  if (declarationEdits.length > 0) {
    state.applyEdits(declarationEdits)
  }
}

function rewriteObjectLiteralsWithAbsorb(state) {
  const candidateRegex = /return\s*\{|=\s*\{/g
  const edits = []
  let shouldImport = false

  /**
   * Build the text and explicit per-character mapping for an absorb replacement.
   * Returns { body, keys, bodyMapping, keysMapping } where bodyMapping/keysMapping
   * are parallel arrays of original-position values for each character in body/keys.
   *
   * @param {string} body - content between { and } of the object literal
   * @param {number} bodyAbsoluteStart - absolute position in state.code where body starts (i.e. openBraceIndex + 1)
   * @param {number} anchor - fallback anchor for synthetic characters
   */
  function buildAbsorbReplacement(body, bodyAbsoluteStart, anchor) {
    const properties = splitTopLevelCommaList(body)

    const shouldAbsorb = properties.some((property) => {
      const trimmed = property.trim()
      if (!trimmed) return false
      return /^get\s+([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/.test(trimmed)
    })

    if (!shouldAbsorb) return null

    const rewrittenEntries = [] // { text: string, mapping: number[] }
    const keyEntries = [] // string

    let propertyCursor = 0

    for (const property of properties) {
      const trimmed = property.trim()
      // Find where this property token starts within body
      const propOffsetInBody = body.indexOf(property, propertyCursor)
      propertyCursor = propOffsetInBody + property.length

      if (!trimmed) continue

      // Absolute position in state.code of the start of the trimmed property text
      const trimOffset = property.indexOf(trimmed)
      const propAbsStart = bodyAbsoluteStart + (propOffsetInBody >= 0 ? propOffsetInBody : 0) + trimOffset
      const propOriginalPos = state.toOriginalPos(propAbsStart)

      const shorthandGetterMatch = trimmed.match(/^([A-Za-z_$][\w$]*)@$/)
      if (shorthandGetterMatch && shorthandGetterMatch[1]) {
        const propName = shorthandGetterMatch[1]
        const outText = `${IDENTIFIER_PREFIX}${propName}`
        // `æ` -> propOriginalPos (invisible prefix); identifier chars -> 1:1
        const outMapping = buildPrefixedIdentifierMapping(
          IDENTIFIER_PREFIX, propName, '', propOriginalPos, propOriginalPos, propOriginalPos
        )
        rewrittenEntries.push({ text: outText, mapping: outMapping })
        keyEntries.push(`'${IDENTIFIER_PREFIX}${propName}'`)
        continue
      }

      const invalidGetPropertyMatch = trimmed.match(/^get\s+([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/)
      if (invalidGetPropertyMatch && invalidGetPropertyMatch[1] && invalidGetPropertyMatch[2]) {
        const propName = invalidGetPropertyMatch[1]
        const initializer = invalidGetPropertyMatch[2].trim()
        // `get ` prefix is 4 chars; identifier follows
        const identAbsStart = propAbsStart + 4 // skip `get `
        const identOriginalPos = state.toOriginalPos(identAbsStart)
        // Build outText as `æpropName: initializer`
        // `æ` -> invisible prefix on identOriginalPos; propName chars -> 1:1; `: ` and initializer -> map to their positions
        const colonAndInitAbsStart = identAbsStart + propName.length
        const colonOriginalPos = state.toOriginalPos(colonAndInitAbsStart)
        const colonIndex = trimmed.indexOf(':')
        const afterColon = colonIndex >= 0 ? trimmed.slice(colonIndex + 1) : ''
        const initializerLeadingWhitespace = afterColon.length - afterColon.trimStart().length
        const initializerAbsStart = propAbsStart + Math.max(0, colonIndex) + 1 + initializerLeadingWhitespace
        const outText = `${IDENTIFIER_PREFIX}${propName}: ${initializer}`
        const outMapping = []
        // æ -> identOriginalPos
        for (let i = 0; i < IDENTIFIER_PREFIX.length; i += 1) outMapping.push(identOriginalPos)
        // propName chars -> 1:1
        for (let i = 0; i < propName.length; i += 1) outMapping.push(identOriginalPos + i)
        // `: ` -> colonOriginalPos
        outMapping.push(colonOriginalPos)
        outMapping.push(colonOriginalPos)
        // initializer chars -> map each character to the corresponding original position
        for (let i = 0; i < initializer.length; i += 1) {
          outMapping.push(state.toOriginalPos(initializerAbsStart + i))
        }
        rewrittenEntries.push({ text: outText, mapping: outMapping })
        keyEntries.push(`'${IDENTIFIER_PREFIX}${propName}'`)
        continue
      }

      const getterMethodMatch = trimmed.match(/^get\s+([A-Za-z_$][\w$]*)\s*\(\s*\)\s*\{([\s\S]*)\}$/)
      if (getterMethodMatch && getterMethodMatch[1]) {
        const propName = getterMethodMatch[1]
        const bodyText = getterMethodMatch[2] || ''
        // `πæ` prefix is synthetic/invisible; `propName: function propName() { bodyText }` maps to original
        const identAbsStart = propAbsStart + 4 // skip `get `
        const identOriginalPos = state.toOriginalPos(identAbsStart)
        const outText = `${GETTER_ACCESS_HELPER}${propName}: function ${propName}() {${bodyText}}`
        const outMapping = []
        // πæ -> anchor (invisible, will be collapsed by collapseHiddenHelperMappings)
        for (let i = 0; i < GETTER_ACCESS_HELPER.length; i += 1) outMapping.push(identOriginalPos)
        // propName chars (key position) -> identOriginalPos 1:1
        for (let i = 0; i < propName.length; i += 1) outMapping.push(identOriginalPos + i)
        // `: function ` -> colonOriginalPos
        const colonOriginalPos = state.toOriginalPos(identAbsStart + propName.length)
        const interlude = `: function ${propName}() {`
        for (let i = 0; i < interlude.length; i += 1) outMapping.push(colonOriginalPos)
        // bodyText chars -> map each to original (best effort: offset within trimmed body)
        const bodyStartInTrimmed = trimmed.indexOf('{') + 1
        for (let i = 0; i < bodyText.length; i += 1) {
          const origPos = state.toOriginalPos(propAbsStart + bodyStartInTrimmed + i)
          outMapping.push(origPos)
        }
        // closing `}` -> map to closing brace in original
        const closingOrigPos = state.toOriginalPos(propAbsStart + trimmed.length - 1)
        outMapping.push(closingOrigPos)
        rewrittenEntries.push({ text: outText, mapping: outMapping })
        keyEntries.push(`'${GETTER_ACCESS_HELPER}${propName}'`)
        continue
      }

      // Plain/untransformed property: map each char to its original position
      const outMapping = []
      for (let i = 0; i < trimmed.length; i += 1) {
        outMapping.push(state.toOriginalPos(propAbsStart + i))
      }
      rewrittenEntries.push({ text: trimmed, mapping: outMapping })
      const key = extractSimpleObjectKey(trimmed)
      if (key) keyEntries.push(`'${key}'`)
    }

    return { entries: rewrittenEntries, keys: keyEntries.join(', ') }
  }

  for (const match of state.code.matchAll(candidateRegex)) {
    const tokenStart = match.index || 0
    const openBraceIndex = state.code.indexOf('{', tokenStart)
    if (openBraceIndex < 0) continue

    const closeBraceIndex = findMatchingBrace(state.code, openBraceIndex)
    if (closeBraceIndex < 0) continue

    const body = state.code.slice(openBraceIndex + 1, closeBraceIndex)
    const anchor = state.toOriginalPos(tokenStart)
    const absorb = buildAbsorbReplacement(body, openBraceIndex + 1, anchor)
    if (!absorb) continue

    // Join entries with `,\n`
    const bodyText = absorb.entries.map(e => e.text).join(',\n')
    const bodyMapping = []
    for (let ei = 0; ei < absorb.entries.length; ei += 1) {
      if (ei > 0) { bodyMapping.push(anchor); bodyMapping.push(anchor) } // `,\n`
      for (const pos of absorb.entries[ei].mapping) bodyMapping.push(pos)
    }

    const isReturn = (match[0] || '').startsWith('return')
    const prefix = isReturn ? `return ${ABSORB_HELPER}({\n` : `${ABSORB_HELPER}({\n`
    const suffix = `\n}, [${absorb.keys}])`
    const replacementText = `${prefix}${bodyText}${suffix}`

    // Build full mapping
    const fullMapping = []
    for (let i = 0; i < prefix.length; i += 1) fullMapping.push(anchor)
    for (const pos of bodyMapping) fullMapping.push(pos)
    for (let i = 0; i < suffix.length; i += 1) fullMapping.push(anchor)

    const editStart = isReturn ? tokenStart : openBraceIndex
    edits.push({
      start: editStart,
      end: closeBraceIndex + 1,
      replacement: replacementText,
      anchor,
      mapping: fullMapping,
    })

    shouldImport = true
  }

  if (edits.length > 0) {
    state.applyEdits(edits)
  }

  if (shouldImport) {
    ensureNamedImportFromModule(state, ABSORB_HELPER)
  }
}

function isWhitespaceOnly(value) {
  return value.trim().length === 0
}

function parseJsxTag(text, index) {
  if (index >= text.length || text[index] !== '<') return null

  if (text.startsWith('</>', index)) {
    return { end: index + 3, isOpening: false, isClosing: true, isFragment: true, isSelfClosing: false, name: '' }
  }

  if (text.startsWith('<>', index)) {
    return { end: index + 2, isOpening: true, isClosing: false, isFragment: true, isSelfClosing: false, name: '' }
  }

  let cursor = index + 1
  let isClosing = false
  if (text[cursor] === '/') {
    isClosing = true
    cursor += 1
  }

  const nameStart = cursor
  while (cursor < text.length && /[A-Za-z0-9_:-]/.test(text[cursor])) cursor += 1
  const name = text.slice(nameStart, cursor)
  if (!name) return null

  let inSingle = false
  let inDouble = false
  let braceDepth = 0

  while (cursor < text.length) {
    const ch = text[cursor]

    if (!inDouble && ch === '\'' && braceDepth === 0) {
      inSingle = !inSingle
      cursor += 1
      continue
    }

    if (!inSingle && ch === '"' && braceDepth === 0) {
      inDouble = !inDouble
      cursor += 1
      continue
    }

    if (!inSingle && !inDouble) {
      if (ch === '{') {
        braceDepth += 1
      } else if (ch === '}') {
        braceDepth = Math.max(0, braceDepth - 1)
      } else if (ch === '>' && braceDepth === 0) {
        const trimmedBefore = text.slice(index, cursor).trimEnd()
        const isSelfClosing = !isClosing && trimmedBefore.endsWith('/')
        return {
          end: cursor + 1,
          isOpening: !isClosing,
          isClosing,
          isFragment: false,
          isSelfClosing,
          name,
        }
      }
    }

    cursor += 1
  }

  return null
}

function hasMultipleTopLevelJsxRoots(inner) {
  const text = inner.trim()
  if (!text.startsWith('<')) return false

  let index = 0
  let rootCount = 0
  const stack = []

  while (index < text.length) {
    if (text[index] !== '<') {
      const nextTag = text.indexOf('<', index)
      const segment = text.slice(index, nextTag >= 0 ? nextTag : text.length)
      if (stack.length === 0 && !isWhitespaceOnly(segment)) return false
      if (nextTag < 0) break
      index = nextTag
      continue
    }

    const tag = parseJsxTag(text, index)
    if (!tag) return false

    if (tag.isOpening && !tag.isClosing) {
      if (stack.length === 0) rootCount += 1
      if (!tag.isSelfClosing) {
        stack.push(tag.isFragment ? '#fragment' : tag.name)
      }
    } else if (tag.isClosing) {
      if (stack.length === 0) return false
      const expected = stack.pop()
      const closingName = tag.isFragment ? '#fragment' : tag.name
      if (expected !== closingName) return false
    }

    index = tag.end
  }

  return stack.length === 0 && rootCount >= 2
}

function rewriteJsxSiblingParensToFragment(state) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.JSX, state.code)
  const openParenStarts = []
  const edits = []

  let token = scanner.scan()
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    if (token === ts.SyntaxKind.OpenParenToken) {
      openParenStarts.push(scanner.getTokenPos())
    } else if (token === ts.SyntaxKind.CloseParenToken) {
      const openPos = openParenStarts.pop()
      if (openPos != null) {
        const closeEnd = scanner.getTextPos()
        const inner = state.code.slice(openPos + 1, closeEnd - 1)
        if (hasMultipleTopLevelJsxRoots(inner)) {
          const openAnchor = state.toOriginalPos(openPos)
          const closeAnchor = state.toOriginalPos(closeEnd - 1)
          const mapping = []

          mapping.push(openAnchor)
          mapping.push(openAnchor)

          for (let i = 0; i < inner.length; i += 1) {
            mapping.push(state.toOriginalPos(openPos + 1 + i))
          }

          mapping.push(closeAnchor)
          mapping.push(closeAnchor)
          mapping.push(closeAnchor)

          edits.push({
            start: openPos,
            end: closeEnd,
            replacement: `<>${inner}</>`,
            anchor: openAnchor,
            mapping,
          })
        }
      }
    }

    token = scanner.scan()
  }

  if (edits.length > 0) {
    state.applyEdits(edits)
  }
}

function isDeclarationName(node) {
  const parent = node.parent
  if (!parent) return false
  if (ts.isVariableDeclaration(parent) && parent.name === node) return true
  if (ts.isParameter(parent) && parent.name === node) return true
  if (ts.isFunctionDeclaration(parent) && parent.name === node) return true
  if (ts.isMethodDeclaration(parent) && parent.name === node) return true
  if (ts.isClassDeclaration(parent) && parent.name === node) return true
  if (ts.isInterfaceDeclaration(parent) && parent.name === node) return true
  if (ts.isTypeAliasDeclaration(parent) && parent.name === node) return true
  if (ts.isImportClause(parent) && parent.name === node) return true
  if (ts.isImportSpecifier(parent) && (parent.name === node || parent.propertyName === node)) return true
  if (ts.isExportSpecifier(parent) && (parent.name === node || parent.propertyName === node)) return true
  if (ts.isBindingElement(parent) && parent.name === node) return true
  return false
}

function isPropertyNamePosition(node) {
  const parent = node.parent
  if (!parent) return false
  if (ts.isPropertyAssignment(parent) && parent.name === node) return true
  if (ts.isPropertySignature(parent) && parent.name === node) return true
  if (ts.isShorthandPropertyAssignment(parent) && parent.name === node) return true
  if (ts.isPropertyDeclaration(parent) && parent.name === node) return true
  if (ts.isGetAccessorDeclaration(parent) && parent.name === node) return true
  if (ts.isSetAccessorDeclaration(parent) && parent.name === node) return true
  if (ts.isMethodSignature(parent) && parent.name === node) return true
  if (ts.isMethodDeclaration(parent) && parent.name === node) return true
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return true
  return false
}

function collectBindingNames(nameNode, targetSet) {
  if (!nameNode) return
  if (ts.isIdentifier(nameNode)) {
    targetSet.add(nameNode.text)
    return
  }
  if (ts.isObjectBindingPattern(nameNode) || ts.isArrayBindingPattern(nameNode)) {
    for (const element of nameNode.elements) {
      if (ts.isBindingElement(element)) {
        collectBindingNames(element.name, targetSet)
      }
    }
  }
}

function collectScopeDeclarations(scopeNode) {
  const names = new Set()

  if (ts.isFunctionLike(scopeNode)) {
    for (const parameter of scopeNode.parameters) {
      collectBindingNames(parameter.name, names)
    }
  }

  if (ts.isFunctionDeclaration(scopeNode) && scopeNode.name) {
    names.add(scopeNode.name.text)
  }

  function collectFromNode(node) {
    if (ts.isVariableDeclaration(node)) {
      collectBindingNames(node.name, names)
      return
    }
    if (ts.isFunctionDeclaration(node) && node.name) {
      names.add(node.name.text)
      return
    }
    if (ts.isClassDeclaration(node) && node.name) {
      names.add(node.name.text)
      return
    }

    ts.forEachChild(node, collectFromNode)
  }

  if (ts.isSourceFile(scopeNode) || ts.isBlock(scopeNode) || ts.isModuleBlock(scopeNode)) {
    for (const statement of scopeNode.statements) {
      collectFromNode(statement)
    }
  }

  return names
}

function createsScope(node) {
  return ts.isSourceFile(node) || ts.isBlock(node) || ts.isFunctionLike(node) || ts.isModuleBlock(node)
}

function classifyGetVarUsage(node, getVars) {
  if (!getVars.has(node.text)) return null
  if (isDeclarationName(node) || isPropertyNamePosition(node)) return null

  const parent = node.parent
  if (!parent) return null

  if (ts.isPropertyAccessExpression(parent) && parent.expression === node) return 'member-root'
  if (ts.isElementAccessExpression(parent) && parent.expression === node) return 'member-root'
  if (ts.isCallExpression(parent) && parent.expression === node) return 'call-root'

  return 'read'
}

function expressionReferencesIdentifier(expression, identifierName) {
  let found = false

  function visit(node) {
    if (found || !node) return
    if (ts.isIdentifier(node) && node.text === identifierName) {
      if (!isDeclarationName(node) && !isPropertyNamePosition(node)) {
        found = true
        return
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(expression)
  return found
}

// TODO: check comma expression logic
// NOTE: (from agent) isDerivationShorthand always returned false 
// — ts.isParenthesizedExpression(e) && isCommaExpression(e) was 
// a logical impossibility (a ParenthesizedExpression can never be 
// a BinaryExpression). Fixed to simply ts.isParenthesizedExpression(e). 
// The sequence-expression exclusion is already handled inside rewriteParenthesized.
//
// function isDerivationShorthand(expression) {
//    return ts.isParenthesizedExpression(expression) && isCommaExpression(expression)
// }

// function isCommaExpression(expression){
//    return ts.isBinaryExpression(expression) && expression.operatorToken === ts.SyntaxKind.CommaToken
// }


function isDerivationShorthand(expression) {
   return ts.isParenthesizedExpression(expression)
}

function conditionImpliesIdentifierTruthy(expression, identifierName, whenConditionTruthy) {
  if (!expression) return false

  if (isDerivationShorthand(expression)) {
    return conditionImpliesIdentifierTruthy(expression.expression, identifierName, whenConditionTruthy)
  }

  if (ts.isPrefixUnaryExpression(expression) && expression.operator === ts.SyntaxKind.ExclamationToken) {
    return conditionImpliesIdentifierTruthy(expression.operand, identifierName, !whenConditionTruthy)
  }


  // Recognize both direct identifier and getter access (æobj or obj@) as guards
  if (ts.isIdentifier(expression)) {
    if (expression.text === identifierName) return whenConditionTruthy;
    // Also match æ-prefixed identifier (for obj@ rewritten to æobj)
    if (expression.text === `æ${identifierName}`) return whenConditionTruthy;
  }

  if (ts.isBinaryExpression(expression)) {
    const op = expression.operatorToken.kind
    const left = expression.left
    const right = expression.right

    const isIdentifierOperand = (operand) => ts.isIdentifier(operand) && operand.text === identifierName
    const isNullOrUndefinedOperand = (operand) => {
      if (operand.kind === ts.SyntaxKind.NullKeyword) return true
      if (ts.isIdentifier(operand) && operand.text === 'undefined') return true
      return false
    }

    const comparisonInvolvesTargetAndNullish = (
      (isIdentifierOperand(left) && isNullOrUndefinedOperand(right))
      || (isIdentifierOperand(right) && isNullOrUndefinedOperand(left))
    )

    if (comparisonInvolvesTargetAndNullish) {
      if (op === ts.SyntaxKind.ExclamationEqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsToken) {
        return whenConditionTruthy
      }
      if (op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.EqualsEqualsToken) {
        return !whenConditionTruthy
      }
    }
  }

  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    if (!whenConditionTruthy) return false
    return (
      conditionImpliesIdentifierTruthy(expression.left, identifierName, true)
      || conditionImpliesIdentifierTruthy(expression.right, identifierName, true)
      || expressionReferencesIdentifier(expression, identifierName)
    )
  }

  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    if (whenConditionTruthy) {
      return (
        conditionImpliesIdentifierTruthy(expression.left, identifierName, true)
        || conditionImpliesIdentifierTruthy(expression.right, identifierName, true)
      )
    }
    return false
  }

  return whenConditionTruthy && expressionReferencesIdentifier(expression, identifierName)
}

function getIdentifierCallName(expression) {
  if (ts.isIdentifier(expression)) return expression.text
  return null
}

function isTemplateConditionalCallName(name) {
  return name === 'If' || name === 'ElseIf' || name === 'Else' || name === 'IfElse'
}

function isWhitespaceJsxText(node) {
  return ts.isJsxText(node) && !node.getText().trim()
}

function getConditionalCallFromJsxChild(node) {
  if (!ts.isJsxExpression(node) || !node.expression) return null
  if (!ts.isCallExpression(node.expression)) return null
  const callName = getIdentifierCallName(node.expression.expression)
  if (!callName || !isTemplateConditionalCallName(callName)) return null
  return {
    name: callName,
    call: node.expression,
  }
}

function inferElseChainTruthyGuard(callExpression, identifierName) {
  const parentJsxExpression = callExpression.parent
  if (!ts.isJsxExpression(parentJsxExpression)) return false

  const jsxContainer = parentJsxExpression.parent
  if (!jsxContainer || (!ts.isJsxElement(jsxContainer) && !ts.isJsxFragment(jsxContainer))) return false

  const children = jsxContainer.children || []
  const selfIndex = children.indexOf(parentJsxExpression)
  if (selfIndex <= 0) return false

  const precedingConditions = []
  for (let index = selfIndex - 1; index >= 0; index -= 1) {
    const child = children[index]
    if (isWhitespaceJsxText(child)) continue

    const conditionalCall = getConditionalCallFromJsxChild(child)
    if (!conditionalCall) break
    if (conditionalCall.name === 'Else') break
    if (conditionalCall.name === 'If' || conditionalCall.name === 'ElseIf') {
      const condition = conditionalCall.call.arguments[0]
      if (condition) precedingConditions.push(condition)
      continue
    }
    break
  }

  if (precedingConditions.length === 0) return false
  return precedingConditions.some((condition) => conditionImpliesIdentifierTruthy(condition, identifierName, false))
}

function inferTruthyGuardFromTemplateConditionalCall(callExpression, argumentNode, identifierName) {
  const callName = getIdentifierCallName(callExpression.expression)
  if (!callName || !isTemplateConditionalCallName(callName)) return false

  const argumentIndex = callExpression.arguments.findIndex((argument) => argument === argumentNode)
  if (argumentIndex < 0) return false

  const lastArgumentIndex = callExpression.arguments.length - 1

  if (callName === 'If' || callName === 'ElseIf') {
    if (argumentIndex !== lastArgumentIndex) return false
    const condition = callExpression.arguments[0]
    return conditionImpliesIdentifierTruthy(condition, identifierName, true)
  }

  if (callName === 'Else') {
    if (argumentIndex !== lastArgumentIndex) return false
    return inferElseChainTruthyGuard(callExpression, identifierName)
  }

  if (callName === 'IfElse') {
    if (argumentIndex !== 1) return false
    const condition = callExpression.arguments[0]
    return conditionImpliesIdentifierTruthy(condition, identifierName, true)
  }

  return false
}

function hasSynchronousTruthyGuard(node, identifierName) {
  if (!node || !node.parent) return false

  let current = node
  while (current && current.parent) {
    const parent = current.parent

    // 1. Render function branch: If(obj, () => ...)
    if (ts.isFunctionLike(parent) && parent.body && current === parent.body) {
      const callExpression = parent.parent
      if (ts.isCallExpression(callExpression)) {
        const guardedRenderFunctionScope = inferTruthyGuardFromTemplateConditionalCall(callExpression, parent, identifierName)
        if (guardedRenderFunctionScope) return true
      }
      return false
    }

    // 2. Direct JSX element branch: If(obj, <div>...</div>)
    if (ts.isCallExpression(parent)) {
      // Check if current is the last argument and is a JSX element or fragment
      const callName = getIdentifierCallName(parent.expression)
      if (callName && isTemplateConditionalCallName(callName)) {
        const argIndex = parent.arguments.findIndex(arg => arg === current)
        const lastArgIndex = parent.arguments.length - 1
        if (argIndex === lastArgIndex && (ts.isJsxElement(current) || ts.isJsxFragment(current))) {
          // Synthesize a guard as if this were a render function
          const condition = parent.arguments[0]
          if (conditionImpliesIdentifierTruthy(condition, identifierName, true)) return true
        }
      }
      // Fallback: original logic for render function
      const templateGuard = inferTruthyGuardFromTemplateConditionalCall(parent, current, identifierName)
      if (templateGuard) return true
    }

    if (ts.isIfStatement(parent)) {
      if (current === parent.thenStatement) {
        return conditionImpliesIdentifierTruthy(parent.expression, identifierName, true)
      }
      if (current === parent.elseStatement) {
        return conditionImpliesIdentifierTruthy(parent.expression, identifierName, false)
      }
    }

    if (ts.isConditionalExpression(parent)) {
      if (current === parent.whenTrue) {
        return conditionImpliesIdentifierTruthy(parent.condition, identifierName, true)
      }
      if (current === parent.whenFalse) {
        return conditionImpliesIdentifierTruthy(parent.condition, identifierName, false)
      }
    }

    if (
      ts.isBinaryExpression(parent)
      && parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
      && current === parent.right
    ) {
      return conditionImpliesIdentifierTruthy(parent.left, identifierName, true)
    }

    if (ts.isWhileStatement(parent) && current === parent.statement) {
      return conditionImpliesIdentifierTruthy(parent.expression, identifierName, true)
    }

    if (ts.isDoStatement(parent) && current === parent.statement) {
      return conditionImpliesIdentifierTruthy(parent.expression, identifierName, true)
    }

    if (ts.isForStatement(parent) && current === parent.statement && parent.condition) {
      return conditionImpliesIdentifierTruthy(parent.condition, identifierName, true)
    }

    current = parent
  }

  return false
}

function rewriteReactiveReads(state, getVars) {
  if (getVars.size === 0) return

  const sourceFile = ts.createSourceFile('virtual.tsx', state.code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []
  const scopeStack = []

  function isShadowed(name) {
    for (let i = scopeStack.length - 1; i >= 0; i -= 1) {
      if (scopeStack[i].has(name)) return true
    }
    return false
  }


  function visit(node, jsxGuardContext) {
    let pushedScope = false
    if (createsScope(node)) {
      scopeStack.push(collectScopeDeclarations(node))
      pushedScope = true
    }

    // If this is a JSXElement/JSXFragment or JsxExpression wrapping one, as argument to If/ElseIf, treat as guarded context
    let nextJsxGuardContext = jsxGuardContext
    // Handle JsxExpression wrapping JSXElement/JSXFragment
    if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.expression) || ts.isJsxFragment(node.expression))) {
      const parent = node.parent
      if (parent && ts.isCallExpression(parent)) {
        const callExpr = parent
        const callName = getIdentifierCallName(callExpr.expression)
        if (callName && isTemplateConditionalCallName(callName)) {
          const argIndex = callExpr.arguments.findIndex(arg => arg === node)
          const lastArgIndex = callExpr.arguments.length - 1
          if (argIndex === lastArgIndex) {
            nextJsxGuardContext = callExpr.arguments[0]
          }
        }
      }
    } else if ((ts.isJsxElement(node) || ts.isJsxFragment(node)) && node.parent && ts.isCallExpression(node.parent)) {
      const callExpr = node.parent
      const callName = getIdentifierCallName(callExpr.expression)
      if (callName && isTemplateConditionalCallName(callName)) {
        const argIndex = callExpr.arguments.findIndex(arg => arg === node)
        const lastArgIndex = callExpr.arguments.length - 1
        if (argIndex === lastArgIndex) {
          // Synthesize a guard context for this JSX branch
          nextJsxGuardContext = callExpr.arguments[0]
        }
      }
    } else if (ts.isArrowFunction(node) && node.parent && ts.isCallExpression(node.parent)) {
      // Handle render function case: If(obj, () => <div>{obj.name}</div>)
      const callExpr = node.parent;
      const callName = getIdentifierCallName(callExpr.expression);
      if (callName && isTemplateConditionalCallName(callName)) {
        // The first argument is the guard
        nextJsxGuardContext = callExpr.arguments[0];
      }
    }

    // If in a guarded JSX branch, propagate guard context to JSX children and derivation shorthand
    if (nextJsxGuardContext && (ts.isJsxElement(node) || ts.isJsxFragment(node))) {
      // Visit children with guard context
      if (node.children) {
        for (const child of node.children) {
          // For JsxExpression children, propagate guard context
          if (ts.isJsxExpression(child) && child.expression) {
            // If child is a parenthesized expression (derivation shorthand), propagate guard context into it
            if (isDerivationShorthand(child.expression)) {
              // Simulate the transform: parenthesized expression becomes () => expr
              // Visit the body of the arrow function with the guard context
              visit(child.expression.expression, nextJsxGuardContext)
            } else {
              visit(child.expression, nextJsxGuardContext)
            }
          } else {
            visit(child, nextJsxGuardContext)
          }
        }
        // Do not double-visit children below
        if (pushedScope) {
          scopeStack.pop()
        }
        return
      }
    }

    if (ts.isIdentifier(node)) {
      if (ts.isJsxAttribute(node.parent) || ts.isJsxOpeningElement(node.parent) || ts.isJsxClosingElement(node.parent)) return;
      const usage = classifyGetVarUsage(node, getVars)
      if (usage && !isShadowed(node.text)) {
        const start = node.getStart(sourceFile)
        const end = node.getEnd()
        const originalIdentStart = state.toOriginalPos(start)
        // If in a guarded JSX branch, treat as guarded
        let shouldAssertNonNull = hasSynchronousTruthyGuard(node, node.text)
        let shouldUseOptionalChaining = false;
        // If the guard is a getter access (If(obj@, ...)), use optional chaining
        if (nextJsxGuardContext) {
          // If the guard is a call to the getter (æobj())
          if (ts.isCallExpression(nextJsxGuardContext) && ts.isIdentifier(nextJsxGuardContext.expression)) {
            if (nextJsxGuardContext.expression.text === `æ${node.text}`) {
              shouldUseOptionalChaining = true;
              shouldAssertNonNull = false;
            }
          } else if (!shouldUseOptionalChaining && conditionImpliesIdentifierTruthy(nextJsxGuardContext, node.text, true)) {
            shouldAssertNonNull = true;
          }
        }
        let callSuffix = '()';
        if (shouldUseOptionalChaining) callSuffix = '()?.';
        else if (shouldAssertNonNull) callSuffix = '()!';
        if (usage === 'member-root') {
          const originalEndPos = state.toOriginalPos(end)
          let replacement;
          // Always emit optional chaining for all guarded branches
          replacement = `${IDENTIFIER_PREFIX}${node.text}${callSuffix}`;
          const mapping = buildPrefixedIdentifierMapping(
            IDENTIFIER_PREFIX, node.text, callSuffix,
            originalIdentStart, originalIdentStart, originalEndPos
          )
          edits.push({ start, end, replacement, anchor: originalIdentStart, mapping })
        } else if (usage === 'call-root') {
          const originalEndPos = state.toOriginalPos(end)
          const replacement = `${IDENTIFIER_PREFIX}${node.text}${callSuffix}`
          const mapping = buildPrefixedIdentifierMapping(
            IDENTIFIER_PREFIX, node.text, callSuffix,
            originalIdentStart, originalIdentStart, originalEndPos
          )
          edits.push({ start, end, replacement, anchor: originalIdentStart, mapping })
        } else if (usage === 'read') {
          const originalEndPos = state.toOriginalPos(end)
          const replacement = `${IDENTIFIER_PREFIX}${node.text}${callSuffix}`
          const mapping = buildPrefixedIdentifierMapping(
            IDENTIFIER_PREFIX, node.text, callSuffix,
            originalIdentStart, originalIdentStart, originalEndPos
          )
          edits.push({ start, end, replacement, anchor: originalIdentStart, mapping })
        }
      }
    }

    ts.forEachChild(node, child => visit(child, nextJsxGuardContext))

    if (pushedScope) {
      scopeStack.pop()
    }
  }

  visit(sourceFile, null)
  if (edits.length > 0) {
    state.applyEdits(edits)
  }
}

function rewriteReactiveAtAccess(state, getVars) {
  const regex = /\b([A-Za-z_$][\w$]*)@/g
  const edits = []

  for (const match of state.code.matchAll(regex)) {
    const name = match[1]
    if (!name) continue
    if (!getVars.has(name)) continue

    const start = match.index || 0
    const end = start + match[0].length
    if (isLikelyAssignmentTarget(state.code, end)) continue

    // `name@` -> `æname`: `æ` maps to name start; identifier chars map 1:1
    const originalIdentStart = state.toOriginalPos(start)
    const replacement = `${IDENTIFIER_PREFIX}${name}`
    const mapping = buildPrefixedIdentifierMapping(
      IDENTIFIER_PREFIX, name, '',
      originalIdentStart, originalIdentStart, originalIdentStart
    )
    edits.push({ start, end, replacement, anchor: originalIdentStart, mapping })
  }

  if (edits.length > 0) {
    state.applyEdits(edits)
  }
}

function rewriteParenthesizedDerivations(state, tsxLike) {
  const sourceFile = ts.createSourceFile('virtual.tsx', state.code, ts.ScriptTarget.Latest, true, tsxLike ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const edits = []

  function rewriteParenthesized(node) {
    if (!isDerivationShorthand(node)) return
    if (ts.isBinaryExpression(node.expression) && node.expression.operatorToken.kind === ts.SyntaxKind.CommaToken) return
    const start = node.getStart(sourceFile)
    const end = node.getEnd()
    edits.push({ start, end: start + 1, replacement: '() => ', anchor: state.toOriginalPos(start) })
    edits.push({ start: end - 1, end, replacement: '', anchor: state.toOriginalPos(end - 1) })
  }

  function visit(node) {
   
    if (tsxLike && ts.isJsxExpression(node) && node.expression && isDerivationShorthand(node.expression)) {
      rewriteParenthesized(node.expression)
    }

    if (ts.isCallExpression(node)) {
      for (const arg of node.arguments) {
        if (isDerivationShorthand(arg)) rewriteParenthesized(arg)
      }
    }

    if (ts.isPropertyAssignment(node) && isDerivationShorthand(node.initializer)) {
      rewriteParenthesized(node.initializer)
    }

    if (ts.isArrayLiteralExpression(node)) {
      for (const element of node.elements) {
        if (isDerivationShorthand(element)) rewriteParenthesized(element)
      }
    }

    if (ts.isVariableDeclaration(node) && node.initializer && isDerivationShorthand(node.initializer)) {
      rewriteParenthesized(node.initializer)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  if (edits.length > 0) {
    state.applyEdits(edits)
  }
}

function buildRemapTableFromMap(map, originalLength, transformedLength) {
  const safeMap = Array.isArray(map) ? map : []
  const runs = []

  if (safeMap.length === 0) {
    return {
      version: 1,
      originalLength: Math.max(0, originalLength || 0),
      transformedLength: Math.max(0, transformedLength || 0),
      runs,
    }
  }

  let runStart = 0
  while (runStart < safeMap.length) {
    const initialStep = runStart + 1 < safeMap.length
      ? safeMap[runStart + 1] - safeMap[runStart]
      : 0

    let runEnd = runStart + 1
    while (runEnd < safeMap.length - 1) {
      const nextStep = safeMap[runEnd + 1] - safeMap[runEnd]
      if (nextStep !== initialStep) break
      runEnd += 1
    }

    runs.push({
      transformedStart: runStart,
      transformedEnd: runEnd + 1,
      originalStart: safeMap[runStart],
      step: initialStep,
    })

    runStart = runEnd + 1
  }

  return {
    version: 1,
    originalLength: Math.max(0, originalLength || 0),
    transformedLength: Math.max(0, transformedLength || 0),
    runs,
  }
}

function toOriginalPosFromRemapTable(remapTable, transformedPos) {
  if (!remapTable || !Array.isArray(remapTable.runs) || remapTable.runs.length === 0) return 0

  const safePos = Math.max(0, Math.min(remapTable.transformedLength || 0, transformedPos || 0))
  let low = 0
  let high = remapTable.runs.length - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    const run = remapTable.runs[mid]
    if (safePos < run.transformedStart) {
      high = mid - 1
      continue
    }
    if (safePos >= run.transformedEnd) {
      low = mid + 1
      continue
    }

    const delta = safePos - run.transformedStart
    return run.originalStart + (delta * run.step)
  }

  return 0
}

function mapTextSpanFromRemapTable(remapTable, span) {
  if (!span) return span

  const transformedStart = Math.max(0, span.start || 0)
  const transformedLength = Math.max(0, span.length || 0)

  if (transformedLength <= 0) {
    return {
      start: toOriginalPosFromRemapTable(remapTable, transformedStart),
      length: 0,
    }
  }

  const transformedEnd = transformedStart + transformedLength
  let firstMapped = null
  let lastMapped = null

  for (let transformedPos = transformedStart; transformedPos < transformedEnd; transformedPos += 1) {
    const mappedOriginal = toOriginalPosFromRemapTable(remapTable, transformedPos)
    if (firstMapped == null) firstMapped = mappedOriginal
    lastMapped = mappedOriginal
  }

  if (firstMapped == null || lastMapped == null) {
    const start = toOriginalPosFromRemapTable(remapTable, transformedStart)
    const end = toOriginalPosFromRemapTable(remapTable, transformedEnd)
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

function buildPositionSourceMapFromRemapTable(remapTable, sourceFileName) {
  const safeTable = remapTable && Array.isArray(remapTable.runs)
    ? remapTable
    : { originalLength: 0, transformedLength: 0, runs: [] }

  return {
    version: 1,
    kind: 'rxs-position-map',
    source: typeof sourceFileName === 'string' ? sourceFileName : 'virtual.rxs',
    originalLength: Math.max(0, safeTable.originalLength || 0),
    generatedLength: Math.max(0, safeTable.transformedLength || 0),
    segments: safeTable.runs.map((run) => ({
      generatedStart: run.transformedStart,
      generatedEnd: run.transformedEnd,
      originalStart: run.originalStart,
      step: run.step,
    })),
  }
}

function toOriginalPosFromSourceMap(sourceMap, generatedPos) {
  if (!sourceMap || !Array.isArray(sourceMap.segments) || sourceMap.segments.length === 0) return 0

  const generatedLength = Math.max(0, sourceMap.generatedLength || 0)
  const safePos = Math.max(0, Math.min(generatedLength, generatedPos || 0))
  let low = 0
  let high = sourceMap.segments.length - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    const segment = sourceMap.segments[mid]
    if (safePos < segment.generatedStart) {
      high = mid - 1
      continue
    }
    if (safePos >= segment.generatedEnd) {
      low = mid + 1
      continue
    }

    const delta = safePos - segment.generatedStart
    return segment.originalStart + (delta * segment.step)
  }

  return 0
}

function toTransformedPosFromSourceMap(sourceMap, originalPos) {
  if (!sourceMap || !Array.isArray(sourceMap.segments) || sourceMap.segments.length === 0) return 0

  const originalLength = Math.max(0, sourceMap.originalLength || 0)
  const safeOriginalPos = Math.max(0, Math.min(originalLength, originalPos || 0))

  let bestGeneratedPos = 0
  let bestDistance = Number.POSITIVE_INFINITY
  let bestUsesSyntheticSegment = true

  for (const segment of sourceMap.segments) {
    if (!segment || typeof segment.generatedStart !== 'number' || typeof segment.generatedEnd !== 'number') continue

    const generatedStart = Math.max(0, segment.generatedStart)
    const generatedEnd = Math.max(generatedStart, segment.generatedEnd)
    const generatedLength = generatedEnd - generatedStart
    if (generatedLength <= 0) continue

    const step = typeof segment.step === 'number' ? segment.step : 0
    const usesSyntheticSegment = step === 0
    const originalStart = typeof segment.originalStart === 'number' ? segment.originalStart : 0

    let candidateGeneratedPos = generatedStart
    let candidateOriginalPos = originalStart

    if (step > 0) {
      const maxDelta = generatedLength - 1
      const originalEnd = originalStart + (maxDelta * step)

      if (safeOriginalPos <= originalStart) {
        candidateGeneratedPos = generatedStart
        candidateOriginalPos = originalStart
      } else if (safeOriginalPos >= originalEnd) {
        candidateGeneratedPos = generatedEnd - 1
        candidateOriginalPos = originalEnd
      } else {
        const rawDelta = Math.round((safeOriginalPos - originalStart) / step)
        const clampedDelta = Math.max(0, Math.min(maxDelta, rawDelta))
        candidateGeneratedPos = generatedStart + clampedDelta
        candidateOriginalPos = originalStart + (clampedDelta * step)
      }
    }

    const distance = Math.abs(candidateOriginalPos - safeOriginalPos)
    if (
      distance < bestDistance
      || (distance === bestDistance && bestUsesSyntheticSegment && !usesSyntheticSegment)
      || (distance === bestDistance && bestUsesSyntheticSegment === usesSyntheticSegment && candidateGeneratedPos < bestGeneratedPos)
    ) {
      bestDistance = distance
      bestGeneratedPos = candidateGeneratedPos
      bestUsesSyntheticSegment = usesSyntheticSegment
      if (distance === 0 && !usesSyntheticSegment) break
    }
  }

  return bestGeneratedPos
}

function mapTextSpanFromSourceMap(sourceMap, span) {
  if (!span) return span

  const generatedStart = Math.max(0, span.start || 0)
  const generatedLength = Math.max(0, span.length || 0)

  if (generatedLength <= 0) {
    return {
      start: toOriginalPosFromSourceMap(sourceMap, generatedStart),
      length: 0,
    }
  }

  const generatedEnd = generatedStart + generatedLength
  let firstMapped = null
  let lastMapped = null

  for (let generatedPos = generatedStart; generatedPos < generatedEnd; generatedPos += 1) {
    const mappedOriginal = toOriginalPosFromSourceMap(sourceMap, generatedPos)
    if (firstMapped == null) firstMapped = mappedOriginal
    lastMapped = mappedOriginal
  }

  if (firstMapped == null || lastMapped == null) {
    const start = toOriginalPosFromSourceMap(sourceMap, generatedStart)
    const end = toOriginalPosFromSourceMap(sourceMap, generatedEnd)
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

function isTsxLike(fileName) {
  return fileName.endsWith('.rxs')  || fileName.endsWith('.tsx') || fileName.endsWith('.jsx')
}

/**
 * Collect semantic token positions from the original (untransformed) source.
 *
 * Each token is `{ type, start, length }` where `start` is a character offset
 * into the original code.
 *
 * Token types:
 *   - `'keyword'`  — the `get` word in a `get varname =` declaration
 *   - `'operator'` — every `@` marker attached to an identifier
 *
 * @param {string} code
 * @returns {{ type: 'keyword' | 'operator', start: number, length: number }[]}
 */
function collectSugarTokens(code) {
  const tokens = []

  // `get varname =` declarations — mark the `get` word as a keyword.
  // Uses the same pattern as rewriteGetAndReactiveDeclarations.
  const getDeclRegex = /(^|[^\w$])get\s+([A-Za-z_$][\w$]*)\s*=/gm
  for (const match of code.matchAll(getDeclRegex)) {
    const prefix = match[1] || ''
    const getStart = (match.index || 0) + prefix.length
    tokens.push({ type: 'keyword', start: getStart, length: 3 })
  }

  // Every `identifier@` — mark the trailing `@` as an operator.
  // Covers: `param@`, `varname@`, `obj.prop@`, `const varname@ =`, etc.
  const atRegex = /[A-Za-z_$][\w$]*@/g
  for (const match of code.matchAll(atRegex)) {
    const atStart = (match.index || 0) + match[0].length - 1
    tokens.push({ type: 'operator', start: atStart, length: 1 })
  }

  return tokens.sort((a, b) => a.start - b.start)
}

function transformRXSSugarShared(input, options = {}) {
  const includeToTransformedPos = Boolean(options && options.includeToTransformedPos)
  const includeTokens = Boolean(options && options.includeTokens)
  const code = input && typeof input.code === 'string' ? input.code : ''
  const fileName = input && typeof input.fileName === 'string' ? input.fileName : 'virtual.rxs'

  const state = new MutableCode(code)
  const reactiveNames = /** @type {Set<string>} */ (new Set())
  const tsxLike = isTsxLike(fileName)

  rewriteGetterAccessSugar(state)
  rewriteDestructuredBindings(state, reactiveNames)
  rewriteGetAndReactiveDeclarations(state, reactiveNames)
  rewriteObjectLiteralsWithAbsorb(state)
  rewriteReactiveAtAccess(state, reactiveNames)

  if (tsxLike) {
    rewriteJsxSiblingParensToFragment(state)
  }

  rewriteReactiveReads(state, reactiveNames)
  rewriteParenthesizedDerivations(state, tsxLike)
  collapseHiddenHelperMappings(state)

  const mapper = {
    toOriginalPos(pos) {
      return state.toOriginalPos(pos)
    },
  }

  const remapTable = buildRemapTableFromMap(state.map, code.length, state.code.length)
  const sourceMap = buildPositionSourceMapFromRemapTable(remapTable, fileName)

  if (includeToTransformedPos) {
    mapper.toTransformedPos = function toTransformedPos(pos) {
      return toTransformedPosFromSourceMap(sourceMap, pos)
    }
  }

  return {
    code: state.code,
    mapper,
    remapTable,
    sourceMap,
    reactiveNames,
    tokens: includeTokens ? collectSugarTokens(code) : undefined,
  }
}

module.exports = {
  buildPositionSourceMapFromRemapTable,
  buildRemapTableFromMap,
  collectSugarTokens,
  mapTextSpanFromSourceMap,
  mapTextSpanFromRemapTable,
  toTransformedPosFromSourceMap,
  toOriginalPosFromSourceMap,
  toOriginalPosFromRemapTable,
  transformRXSSugarShared,
}

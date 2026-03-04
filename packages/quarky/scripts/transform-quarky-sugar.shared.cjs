const ts = require('typescript')

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
    const upperDistance = Math.abs(this.map[upper] - originalPos)
    const lowerDistance = Math.abs(this.map[lower] - originalPos)
    return lowerDistance <= upperDistance ? lower : upper
  }

  replaceRange(start, end, replacement, anchor) {
    const safeStart = Math.max(0, start)
    const safeEnd = Math.max(safeStart, end)
    const anchorPos = anchor ?? this.toOriginalPos(safeStart)
    const replacedOriginalSlice = this.code.slice(safeStart, safeEnd)

    const beforeCode = this.code.slice(0, safeStart)
    const afterCode = this.code.slice(safeEnd)
    this.code = beforeCode + replacement + afterCode

    const beforeMap = this.map.slice(0, safeStart)
    const afterMap = this.map.slice(safeEnd)
    const replacementMap = new Array(replacement.length)
    const originalSpanLength = Math.max(0, safeEnd - safeStart)

    if (replacement.length > 0) {
      if (originalSpanLength === 0) {
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
      this.replaceRange(edit.start, edit.end, edit.replacement, edit.anchor)
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
    } else {
      result[replacementIndex] = lastMapped
    }
  }

  return result
}

function isTsxLike(fileName) {
  return fileName.endsWith('.luex') || fileName.endsWith('.tsx') || fileName.endsWith('.jsx')
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
  if (ts.isMethodSignature(parent) && parent.name === node) return true
  if (ts.isMethodDeclaration(parent) && parent.name === node) return true
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return true
  return false
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

function rewriteGetVarUsages(state, getVars) {
  const sourceFile = ts.createSourceFile('virtual.tsx', state.code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []

  function visit(node) {
    if (ts.isIdentifier(node)) {
      const usage = classifyGetVarUsage(node, getVars)
      if (usage) {
        const start = node.getStart(sourceFile)
        const end = node.getEnd()
        if (usage === 'member-root' || usage === 'call-root') {
          edits.push({ start, end, replacement: `$${node.text}`, anchor: state.toOriginalPos(start) })
        } else if (usage === 'read') {
          edits.push({ start, end, replacement: `$${node.text}()`, anchor: state.toOriginalPos(start) })
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  state.applyEdits(edits)
}

function rewriteParenthesizedSugar(state, tsxLike) {
  const sourceFile = ts.createSourceFile('virtual.tsx', state.code, ts.ScriptTarget.Latest, true, tsxLike ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const edits = []
  let needsDerivationImport = false

  function visit(node) {
    if (tsxLike && ts.isJsxExpression(node) && node.expression && ts.isParenthesizedExpression(node.expression)) {
      const inner = node.expression.expression.getText(sourceFile)
      const start = node.expression.getStart(sourceFile)
      const end = node.expression.getEnd()
      edits.push({
        start,
        end,
        replacement: `$_derivation(() => ${inner})`,
        anchor: state.toOriginalPos(start),
      })
      needsDerivationImport = true
    }

    if (ts.isCallExpression(node)) {
      for (const arg of node.arguments) {
        if (ts.isParenthesizedExpression(arg)) {
          const inner = arg.expression.getText(sourceFile)
          const start = arg.getStart(sourceFile)
          const end = arg.getEnd()
          edits.push({ start, end, replacement: `() => ${inner}`, anchor: state.toOriginalPos(start) })
        }
      }
    }

    if (ts.isPropertyAssignment(node) && ts.isParenthesizedExpression(node.initializer)) {
      const inner = node.initializer.expression.getText(sourceFile)
      const start = node.initializer.getStart(sourceFile)
      const end = node.initializer.getEnd()
      edits.push({ start, end, replacement: `() => ${inner}`, anchor: state.toOriginalPos(start) })
    }

    if (ts.isArrayLiteralExpression(node)) {
      for (const element of node.elements) {
        if (ts.isParenthesizedExpression(element)) {
          const inner = element.expression.getText(sourceFile)
          const start = element.getStart(sourceFile)
          const end = element.getEnd()
          edits.push({ start, end, replacement: `() => ${inner}`, anchor: state.toOriginalPos(start) })
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  state.applyEdits(edits)

  if (needsDerivationImport) {
    const hasDerivationNamedImport = /import\s*\{[^}]*\$_derivation[^}]*\}\s*from\s*['"]@rue\/quarky['"]/.test(state.code)

    if (!hasDerivationNamedImport) {
      state.replaceRange(0, 0, 'import { $_derivation } from "@rue/quarky"\n', 0)
    }
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
          edits.push({
            start: openPos,
            end: closeEnd,
            replacement: `<>${inner}</>`,
            anchor: state.toOriginalPos(openPos),
          })
        }
      }
    }

    token = scanner.scan()
  }

  state.applyEdits(edits)
}

function runLexicalPass(state, getVars, tsxLike) {
  const declarationRegex = /(^|[^\w$])get\s+([A-Za-z_$][\w$]*)\s*=/gm
  const declarationEdits = []
  for (const match of state.code.matchAll(declarationRegex)) {
    const full = match[0]
    const prefix = match[1] ?? ''
    const varName = match[2]
    if (!varName) continue

    getVars.add(varName)

    const fullStart = match.index ?? 0
    const start = fullStart + prefix.length
    const end = fullStart + full.length
    declarationEdits.push({
      start,
      end,
      replacement: `const $${varName} =`,
      anchor: state.toOriginalPos(start),
    })
  }
  state.applyEdits(declarationEdits)

  const atSugarRegex = /\b([A-Za-z_$][\w$]*)@/g
  const atEdits = []
  for (const match of state.code.matchAll(atSugarRegex)) {
    const varName = match[1]
    if (!varName) continue
    const start = match.index ?? 0
    const end = start + match[0].length
    atEdits.push({ start, end, replacement: `$${varName}`, anchor: state.toOriginalPos(start) })
  }
  state.applyEdits(atEdits)

  if (tsxLike) {
    rewriteJsxSiblingParensToFragment(state)
  }
}

function transformQuarkySugarShared(input, options = {}) {
  const { includeToTransformedPos = false } = options
  const { code, fileName } = input
  const state = new MutableCode(code)
  const tsxLike = isTsxLike(fileName)

  const getVars = new Set()
  runLexicalPass(state, getVars, tsxLike)

  if (getVars.size > 0) {
    rewriteGetVarUsages(state, getVars)
  }

  rewriteParenthesizedSugar(state, tsxLike)

  const mapper = {
    toOriginalPos(pos) {
      return state.toOriginalPos(pos)
    },
  }

  if (includeToTransformedPos) {
    mapper.toTransformedPos = function toTransformedPos(pos) {
      return state.toTransformedPos(pos)
    }
  }

  return {
    code: state.code,
    mapper,
  }
}

module.exports = {
  transformQuarkySugarShared,
}
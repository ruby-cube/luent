const ts = require('typescript')

const IDENTIFIER_PREFIX = 'ø'
const DERIVATION_HELPER = 'ø'
const GETTER_ACCESS_HELPER = 'øø'

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
      let rightmost = upper
      while (rightmost + 1 <= lastIndex && this.map[rightmost + 1] === originalPos) {
        rightmost += 1
      }
      return rightmost
    }

    const upperDistance = Math.abs(this.map[upper] - originalPos)
    const lowerDistance = Math.abs(this.map[lower] - originalPos)

    if (lowerDistance === upperDistance) {
      return upper
    }

    return lowerDistance < upperDistance ? lower : upper
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
  if (alignmentRatio < 0.35) {
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

function isTsxLike(fileName) {
  return fileName.endsWith('.qrx') || fileName.endsWith('.tsx') || fileName.endsWith('.jsx')
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function ensureNamedImportFromQuarky(state, importName) {
  const namedImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"]@rue\/quarky['"]/m
  const match = state.code.match(namedImportRegex)

  if (match) {
    const full = match[0]
    const named = match[1] ?? ''
    const importNameRegex = new RegExp(`(^|\\s|,)${escapeRegExp(importName)}(\\s|,|$)`)
    if (importNameRegex.test(named)) return

    const insertionPoint = full.lastIndexOf('}')
    if (insertionPoint < 0) return

    const absoluteStart = (match.index ?? 0) + insertionPoint
    const prefix = named.trim().length === 0 ? '' : ', '
    state.replaceRange(absoluteStart, absoluteStart, `${prefix}${importName}`, state.toOriginalPos(absoluteStart))
    return
  }

  state.replaceRange(0, 0, `import { ${importName} } from "@rue/quarky"\n`, 0)
}

function rewriteGetVarUsages(state, getVars) {
  const sourceFile = ts.createSourceFile('virtual.tsx', state.code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []
  const scopeStack = []

  function isShadowed(name) {
    for (let i = scopeStack.length - 1; i >= 0; i -= 1) {
      if (scopeStack[i].has(name)) return true
    }
    return false
  }

  function visit(node) {
    let pushedScope = false
    if (createsScope(node)) {
      scopeStack.push(collectScopeDeclarations(node))
      pushedScope = true
    }

    if (ts.isIdentifier(node)) {
      const usage = classifyGetVarUsage(node, getVars)
      if (usage && !isShadowed(node.text)) {
        const start = node.getStart(sourceFile)
        const end = node.getEnd()
        if (usage === 'member-root' || usage === 'call-root') {
          edits.push({ start, end, replacement: `${IDENTIFIER_PREFIX}${node.text}`, anchor: state.toOriginalPos(start) })
        } else if (usage === 'read') {
          edits.push({ start, end, replacement: `${IDENTIFIER_PREFIX}${node.text}()`, anchor: state.toOriginalPos(start) })
        }
      }
    }

    ts.forEachChild(node, visit)

    if (pushedScope) {
      scopeStack.pop()
    }
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
      const start = node.expression.getStart(sourceFile)
      edits.push({
        start,
        end: start + 1,
        replacement: `${DERIVATION_HELPER}(() => `,
        anchor: state.toOriginalPos(start),
      })
      needsDerivationImport = true
    }

    if (ts.isCallExpression(node)) {
      for (const arg of node.arguments) {
        if (ts.isParenthesizedExpression(arg)) {
          const start = arg.getStart(sourceFile)
          const end = arg.getEnd()
          edits.push({ start, end: start + 1, replacement: '() => ', anchor: state.toOriginalPos(start) })
          edits.push({ start: end - 1, end, replacement: '', anchor: state.toOriginalPos(end - 1) })
        }
      }
    }

    if (ts.isPropertyAssignment(node) && ts.isParenthesizedExpression(node.initializer)) {
      const start = node.initializer.getStart(sourceFile)
      const end = node.initializer.getEnd()
      edits.push({ start, end: start + 1, replacement: '() => ', anchor: state.toOriginalPos(start) })
      edits.push({ start: end - 1, end, replacement: '', anchor: state.toOriginalPos(end - 1) })
    }

    if (ts.isArrayLiteralExpression(node)) {
      for (const element of node.elements) {
        if (ts.isParenthesizedExpression(element)) {
          const start = element.getStart(sourceFile)
          const end = element.getEnd()
          edits.push({ start, end: start + 1, replacement: '() => ', anchor: state.toOriginalPos(start) })
          edits.push({ start: end - 1, end, replacement: '', anchor: state.toOriginalPos(end - 1) })
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  state.applyEdits(edits)

  if (needsDerivationImport) {
    ensureNamedImportFromQuarky(state, DERIVATION_HELPER)
  }
}

function rewriteGetterDotAccessSugar(state) {
  const dotAccessRegex = /([A-Za-z_$][\w$]*(?:\([^\n\r)]*\)|\[[^\n\r\]]*\]|\.[A-Za-z_$][\w$]*)*)\.([A-Za-z_$][\w$]*)@/g
  const edits = []

  for (const match of state.code.matchAll(dotAccessRegex)) {
    const full = match[0]
    const targetExpr = match[1]
    const property = match[2]
    if (!full || !targetExpr || !property) continue

    const start = match.index ?? 0
    const end = start + full.length
    edits.push({
      start,
      end,
      replacement: `${GETTER_ACCESS_HELPER}(${targetExpr}, '${property}')`,
      anchor: state.toOriginalPos(start),
    })
  }

  if (edits.length > 0) {
    state.applyEdits(edits)
    ensureNamedImportFromQuarky(state, GETTER_ACCESS_HELPER)
  }
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

function rewriteDestructuredGetterBindings(state, getVars) {
  const declarationRegex = /(^|\n)([ \t]*)(const|let|var)\s*\{([^{}]*)\}\s*=\s*([^;\n]+)(;?)/g
  const edits = []
  let shouldImportGetterAccessHelper = false

  for (const match of state.code.matchAll(declarationRegex)) {
    const full = match[0]
    const lineStart = match[1] ?? ''
    const indent = match[2] ?? ''
    const declKind = match[3]
    const patternBody = match[4] ?? ''
    const rhs = match[5] ?? ''
    const semi = match[6] ?? ''
    if (!full || !declKind || !rhs) continue

    const absoluteStart = (match.index ?? 0) + lineStart.length
    const linePrefix = state.code.slice((match.index ?? 0), absoluteStart)
    const lineWithIndentStart = absoluteStart - indent.length
    const fullLinePrefix = state.code.slice(Math.max(0, lineWithIndentStart - 2), absoluteStart)
    if (fullLinePrefix.trimStart().startsWith('//')) continue

    const properties = splitTopLevelCommaList(patternBody)
    const kept = []
    const getterProps = []

    for (const property of properties) {
      const trimmed = property.trim()
      if (!trimmed) continue

      const getterMatch = trimmed.match(/^([A-Za-z_$][\w$]*)@$/)
      if (getterMatch?.[1]) {
        getterProps.push(getterMatch[1])
      } else {
        kept.push(trimmed)
      }
    }

    if (getterProps.length === 0) continue

    const start = absoluteStart
    const end = start + (full.length - lineStart.length)
    const statements = []

    if (kept.length > 0) {
      statements.push(`${declKind} { ${kept.join(', ')} } = ${rhs}${semi || ';'}`)
    }

    for (const prop of getterProps) {
      getVars.add(prop)
      statements.push(`const ${IDENTIFIER_PREFIX}${prop} = ${GETTER_ACCESS_HELPER}(${rhs}, '${prop}');`)
    }

    edits.push({
      start,
      end,
      replacement: statements.join(`\n${indent}`),
      anchor: state.toOriginalPos(start),
    })
    shouldImportGetterAccessHelper = true
  }

  if (edits.length > 0) {
    state.applyEdits(edits)
  }

  if (shouldImportGetterAccessHelper) {
    ensureNamedImportFromQuarky(state, GETTER_ACCESS_HELPER)
  }
}

function rewriteReactiveReturnObjectProperties(state) {
  const returnObjectRegex = /return\s*\{([\s\S]*?)\}/g
  const edits = []

  for (const match of state.code.matchAll(returnObjectRegex)) {
    const full = match[0]
    const body = match[1] ?? ''
    if (!full) continue

    const propertyRegex = /^([ \t]*)([A-Za-z_$][\w$]*)@\s*:\s*([^\n]+?)(,?)\s*$/gm
    const hoisted = []
    let rewrittenBody = body
    let changed = false

    rewrittenBody = rewrittenBody.replace(propertyRegex, (_line, indent, prop, initializer) => {
      changed = true
      hoisted.push(`${indent}const ${IDENTIFIER_PREFIX}${prop} = ${initializer.trim()};`)
      return `${indent}get ${prop}() { return ${IDENTIFIER_PREFIX}${prop}(); },`
    })

    if (!changed) continue

    const start = match.index ?? 0
    const end = start + full.length
    const replacement = `${hoisted.join('\n')}\n\nreturn {${rewrittenBody}}`
    edits.push({ start, end, replacement, anchor: state.toOriginalPos(start) })
  }

  state.applyEdits(edits)
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
  rewriteGetterDotAccessSugar(state)
  rewriteDestructuredGetterBindings(state, getVars)

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
      replacement: `const ${IDENTIFIER_PREFIX}${varName} =`,
      anchor: state.toOriginalPos(start),
    })
  }
  state.applyEdits(declarationEdits)

  const reactiveParamRegex = /(^|[(,{]\s*)([A-Za-z_$][\w$]*)@(?=\s*[,)=:}])/gm
  for (const match of state.code.matchAll(reactiveParamRegex)) {
    const varName = match[2]
    if (varName) getVars.add(varName)
  }

  rewriteReactiveReturnObjectProperties(state)

  const atSugarRegex = /\b([A-Za-z_$][\w$]*)@/g
  const atEdits = []
  for (const match of state.code.matchAll(atSugarRegex)) {
    const varName = match[1]
    if (!varName) continue
    const start = match.index ?? 0
    const end = start + match[0].length
    atEdits.push({ start, end, replacement: `${IDENTIFIER_PREFIX}${varName}`, anchor: state.toOriginalPos(start) })
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
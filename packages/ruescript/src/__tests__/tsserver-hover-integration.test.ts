import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript') as typeof import('typescript')
const initPlugin = require('../../../tsserver-plugin-ruescript/index.cjs') as (modules: { typescript: typeof import('typescript') }) => {
  create: (info: {
    languageService: import('typescript').LanguageService
    languageServiceHost: import('typescript').LanguageServiceHost
  }) => import('typescript').LanguageService
}

function offsetAt(source: string, needle: string) {
  const offset = source.indexOf(needle)
  expect(offset).toBeGreaterThanOrEqual(0)
  return offset
}

function quickInfoDisplayText(quickInfo: import('typescript').QuickInfo | undefined) {
  return (quickInfo?.displayParts || []).map((part) => part.text).join('')
}

function createPluginLanguageService(
  fileName: string,
  source: string,
  compilerOptions: import('typescript').CompilerOptions = {},
) {
  const dummyFile = '/virtual/dummy.ts'
  const files = new Map<string, string>([
    [fileName, source],
    [dummyFile, 'export {}\n'],
  ])

  const host: import('typescript').LanguageServiceHost = {
    getCompilationSettings: () => ({
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      noEmit: true,
      ...compilerOptions,
    }),
    getScriptFileNames: () => [dummyFile, fileName],
    getScriptVersion: () => '0',
    getScriptSnapshot: (name) => {
      const text = files.get(name)
      if (typeof text === 'string') return ts.ScriptSnapshot.fromString(text)
      const diskText = ts.sys.readFile(name)
      return typeof diskText === 'string' ? ts.ScriptSnapshot.fromString(diskText) : undefined
    },
    getCurrentDirectory: () => '/virtual',
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: (name) => files.has(name) || ts.sys.fileExists(name),
    readFile: (name) => files.get(name) ?? ts.sys.readFile(name),
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
  }

  const baseLanguageService = ts.createLanguageService(host)
  const plugin = initPlugin({ typescript: ts })
  const languageService = plugin.create({
    languageService: baseLanguageService,
    languageServiceHost: host,
  })

  return {
    languageService,
    dispose() {
      baseLanguageService.dispose()
    },
  }
}

describe('tsserver plugin hover integration', () => {
  it('highlights identifier for get declaration hover', () => {
    const fileName = '/virtual/GetDeclHover.rxs'
    const source = `
function GetDeclHover() {
  get count = Ion(0)
  return count
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const hoverPos = offsetAt(source, 'get count =') + 5
      const quickInfo = service.languageService.getQuickInfoAtPosition(fileName, hoverPos)

      expect(quickInfo).toBeTruthy()
      expect(quickInfo && quickInfo.textSpan).toBeTruthy()
      if (!quickInfo || !quickInfo.textSpan) return

      const hoveredText = source.slice(
        quickInfo.textSpan.start,
        quickInfo.textSpan.start + quickInfo.textSpan.length,
      )

      expect(hoveredText).toBe('count')
    } finally {
      service.dispose()
    }
  })

  it('highlights identifier@ for const variable@ declaration hover', () => {
    const fileName = '/virtual/ConstReactiveDeclHover.rxs'
    const source = `
function ConstReactiveDeclHover() {
  const count@ = Ion(0)
  return count@
}
`

    const service = createPluginLanguageService(fileName, source, { strictNullChecks: true })
    try {
      const hoverPos = offsetAt(source, 'const count@ =') + 7
      const quickInfo = service.languageService.getQuickInfoAtPosition(fileName, hoverPos)

      expect(quickInfo).toBeTruthy()
      expect(quickInfo && quickInfo.textSpan).toBeTruthy()
      if (!quickInfo || !quickInfo.textSpan) return

      const hoveredText = source.slice(
        quickInfo.textSpan.start,
        quickInfo.textSpan.start + quickInfo.textSpan.length,
      )

      expect(hoveredText).toBe('count@')
    } finally {
      service.dispose()
    }
  })

  it('highlights derivation opening paren and shows arrow-function quick info', () => {
    const fileName = '/virtual/DerivationHover.rxs'
    const source = `
function DerivationHover(expression: number) {
  const obj = { property: (expression + 1) }
  return obj
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const openParenPos = offsetAt(source, '(expression + 1)')
      const quickInfo = service.languageService.getQuickInfoAtPosition(fileName, openParenPos)

      expect(quickInfo).toBeTruthy()
      expect(quickInfo && quickInfo.textSpan).toBeTruthy()
      if (!quickInfo || !quickInfo.textSpan) return

      const hoveredText = source.slice(
        quickInfo.textSpan.start,
        quickInfo.textSpan.start + quickInfo.textSpan.length,
      )
      const displayText = quickInfoDisplayText(quickInfo)

      expect(quickInfo.textSpan.start).toBe(openParenPos)
      expect(quickInfo.textSpan.length).toBe(1)
      expect(hoveredText).toBe('(')
      expect(displayText.includes('=>')).toBe(true)
    } finally {
      service.dispose()
    }
  })

  it('shows arrow-function quick info on derivation opening paren in JSX expression container', () => {
    const fileName = '/virtual/DerivationJsxHover.rxs'
    const source = `
function DerivationJsxHover(expression: number) {
  return <Comp value={(expression + 1)}></Comp>
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const openParenPos = offsetAt(source, '(expression + 1)')
      const quickInfo = service.languageService.getQuickInfoAtPosition(fileName, openParenPos)

      expect(quickInfo).toBeTruthy()
      expect(quickInfo && quickInfo.textSpan).toBeTruthy()
      if (!quickInfo || !quickInfo.textSpan) return

      const hoveredText = source.slice(
        quickInfo.textSpan.start,
        quickInfo.textSpan.start + quickInfo.textSpan.length,
      )
      const displayText = quickInfoDisplayText(quickInfo)

      expect(quickInfo.textSpan.start).toBe(openParenPos)
      expect(quickInfo.textSpan.length).toBe(1)
      expect(hoveredText).toBe('(')
      expect(displayText.includes('=>')).toBe(true)
    } finally {
      service.dispose()
    }
  })

  it('shows arrow-function quick info on derivation opening paren in function argument', () => {
    const fileName = '/virtual/DerivationArgHover.rxs'
    const source = `
function DerivationArgHover(expression: number) {
  return Ion((expression + 1))
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const openParenPos = offsetAt(source, '(expression + 1)')
      const quickInfo = service.languageService.getQuickInfoAtPosition(fileName, openParenPos)

      expect(quickInfo).toBeTruthy()
      expect(quickInfo && quickInfo.textSpan).toBeTruthy()
      if (!quickInfo || !quickInfo.textSpan) return

      const hoveredText = source.slice(
        quickInfo.textSpan.start,
        quickInfo.textSpan.start + quickInfo.textSpan.length,
      )
      const displayText = quickInfoDisplayText(quickInfo)

      expect(quickInfo.textSpan.start).toBe(openParenPos)
      expect(quickInfo.textSpan.length).toBe(1)
      expect(hoveredText).toBe('(')
      expect(displayText.includes('=>')).toBe(true)
    } finally {
      service.dispose()
    }
  })

  it('highlights halfCount@ when hovering kit.halfCount@ access', () => {
    const fileName = '/virtual/Counter.rxs'
    const source = `
function FractionKit(count@: Ion<number>) {
  return {
    get halfCount: Ion(() => count / 2)
  }
}

function Counter() {
  const kit = FractionKit(Ion(0))
  get halfCount = kit.halfCount@
  return halfCount
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const hoverPos = offsetAt(source, 'kit.halfCount@') + 'kit.half'.length
      const quickInfo = service.languageService.getQuickInfoAtPosition(fileName, hoverPos)

      expect(quickInfo).toBeTruthy()
      expect(quickInfo && quickInfo.textSpan).toBeTruthy()
      if (!quickInfo || !quickInfo.textSpan) return

      const hoveredText = source.slice(
        quickInfo.textSpan.start,
        quickInfo.textSpan.start + quickInfo.textSpan.length,
      )

      expect(hoveredText).toBe('halfCount@')
      expect(hoverPos).toBeGreaterThanOrEqual(quickInfo.textSpan.start)
      expect(hoverPos).toBeLessThan(quickInfo.textSpan.start + quickInfo.textSpan.length)
    } finally {
      service.dispose()
    }
  })

  it('highlights property@ for chained @ property access', () => {
    const fileName = '/virtual/ChainedAccess.rxs'
    const source = `
function Chained(obj: any) {
  get value = obj.a@.b@.c@.property@
  return value
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const hoverPos = offsetAt(source, 'obj.a@.b@.c@.property@') + 'obj.a@.b@.c@.prop'.length
      const quickInfo = service.languageService.getQuickInfoAtPosition(fileName, hoverPos)

      expect(quickInfo).toBeTruthy()
      expect(quickInfo && quickInfo.textSpan).toBeTruthy()
      if (!quickInfo || !quickInfo.textSpan) return

      const hoveredText = source.slice(
        quickInfo.textSpan.start,
        quickInfo.textSpan.start + quickInfo.textSpan.length,
      )

      expect(hoveredText).toBe('property@')
      expect(hoverPos).toBeGreaterThanOrEqual(quickInfo.textSpan.start)
      expect(hoverPos).toBeLessThan(quickInfo.textSpan.start + quickInfo.textSpan.length)
    } finally {
      service.dispose()
    }
  })

  it('highlights value@ for optional chaining access', () => {
    const fileName = '/virtual/OptionalAccess.rxs'
    const source = `
function Optional(obj: any) {
  get value = obj?.value@
  return value
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const hoverPos = offsetAt(source, 'obj?.value@') + 'obj?.val'.length
      const quickInfo = service.languageService.getQuickInfoAtPosition(fileName, hoverPos)

      expect(quickInfo).toBeTruthy()
      expect(quickInfo && quickInfo.textSpan).toBeTruthy()
      if (!quickInfo || !quickInfo.textSpan) return

      const hoveredText = source.slice(
        quickInfo.textSpan.start,
        quickInfo.textSpan.start + quickInfo.textSpan.length,
      )

      expect(hoveredText).toBe('value@')
      expect(hoverPos).toBeGreaterThanOrEqual(quickInfo.textSpan.start)
      expect(hoverPos).toBeLessThan(quickInfo.textSpan.start + quickInfo.textSpan.length)
    } finally {
      service.dispose()
    }
  })

  it('maps hover correctly for absorbØ-transformed initializers', () => {
    const fileName = '/virtual/Counter.rxs'
    const source = `
function Counter(value: number) {
  return {
    get count: Ion((value + 1)),
    label: value
  }
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const position = offsetAt(source, 'value + 1')
      const quickInfo = service.languageService.getQuickInfoAtPosition(fileName, position)
      expect(quickInfo).toBeTruthy()
      expect(quickInfo && quickInfo.textSpan).toBeTruthy()
      if (!quickInfo || !quickInfo.textSpan) return

      const { start, length } = quickInfo.textSpan
      expect(position).toBeGreaterThanOrEqual(start)
      expect(position).toBeLessThan(start + length)
      expect(source.slice(start, start + length)).toContain('value')
    } finally {
      service.dispose()
    }
  })

  it('maps hover correctly for absorbØ shorthand/getter-method rewrites', () => {
    const fileName = '/virtual/AbsorbCases.rxs'
    const source = `
function AbsorbCases(count@: Ion<number>) {
  return {
    count@,
    get doubled: Ion((count * 2)),
    get echoed() { return count }
  }
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const probes = [
        offsetAt(source, 'count * 2') + 2,
        offsetAt(source, 'return count') + 8,
        offsetAt(source, 'echoed()') + 2,
      ]

      const quickInfos = probes
        .map((pos) => service.languageService.getQuickInfoAtPosition(fileName, pos))
        .filter(Boolean)

      expect(quickInfos.length).toBeGreaterThan(0)
      const displays = quickInfos.map((info) => quickInfoDisplayText(info))
      expect(displays.some((text) => text.includes('count'))).toBe(true)
      expect(displays.some((text) => text.includes('echoed'))).toBe(true)
      expect(displays.some((text) => text.includes('absorbØ'))).toBe(false)
      expect(displays.some((text) => text.includes('destructureØ'))).toBe(false)
      expect(displays.some((text) => text.includes('πæ'))).toBe(false)
    } finally {
      service.dispose()
    }
  })

  it('maps hover to authored symbol inside JSX sibling-parens fragment rewrites', () => {
    const fileName = '/virtual/View.rxs'
    const source = `
function View() {
  get superCounter = Ion(0)
  return (
    <Label>{superCounter + 1}</Label>
    <Label>{superCounter + 2}</Label>
  )
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const tokenStart = offsetAt(source, 'superCounter + 2')
      const probes = [tokenStart, tokenStart + 2, tokenStart + 6, tokenStart + 10]
      const quickInfos = probes
        .map((pos) => service.languageService.getQuickInfoAtPosition(fileName, pos))
        .filter(Boolean)

      expect(quickInfos.length).toBeGreaterThan(0)
      const displays = quickInfos.map((info) => quickInfoDisplayText(info))
      expect(displays.some((text) => text.includes('superCounter'))).toBe(true)
      expect(displays.some((text) => text.includes('import æ'))).toBe(false)
      expect(displays.some((text) => text.includes('absorbØ'))).toBe(false)
      expect(displays.some((text) => text.includes('destructureØ'))).toBe(false)
      expect(displays.some((text) => text.includes('πæ'))).toBe(false)
    } finally {
      service.dispose()
    }
  })

  it('keeps definitions and references available through absorbØ transforms', () => {
    const fileName = '/virtual/AbsorbDefs.rxs'
    const source = `
function AbsorbDefs(count@: Ion<number>) {
  return {
    get echoed() { return count }
  }
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const position = offsetAt(source, 'return count') + 8

      const definitions = service.languageService.getDefinitionAtPosition(fileName, position) || []
      expect(definitions.length).toBeGreaterThan(0)
      const definitionSnippets = definitions
        .filter((entry) => entry.fileName === fileName)
        .map((entry) => source.slice(entry.textSpan.start, entry.textSpan.start + entry.textSpan.length))
      expect(definitionSnippets.some((text) => text.includes('count'))).toBe(true)

      const references = service.languageService.getReferencesAtPosition(fileName, position) || []
      expect(references.length).toBeGreaterThan(0)
      const referenceSnippets = references
        .filter((entry) => entry.fileName === fileName)
        .map((entry) => source.slice(entry.textSpan.start, entry.textSpan.start + entry.textSpan.length))
      expect(referenceSnippets.some((text) => text.includes('count'))).toBe(true)
    } finally {
      service.dispose()
    }
  })

  it('keeps rename available through absorbØ transforms', () => {
    const fileName = '/virtual/AbsorbRename.rxs'
    const source = `
function AbsorbRename(count@: Ion<number>) {
  return {
    get echoed() { return count }
  }
}
`

    const service = createPluginLanguageService(fileName, source)
    try {
      const position = offsetAt(source, 'return count') + 8

      const renameInfo = service.languageService.getRenameInfo(fileName, position, {})
      expect(renameInfo).toBeTruthy()
      expect(renameInfo && renameInfo.canRename).toBe(true)
      if (!renameInfo || !renameInfo.canRename || !renameInfo.triggerSpan) return

      const triggerText = source.slice(renameInfo.triggerSpan.start, renameInfo.triggerSpan.start + renameInfo.triggerSpan.length)
      expect(triggerText).toContain('count')

      const locations = service.languageService.findRenameLocations(fileName, position, false, false, {}) || []
      expect(locations.length).toBeGreaterThan(0)
      const locationTexts = locations
        .filter((entry) => entry.fileName === fileName)
        .map((entry) => source.slice(entry.textSpan.start, entry.textSpan.start + entry.textSpan.length))
      expect(locationTexts.some((text) => text.includes('count'))).toBe(true)
    } finally {
      service.dispose()
    }
  })

})

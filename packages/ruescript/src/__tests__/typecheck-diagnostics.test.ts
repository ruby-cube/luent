import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript') as typeof import('typescript')
const { transformRXSSugarShared } = require('../../../scripts/transform-rxs-sugar.shared.cjs') as {
  transformRXSSugarShared: (input: { code: string; fileName: string }) => {
    code: string
    mapper: {
      toOriginalPos(pos: number): number
    }
  }
}

type RemappedDiagnostic = {
  code: number
  message: string
  start: number
  length: number
}

function offsetAt(source: string, needle: string) {
  const offset = source.indexOf(needle)
  expect(offset).toBeGreaterThanOrEqual(0)
  return offset
}

function collectRemappedDiagnostics(source: string, fileName: string) {
  const transformed = transformRXSSugarShared({ code: source, fileName })
  const virtualFileName = `${fileName}.tsx`

  const compilerOptions: import('typescript').CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.Preserve,
    noEmit: true,
    strictNullChecks: true,
  }

  const host = ts.createCompilerHost(compilerOptions, true)
  const getSourceFile = host.getSourceFile.bind(host)
  const readFile = host.readFile.bind(host)
  const fileExists = host.fileExists.bind(host)

  host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (name === virtualFileName) {
      return ts.createSourceFile(name, transformed.code, languageVersion, true, ts.ScriptKind.TSX)
    }
    return getSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile)
  }

  host.readFile = (name) => {
    if (name === virtualFileName) return transformed.code
    return readFile(name)
  }

  host.fileExists = (name) => {
    if (name === virtualFileName) return true
    return fileExists(name)
  }

  const program = ts.createProgram({
    rootNames: [virtualFileName],
    options: compilerOptions,
    host,
  })

  const diagnostics = ts.getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file?.fileName === virtualFileName)

  return diagnostics.map<RemappedDiagnostic>((diagnostic) => {
    const transformedStart = diagnostic.start ?? 0
    const transformedLength = diagnostic.length ?? 0
    const transformedEnd = transformedStart + transformedLength

    const start = Math.max(0, transformed.mapper.toOriginalPos(transformedStart))
    const end = Math.max(start, transformed.mapper.toOriginalPos(transformedEnd))

    return {
      code: diagnostic.code,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      start,
      length: end - start,
    }
  })
}

describe('RueScript sugar typecheck diagnostics', () => {
  it('maps possibly-undefined diagnostics to authored unguarded reads while guarded sync read stays clean', () => {
    const fileName = '/virtual/UndefinedGuardedRead.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>
declare function watch<T>(value: Reactive<T>, callback: () => void): void

function UndefinedGuardedRead() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  if (obj) {
    console.log(obj.name)
    watch(obj@, () => {
      console.log(obj.name)
    })
  }

  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const syncGuardedAccess = offsetAt(source, 'console.log(obj.name)') + 'console.log('.length
    const callbackAccess = source.indexOf('obj.name', syncGuardedAccess + 1)
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(callbackAccess).toBeGreaterThan(syncGuardedAccess)
    expect(unguardedAccess).toBeGreaterThan(callbackAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, syncGuardedAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('maps possibly-undefined diagnostics to else-branch reads while guarded-branch reads stay clean', () => {
    const fileName = '/virtual/UndefinedElseBranch.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>

function UndefinedElseBranch() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  if (obj) {
    console.log(obj.name)
  } else {
    console.log(obj.name)
  }
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const guardedAccess = offsetAt(source, 'console.log(obj.name)') + 'console.log('.length
    const elseAccess = source.lastIndexOf('obj.name')
    expect(elseAccess).toBeGreaterThan(guardedAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, guardedAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, elseAccess))).toBe(true)
  })

  it('keeps logical-and guarded reads clean while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedLogicalAnd.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>

function UndefinedLogicalAnd() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  obj && console.log(obj.name)
  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const guardedAccess = offsetAt(source, 'obj && console.log(obj.name)') + 'obj && console.log('.length
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(unguardedAccess).toBeGreaterThan(guardedAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, guardedAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps conditional-consequent guarded reads clean while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedConditional.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>

function UndefinedConditional() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  const label = obj ? obj.name : 'none'
  console.log(label)
  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const guardedAccess = offsetAt(source, 'obj ? obj.name :') + 'obj ? '.length
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(unguardedAccess).toBeGreaterThan(guardedAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, guardedAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps nested conditional guarded reads clean while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedNestedConditional.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>

function UndefinedNestedConditional(flag: boolean) {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  const label = flag ? (obj ? obj.name : 'missing') : 'fallback'
  console.log(label)
  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const guardedAccess = offsetAt(source, 'obj ? obj.name :') + 'obj ? '.length
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(unguardedAccess).toBeGreaterThan(guardedAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, guardedAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps negated-if else-branch guarded reads clean while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedNegatedIfElse.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>

function UndefinedNegatedIfElse() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  if (!obj) {
    console.log('missing')
  } else {
    console.log(obj.name)
  }

  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const guardedElseAccess = offsetAt(source, 'console.log(obj.name)') + 'console.log('.length
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(unguardedAccess).toBeGreaterThan(guardedElseAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, guardedElseAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps negated-ternary false-branch guarded reads clean while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedNegatedTernary.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>

function UndefinedNegatedTernary() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  const label = !obj ? 'none' : obj.name
  console.log(label)
  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const guardedFalseBranchAccess = offsetAt(source, "!obj ? 'none' : obj.name") + "!obj ? 'none' : ".length
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(unguardedAccess).toBeGreaterThan(guardedFalseBranchAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, guardedFalseBranchAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps explicit non-nullish comparison guarded reads clean while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedExplicitNonNullishComparison.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>

function UndefinedExplicitNonNullishComparison() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  if (obj != null) {
    console.log(obj.name)
  }

  if (obj !== undefined) {
    console.log(obj.name)
  }

  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const firstGuardedAccess = offsetAt(source, 'console.log(obj.name)') + 'console.log('.length
    const secondGuardedAccess = source.indexOf('obj.name', firstGuardedAccess + 1)
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(secondGuardedAccess).toBeGreaterThan(firstGuardedAccess)
    expect(unguardedAccess).toBeGreaterThan(secondGuardedAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, firstGuardedAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, secondGuardedAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps explicit nullish-equality else-branch reads clean while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedExplicitNullishEquality.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>

function UndefinedExplicitNullishEquality() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  if (obj == null) {
    console.log('missing')
  } else {
    console.log(obj.name)
  }

  if (obj === undefined) {
    console.log('missing too')
  } else {
    console.log(obj.name)
  }

  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const firstElseGuardedAccess = offsetAt(source, 'console.log(obj.name)') + 'console.log('.length
    const secondElseGuardedAccess = source.indexOf('obj.name', firstElseGuardedAccess + 1)
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(secondElseGuardedAccess).toBeGreaterThan(firstElseGuardedAccess)
    expect(unguardedAccess).toBeGreaterThan(secondElseGuardedAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, firstElseGuardedAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, secondElseGuardedAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps If and ElseIf template branch reads clean while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedTemplateIfElseIf.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>
declare function If(condition: any, jsx: any): any
declare function ElseIf(condition: any, jsx: any): any
declare namespace JSX {
  interface IntrinsicElements {
    div: any
    p: any
  }
}

function UndefinedTemplateIfElseIf() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  const view = <div>
    {If(obj, <p>{obj.name}</p>)}
    {ElseIf(obj !== undefined, <p>{obj.name}</p>)}
  </div>

  console.log(view)
  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const firstTemplateGuarded = offsetAt(source, '{obj.name}</p>') + 1
    const secondTemplateGuarded = source.indexOf('obj.name', firstTemplateGuarded + 1)
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(secondTemplateGuarded).toBeGreaterThan(firstTemplateGuarded)
    expect(unguardedAccess).toBeGreaterThan(secondTemplateGuarded)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, firstTemplateGuarded))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, secondTemplateGuarded))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps Else template branch reads clean when paired with negated If while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedTemplateElse.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>
declare function If(condition: any, jsx: any): any
declare function Else(jsx: any): any
declare namespace JSX {
  interface IntrinsicElements {
    div: any
    p: any
  }
}

function UndefinedTemplateElse() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  const view = <div>
    {If(!obj, <p>missing</p>)}
    {Else(<p>{obj.name}</p>)}
  </div>

  console.log(view)
  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const elseTemplateGuarded = offsetAt(source, '{obj.name}</p>') + 1
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(unguardedAccess).toBeGreaterThan(elseTemplateGuarded)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, elseTemplateGuarded))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps loop-body reads clean for while/do-while/for guarded conditions while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedLoopGuards.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>

function UndefinedLoopGuards() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  while (obj) {
    console.log(obj.name)
    break
  }

  do {
    console.log(obj.name)
    break
  } while (obj)

  for (; obj; ) {
    console.log(obj.name)
    break
  }

  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const whileGuarded = offsetAt(source, 'while (obj) {\n    console.log(obj.name)') + 'while (obj) {\n    console.log('.length
    const doWhileGuarded = source.indexOf('obj.name', whileGuarded + 1)
    const forGuarded = source.indexOf('obj.name', doWhileGuarded + 1)
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(doWhileGuarded).toBeGreaterThan(whileGuarded)
    expect(forGuarded).toBeGreaterThan(doWhileGuarded)
    expect(unguardedAccess).toBeGreaterThan(forGuarded)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, whileGuarded))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, doWhileGuarded))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, forGuarded))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps If/ElseIf render-function branch reads clean while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedTemplateRenderFunctions.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>
declare function If(condition: any, render: () => any): any
declare function ElseIf(condition: any, render: () => any): any
declare namespace JSX {
  interface IntrinsicElements {
    div: any
    p: any
  }
}

function UndefinedTemplateRenderFunctions() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  const view = <div>
    {If(obj, () => <p>{obj.name}</p>)}
    {ElseIf(obj !== undefined, () => <p>{obj.name}</p>)}
  </div>

  console.log(view)
  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const firstGuarded = offsetAt(source, '{obj.name}</p>') + 1
    const secondGuarded = source.indexOf('obj.name', firstGuarded + 1)
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(secondGuarded).toBeGreaterThan(firstGuarded)
    expect(unguardedAccess).toBeGreaterThan(secondGuarded)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, firstGuarded))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, secondGuarded))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps Else render-function branch reads clean when paired with negated If while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedTemplateElseRenderFunction.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>
declare function If(condition: any, render: () => any): any
declare function Else(render: () => any): any
declare namespace JSX {
  interface IntrinsicElements {
    div: any
    p: any
  }
}

function UndefinedTemplateElseRenderFunction() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  const view = <div>
    {If(!obj, () => <p>missing</p>)}
    {Else(() => <p>{obj.name}</p>)}
  </div>

  console.log(view)
  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const guardedElseRenderAccess = offsetAt(source, '{obj.name}</p>') + 1
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(unguardedAccess).toBeGreaterThan(guardedElseRenderAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, guardedElseRenderAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })

  it('keeps IfElse truthy render-function reads clean while flagging later unguarded reads', () => {
    const fileName = '/virtual/UndefinedIfElseRenderFunction.rxs'
    const source = `
type Reactive<T> = {
  (): T
  value: T
}
declare function Ion<T>(value: T): Reactive<T>
declare function IfElse(condition: any, whenTrue: () => any, whenFalse: () => any): any

function UndefinedIfElseRenderFunction() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  const label = IfElse(obj, () => obj.name, () => 'none')
  console.log(label)
  console.log(obj.name)
}
`

    const diagnostics = collectRemappedDiagnostics(source, fileName)
    const undefinedDiagnostics = diagnostics.filter((diagnostic) => {
      if (diagnostic.code !== 2532) return false
      return /possibly\s+'undefined'/.test(diagnostic.message)
    })

    expect(undefinedDiagnostics.length).toBeGreaterThanOrEqual(1)

    const guardedRenderAccess = offsetAt(source, '() => obj.name') + '() => '.length
    const unguardedAccess = source.lastIndexOf('obj.name')
    expect(unguardedAccess).toBeGreaterThan(guardedRenderAccess)

    const coversPosition = (diagnostic: RemappedDiagnostic, position: number) => {
      const length = Math.max(1, diagnostic.length)
      return position >= diagnostic.start && position < diagnostic.start + length
    }

    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, guardedRenderAccess))).toBe(false)
    expect(undefinedDiagnostics.some((diagnostic) => coversPosition(diagnostic, unguardedAccess))).toBe(true)
  })
})

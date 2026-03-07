import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformQuarkySugarShared } = require('../../../scripts/transform-quarky-sugar.shared.cjs') as {
  transformQuarkySugarShared: (input: { code: string; fileName: string }) => { code: string }
}

describe('quarky sugar transforms', () => {
  it('rewrites get declarations and reactive reads', () => {
    const input = `
function Demo() {
  get count = Ion(0)
  return count
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrk' }).code
    expect(transformed).toContain('const øcount = Ion(0)')
    expect(transformed).toContain('return øcount()')
  })

  it('rewrites reactive call-root reads to double-call form', () => {
    const input = `
function Demo() {
  get count = Ion(() => 1)
  return count()
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrk' }).code
    expect(transformed).toContain('const øcount = Ion(() => 1)')
    expect(transformed).toContain('return øcount()()')
  })

  it('rewrites destructuring sugar and getter access sugar', () => {
    const input = `
function Demo(obj: any) {
  const { a@, b } = obj
  get picked = obj.value@
  return [a@, b, picked]
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('destructureØ')
    expect(transformed).toContain('πø')
    expect(transformed).toContain("const { øa, b } = destructureØ(obj, 'øa', 'b')")
    expect(transformed).toContain("const øpicked = (obj.øvalue, πø(obj, 'value'))")
    expect(transformed).toContain('return [øa, b, øpicked()]')
  })

  it('rewrites invalid object literal get sugar through absorbØ', () => {
    const input = `
function Kit() {
  return {
    get count: Ion(0),
    normalProperty: 1
  }
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('absorbØ')
    expect(transformed).toContain('øcount: Ion(0)')
    expect(transformed).toContain("['øcount', 'normalProperty']")
  })

  it('rewrites derivation shorthand for calls, arrays and jsx containers', () => {
    const input = `
function View() {
  get count = Ion(0)
  const value = (count + 1)
  const list = [ (count + 2) ]
  return <Comp value={(count + 3)} x={doThing((count + 4))} list={list} value2={value} />
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('const value = () => øcount() + 1')
    expect(transformed).toContain('const list = [ () => øcount() + 2 ]')
    expect(transformed).toContain('value={ø(() => øcount() + 3)}')
    expect(transformed).toContain('doThing(() => øcount() + 4)')
    expect(transformed).toContain('import { ø } from "@rue/quarky"')
  })

  it('rewrites JSX expression-container derivation with ø helper', () => {
    const input = `
function View(value: number) {
  return <Comp value={(value + 1)}></Comp>
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('import { ø } from "@rue/quarky"')
    expect(transformed).toContain('value={ø(() => value + 1)}')
  })

  it('rewrites chained dot-notation @ access via tuple form and πø nesting', () => {
    const input = `
function Demo(obj: any) {
  get one = obj.a.b.c.property@
  get two = obj.a@.b@.c@.property@
  return [one, two]
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain("const øone = (obj.a.b.c.øproperty, πø(obj.a.b.c, 'property'))")
    expect(transformed).toContain("const øtwo = (obj.øa.øb.øc.øproperty, πø(πø(πø(πø(obj, 'a'), 'b'), 'c'), 'property'))")
  })

  it('rewrites optional dot-property @ access forms', () => {
    const input = `
function Demo(obj: any, key: string) {
  get a = obj?.value@
  return [a, key]
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain("const øa = obj == null ? undefined : πø(obj, 'value')")
  })

  it('rewrites property access from get declaration variables to call-form member access', () => {
    const input = `
function Demo() {
  get obj = Ion({ property: 1 })
  return obj.property
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('const øobj = Ion({ property: 1 })')
    expect(transformed).toContain('return øobj().property')
  })

  it('rewrites property access from const @ variables to call-form member access', () => {
    const input = `
function Demo() {
  const obj@ = Ion({ property: 1 })
  return obj.property
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('const øobj = Ion({ property: 1 })')
    expect(transformed).toContain('return øobj().property')
  })

  it('adds non-null assertion for synchronous guarded reads but not nested callback reads', () => {
    const input = `
function Demo() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  if (obj) {
    console.log(obj.name)
    watch(obj@, () => {
      console.log(obj.name)
    })
  }
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain("if (øobj())")
    expect(transformed).toContain("console.log(øobj()!.name)")
    expect(transformed).toContain("watch(øobj, () => {")
    expect(transformed).toContain("console.log(øobj().name)")
  })

  it('adds non-null assertion in else branch when guard is negated', () => {
    const input = `
function Demo() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  if (!obj) {
    console.log('missing')
  } else {
    console.log(obj.name)
  }
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('if (!øobj())')
    expect(transformed).toContain("console.log(øobj()!.name)")
  })

  it('adds non-null assertion in ternary false branch for negated guard', () => {
    const input = `
function Demo() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)
  const value = !obj ? 'none' : obj.name
  return value
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain("const value = !øobj() ? 'none' : øobj()!.name")
  })

  it('adds non-null assertion for explicit non-nullish comparison guards', () => {
    const input = `
function Demo() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)

  if (obj != null) {
    console.log(obj.name)
  }

  if (obj !== undefined) {
    console.log(obj.name)
  }
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('if (øobj() != null)')
    expect(transformed).toContain('if (øobj() !== undefined)')
    expect(transformed).toContain('console.log(øobj()!.name)')
  })

  it('adds non-null assertion in else branch for explicit nullish equality guards', () => {
    const input = `
function Demo() {
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
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('if (øobj() == null)')
    expect(transformed).toContain('if (øobj() === undefined)')
    expect(transformed).toContain('console.log(øobj()!.name)')
  })

  it('adds non-null assertion inside while/do-while/for loop bodies guarded by condition', () => {
    const input = `
function Demo() {
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
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('while (øobj())')
    expect(transformed).toContain('} while (øobj())')
    expect(transformed).toContain('for (; øobj(); )')
    expect(transformed).toContain('console.log(øobj()!.name)')
  })

  it('adds non-null assertion inside If and ElseIf template conditional branches', () => {
    const input = `
function Demo() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)
  return template(
    <div>
      {If(obj, <p>{obj.name}</p>)}
      {ElseIf(obj !== undefined, <p>{obj.name}</p>)}
    </div>
  )
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('If(øobj(), <p>{øobj()!.name}</p>)')
    expect(transformed).toContain('ElseIf(øobj() !== undefined, <p>{øobj()!.name}</p>)')
  })

  it('adds non-null assertion inside Else template branch when paired with negated If', () => {
    const input = `
function Demo() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)
  return template(
    <div>
      {If(!obj, <p>missing</p>)}
      {Else(<p>{obj.name}</p>)}
    </div>
  )
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('If(!øobj(), <p>missing</p>)')
    expect(transformed).toContain('Else(<p>{øobj()!.name}</p>)')
  })

  it('adds non-null assertion inside If/ElseIf render-function branch scopes', () => {
    const input = `
function Demo() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)
  return template(
    <div>
      {If(obj, () => <p>{obj.name}</p>)}
      {ElseIf(obj !== undefined, () => <p>{obj.name}</p>)}
    </div>
  )
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('If(øobj(), () => <p>{øobj()!.name}</p>)')
    expect(transformed).toContain('ElseIf(øobj() !== undefined, () => <p>{øobj()!.name}</p>)')
  })

  it('adds non-null assertion inside Else render-function branch when paired with negated If', () => {
    const input = `
function Demo() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)
  return template(
    <div>
      {If(!obj, () => <p>missing</p>)}
      {Else(() => <p>{obj.name}</p>)}
    </div>
  )
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('If(!øobj(), () => <p>missing</p>)')
    expect(transformed).toContain('Else(() => <p>{øobj()!.name}</p>)')
  })

  it('adds non-null assertion inside IfElse truthy render-function scope', () => {
    const input = `
function Demo() {
  get obj = Ion({ name: 'kermit' } as { name: string } | undefined)
  const value = IfElse(obj, () => obj.name, () => 'none')
  return value
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain("const value = IfElse(øobj(), () => øobj()!.name, () => 'none')")
  })

  it('does not rewrite computed @ access forms', () => {
    const input = `
function Demo(obj: any, key: string) {
  get a = obj[key]@
  get b = obj?.[key]@
  return [a, b]
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('const øa = obj[key]@')
    expect(transformed).toContain('const øb = obj?.[key]@')
    expect(transformed).not.toContain('πø(obj, key)')
    expect(transformed).not.toContain('obj == null ? undefined : πø(obj, key)')
  })

  it('keeps nested destructuring syntax stable while still transforming marked bindings', () => {
    const input = `
function Demo(src: any) {
  const { top@, nested: { deep@ } } = src
  return top@
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('const { øtop, nested: { ødeep } } = src')
    expect(transformed).toContain('return øtop')
  })

  it('is idempotent across repeated transform passes', () => {
    const input = `
function Demo(obj: any) {
  get count = Ion(0)
  get picked = obj.value@
  return <Comp value={(count + 1)} picked={picked}></Comp>
}
`

    const once = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    const twice = transformQuarkySugarShared({ code: once, fileName: 'demo.qrx' }).code
    expect(twice).toBe(once)
  })

  it('rewrites typed reactive params and their reads in local scope', () => {
    const input = `
function FractionKitB(count@: Ion<number>) {
  const halfCount@ = Ion((count / 2))
  return { get halfCount() { return halfCount } }
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code
    expect(transformed).toContain('function FractionKitB(øcount: Ion<number>)')
    expect(transformed).toContain('const øhalfCount = Ion(() => øcount() / 2)')
    expect(transformed).toContain('return { get halfCount() { return øhalfCount() } }')
  })
})

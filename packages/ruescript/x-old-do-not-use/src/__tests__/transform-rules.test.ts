import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformRXSSugarShared } = require('../../scripts/transform-rxs-sugar.shared.cjs') as {
  transformRXSSugarShared: (input: { code: string; fileName: string }) => { code: string }
}

describe('RueScript sugar transforms', () => {
  it('rewrites get declarations and reactive reads', () => {
    const input = `
function Demo() {
  get count = ion(0)
  return count
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('const æcount = ion(0)')
    expect(transformed).toContain('return æcount()')
  })

  it('rewrites reactive call-root reads to double-call form', () => {
    const input = `
function Demo() {
  get count = ion(() => 1)
  return count()
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('const æcount = ion(() => 1)')
    expect(transformed).toContain('return æcount()()')
  })

  it('rewrites destructuring sugar and getter access sugar', () => {
    const input = `
function Demo(obj: any) {
  const { a@, b } = obj
  get picked = obj.value@
  return [a@, b, picked]
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('destructureØ')
    expect(transformed).toContain('πæ')
    expect(transformed).toContain("const { æa, b } = destructureØ(obj, 'æa', 'b')")
    expect(transformed).toContain("const æpicked = (obj.ævalue, πæ(obj, 'value'))")
    expect(transformed).toContain('return [æa, b, æpicked()]')
  })

  it('rewrites invalid object literal get sugar through absorbØ', () => {
    const input = `
function Kit() {
  return {
    get count: ion(0),
    normalProperty: 1
  }
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('absorbØ')
    expect(transformed).toContain('æcount: ion(0)')
    expect(transformed).toContain("['æcount', 'normalProperty']")
  })

  it('rewrites derivation shorthand for calls, arrays and jsx containers', () => {
    const input = `
function View() {
  get count = ion(0)
  const value = (count + 1)
  const list = [ (count + 2) ]
  return <Comp value={(count + 3)} x={doThing((count + 4))} list={list} value2={value} />
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('const value = () => æcount() + 1')
    expect(transformed).toContain('const list = [ () => æcount() + 2 ]')
    expect(transformed).toContain('value={() => æcount() + 3}')
    expect(transformed).toContain('doThing(() => æcount() + 4)')
  })

  it('rewrites JSX expression-container derivation as arrow function', () => {
    const input = `
function View(value: number) {
  return <Comp value={(value + 1)}></Comp>
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('value={() => value + 1}')
  })

  it('rewrites chained dot-notation @ access via tuple form and πæ nesting', () => {
    const input = `
function Demo(obj: any) {
  get one = obj.a.b.c.property@
  get two = obj.a@.b@.c@.property@
  return [one, two]
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain("const æone = (obj.a.b.c.æproperty, πæ(obj.a.b.c, 'property'))")
    expect(transformed).toContain("const ætwo = (obj.æa.æb.æc.æproperty, πæ(πæ(πæ(πæ(obj, 'a'), 'b'), 'c'), 'property'))")
  })

  it('rewrites optional dot-property @ access forms', () => {
    const input = `
function Demo(obj: any, key: string) {
  get a = obj?.value@
  return [a, key]
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain("const æa = obj == null ? undefined : πæ(obj, 'value')")
  })

  it('rewrites property access from get declaration variables to call-form member access', () => {
    const input = `
function Demo() {
  get obj = ion({ property: 1 })
  return obj.property
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('const æobj = ion({ property: 1 })')
    expect(transformed).toContain('return æobj().property')
  })

  it('rewrites property access from const @ variables to call-form member access', () => {
    const input = `
function Demo() {
  const obj@ = ion({ property: 1 })
  return obj.property
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('const æobj = ion({ property: 1 })')
    expect(transformed).toContain('return æobj().property')
  })

  it('adds non-null assertion for synchronous guarded reads but not nested callback reads', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)

  if (obj) {
    console.log(obj.name)
    watch(obj@, () => {
      console.log(obj.name)
    })
  }
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain("if (æobj())")
    expect(transformed).toContain("console.log(æobj()!.name)")
    expect(transformed).toContain("watch(æobj, () => {")
    expect(transformed).toContain("console.log(æobj().name)")
  })

  it('adds non-null assertion in else branch when guard is negated', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)

  if (!obj) {
    console.log('missing')
  } else {
    console.log(obj.name)
  }
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('if (!æobj())')
    expect(transformed).toContain("console.log(æobj()!.name)")
  })

  it('adds non-null assertion in ternary false branch for negated guard', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)
  const value = !obj ? 'none' : obj.name
  return value
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain("const value = !æobj() ? 'none' : æobj()!.name")
  })

  it('adds non-null assertion for explicit non-nullish comparison guards', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)

  if (obj != null) {
    console.log(obj.name)
  }

  if (obj !== undefined) {
    console.log(obj.name)
  }
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('if (æobj() != null)')
    expect(transformed).toContain('if (æobj() !== undefined)')
    expect(transformed).toContain('console.log(æobj()!.name)')
  })

  it('adds non-null assertion in else branch for explicit nullish equality guards', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)

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

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('if (æobj() == null)')
    expect(transformed).toContain('if (æobj() === undefined)')
    expect(transformed).toContain('console.log(æobj()!.name)')
  })

  it('adds non-null assertion inside while/do-while/for loop bodies guarded by condition', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)

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

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('while (æobj())')
    expect(transformed).toContain('} while (æobj())')
    expect(transformed).toContain('for (; æobj(); )')
    expect(transformed).toContain('console.log(æobj()!.name)')
  })

  it('adds non-null assertion inside If and ElseIf template conditional branches', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)
  return Component(
    <div>
      {If(obj, <p>{obj.name}</p>)}
      {ElseIf(obj !== undefined, <p>{obj.name}</p>)}
    </div>
  )
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('If(æobj(), <p>{æobj()!.name}</p>)')
    expect(transformed).toContain('ElseIf(æobj() !== undefined, <p>{æobj()!.name}</p>)')
  })

  it('adds non-null assertion inside Else template branch when paired with negated If', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)
  return Component(
    <div>
      {If(!obj, <p>missing</p>)}
      {Else(<p>{obj.name}</p>)}
    </div>
  )
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('If(!æobj(), <p>missing</p>)')
    expect(transformed).toContain('Else(<p>{æobj()!.name}</p>)')
  })

  it('adds non-null assertion inside If/ElseIf render-function branch scopes', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)
  return Component(
    <div>
      {If(obj, () => <p>{obj.name}</p>)}
      {ElseIf(obj !== undefined, () => <p>{obj.name}</p>)}
    </div>
  )
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('If(æobj(), () => <p>{æobj()!.name}</p>)')
    expect(transformed).toContain('ElseIf(æobj() !== undefined, () => <p>{æobj()!.name}</p>)')
  })

  it('adds non-null assertion inside Else render-function branch when paired with negated If', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)
  return Component(
    <div>
      {If(!obj, () => <p>missing</p>)}
      {Else(() => <p>{obj.name}</p>)}
    </div>
  )
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('If(!æobj(), () => <p>missing</p>)')
    expect(transformed).toContain('Else(() => <p>{æobj()!.name}</p>)')
  })

  it('adds non-null assertion inside IfElse truthy render-function scope', () => {
    const input = `
function Demo() {
  get obj = ion({ name: 'kermit' } as { name: string } | undefined)
  const value = IfElse(obj, () => obj.name, () => 'none')
  return value
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain("const value = IfElse(æobj(), () => æobj()!.name, () => 'none')")
  })

  it('does not rewrite computed @ access forms', () => {
    const input = `
function Demo(obj: any, key: string) {
  get a = obj[key]@
  get b = obj?.[key]@
  return [a, b]
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('const æa = obj[key]@')
    expect(transformed).toContain('const æb = obj?.[key]@')
    expect(transformed).not.toContain('πæ(obj, key)')
    expect(transformed).not.toContain('obj == null ? undefined : πæ(obj, key)')
  })

  it('keeps nested destructuring syntax stable while still transforming marked bindings', () => {
    const input = `
function Demo(src: any) {
  const { top@, nested: { deep@ } } = src
  return top@
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('const { ætop, nested: { ædeep } } = src')
    expect(transformed).toContain('return ætop')
  })

  it('is idempotent across repeated transform passes', () => {
    const input = `
function Demo(obj: any) {
  get count = ion(0)
  get picked = obj.value@
  return <Comp value={(count + 1)} picked={picked}></Comp>
}
`

    const once = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    const twice = transformRXSSugarShared({ code: once, fileName: 'demo.rxs' }).code
    expect(twice).toBe(once)
  })

  it('rewrites typed reactive params and their reads in local scope', () => {
    const input = `
function FractionKitB(count@: Ion<number>) {
  const halfCount@ = ion((count / 2))
  return { get halfCount() { return halfCount } }
}
`

    const transformed = transformRXSSugarShared({ code: input, fileName: 'demo.rxs' }).code
    expect(transformed).toContain('function FractionKitB(æcount: Ion<number>)')
    expect(transformed).toContain('const æhalfCount = ion(() => æcount() / 2)')
    expect(transformed).toContain('return { get halfCount() { return æhalfCount() } }')
  })
})

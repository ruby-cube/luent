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

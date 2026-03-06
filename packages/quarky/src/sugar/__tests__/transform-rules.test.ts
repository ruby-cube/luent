import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformQuarkySugarShared } = require('../../../scripts/transform-quarky-sugar.shared.cjs') as {
  transformQuarkySugarShared: (input: { code: string; fileName: string }) => { code: string }
}

describe('quarky sugar + transforms', () => {
  it('rewrites destructured getter access to destructureØ and dot getter access to πø', () => {
    const input = `
function Demo(obj: any) {
  const { propertyA@, propertyB@, keep } = obj
  get readA = obj.propertyA@
  return [propertyA, propertyB@, readA@, keep]
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code

    expect(transformed).toContain('destructureØ')
    expect(transformed).toContain('πø')
    expect(transformed).toContain("const { øpropertyA, øpropertyB, keep } = destructureØ(obj, 'øpropertyA', 'øpropertyB', 'keep');")
    expect(transformed).toContain("const øreadA = πø(obj, 'propertyA')")
    expect(transformed).toContain('[øpropertyA(), øpropertyB, øreadA, keep]')
  })

  it('wraps object literals with property@ shorthand and get key:value using absorbØ', () => {
    const input = `
function CounterKit() {
  get count = Ion(0)

  const obj = { count@ }

  return {
    get halfCount: Ion((count / 2)),
    get something() {
      return 4;
    },
    normalProperty: 0
  }
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrk' }).code

    expect(transformed).toContain('import { absorbØ } from "@rue/quarky"')
    expect(transformed).toContain('const obj = absorbØ({')
    expect(transformed).toContain('øcount')
    expect(transformed).toContain("}, ['øcount'])")
    expect(transformed).toContain("πøsomething: function something() {")
    expect(transformed).toContain('return absorbØ({')
    expect(transformed).toContain('øhalfCount: Ion(() => øcount() / 2)')
    expect(transformed).toContain("['øhalfCount', 'πøsomething', 'normalProperty']")
  })

  it('adds keys array for object literals with invalid get key:value sugar', () => {
    const input = `
function Demo(value: number) {
  const obj = { get property: value }
  return obj
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code

    expect(transformed).toContain('import { absorbØ } from "@rue/quarky"')
    expect(transformed).toContain('const obj = absorbØ({')
    expect(transformed).toContain('øproperty: value')
    expect(transformed).toContain("}, ['øproperty'])")
  })

  it('keeps absorbØ transformed code safe when source object entries include // comments', () => {
    const input = `
function Demo() {
  get count = Ion(0)
  const obj = {
    count@,
    // keep this comment
    value: 1
  }
  return obj
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrk' }).code

    expect(transformed).toContain('const obj = absorbØ({')
    expect(transformed).toContain('// keep this comment')
    expect(transformed).toContain('value: 1')
    expect(transformed).toContain("}, ['øcount', 'value'])")
  })

  it('does not rewrite non-reactive @ declarations and assignments', () => {
    const input = `
function Demo() {
  const number@ = Ion(0)
  const something = {
    number@: Ion(0)
  }
  something.number@ = Ion(0)
  return something.number@
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code

    expect(transformed).toContain('const number@ = Ion(0)')
    expect(transformed).toContain('number@: Ion(0)')
    expect(transformed).toContain('something.number@ = Ion(0)')
    expect(transformed).toContain("return πø(something, 'number')")
  })

  it('uses ø helper for extraneous parens inside JSX expressions', () => {
    const input = `
function View({ show@ }) {
  get count = Ion(0)
  return <Comp value={(count + 1)} hidden={(show ? false : true)}></Comp>
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code

    expect(transformed).toContain('import { ø } from "@rue/quarky"')
    expect(transformed).toContain('value={ø(() => øcount() + 1)}')
    expect(transformed).toContain('hidden={ø(() => øshow() ? false : true)}')
  })

  it('does not leave a space after call paren when rewriting parenthesized call args', () => {
    const input = `
function View() {
  get count = Ion(0)
  return ø( (count + 1))
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code

    expect(transformed).toContain('return ø(() => øcount() + 1)')
    expect(transformed).not.toContain('ø( () =>')
  })

  it('normalizes spacing for Ion and other parenthesized-arrow rewrites', () => {
    const input = `
function Demo({ show@ }) {
  get count = Ion(0)
  const value = Ion( (count + 1))
  const list = [ (count + 2), (count + 3) ]
  const config = { compute: (count + 4) }
  return <Comp value={ (count + 5)} hidden={(show ? false : true)} value2={value} list={list} config={config}></Comp>
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code

    expect(transformed).toContain('const value = Ion(() => øcount() + 1)')
    expect(transformed).toContain('const list = [() => øcount() + 2, () => øcount() + 3 ]')
    expect(transformed).toContain('const config = { compute: () => øcount() + 4 }')
    expect(transformed).toContain('value={ø(() => øcount() + 5)}')
    expect(transformed).not.toContain('Ion( () =>')
    expect(transformed).not.toContain('[ () =>')
    expect(transformed).not.toContain('{ ø(() =>')
  })
})

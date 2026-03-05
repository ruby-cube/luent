import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformQuarkySugarShared } = require('../../../scripts/transform-quarky-sugar.shared.cjs') as {
  transformQuarkySugarShared: (input: { code: string; fileName: string }) => { code: string }
}

describe('quarky sugar + transforms', () => {
  it('rewrites destructured and dot getter access ending with @ to øø helper', () => {
    const input = `
function Demo(obj: any) {
  const { propertyA@, propertyB@, keep } = obj
  get readA = obj.propertyA@
  return [propertyA, propertyB@, readA@, keep]
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.qrx' }).code

    expect(transformed).toContain('import { øø } from "@rue/quarky"')
    expect(transformed).toContain('const { keep } = obj;')
    expect(transformed).toContain("const øpropertyA = øø(obj, 'propertyA');")
    expect(transformed).toContain("const øpropertyB = øø(obj, 'propertyB');")
    expect(transformed).toContain("const øreadA = øø(obj, 'propertyA')")
    expect(transformed).toContain('[øpropertyA(), øpropertyB, øreadA, keep]')
  })

  it('expands object literal property@ values into ø const + accessor getter', () => {
    const input = `
function FractionKit(count@) {
  return {
    halfCount@: Ion((count / 2)),
    thirdCount@: Ion((count / 3))
  }
}
`

    const transformed = transformQuarkySugarShared({ code: input, fileName: 'demo.lue' }).code

    expect(transformed).toContain('const øhalfCount = Ion(() => øcount() / 2);')
    expect(transformed).toContain('const øthirdCount = Ion(() => øcount() / 3);')
    expect(transformed).toContain('get halfCount() { return øhalfCount(); },')
    expect(transformed).toContain('get thirdCount() { return øthirdCount(); },')
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
})

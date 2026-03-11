import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformQRXSugarShared } = require('../../../scripts/transform-qrx-sugar.shared.cjs') as {
  transformQRXSugarShared: (
    input: { code: string; fileName: string },
    options?: { includeToTransformedPos?: boolean },
  ) => {
    code: string
    mapper: {
      toOriginalPos(pos: number): number
      toTransformedPos(pos: number): number
    }
  }
}

function offsetAt(source: string, needle: string) {
  const offset = source.indexOf(needle)
  expect(offset).toBeGreaterThanOrEqual(0)
  return offset
}

describe('qrx sugar position mapping', () => {
  const source = `
function Counter({ show@ }) {
  get count = Ion(0)
  const value = (count + 1)
  return <Comp value={(count + 2)} hidden={(show ? false : true)}>{count}</Comp>
}
`

  const transformed = transformQRXSugarShared(
    { code: source, fileName: 'Counter.qrx' },
    { includeToTransformedPos: true },
  )

  function expectRoundTripNear(originalOffset: number, maxDelta = 4) {
    const transformedOffset = transformed.mapper.toTransformedPos(originalOffset)
    const remappedOriginalOffset = transformed.mapper.toOriginalPos(transformedOffset)
    expect(Math.abs(remappedOriginalOffset - originalOffset)).toBeLessThanOrEqual(maxDelta)
  }

  it('keeps mapping stable for get declaration identifier', () => {
    const originalOffset = offsetAt(source, 'count = Ion')
    expectRoundTripNear(originalOffset)
  })

  it('keeps mapping stable for JSX derivation shorthand span', () => {
    const originalOffset = offsetAt(source, '(count + 2)') + 1
    expectRoundTripNear(originalOffset, 8)
  })

  it('keeps mapping stable for reactive read in JSX body', () => {
    const originalOffset = offsetAt(source, '{count}') + 1
    expectRoundTripNear(originalOffset)
  })

  it('emits transformed reactive helpers', () => {
    expect(transformed.code).toContain('const æcount = Ion(0)')
    expect(transformed.code).toContain('value={æ(() => æcount() + 2)}')
    expect(transformed.code).toContain('{æcount()}')
  })

  it('keeps mapping stable inside absorbØ initializer expressions', () => {
    const absorbSource = `
function Kit(value: number) {
  return {
    get count: Ion((value + 1)),
    normalProperty: value
  }
}
`

    const absorbTransformed = transformQRXSugarShared(
      { code: absorbSource, fileName: 'Kit.qrx' },
      { includeToTransformedPos: true },
    )

    const originalOffset = offsetAt(absorbSource, 'value + 1') + 3
    const transformedOffset = absorbTransformed.mapper.toTransformedPos(originalOffset)
    const remappedOriginalOffset = absorbTransformed.mapper.toOriginalPos(transformedOffset)

    expect(Math.abs(remappedOriginalOffset - originalOffset)).toBeLessThanOrEqual(2)
  })

  it('keeps mapping stable for JSX sibling-parens fragment rewrites', () => {
    const jsxFragmentSource = `
function View() {
  get count = Ion(0)
  return (
    <Label value={(count + 1)} />
    <Label value={(count + 2)} />
  )
}
`

    const jsxFragmentTransformed = transformQRXSugarShared(
      { code: jsxFragmentSource, fileName: 'View.qrx' },
      { includeToTransformedPos: true },
    )

    const originalOffset = offsetAt(jsxFragmentSource, '(count + 2)') + 2
    const transformedOffset = jsxFragmentTransformed.mapper.toTransformedPos(originalOffset)
    const remappedOriginalOffset = jsxFragmentTransformed.mapper.toOriginalPos(transformedOffset)

    expect(Math.abs(remappedOriginalOffset - originalOffset)).toBeLessThanOrEqual(2)
  })
})

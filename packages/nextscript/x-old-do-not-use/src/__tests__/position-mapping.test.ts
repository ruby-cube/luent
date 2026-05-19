import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformNSXSugarShared } = require('../../scripts/transform-nsx-sugar.shared.cjs') as {
  transformNSXSugarShared: (
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

describe('nsx sugar position mapping', () => {
  const source = `
function Counter({ show@ }) {
  get count = ion(0)
  const value = (count + 1)
  return <Comp value={(count + 2)} hidden={(show ? false : true)}>{count}</Comp>
}
`

  const transformed = transformNSXSugarShared(
    { code: source, fileName: 'Counter.nsx' },
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
    expect(transformed.code).toContain('const æcount = ion(0)')
    expect(transformed.code).toContain('value={() => æcount() + 2}')
    expect(transformed.code).toContain('{æcount()}')
  })

  it('keeps mapping stable inside absorbØ initializer expressions', () => {
    const absorbSource = `
function Kit(value: number) {
  return {
    get count: ion((value + 1)),
    normalProperty: value
  }
}
`

    const absorbTransformed = transformNSXSugarShared(
      { code: absorbSource, fileName: 'Kit.nsx' },
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
  get count = ion(0)
  return (
    <Label value={(count + 1)} />
    <Label value={(count + 2)} />
  )
}
`

    const jsxFragmentTransformed = transformNSXSugarShared(
      { code: jsxFragmentSource, fileName: 'View.nsx' },
      { includeToTransformedPos: true },
    )

    const originalOffset = offsetAt(jsxFragmentSource, '(count + 2)') + 2
    const transformedOffset = jsxFragmentTransformed.mapper.toTransformedPos(originalOffset)
    const remappedOriginalOffset = jsxFragmentTransformed.mapper.toOriginalPos(transformedOffset)

    expect(Math.abs(remappedOriginalOffset - originalOffset)).toBeLessThanOrEqual(2)
  })
})

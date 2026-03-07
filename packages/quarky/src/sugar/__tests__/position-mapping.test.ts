import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformQuarkySugarShared } = require('../../../scripts/transform-quarky-sugar.shared.cjs') as {
  transformQuarkySugarShared: (
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

  const transformed = transformQuarkySugarShared(
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
    expect(transformed.code).toContain('const øcount = Ion(0)')
    expect(transformed.code).toContain('value={ø(() => øcount() + 2)}')
    expect(transformed.code).toContain('{øcount()}')
  })
})

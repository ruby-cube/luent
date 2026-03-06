import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { transformQuarkySugarShared } = require('../../../scripts/transform-quarky-sugar.shared.cjs') as {
  transformQuarkySugarShared: (input: { code: string; fileName: string }, options?: { includeToTransformedPos?: boolean }) => {
    code: string
    mapper: {
      toOriginalPos(pos: number): number
      toTransformedPos(pos: number): number
    }
  }
}

function offsetAt(source: string, lineNumber: number, columnNumber: number) {
  const lines = source.split('\n')
  const prefixLength = lines.slice(0, lineNumber - 1).reduce((sum, line) => sum + line.length + 1, 0)
  return prefixLength + (columnNumber - 1)
}

function lineColumnAt(source: string, offset: number) {
  const safeOffset = Math.max(0, Math.min(source.length, offset))
  const lines = source.split('\n')
  let consumed = 0

  for (let index = 0; index < lines.length; index += 1) {
    const lineLength = lines[index].length
    const lineEnd = consumed + lineLength
    if (safeOffset <= lineEnd) {
      return {
        line: index + 1,
        column: safeOffset - consumed + 1,
      }
    }
    consumed = lineEnd + 1
  }

  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length || 0) + 1,
  }
}

describe('qrx sugar position mapping', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const filePath = path.resolve(currentDir, '../../../../../apps/play/src/Counter.qrx')
  const source = fs.readFileSync(filePath, 'utf8')
  const transformed = transformQuarkySugarShared(
    { code: source, fileName: filePath },
    { includeToTransformedPos: true },
  )

  function expectRoundTripNear(originalOffset: number, maxDelta = 3) {
    const transformedOffset = transformed.mapper.toTransformedPos(originalOffset)
    const remappedOriginalOffset = transformed.mapper.toOriginalPos(transformedOffset)
    expect(Math.abs(remappedOriginalOffset - originalOffset)).toBeLessThanOrEqual(maxDelta)
  }

  it('maps get-variable reads inside extraneous-parens JSX expression to inner transformed identifier', () => {
    const originalOffset = offsetAt(source, 40, 28)

    expect(transformed.code).toContain('ø(() => øcount() * 3)')
    expectRoundTripNear(originalOffset)
  })

  it('maps get-variable reads inside parenthesized expressions for Ion initializers', () => {
    const doubleCountExprIndex = source.indexOf('(count * 2)')
    const halfCountExprIndex = source.indexOf('(count / 2)')
    const thirdCountExprIndex = source.indexOf('(count / 3)')

    expect(doubleCountExprIndex).toBeGreaterThanOrEqual(0)
    expect(halfCountExprIndex).toBeGreaterThanOrEqual(0)
    expect(thirdCountExprIndex).toBeGreaterThanOrEqual(0)

    const line11Offset = doubleCountExprIndex + 1
    const line52Offset = halfCountExprIndex + 1
    const line53Offset = thirdCountExprIndex + 1

    expectRoundTripNear(line11Offset)
    expectRoundTripNear(line52Offset, 24)
    expectRoundTripNear(line53Offset, 24)
  })

  it('keeps halfCount/thirdCount mapped to distinct original authored ranges', () => {
    const halfToken = '{øhalfCount}'
    const thirdToken = transformed.code.includes('{øthirdCount}') ? '{øthirdCount}' : '{thirdCount}'
    const halfTransformedOffset = transformed.code.indexOf(halfToken) + 1
    const thirdTransformedOffset = transformed.code.indexOf(thirdToken) + 1

    expect(halfTransformedOffset).toBeGreaterThan(0)
    expect(thirdTransformedOffset).toBeGreaterThan(0)

    const halfOriginalOffset = transformed.mapper.toOriginalPos(halfTransformedOffset)
    const thirdOriginalOffset = transformed.mapper.toOriginalPos(thirdTransformedOffset)

    const halfOriginalWindow = source.slice(Math.max(0, halfOriginalOffset - 32), Math.min(source.length, halfOriginalOffset + 32))
    const thirdOriginalWindow = source.slice(Math.max(0, thirdOriginalOffset - 32), Math.min(source.length, thirdOriginalOffset + 32))

    expect(/halfCount/.test(halfOriginalWindow)).toBe(true)
    expect(/thirdCount/.test(thirdOriginalWindow)).toBe(true)
    expect(thirdOriginalOffset).toBeGreaterThan(halfOriginalOffset)
  })
})
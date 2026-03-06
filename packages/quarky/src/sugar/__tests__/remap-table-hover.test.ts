import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const {
  transformQuarkySugarShared,
  toOriginalPosFromRemapTable,
  mapTextSpanFromRemapTable,
} = require('../../../scripts/transform-quarky-sugar.shared.cjs') as {
  transformQuarkySugarShared: (
    input: { code: string; fileName: string },
    options?: { includeToTransformedPos?: boolean },
  ) => {
    code: string
    mapper: {
      toOriginalPos(pos: number): number
      toTransformedPos(pos: number): number
    }
    remapTable: {
      version: number
      originalLength: number
      transformedLength: number
      runs: Array<{
        transformedStart: number
        transformedEnd: number
        originalStart: number
        step: number
      }>
    }
  }
  toOriginalPosFromRemapTable: (
    remapTable: {
      version: number
      originalLength: number
      transformedLength: number
      runs: Array<{
        transformedStart: number
        transformedEnd: number
        originalStart: number
        step: number
      }>
    },
    transformedPos: number,
  ) => number
  mapTextSpanFromRemapTable: (
    remapTable: {
      version: number
      originalLength: number
      transformedLength: number
      runs: Array<{
        transformedStart: number
        transformedEnd: number
        originalStart: number
        step: number
      }>
    },
    span: { start: number; length: number },
  ) => { start: number; length: number }
}

describe('remap table scaffold', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const filePath = path.resolve(currentDir, '../../../../../apps/play/src/Counter.qrx')
  const source = fs.readFileSync(filePath, 'utf8')
  const transformed = transformQuarkySugarShared(
    { code: source, fileName: filePath },
    { includeToTransformedPos: true },
  )

  it('round-trips toOriginalPos through remap table for sampled positions', () => {
    const samplePositions = [0, 1, 8, 30, 64, 120, 180, 240, 320, 480, 640, transformed.code.length]

    for (const transformedPos of samplePositions) {
      const expected = transformed.mapper.toOriginalPos(transformedPos)
      const actual = toOriginalPosFromRemapTable(transformed.remapTable, transformedPos)
      expect(actual).toBe(expected)
    }
  })

  it.fails('maps transformed Ion span in thirdCount initializer back to line 58 Ion span', () => {
    const transformedNeedle = 'øthirdCount: Ion(() => øcount() / 3)'
    const transformedNeedleIndex = transformed.code.indexOf(transformedNeedle)
    expect(transformedNeedleIndex).toBeGreaterThanOrEqual(0)

    const transformedIonStart = transformedNeedleIndex + 'øthirdCount: '.length
    const mappedIonSpan = mapTextSpanFromRemapTable(transformed.remapTable, {
      start: transformedIonStart,
      length: 'Ion'.length,
    })

    const expectedOriginalLineNeedle = 'get thirdCount: Ion((count / 3))'
    const expectedOriginalLineIndex = source.lastIndexOf(expectedOriginalLineNeedle)
    expect(expectedOriginalLineIndex).toBeGreaterThanOrEqual(0)

    const expectedIonStart = expectedOriginalLineIndex + 'get thirdCount: '.length
    expect(mappedIonSpan).toEqual({
      start: expectedIonStart,
      length: 'Ion'.length,
    })
  })
})

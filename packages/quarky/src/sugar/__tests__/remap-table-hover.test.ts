import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  mapTextSpanFromSourceMap,
  toTransformedPosFromSourceMap,
  toOriginalPosFromSourceMap,
  transformQuarkySugarShared,
  toOriginalPosFromRemapTable,
  mapTextSpanFromRemapTable,
} = require('../../../scripts/transform-quarky-sugar.shared.cjs') as {
  mapTextSpanFromSourceMap: (
    sourceMap: {
      version: number
      kind: string
      source: string
      originalLength: number
      generatedLength: number
      segments: Array<{
        generatedStart: number
        generatedEnd: number
        originalStart: number
        step: number
      }>
    },
    span: { start: number; length: number },
  ) => { start: number; length: number }
  toOriginalPosFromSourceMap: (
    sourceMap: {
      version: number
      kind: string
      source: string
      originalLength: number
      generatedLength: number
      segments: Array<{
        generatedStart: number
        generatedEnd: number
        originalStart: number
        step: number
      }>
    },
    generatedPos: number,
  ) => number
  toTransformedPosFromSourceMap: (
    sourceMap: {
      version: number
      kind: string
      source: string
      originalLength: number
      generatedLength: number
      segments: Array<{
        generatedStart: number
        generatedEnd: number
        originalStart: number
        step: number
      }>
    },
    originalPos: number,
  ) => number
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
    sourceMap: {
      version: number
      kind: string
      source: string
      originalLength: number
      generatedLength: number
      segments: Array<{
        generatedStart: number
        generatedEnd: number
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

describe('remap table', () => {
  const source = `
function FractionKit(count@) {
  get halfCount = Ion((count / 2))
  return { get halfCount: Ion((count / 2)) }
}
`

  const transformed = transformQuarkySugarShared(
    { code: source, fileName: 'FractionKit.qrx' },
    { includeToTransformedPos: true },
  )

  it('round-trips mapper.toOriginalPos via remap table on sampled offsets', () => {
    const samplePositions = [0, 1, 8, 24, 48, 96, transformed.code.length]

    for (const transformedPos of samplePositions) {
      const expected = transformed.mapper.toOriginalPos(transformedPos)
      const actual = toOriginalPosFromRemapTable(transformed.remapTable, transformedPos)
      expect(actual).toBe(expected)
    }
  })

  it('round-trips mapper.toOriginalPos via source map on sampled offsets', () => {
    const samplePositions = [0, 1, 8, 24, 48, 96, transformed.code.length]

    for (const transformedPos of samplePositions) {
      const expected = transformed.mapper.toOriginalPos(transformedPos)
      const actual = toOriginalPosFromSourceMap(transformed.sourceMap, transformedPos)
      expect(actual).toBe(expected)
    }
  })

  it('matches mapper.toTransformedPos via source map on sampled authored offsets', () => {
    const sampleOriginalPositions = [0, 1, 8, 24, 48, 96, source.length]

    for (const originalPos of sampleOriginalPositions) {
      const expected = transformed.mapper.toTransformedPos(originalPos)
      const actual = toTransformedPosFromSourceMap(transformed.sourceMap, originalPos)
      expect(actual).toBe(expected)
    }
  })

  it('maps transformed span into authored source span', () => {
    const transformedNeedle = 'øhalfCount'
    const transformedNeedleIndex = transformed.code.indexOf(transformedNeedle)
    expect(transformedNeedleIndex).toBeGreaterThanOrEqual(0)

    const mappedSpan = mapTextSpanFromRemapTable(transformed.remapTable, {
      start: transformedNeedleIndex,
      length: transformedNeedle.length,
    })

    const mappedText = source.slice(mappedSpan.start, mappedSpan.start + mappedSpan.length)
    expect(mappedText.includes('halfCount')).toBe(true)
  })

  it('maps transformed span into authored source span via source map', () => {
    const transformedNeedle = 'øhalfCount'
    const transformedNeedleIndex = transformed.code.indexOf(transformedNeedle)
    expect(transformedNeedleIndex).toBeGreaterThanOrEqual(0)

    const mappedSpan = mapTextSpanFromSourceMap(transformed.sourceMap, {
      start: transformedNeedleIndex,
      length: transformedNeedle.length,
    })

    const mappedText = source.slice(mappedSpan.start, mappedSpan.start + mappedSpan.length)
    expect(mappedText.includes('halfCount')).toBe(true)
  })

  it('maps helper identifiers to zero-width authored positions', () => {
    const helperSource = `
function Counter(count@: Ion<number>) {
  const { halfCountA@, thirdCountA@ } = FractionKit(count@)
  get picked = FractionKit(count@).halfCount@
  return { get value: Ion((count / 2)), picked@ }
}
`

    const helperTransformed = transformQuarkySugarShared(
      { code: helperSource, fileName: 'Counter.qrx' },
      { includeToTransformedPos: true },
    )

    for (const helperName of ['destructureØ', 'πø', 'absorbØ']) {
      const helperIndex = helperTransformed.code.indexOf(helperName)
      expect(helperIndex).toBeGreaterThanOrEqual(0)

      const mappedSpan = mapTextSpanFromSourceMap(helperTransformed.sourceMap, {
        start: helperIndex,
        length: helperName.length,
      })

      expect(mappedSpan.length).toBe(1)
      const startPos = toOriginalPosFromSourceMap(helperTransformed.sourceMap, helperIndex)
      const endPos = toOriginalPosFromSourceMap(helperTransformed.sourceMap, helperIndex + helperName.length - 1)
      expect(endPos).toBe(startPos)
    }
  })

  it('maps helper synthetic argument tails to zero-width authored positions', () => {
    const helperSource = `
function Counter(count@: Ion<number>) {
  const { halfCountA@, thirdCountA@ } = FractionKit(count@)
  get picked = FractionKit(count@).halfCount@
  return { get value: Ion((count / 2)), picked@ }
}
`

    const helperTransformed = transformQuarkySugarShared(
      { code: helperSource, fileName: 'Counter.qrx' },
      { includeToTransformedPos: true },
    )

    const syntheticNeedles = [", 'øthirdCountA')", ", 'halfCount')", ", ['øvalue'])"]

    for (const needle of syntheticNeedles) {
      const start = helperTransformed.code.indexOf(needle)
      expect(start).toBeGreaterThanOrEqual(0)

      const mappedSpan = mapTextSpanFromSourceMap(helperTransformed.sourceMap, {
        start,
        length: needle.length,
      })

      expect(mappedSpan.length).toBe(1)
      const startPos = toOriginalPosFromSourceMap(helperTransformed.sourceMap, start)
      const endPos = toOriginalPosFromSourceMap(helperTransformed.sourceMap, start + needle.length - 1)
      expect(endPos).toBe(startPos)
    }
  })

  it('treats Ø/ø/π as single UTF-16 units for mapping purposes', () => {
    expect('Ø'.length).toBe(1)
    expect('ø'.length).toBe(1)
    expect('π'.length).toBe(1)

    const unicodeSource = `
function Counter(count@: Ion<number>) {
  return { get value: Ion((count / 2)) }
}
`

    const unicodeTransformed = transformQuarkySugarShared(
      { code: unicodeSource, fileName: 'Counter.qrx' },
      { includeToTransformedPos: true },
    )

    const presentHelpers = ['absorbØ', 'πø'].filter((helperName) => unicodeTransformed.code.includes(helperName))
    expect(presentHelpers.length).toBeGreaterThan(0)

    for (const helperName of presentHelpers) {
      const helperIndex = unicodeTransformed.code.indexOf(helperName)
      expect(helperIndex).toBeGreaterThanOrEqual(0)

      const anchor = toOriginalPosFromSourceMap(unicodeTransformed.sourceMap, helperIndex)
      const end = toOriginalPosFromSourceMap(unicodeTransformed.sourceMap, helperIndex + helperName.length - 1)
      expect(end).toBe(anchor)
    }
  })

})

import { transformQuarkySugar } from './transform-quarky-sugar.mjs'

const SUGAR_IDENTIFIER_RE = /^ø[A-Za-z_$][\w$]*$/

function getLineStarts(text) {
  const starts = [0]

  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) {
      starts.push(index + 1)
    }
  }

  return starts
}

function offsetFromLoc(lineStarts, textLength, line, column) {
  const safeLine = Math.max(1, line || 1)
  const safeColumn = Math.max(1, column || 1)
  const lineIndex = Math.min(safeLine - 1, lineStarts.length - 1)
  const lineStart = lineStarts[lineIndex] ?? 0
  const offset = lineStart + safeColumn - 1

  return Math.max(0, Math.min(textLength, offset))
}

function locFromOffset(lineStarts, textLength, offset) {
  const safeOffset = Math.max(0, Math.min(textLength, offset))
  let low = 0
  let high = lineStarts.length - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    const lineStart = lineStarts[mid]
    const nextStart = mid + 1 < lineStarts.length ? lineStarts[mid + 1] : textLength + 1

    if (safeOffset < lineStart) {
      high = mid - 1
      continue
    }

    if (safeOffset >= nextStart) {
      low = mid + 1
      continue
    }

    return {
      line: mid + 1,
      column: safeOffset - lineStart + 1,
    }
  }

  const fallbackLine = Math.max(0, Math.min(lineStarts.length - 1, low))
  return {
    line: fallbackLine + 1,
    column: safeOffset - (lineStarts[fallbackLine] ?? 0) + 1,
  }
}

function findBestNearbyOriginalIdentifierRange(source, transformedSlice, approximateStart) {
  if (typeof transformedSlice !== 'string') return null
  if (!SUGAR_IDENTIFIER_RE.test(transformedSlice)) return null

  const identifier = transformedSlice.slice(1)
  const windowStart = Math.max(0, approximateStart - 80)
  const windowEnd = Math.min(source.length, approximateStart + 80)
  const candidates = []

  function collect(token, includeAt) {
    let index = source.indexOf(token, windowStart)
    while (index >= 0 && index < windowEnd) {
      candidates.push({
        start: index,
        length: includeAt ? identifier.length + 1 : identifier.length,
        distance: Math.abs(index - approximateStart),
        priority: includeAt ? 0 : 1,
      })
      index = source.indexOf(token, index + 1)
    }
  }

  collect(`${identifier}@`, true)
  collect(identifier, false)

  if (candidates.length === 0) return null

  candidates.sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority
    if (left.distance !== right.distance) return left.distance - right.distance
    return left.start - right.start
  })

  const best = candidates[0]
  return [best.start, Math.min(source.length, best.start + best.length)]
}

function mapOffsetRangeToOriginal(entry, transformedStart, transformedEnd) {
  const safeTransformedStart = Math.max(0, Math.min(entry.transformedCode.length, transformedStart))
  const safeTransformedEnd = Math.max(safeTransformedStart, Math.min(entry.transformedCode.length, transformedEnd))
  const transformedSlice = entry.transformedCode.slice(safeTransformedStart, safeTransformedEnd)

  const correctedIdentifierRange = findBestNearbyOriginalIdentifierRange(
    entry.source,
    transformedSlice,
    entry.mapper.toOriginalPos(safeTransformedStart),
  )
  if (correctedIdentifierRange) {
    return correctedIdentifierRange
  }

  if (safeTransformedEnd <= safeTransformedStart) {
    const point = entry.mapper.toOriginalPos(safeTransformedStart)
    return [point, point]
  }

  let firstMapped = null
  let lastMapped = null
  let matchedCount = 0

  for (let transformedPos = safeTransformedStart; transformedPos < safeTransformedEnd; transformedPos += 1) {
    const transformedChar = entry.transformedCode[transformedPos]
    if (typeof transformedChar !== 'string') continue

    const mappedOriginal = entry.mapper.toOriginalPos(transformedPos)
    if (mappedOriginal < 0 || mappedOriginal >= entry.source.length) continue

    if (entry.source[mappedOriginal] !== transformedChar) continue

    matchedCount += 1
    if (firstMapped == null) firstMapped = mappedOriginal
    lastMapped = mappedOriginal
  }

  if (matchedCount > 0 && firstMapped != null && lastMapped != null) {
    const mappedStart = Math.min(firstMapped, lastMapped)
    let mappedEnd = Math.max(firstMapped, lastMapped)
    const transformedLooksLikeSugarIdentifier = SUGAR_IDENTIFIER_RE.test(transformedSlice)
    if (
      transformedLooksLikeSugarIdentifier
      && mappedEnd + 1 < entry.source.length
      && entry.source[mappedEnd + 1] === '@'
    ) {
      mappedEnd += 1
    }

    const correctedIdentifierRange = findBestNearbyOriginalIdentifierRange(
      entry.source,
      transformedSlice,
      mappedStart,
    )
    if (correctedIdentifierRange) {
      return correctedIdentifierRange
    }

    return [mappedStart, Math.min(entry.source.length, mappedEnd + 1)]
  }

  const mappedStart = entry.mapper.toOriginalPos(safeTransformedStart)
  const mappedEnd = entry.mapper.toOriginalPos(safeTransformedEnd)
  const rangeStart = Math.max(0, Math.min(entry.source.length, Math.min(mappedStart, mappedEnd)))
  const rangeEnd = Math.max(rangeStart, Math.min(entry.source.length, Math.max(mappedStart, mappedEnd)))

  return [rangeStart, rangeEnd]
}

export function createQrxProcessor() {
  const cache = new Map()

  return {
    supportsAutofix: true,

    preprocess(text, filename) {
      if (!filename.endsWith('.qrx')) {
        return [text]
      }

      try {
        const transformed = transformQuarkySugar({
          code: text,
          fileName: filename,
        })

        cache.set(filename, {
          source: text,
          transformedCode: transformed.code,
          mapper: transformed.mapper,
        })

        return [transformed.code]
      } catch {
        cache.delete(filename)
        return [text]
      }
    },

    postprocess(messageLists, filename) {
      const messages = messageLists[0] ?? []
      const entry = cache.get(filename)
      cache.delete(filename)

      if (!entry) {
        return messages
      }

      const sourceLineStarts = getLineStarts(entry.source)
      const transformedLineStarts = getLineStarts(entry.transformedCode)
      const sourceLength = entry.source.length
      const transformedLength = entry.transformedCode.length

      return messages.map((message) => {
        const nextMessage = { ...message }

        const transformedStart = offsetFromLoc(
          transformedLineStarts,
          transformedLength,
          message.line,
          message.column,
        )
        const hasEndLoc = typeof message.endLine === 'number' && typeof message.endColumn === 'number'
        const transformedEnd = hasEndLoc
          ? offsetFromLoc(
            transformedLineStarts,
            transformedLength,
            message.endLine,
            message.endColumn,
          )
          : transformedStart

        const [originalStart, originalEnd] = mapOffsetRangeToOriginal(entry, transformedStart, transformedEnd)
        const originalStartLoc = locFromOffset(sourceLineStarts, sourceLength, originalStart)

        nextMessage.line = originalStartLoc.line
        nextMessage.column = originalStartLoc.column

        if (hasEndLoc) {
          const originalEndLoc = locFromOffset(sourceLineStarts, sourceLength, originalEnd)

          nextMessage.endLine = originalEndLoc.line
          nextMessage.endColumn = originalEndLoc.column
        }

        if (message.fix && Array.isArray(message.fix.range) && message.fix.range.length === 2) {
          const [fixStart, fixEnd] = message.fix.range
          const [originalFixStart, originalFixEnd] = mapOffsetRangeToOriginal(entry, fixStart, fixEnd)

          nextMessage.fix = {
            ...message.fix,
            range: [originalFixStart, originalFixEnd],
          }
        }

        return nextMessage
      })
    },
  }
}

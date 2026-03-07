import { transformQuarkySugar } from './transform-quarky-sugar.mjs'

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

function mapOffsetRangeToOriginal(entry, transformedStart, transformedEnd) {
  const safeStart = Math.max(0, Math.min(entry.transformedCode.length, transformedStart))
  const safeEnd = Math.max(safeStart, Math.min(entry.transformedCode.length, transformedEnd))

  if (safeEnd <= safeStart) {
    const point = entry.mapper.toOriginalPos(safeStart)
    return [point, point]
  }

  const mappedStart = entry.mapper.toOriginalPos(safeStart)
  const mappedEnd = entry.mapper.toOriginalPos(safeEnd)

  return [
    Math.max(0, Math.min(entry.source.length, Math.min(mappedStart, mappedEnd))),
    Math.max(0, Math.min(entry.source.length, Math.max(mappedStart, mappedEnd))),
  ]
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

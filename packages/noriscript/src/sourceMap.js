import { GenMapping, maybeAddSegment, setSourceContent, toEncodedMap } from '@jridgewell/gen-mapping';
export function codeMappingsToSourceMap(sourceFile, generatedFile, source, generated, mappings) {
    const map = new GenMapping({ file: generatedFile });
    const sourceLineStarts = getLineStarts(source);
    const generatedLineStarts = getLineStarts(generated);
    setSourceContent(map, sourceFile, source);
    for (const mapping of mappings) {
        const generatedLengths = mapping.generatedLengths ?? mapping.lengths;
        const count = Math.min(mapping.sourceOffsets.length, mapping.generatedOffsets.length, mapping.lengths.length, generatedLengths.length);
        for (let index = 0; index < count; index++) {
            const sourceOffset = mapping.sourceOffsets[index];
            const generatedOffset = mapping.generatedOffsets[index];
            const sourceLength = mapping.lengths[index];
            const generatedLength = generatedLengths[index];
            if (sourceLength <= 0 || generatedLength <= 0)
                continue;
            addSpanBoundarySegments(map, sourceFile, sourceLineStarts, generatedLineStarts, sourceOffset, generatedOffset, sourceLength, generatedLength, source);
        }
    }
    return toEncodedMap(map);
}
function addSpanBoundarySegments(map, sourceFile, sourceLineStarts, generatedLineStarts, sourceOffset, generatedOffset, sourceLength, generatedLength, sourceContent) {
    addOffsetSegment(map, sourceFile, sourceLineStarts, generatedLineStarts, sourceOffset, generatedOffset, sourceContent);
    if (generatedLength === 1 || sourceLength === 1)
        return;
    const generatedEndOffset = generatedOffset + generatedLength - 1;
    const sourceEndOffset = sourceOffset + sourceLength - 1;
    if (generatedEndOffset > generatedOffset && sourceEndOffset > sourceOffset) {
        addOffsetSegment(map, sourceFile, sourceLineStarts, generatedLineStarts, sourceEndOffset, generatedEndOffset, sourceContent);
    }
}
function addOffsetSegment(map, sourceFile, sourceLineStarts, generatedLineStarts, sourceOffset, generatedOffset, sourceContent) {
    const generatedPosition = offsetToPosition(generatedOffset, generatedLineStarts);
    const sourcePosition = offsetToPosition(sourceOffset, sourceLineStarts);
    maybeAddSegment(map, generatedPosition.line, generatedPosition.column, sourceFile, sourcePosition.line, sourcePosition.column, null, sourceContent);
}
function getLineStarts(text) {
    const lineStarts = [0];
    for (let index = 0; index < text.length; index++) {
        if (text.charCodeAt(index) === 10) {
            lineStarts.push(index + 1);
        }
    }
    return lineStarts;
}
function offsetToPosition(offset, lineStarts) {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low <= high) {
        const middle = (low + high) >> 1;
        const lineStart = lineStarts[middle];
        const nextLineStart = lineStarts[middle + 1] ?? Number.POSITIVE_INFINITY;
        if (offset < lineStart) {
            high = middle - 1;
            continue;
        }
        if (offset >= nextLineStart) {
            low = middle + 1;
            continue;
        }
        return {
            line: middle,
            column: offset - lineStart
        };
    }
    const lastLine = lineStarts.length - 1;
    return {
        line: lastLine,
        column: Math.max(0, offset - lineStarts[lastLine])
    };
}

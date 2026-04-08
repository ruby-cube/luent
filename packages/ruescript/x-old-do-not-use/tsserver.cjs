const {
  mapTextSpanFromRemapTable,
  mapTextSpanFromSourceMap,
  toTransformedPosFromSourceMap,
  toOriginalPosFromRemapTable,
  toOriginalPosFromSourceMap,
  transformRXSSugarShared,
} = require('./scripts/transform-rxs-sugar.shared.cjs')

function transformRXSSugar(input) {
  return transformRXSSugarShared(input, { includeToTransformedPos: true })
}

module.exports = {
  mapTextSpanFromRemapTable,
  mapTextSpanFromSourceMap,
  toTransformedPosFromSourceMap,
  toOriginalPosFromRemapTable,
  toOriginalPosFromSourceMap,
  transformRXSSugar,
}
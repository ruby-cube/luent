const {
  mapTextSpanFromRemapTable,
  mapTextSpanFromSourceMap,
  toTransformedPosFromSourceMap,
  toOriginalPosFromRemapTable,
  toOriginalPosFromSourceMap,
  transformNSXSugarShared,
} = require('./scripts/transform-nsx-sugar.shared.cjs')

function transformNSXSugar(input) {
  return transformNSXSugarShared(input, { includeToTransformedPos: true })
}

module.exports = {
  mapTextSpanFromRemapTable,
  mapTextSpanFromSourceMap,
  toTransformedPosFromSourceMap,
  toOriginalPosFromRemapTable,
  toOriginalPosFromSourceMap,
  transformNSXSugar,
}
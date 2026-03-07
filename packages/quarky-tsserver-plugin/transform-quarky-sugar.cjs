const {
  mapTextSpanFromRemapTable,
  mapTextSpanFromSourceMap,
  toTransformedPosFromSourceMap,
  toOriginalPosFromRemapTable,
  toOriginalPosFromSourceMap,
  transformQuarkySugarShared,
} = require('../quarky/scripts/transform-quarky-sugar.shared.cjs')

function transformQuarkySugar(input) {
  return transformQuarkySugarShared(input, { includeToTransformedPos: true })
}

module.exports = {
  mapTextSpanFromRemapTable,
  mapTextSpanFromSourceMap,
  toTransformedPosFromSourceMap,
  toOriginalPosFromRemapTable,
  toOriginalPosFromSourceMap,
  transformQuarkySugar,
}

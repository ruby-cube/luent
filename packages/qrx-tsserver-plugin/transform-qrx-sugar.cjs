const {
  mapTextSpanFromRemapTable,
  mapTextSpanFromSourceMap,
  toTransformedPosFromSourceMap,
  toOriginalPosFromRemapTable,
  toOriginalPosFromSourceMap,
  transformQRXSugarShared,
} = require('../qrx/scripts/transform-qrx-sugar.shared.cjs')

function transformQRXSugar(input) {
  return transformQRXSugarShared(input, { includeToTransformedPos: true })
}

module.exports = {
  mapTextSpanFromRemapTable,
  mapTextSpanFromSourceMap,
  toTransformedPosFromSourceMap,
  toOriginalPosFromRemapTable,
  toOriginalPosFromSourceMap,
  transformQRXSugar,
}

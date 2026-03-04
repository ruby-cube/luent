// Thin wrapper: edit ../quarky/scripts/transform-quarky-sugar.shared.cjs for transformer logic.
const { transformQuarkySugarShared } = require('../quarky/scripts/transform-quarky-sugar.shared.cjs')

function transformQuarkySugar(input) {
  return transformQuarkySugarShared(input, { includeToTransformedPos: true })
}

module.exports = {
  transformQuarkySugar,
}

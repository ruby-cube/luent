const { transformNSXSugarShared } = require('./scripts/transform-nsx-sugar.shared.cjs')

function transformNSXSugar(input) {
  return transformNSXSugarShared(input)
}

module.exports = {
  transformNSXSugar,
}
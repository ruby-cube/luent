const { transformRXSSugarShared } = require('./scripts/transform-rxs-sugar.shared.cjs')

function transformRXSSugar(input) {
  return transformRXSSugarShared(input)
}

module.exports = {
  transformRXSSugar,
}
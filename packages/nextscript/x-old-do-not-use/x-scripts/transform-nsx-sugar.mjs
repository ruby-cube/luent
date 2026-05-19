import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformNSXSugarShared } = require('./transform-nsx-sugar.shared.cjs')

export function transformNSXSugar(input) {
  return transformNSXSugarShared(input)
}

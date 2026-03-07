import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformQuarkySugarShared } = require('./transform-quarky-sugar.shared.cjs')

export function transformQuarkySugar(input) {
  return transformQuarkySugarShared(input)
}

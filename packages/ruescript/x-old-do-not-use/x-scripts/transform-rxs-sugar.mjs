import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformRXSSugarShared } = require('./transform-rxs-sugar.shared.cjs')

export function transformRXSSugar(input) {
  return transformRXSSugarShared(input)
}

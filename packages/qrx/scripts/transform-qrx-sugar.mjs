import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformQRXSugarShared } = require('./transform-qrx-sugar.shared.cjs')

export function transformQRXSugar(input) {
  return transformQRXSugarShared(input)
}

// Thin wrapper: edit ./transform-quarky-sugar.shared.cjs for transformer logic.
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformQuarkySugarShared } = require('./transform-quarky-sugar.shared.cjs')

/**
 * @typedef {{
 *   toOriginalPos(pos: number): number
 * }} PositionMapper
 *
 * @typedef {{
 *   code: string,
 *   mapper: PositionMapper
 * }} TransformResult
 */

/**
 * @param {{ code: string, fileName: string }} input
 * @returns {TransformResult}
 */
export function transformQuarkySugar(input) {
  return transformQuarkySugarShared(input)
}

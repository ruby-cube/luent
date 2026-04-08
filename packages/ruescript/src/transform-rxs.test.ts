import { describe, expect, it } from 'vitest'
import { preprocessRXS } from './1-preprocess'
import { parseRXS } from './2-parse'
import { transformRXS } from './3-transform'
import { printTSX } from './4-generate'


describe('transform', () => {
   it('works', () => {
      const { code, edits } = preprocessRXS('get count = ref(0)')
      expect(code).toBe('gÆt_count = ref(0)')
      const ast = parseRXS('test.rxs', code)
      const tsxTree = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe('const countª = ref(0);')
   })
})
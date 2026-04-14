import { describe, expect, it } from 'vitest'
import { preprocessRXS } from '../src/1-preprocess'
import { parseRXS } from '../src/2-parse'
import { transformRXS } from '../src/3-transform'
import { printTSX } from '../src/5-generate'
import { visitorKeys } from 'oxc-parser'
import { assertChildKeysDev, CHILD_KEYS } from '../src/ast'


describe('transform', () => {
   it('works', () => {
      const { code, edits } = preprocessRXS('get count = ref(0)')
      expect(code).toBe('gÆt_count = ref(0)')
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe('import { assertª } from "@rue/ruescript";\nconst countª = assertª(ref(0));')
   })

   it('preserves parentheses', () => {
      const ast = parseRXS('test.tsx', `#!/usr/bin/env node\nconst node /* hi */ = <div value={(count + 1)}>Hello</div>`)
      console.log('ast', ast.program)
      assertChildKeysDev(CHILD_KEYS)
      // console.log('ChildKeys', visitorKeys)
      // console.log('My ChildKeys', CHILD_KEYS)
   })
})

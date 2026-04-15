import { describe, expect, it } from 'vitest'
import { preprocessRXS } from '../src/1-preprocess'
import { parseRXS } from '../src/2-parse'
import { transformRXS } from '../src/3-transform'
import { printTSX } from '../src/4-generate'
import { visitorKeys } from 'oxc-parser'
import { assertChildKeysDev, CHILD_KEYS } from '../src/ast'


describe('transform', () => {
   it('works', () => {
      const { code, edits } = preprocessRXS('get count = ref(0)')
      expect(code).toBe('gÆt_count = ref(0)')
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe('import { assertª } from "@rue/ruescript";\nconst countª = assertª(ref(0));\n')
   })

   it('works with new lines', () => {
      const { code, edits } = preprocessRXS('function ref(a: number){\n}\n\nfunction frog() {\n   get count = ref(0);\n   return;\n}\n\nconst count = 0')
      expect(code).toBe('function ref(a: number){\n}\n\nfunction frog() {\n   gÆt_count = ref(0);\n   return;\n}\n\nconst count = 0')
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe('import { assertª } from "@rue/ruescript";\nfunction ref(a: number) {\n}\n\nfunction frog() {\n\tconst countª = assertª(ref(0));\n\treturn;\n}\n\nconst count = 0;\n')
   })

   it('preserves parentheses', () => {
      const ast = parseRXS('test.tsx', `#!/usr/bin/env node\nconst node /* hi */ = <div value={(count + 1)}>Hello</div>`)
      console.log('ast', ast.program)
      assertChildKeysDev(CHILD_KEYS)
      // console.log('ChildKeys', visitorKeys)
      // console.log('My ChildKeys', CHILD_KEYS)
   })
})

import { describe, expect, it } from 'vitest'
import { parseRXS } from '../src/2-parse'
import { printTSX } from '../src/5-generate'

function parseProgram(code: string) {
   return parseRXS('declarations-test.tsx', code).program
}

describe('printTSX declaration visitors', () => {
   it('prints definite variable declarator with type annotation', () => {
      const program = parseProgram('let a!: Type')
      const output = printTSX(program).code
      expect(output).toBe('let a!: Type;')
   })

   it('prints variable declarator without initializer as valid code', () => {
      const program = parseProgram('let a')
      const output = printTSX(program).code
      expect(output).toBe('let a;')
   })

   it('prints typed variable declarator without duplicate type annotation', () => {
      const program = parseProgram('let a: number = 1')
      const output = printTSX(program).code
      expect(output).toBe('let a: number = 1;')
   })

   it('prints declare function without body and preserves statement boundary', () => {
      const program = parseProgram('declare function id<T>(x: T): T\nconst y = 2')
      const output = printTSX(program).code
      expect(output).toBe('declare function id<T>(x: T): T;\nconst y = 2;')
   })

   it('prints class declaration with multiple implements entries and type arguments', () => {
      const program = parseProgram('class C implements A<number>, B<string> {}')
      const output = printTSX(program).code
      expect(output).toBe('class C implements A<number>, B<string> {\n}\n')
   })
})

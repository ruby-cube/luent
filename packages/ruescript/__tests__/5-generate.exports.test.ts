import { describe, expect, it } from 'vitest'
import { parseRXS } from '../src/2-parse'
import { printTSX } from '../src/4-generate'

function parseProgram(code: string) {
   return parseRXS('exports-test.tsx', code).program
}

describe('printTSX export visitors', () => {
   it('prints export all', () => {
      const program = parseProgram('export * from "module"')
      const output = printTSX(program).code
      expect(output).toBe('export * from "module";\n')
   })

   it('prints export named exports', () => {
      const program = parseProgram('export {x, y, z} from "module"')
      const output = printTSX(program).code
      expect(output).toBe('export { x, y, z } from "module";\n')
   })

   it('prints export specifier in local-as-exported order', () => {
      const program = parseProgram('export { foo as bar }')
      const output = printTSX(program).code
      expect(output).toBe('export { foo as bar };\n')
   })

   it('adds only a newline after exported variable declarations', () => {
      const program = parseProgram('export const x = 1\nconst y = 2')
      const output = printTSX(program).code
      expect(output).toBe('export const x = 1;\nconst y = 2;')
   })

   it('does not add an extra semicolon after exported function declarations', () => {
      const program = parseProgram('export function f() {}\nconst y = 2')
      const output = printTSX(program).code
      expect(output).not.toContain('\n;\n')
      expect(output).toBe('export function f(){\n}\nconst y = 2;')
   })
})

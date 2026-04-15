import { describe, expect, it } from 'vitest'
import { parseRXS } from '../src/2-parse'
import { printTSX } from '../src/4-generate'

function parseProgram(code: string) {
   return parseRXS('imports-test.tsx', code).program
}

describe('printTSX import visitors', () => {
   it('prints named imports', () => {
      const program = parseProgram('import { x, y, z } from "module"')
      const output = printTSX(program).code
      expect(output).toBe('import { x, y, z } from "module";\n')
   })

   it('prints side-effect import attributes', () => {
      const program = parseProgram('import "./data.json" with { type: "json" }')
      const output = printTSX(program).code
      expect(output).toBe('import "./data.json" with { type: "json" };\n')
   })

   it('prints malformed default specifier ordering as-is', () => {
      const program = parseProgram('import d, { a } from "pkg"')
      const declaration = program.body[0] as unknown as { specifiers: unknown[] }
      declaration.specifiers = [declaration.specifiers[1], declaration.specifiers[0]]

      const output = printTSX(program).code
      expect(output).toBe('import { a }, d from "pkg";\n')
   })

   it('prints malformed namespace and named combination as-is', () => {
      const program = parseProgram('import * as ns from "pkg"')
      const namedProgram = parseProgram('import { a } from "pkg"')

      const declaration = program.body[0] as unknown as { specifiers: unknown[] }
      const namedDeclaration = namedProgram.body[0] as unknown as { specifiers: unknown[] }
      declaration.specifiers = [
         ...declaration.specifiers,
         namedDeclaration.specifiers[0],
      ]

      const output = printTSX(program).code
      expect(output).toBe('import * as ns, { a } from "pkg";\n')
   })
})

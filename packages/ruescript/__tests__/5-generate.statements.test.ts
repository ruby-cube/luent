import { describe, expect, it } from 'vitest'
import { parseRXS } from '../src/2-parse'
import { printTSX } from '../src/5-generate'

function parseProgram(code: string) {
   return parseRXS('statements-test.tsx', code).program
}

describe('printTSX statement visitors', () => {
   it('prints block statements with line separation', () => {
      const program = parseProgram('{}\nconst x = 1')
      const output = printTSX(program).code
      expect(output).toBe('{\n}\nconst x = 1;')
   })

   it('prints if/else with block branches', () => {
      const program = parseProgram('if (ok) { run() } else { stop() }')
      const output = printTSX(program).code
      expect(output).toBe('if (ok) {\n\trun();\n}\nelse {\n\tstop();\n}\n')
   })

    it('prints if/else with non-block alternate on its own indented line', () => {
      const program = parseProgram('if (ok) { run() } else stop()')
      const output = printTSX(program).code
      expect(output).toBe('if (ok) {\n\trun();\n}\nelse\n\tstop();\n')
   })

   it('prints switch statements and cases with separated consequents', () => {
      const program = parseProgram('switch (x) { case 1: break; default: ; }')
      const output = printTSX(program).code
      expect(output).toBe('switch (x) {\n\tcase 1:\n\t\tbreak;\n\tdefault:\n\t\t;\n}\n')
   })

   it('prints expression statements', () => {
      const program = parseProgram('foo()')
      const output = printTSX(program).code
      expect(output).toBe('foo();\n')
   })

   it('prints throw statements', () => {
      const program = parseProgram('throw err')
      const output = printTSX(program).code
      expect(output).toBe('throw err;\n')
   })

   it('prints try/catch statements', () => {
      const program = parseProgram('try { run() } catch (err) { handle(err) }')
      const output = printTSX(program).code
      expect(output).toContain('try {\n\trun();\n}')
      expect(output).toContain('catch (err) {\n\thandle(err);\n}')
   })

   it('prints with statements from AST nodes', () => {
      const program = parseProgram('if (ok) ok')
      const ifStmt = program.body[0] as unknown as { consequent: unknown }
      program.body[0] = {
         type: 'WithStatement',
         object: {
            type: 'Identifier',
            name: 'obj',
            decorators: [],
            optional: false,
            typeAnnotation: null,
            start: 0,
            end: 3,
         },
         body: ifStmt.consequent,
         start: 0,
         end: 8,
      } as unknown as typeof program.body[number]

      const output = printTSX(program).code
      expect(output).toBe('with (obj)\n\tok;\n')
   })

   it('prints debugger and empty statements', () => {
      const program = parseProgram('debugger;\n;')
      const output = printTSX(program).code
      expect(output).toBe('debugger;\n;\n')
   })
})

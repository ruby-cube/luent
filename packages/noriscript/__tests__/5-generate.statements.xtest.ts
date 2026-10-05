import { describe, expect, it } from 'vitest'
import { parseNSX } from '../src/2-parse'
import { printTSX } from '../src/4-generate'

function parseProgram(code: string) {
   return parseNSX('statements-test.tsx', code).program
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

   it('prints return statement with value', () => {
      const program = parseProgram('function f() { return value }')
      const output = printTSX(program).code
      expect(output).toBe('function f(){\n\treturn value;\n}\n')
   })

   it('prints bare return statement', () => {
      const program = parseProgram('function f() { return }')
      const output = printTSX(program).code
      expect(output).toBe('function f(){\n\treturn;\n}\n')
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

   it('prints for-in loops with declaration left side', () => {
      const program = parseProgram('for (const key in obj) { use(key) }')
      const output = printTSX(program).code
      expect(output).toBe('for (const key in obj) {\n\tuse(key);\n}\n')
   })

   it('prints for-of loops and for-await-of in async function bodies', () => {
      const program = parseProgram('for (const value of list) value\nasync function read() { for await (const chunk of stream) { consume(chunk) } }')
      const output = printTSX(program).code
      expect(output).toBe('for (const value of list)\n\tvalue;\nasync function read(){\n\tfor await (const chunk of stream) {\n\t\tconsume(chunk);\n\t}\n}\n')
   })

   it('prints classic for loops with initializer, test, and update', () => {
      const program = parseProgram('for (let i = 0; i < n; i++) { tick(i) }')
      const output = printTSX(program).code
      expect(output).toBe('for (let i = 0; i < n; i++) {\n\ttick(i);\n}\n')
   })

   it('prints while and do-while loops in common forms', () => {
      const program = parseProgram('while (ready) step()\ndo { move() } while (keepGoing)')
      const output = printTSX(program).code
      expect(output).toBe('while (ready)\n\tstep();\ndo {\n\tmove();\n}\nwhile (keepGoing);\n')
   })

   it('prints non-block do-while from AST nodes', () => {
      const program = parseProgram('while (ready) step()')
      const whileStmt = program.body[0] as unknown as { body: unknown, test: unknown }
      program.body[0] = {
         type: 'DoWhileStatement',
         body: whileStmt.body,
         test: whileStmt.test,
         start: 0,
         end: 0,
      } as unknown as typeof program.body[number]

      const output = printTSX(program).code
      expect(output).toBe('do\n\tstep();\nwhile (ready);\n')
   })

   it('prints labeled loops with labeled continue and break statements', () => {
      const program = parseProgram('loop: while (ok) { continue loop; break loop }')
      const output = printTSX(program).code
      expect(output).toBe('loop: while (ok) {\n\tcontinue loop;\n\tbreak loop;\n}\n')
   })
})

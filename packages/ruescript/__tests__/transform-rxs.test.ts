import { describe, expect, it } from 'vitest'
import { preprocessRXS } from '../src/1-preprocess'
import { parseRXS } from '../src/2-parse'
import { transformRXS } from '../src/3-transform'
import { printTSX } from '../src/4-generate'
import { skip } from 'node:test'


describe('transform', () => {
   it('transforms simple accessor variable declarations', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0)`
      )
      expect(code).toBe(
         `let count = ref(0)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n`
         + `const count = assertª(ref(0));\n`
      )
   })

   it('transforms accessor variable reads', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `console.log(count)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `console.log(count)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `console.log(count());\n`
      )
   })

   // TODO:
   it.skip('transforms accessor variable writes', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `count = 2`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `count = 2`
      )
      const ast = parseRXS('test.rxs', code)
      console.log('ast', ast.program.body, edits)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value = 2;\n`
      )
   })

   it('transforms accessor variable getter access', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      console.log('ast', ast.program.body, edits)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `console.log(count);\n`
      )
   })

   it('works with new lines', () => {
      const { code, edits } = preprocessRXS('function ref(a: number){\n}\n\nfunction frog() {\n   get count = ref(0);\n   return;\n}\n\nconst count = 0')
      expect(code).toBe('function ref(a: number){\n}\n\nfunction frog() {\n   let count = ref(0);\n   return;\n}\n\nconst count = 0')
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe('import { assertª } from "@rue/ruescript";\nfunction ref(a: number) {\n}\n\nfunction frog() {\n\tconst count = assertª(ref(0));\n\treturn;\n}\n\nconst count = 0;\n')
   })


   it('parses multiple jsx roots', () => {
      const ast = parseRXS('test.rxs', `
          function a() {
            const b = {
               a,
               a,
               a
            }
            const n = /*<T>*/(b: T) => { }

            ª=><div></div>
            ª=><>{If(
            )}</>
            ª=><div></div>
         }
      `)
      console.log('ast', ast.program.body[0].body.body[0])
   })
})

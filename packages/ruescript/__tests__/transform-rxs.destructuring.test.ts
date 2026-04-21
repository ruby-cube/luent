import { describe, expect, it } from "vitest"
import { preprocessRXS } from "../src/1-preprocess"
import { parseRXS } from "../src/2-parse"
import { printTSX } from "../src/4-generate"
import { transformRXS } from "../src/3-transform"

// get { foo, bar, count } = obj
// console.log(bar) // value access: 1
// console.log(bar@)

// object
//    [V] get keyword
//    [V] nested destructuring
//    [X] destructuring with defaults
//    [x] with const and @

// array
//    [] get keyword
//    [] nested destructuring
//    [] destructuring with defaults
//    [] with const and @

describe('transform', () => {
   it('transforms destructuring with get keyword - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `get { count, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(count@)\n`
      )
      expect(code).toBe(
         `let { count, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(countª)\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureª } from "@rue/ruescript";\n` +
         `const { count, bar } = destructureª(obj, {\n` +
         `\tcount: 1,\n` +
         `\tbar: 1\n` +
         `});\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it('transforms destructuring with get keyword with defaults - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `get { count, bar = () => 0 } = obj\n` +
         `console.log(bar);\n` +
         `console.log(bar@);`
      )
      expect(code).toBe(
         `let { count, bar = () => 0 } = obj\n` +
         `console.log(bar);\n` +
         `console.log(barª);`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { assertª, destructureª } from "@rue/ruescript";\n` +
         `const { count, bar = assertª(() => 0) } = destructureª(obj, {\n` +
         `\tcount: 1,\n` +
         `\tbar: 1\n` +
         `});\n` +
         `console.log(bar());\n` +
         `console.log(bar);\n`
      )
   })

   it('transforms nested destructuring with get keyword - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `get { count, bar: { foo } } = obj\n` +
         `console.log(count);` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `let { count, bar: { foo } } = obj\n` +
         `console.log(count);` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureª } from "@rue/ruescript";\n` +
         `const { count, bar: { foo } } = destructureª(obj, {\n` +
         `\tcount: 1,\n` +
         `\tbar: {\n` +
         `\t\tfoo: 1\n` +
         `\t}\n` +
         `});\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it.skip('transforms destructuring with @ postfix - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `const { count@, bar } = obj` +
         `console.log(count)\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `const { countª, bar } = obj` +
         `console.log(count)\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureª } from "@rue/ruescript";\n` +
         `const { count, bar } = destructureª(obj, {\n` +
         `\tcount: 1,\n` +
         `\tbar: 0\n` +
         `});\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })
})
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
//    [V] destructuring with defaults
//    [V] with const and @

// array
//    [V] get keyword
//    [V] nested destructuring
//    [V] destructuring with defaults
//    [V] with const and @

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
         `import { destructureªª } from "@rue/ruescript";\n` +
         `const { count, bar } = destructureªª(obj, {\n` +
         `\tcount: 1,\n` +
         `\tbar: 1\n` +
         `});\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })
 
   it('transforms aliased destructuring with get keyword - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `get { num: count, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(count@)\n`
      )
      expect(code).toBe(
         `let { num: count, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(countª)\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª } from "@rue/ruescript";\n` +
         `const { num: count, bar } = destructureªª(obj, {\n` +
         `\tnum: 1,\n` +
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
         `import { assertª, destructureªª } from "@rue/ruescript";\n` +
         `const { count, bar = assertª(() => 0) } = destructureªª(obj, {\n` +
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
         `import { destructureªª } from "@rue/ruescript";\n` +
         `const { count, bar: { foo } } = destructureªª(obj, {\n` +
         `\tcount: 1,\n` +
         `\tbar: {\n` +
         `\t\tfoo: 1\n` +
         `\t}\n` +
         `});\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it('transforms destructuring with get keyword - array pattern', () => {
      const { code, edits } = preprocessRXS(
         `get [count, bar] = array;` +
         `console.log(count)\n` +
         `console.log(count@)\n`
      )
      expect(code).toBe(
         `let [count, bar] = array;` +
         `console.log(count)\n` +
         `console.log(countª)\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª } from "@rue/ruescript";\n` +
         `const [count, bar] = destructureªª(array, [1, 1]);\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it('transforms destructuring with get keyword with default value - array pattern', () => {
      const { code, edits } = preprocessRXS(
         `get [count, bar = () => 0] = array;` +
         `console.log(count)\n` +
         `console.log(count@)\n`
      )
      expect(code).toBe(
         `let [count, bar = () => 0] = array;` +
         `console.log(count)\n` +
         `console.log(countª)\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { assertª, destructureªª } from "@rue/ruescript";\n` +
         `const [count, bar = assertª(() => 0)] = destructureªª(array, [1, 1]);\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })


   it('transforms nested destructuring with get keyword - array pattern', () => {
      const { code, edits } = preprocessRXS(
         `get [count, [b, c]] = array;` +
         `console.log(count)\n` +
         `console.log(count@)\n`
      )
      expect(code).toBe(
         `let [count, [b, c]] = array;` +
         `console.log(count)\n` +
         `console.log(countª)\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª } from "@rue/ruescript";\n` +
         `const [count, [b, c]] = destructureªª(array, [1, [1, 1]]);\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it('transforms destructuring with @ postfix - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `const { count@, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `const { countª, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª } from "@rue/ruescript";\n` +
         `const { count, bar } = destructureªª(obj, {\n` +
         `\tcount: 1,\n` +
         `\tbar: 0\n` +
         `});\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it('transforms aliased destructuring with @ postfix - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `const { num: count@, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `const { num: countª, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª } from "@rue/ruescript";\n` +
         `const { num: count, bar } = destructureªª(obj, {\n` +
         `\tnum: 1,\n` +
         `\tbar: 0\n` +
         `});\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it('transforms aliased destructuring with @ postfix - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `const { num: count@ = () => 0, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `const { num: countª = () => 0, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª, assertª } from "@rue/ruescript";\n` +
         `const { num: count = assertª(() => 0), bar } = destructureªª(obj, {\n` +
         `\tnum: 1,\n` +
         `\tbar: 0\n` +
         `});\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it('transforms destructuring with @ postfix - array pattern', () => {
      const { code, edits } = preprocessRXS(
         `const [count@, bar] = arr;` +
         `console.log(count)\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `const [countª, bar] = arr;` +
         `console.log(count)\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª } from "@rue/ruescript";\n` +
         `const [count, bar] = destructureªª(arr, [1, 0]);\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it('transforms destructuring with @ postfix with default - array pattern', () => {
      const { code, edits } = preprocessRXS(
         `const [count@ = () => 0, bar] = arr;` +
         `console.log(count)\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `const [countª = () => 0, bar] = arr;` +
         `console.log(count)\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª, assertª } from "@rue/ruescript";\n` +
         `const [count = assertª(() => 0), bar] = destructureªª(arr, [1, 0]);\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })


   it('transforms destructuring with @ postfix with nesting - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `const { foo: { count@ }, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `const { foo: { countª }, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª } from "@rue/ruescript";\n` +
         `const { foo: { count }, bar } = destructureªª(obj, {\n` +
         `\tfoo: {\n` +
         `\t\tcount: 1\n` +
         `\t},\n` + // TODO: printing nested object literal is messed up
         `\tbar: 0\n` +
         `});\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it('transforms destructuring with @ postfix with defaults - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `const { count@ = () => 0, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `const { countª = () => 0, bar } = obj;` +
         `console.log(count)\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª, assertª } from "@rue/ruescript";\n` +
         `const { count = assertª(() => 0), bar } = destructureªª(obj, {\n` +
         `\tcount: 1,\n` +
         `\tbar: 0\n` +
         `});\n` +
         `console.log(count());\n` +
         `console.log(count);\n`
      )
   })

   it('transforms parameter destructuring with @ postfix - object pattern', () => {
      const { code, edits } = preprocessRXS(
         `function Foo({ count@, bar }) {\n` +
         `console.log(count)\n` +
         `console.log(count@)\n` +
         `}`
      )
      expect(code).toBe(
         `function Foo({ countª, bar }) {\n` +
         `console.log(count)\n` +
         `console.log(countª)\n` +
         `}`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª } from "@rue/ruescript";\n` +
         `function Foo(dpª0) {\n` +
         `\tlet { count, bar } = destructureªª(dpª0, {\n` +
         `\t\tcount: 1,\n` +
         `\t\tbar: 0\n` +
         `\t});\n` +
         `\tconsole.log(count());\n` +
         `\tconsole.log(count);\n` +
         `}\n\n`
      )
   })

   it('transforms parameter destructuring with @ postfix - array pattern', () => {
      const { code, edits } = preprocessRXS(
         `function Foo([count@, bar]) {\n` +
         `console.log(count)\n` +
         `console.log(count@)\n` +
         `}`
      )
      expect(code).toBe(
         `function Foo([countª, bar]) {\n` +
         `console.log(count)\n` +
         `console.log(countª)\n` +
         `}`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)

      expect(generated.code).toBe(
         `import { destructureªª } from "@rue/ruescript";\n` +
         `function Foo(dpª0) {\n` +
         `\tlet [count, bar] = destructureªª(dpª0, [1, 0]);\n` +
         `\tconsole.log(count());\n` +
         `\tconsole.log(count);\n` +
         `}\n\n`
      )
   })
})
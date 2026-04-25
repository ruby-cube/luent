import { expect, it } from "vitest"
import { preprocessRXS } from "../src/1-preprocess"
import { parseRXS } from "../src/2-parse"
import { transformRXS } from "../src/3-transform"
import { printTSX } from "../src/4-generate"
import { describe } from "node:test"

describe('RueScript TypeGuard transforms', () => {
   it('transforms if statement type guards - reads in body', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tif(obj) {\n` +
         `\t\tconsole.log(obj.name)\n` +
         `\t}\n` +
         `\telse {\n` +
         `\t\tconsole.log(obj)\n` +
         `\t}\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tif ((ø_obj = obj(), ø_obj)) {\n` +
         `\t\tconsole.log((obj() as typeof ø_obj).name);\n` +
         `\t}\n` +
         `\telse {\n` +
         `\t\tconsole.log(obj() as typeof ø_obj);\n` +
         `\t}\n` +
         `}\n\n`
      )
   })
   
   it('transforms if return statement type guards - reads in body', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tif(!obj) return;\n` +
         `\tconsole.log(obj.name)\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tif (!(ø_obj = obj(), ø_obj))\n\t\treturn;\n` +
         `\tconsole.log((obj() as typeof ø_obj).name);\n` +
         `}\n\n`
      )
   })

   it('transforms if return statement type guards - reads in body', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tif(!obj) return;\n` +
         `\ta = obj.name\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tif (!(ø_obj = obj(), ø_obj))\n\t\treturn;\n` +
         `\ta = (obj() as typeof ø_obj).name;\n` +
         `}\n\n`
      )
   })

   it('transforms if return statement type guards - reads in body', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tif(obj) {\n` +
         `\t\ta = obj.name\n` +
         `\t}\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tif ((ø_obj = obj(), ø_obj)) {\n` +
         `\t\ta = (obj() as typeof ø_obj).name;\n` +
         `\t}\n` +
         `}\n\n`
      )
   })

   it('transforms if return statement type guards - reads in body', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tif(obj) {\n` +
         // `\t\ta = obj\n` +
         `\t\tobj\n` +
         `\t}\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tif ((ø_obj = obj(), ø_obj)) {\n` +
         // `\t\ta = obj() as typeof ø_obj;\n` +
         `\t\tobj() as typeof ø_obj;\n` +
         `\t}\n` +
         `}\n\n`
      )
   })

   it('transforms if return statement type guards - reads in body', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tif(!obj) return;\n` +
         `\tif (other) console.log(obj.name)\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tif (!(ø_obj = obj(), ø_obj))\n\t\treturn;\n` +
         `\tif (other)\n\t\tconsole.log((obj() as typeof ø_obj).name);\n` +
         `}\n\n`
      )
   })

   it('transforms conditional expression type guards - reads in body', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tconst a = obj ? obj.name : undefined;\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tconst a = (ø_obj = obj(), ø_obj) ? (obj() as typeof ø_obj).name : undefined;\n` +
         `}\n\n`
      )
   })

   it('transforms logical expression type guards - reads in body', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tconst a = obj && obj.name;\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tconst a = (ø_obj = obj(), ø_obj) && (obj() as typeof ø_obj).name;\n` +
         `}\n\n`
      )
   })

   it('transforms if statement type guards !obj - reads in body', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tif(!obj) {\n` +
         `\t\tconsole.log(obj.name)\n` +
         `\t}\n` +
         `\telse {\n` +
         `\t\tconsole.log(obj)\n` +
         `\t}\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tif (!(ø_obj = obj(), ø_obj)) {\n` +
         `\t\tconsole.log((obj() as typeof ø_obj).name);\n` +
         `\t}\n` +
         `\telse {\n` +
         `\t\tconsole.log(obj() as typeof ø_obj);\n` +
         `\t}\n` +
         `}\n\n`
      )
   })

   it('transforms if statement type-guards - writes in body', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tif(obj) {\n` +
         `\t\tobj = undefined\n` +
         `\t\tconsole.log(obj.name)\n` +
         `\t}\n` +
         `\telse {\n` +
         `\t\tconsole.log(obj)\n` +
         `\t}\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tif ((ø_obj = obj(), ø_obj)) {\n` +
         `\t\tø_obj = assertµ(obj).value = undefined;\n` +
         `\t\tconsole.log((obj() as typeof ø_obj).name);\n` +
         `\t}\n` +
         `\telse {\n` +
         `\t\tconsole.log(obj() as typeof ø_obj);\n` +
         `\t}\n` +
         `}\n\n`
      )
   })

   it('transforms if statement type guards - logical expression', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tif(obj && bar) {\n` +
         `\t\tconsole.log(obj.name)\n` +
         `\t}\n` +
         `\telse {\n` +
         `\t\tconsole.log(obj)\n` +
         `\t}\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tif ((ø_obj = obj(), ø_obj) && bar) {\n` +
         `\t\tconsole.log((obj() as typeof ø_obj).name);\n` +
         `\t}\n` +
         `\telse {\n` +
         `\t\tconsole.log(obj() as typeof ø_obj);\n` +
         `\t}\n` +
         `}\n\n`
      )
   })

   // FIX:
   it.skip('transforms if-statement type-guards - writes in test', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\tif(obj = a) {\n` +
         `\t\tconsole.log(obj.name)\n` +
         `\t}\n` +
         `\telse {\n` +
         `\t\tconsole.log(obj)\n` +
         `\t}\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\tif ((ø_obj = assertµ(obj).value = a, ø_obj)) {\n` +
         `\t\tconsole.log((obj() as typeof ø_obj).name);\n` +
         `\t}\n` +
         `\telse {\n` +
         `\t\tconsole.log(obj() as typeof ø_obj);\n` +
         `\t}\n` +
         `}\n\n`
      )
   })

   it('transforms while-statement type guards', () => {
      const { code, edits } = preprocessRXS(
         `get obj = ref(undefined)\n` +
         `function foo() {` +
         `\twhile(obj) {\n` +
         `\t\tconsole.log(obj.name)\n` +
         `\t}\n` +
         `}\n`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const obj = assertª(ref(undefined));\n` +
         `let ø_obj: ReturnType<typeof obj>;\n` +
         `function foo() {\n` +
         `\twhile ((ø_obj = obj(), ø_obj)) {\n` +
         `\t\tconsole.log((obj() as typeof ø_obj).name);\n` +
         `\t}\n` +
         `}\n\n`
      )
   })
})
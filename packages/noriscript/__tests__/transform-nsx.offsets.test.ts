import { describe, expect, it } from "vitest";
import { preprocessNSX } from "../src/1-preprocess";
import { parseNSX } from "../src/2-parse";
import { transformNSX } from "../src/3-transform";
import { printTSX } from "../src/4-generate";

describe('NoriScript transform with offsets', () => {
   it('transforms block derivation expressions', () => {
      const { code, edits } = preprocessNSX(
         `get foo = ref(0);\n` +
         `observe({ const a = 0; return a }@);` +
         `get count = ref(0);\n` +
         `count = 2`
      )
      expect(code).toBe(
         `let foo = ref(0);\n` +
         `observe((ª=>{ const a = 0; return a }));` +
         `let count = ref(0);\n` +
         `count = 2`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@luent/noriscript";\n` +
         `const foo = assertª(ref(0));\n` +
         `observe((() => {\n` + `\tconst a = 0;\n\treturn a;\n}\n));\n` + // TODO: remove parentheses if not IIDE
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value = 2;\n`
      )
   })

   it('transforms async block derivation expressions', () => {
      const { code, edits } = preprocessNSX(
         `get foo = ref(0);\n` +
         `observe({ const res = await a; return res }@);` +
         `get count = ref(0);\n` +
         `count = 2`
      )
      expect(code).toBe(
         `let foo = ref(0);\n` +
         `observe((ª=>{ const res = await a; return res }));` +
         `let count = ref(0);\n` +
         `count = 2`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@luent/noriscript";\n` +
         `const foo = assertª(ref(0));\n` +
         `observe((async () => {\n` + `\tconst res = await a;\n\treturn res;\n}\n));\n` + // TODO: remove parentheses if not IIDE
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value = 2;\n`
      )
   })

   it('transforms immediately invoked block derivation expressions', () => {
      const { code, edits } = preprocessNSX(
         `get foo = ref(0);\n` +
         `observe({ const a = 0; return a }@());` +
         `get count = ref(0);\n` +
         `count = 2`
      )
      expect(code).toBe(
         `let foo = ref(0);\n` +
         `observe((ª=>{ const a = 0; return a })());` +
         `let count = ref(0);\n` +
         `count = 2`
      )
      const ast = parseNSX('test.nsx', code)
      console.log('ast', ast.program.body)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@luent/noriscript";\n` +
         `const foo = assertª(ref(0));\n` +
         `observe((() => {\n` + `\tconst a = 0;\n\treturn a;\n}\n)());\n` + // TODO: remove parentheses if not IIDE
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value = 2;\n`
      )
   })

   it('transforms async immediately invoked block derivation expressions', () => {
      const { code, edits } = preprocessNSX(
         `get foo = ref(0);\n` +
         `observe({ const res = await a; return res }@());` +
         `get count = ref(0);\n` +
         `count = 2`
      )
      expect(code).toBe(
         `let foo = ref(0);\n` +
         `observe((ª=>{ const res = await a; return res })());` +
         `let count = ref(0);\n` +
         `count = 2`
      )
      const ast = parseNSX('test.nsx', code)
      console.log('ast', ast.program.body)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@luent/noriscript";\n` +
         `const foo = assertª(ref(0));\n` +
         `observe((async () => {\n` + `\tconst res = await a;\n\treturn res;\n}\n)());\n` + // TODO: remove parentheses if not IIDE
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value = 2;\n`
      )
   })
})
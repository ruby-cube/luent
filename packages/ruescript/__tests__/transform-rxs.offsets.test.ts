import { describe, expect, it } from "vitest";
import { preprocessRXS } from "../src/1-preprocess";
import { parseRXS } from "../src/2-parse";
import { transformRXS } from "../src/3-transform";
import { printTSX } from "../src/4-generate";

describe('RueScript transform with offsets', () => {
   it('transforms block derivation expressions', () => {
      const { code, edits } = preprocessRXS(
         `get foo = ref(0);\n` +
         `watch({ const a = 0; return a }@);` +
         `get count = ref(0);\n` +
         `count = 2`
      )
      expect(code).toBe(
         `let foo = ref(0);\n` +
         `watch((ª=>{ const a = 0; return a }));` +
         `let count = ref(0);\n` +
         `count = 2`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@rue/ruescript";\n` +
         `const foo = assertª(ref(0));\n` +
         `watch(((ª) => {\n` + `\tconst a = 0;\n\treturn a;\n}\n));\n` + // TODO: remove parentheses if not IIDE
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value = 2;\n`
      )
   })

   it.skip('transforms immediately invoked block derivation expressions', () => {
      const { code, edits } = preprocessRXS(
         `get foo = ref(0);\n` +
         `watch({ const a = 0; return a }@());` +
         `get count = ref(0);\n` +
         `count = 2`
      )
      expect(code).toBe(
         `let foo = ref(0);\n` +
         `watch((ª=>{ const a = 0; return a })());` +
         `let count = ref(0);\n` +
         `count = 2`
      )
      const ast = parseRXS('test.rxs', code)
      console.log('ast', ast.program.body)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@rue/ruescript";\n` +
         `const foo = assertª(ref(0));\n` +
         `watch(((ª) => {\n` + `\tconst a = 0;\n\treturn a;\n}\n)());\n` + // TODO: remove parentheses if not IIDE
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value = 2;\n`
      )
   })
})
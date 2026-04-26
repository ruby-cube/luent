import { describe, expect, it } from "vitest";
import { preprocessRXS } from "../src/1-preprocess";
import { parseRXS } from "../src/2-parse";

describe('Handling incomplete/invalid source', () => {
   it('handles incomplete/invalid source', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `a = count.;\n` +
         `console.log(a)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `a = count.;\n` +
         `console.log(a)`
      )
      const ast = parseRXS('test.rxs', code)
      console.log('ast', ast.program)
      console.log('ast', ast.errors[0])
      console.log('ast', ast.errors[0].labels)
   })
})
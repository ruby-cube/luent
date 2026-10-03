import { describe, expect, it } from "vitest";
import { preprocessNSX } from "../src/1-preprocess";
import { parseNSX } from "../src/2-parse";

describe('Handling incomplete/invalid source', () => {
   it('handles incomplete/invalid source', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `a = count.;\n` +
         `console.log(a)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `a = count.;\n` +
         `console.log(a)`
      )
      const ast = parseNSX('test.nsx', code)
      console.log('ast', ast.program)
      console.log('ast', ast.errors[0])
      console.log('ast', ast.errors[0].labels)
   })
})
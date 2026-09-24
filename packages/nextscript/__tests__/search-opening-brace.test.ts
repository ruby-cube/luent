import { describe, expect, it } from 'vitest'
import { searchOpeningBrace } from '../src/searchOpeningBrace'

describe('searchOpeningBrace', () => {
   it('finds matching opening brace for nested braces', () => {
      const code = 'if (ok) { while (x) { run() } }'
      const closing = code.lastIndexOf('}')
      expect(searchOpeningBrace(code, closing)).toBe(code.indexOf('{', code.indexOf('if')))
   })

   it('ignores brackets inside comments', () => {
      const code = 'const x = 1 + 2; if (ok) { /* { [ ( */run() }'
      const closing = code.lastIndexOf('}')
      const opening = code.indexOf('{', code.indexOf('if'))
      expect(searchOpeningBrace(code, closing)).toBe(opening)
   })

   it('ignores braces inside strings', () => {
      const code = 'if (ok) { const text = "not a bracket: { [ ("; run() }'
      const closing = code.lastIndexOf('}')
      const opening = code.indexOf('{', code.indexOf('if'))
      expect(searchOpeningBrace(code, closing)).toBe(opening)
   })

   it('ignores braces inside template literals', () => {
      const code = 'if (ok) { const text = `not a bracket: { [ ( ${a}`; run() }'
      const closing = code.lastIndexOf('}')
      const opening = code.indexOf('{', code.indexOf('if'))
      expect(searchOpeningBrace(code, closing)).toBe(opening)
   })

   it('ignores braces inside regex literals', () => {
      const code = 'if (ok) { const re = /foo[(){}\\[\\]]bar/; run() }'
      const closing = code.lastIndexOf('}')
      const opening = code.indexOf('{', code.indexOf('if'))
      expect(searchOpeningBrace(code, closing)).toBe(opening)
   })

   it('returns undefined when no match exists', () => {
      const code = 'const value = a + b }'
      const closing = code.lastIndexOf('}')
      expect(searchOpeningBrace(code, closing)).toBeUndefined()
   })

   it('returns undefined when closing index is not a closing brace', () => {
      const code = 'observe((count + 1)@())'
      const closing = code.lastIndexOf(')')
      expect(searchOpeningBrace(code, closing)).toBeUndefined()
   })
})

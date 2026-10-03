import { describe, expect, it } from 'vitest'
import { preprocessNSX } from '../src/1-preprocess'

describe('preprocess: rewriteGetVariableDeclarations', () => {
   it('rewrites a basic get declaration', () => {
      const { code } = preprocessNSX('get count = ref(0)')
      expect(code).toBe('gÆt_count = ref(0)')
   })

   it('preserves multi-space gap between get and identifier', () => {
      const { code } = preprocessNSX('get  count = ref(0)')
      expect(code).toBe('gÆt__count = ref(0)')
   })

   it('encodes a trapped block comment', () => {
      const { code } = preprocessNSX('get /* note */ count = ref(0)')
      expect(code).toBe('gÆt_ƒº_note_ºƒ_count = ref(0)')
   })

   it('encodes multiple trapped block comment', () => {
      const { code } = preprocessNSX('get /* note */ /* note2*/count = ref(0)')
      expect(code).toBe('gÆt_ƒº_note_ºƒ_ƒº_note2ºƒcount = ref(0)')
   })

   it('allows zero whitespace before =', () => {
      const { code } = preprocessNSX('get count= ref(0)')
      expect(code).toBe('gÆt_count= ref(0)')
   })

   it('records an edit with correct position and length', () => {
      const source = 'get count = ref(0)'
      const { edits } = preprocessNSX(source)
      expect(edits).toHaveLength(1)
      expect(edits[0].pos).toBe(0)
      // matches "get count " (everything up to but not including "=")
      expect(edits[0].original).toBe('get count ')
      expect(edits[0].transformed).toBe('gÆt_count ')
   })

   it('does not rewrite get as part of a longer identifier', () => {
      const { code } = preprocessNSX('getCount = ref(0)')
      expect(code).toBe('getCount = ref(0)')
   })

   it('does not rewrite get followed by ==', () => {
      const { code } = preprocessNSX('get count == 0')
      expect(code).toBe('get count == 0')
   })

   it('does not rewrite get followed by =>', () => {
      const { code } = preprocessNSX('get count => {}')
      expect(code).toBe('get count => {}')
   })

   it('rewrites multiple get declarations in the same source', () => {
      const source = 'get a = ref(0)\nget b = ref(1)'
      const { code, edits } = preprocessNSX(source)
      expect(code).toBe('gÆt_a = ref(0)\ngÆt_b = ref(1)')
      expect(edits).toHaveLength(2)
   })

   // it('does not rewrite a get declaration in template text', () => {
   //    const { code } = preprocessNSX('`get count = ref(0)`')
   //    expect(code).toBe('`get count = ref(0)`')
   // })

   // it('does not rewrite a get declaration in line comments', () => {
   //    const { code } = preprocessNSX('// get count = ref(0)')
   //    expect(code).toBe('// get count = ref(0)')
   // })

   // it('does not rewrite a get declaration in block comments', () => {
   //    const { code } = preprocessNSX('/* get count = ref(0) */')
   //    expect(code).toBe('/* get count = ref(0) */')
   // })

   // it('does not rewrite a get declaration in regex literals', () => {
   //    const { code } = preprocessNSX('/get count = ref\\(0\\)/')
   //    expect(code).toBe('/get count = ref\\(0\\)/')
   // })

   // it('rewrites get declaration inside template expressions only', () => {
   //    const { code } = preprocessNSX('`text get count = ref(0) ${get count = ref(0)}`')
   //    expect(code).toBe('`text get count = ref(0) ${gÆt_count = ref(0)}`')
   // })
})

describe('preprocess: rewriteGetPropertyDelarations', () => {
   it('rewrites get property colon notation', () => {
      const { code } = preprocessNSX('const obj = { get foo: ref(0) }')
      expect(code).toBe('const obj = { gÆt_foo: ref(0) }')
   })

   // it('does not rewrite get colon notation outside of object literal', () => {
   //    const { code } = preprocessNSX('get foo: ref(0)')
   //    expect(code).toBe('get foo: ref(0)')
   // })

   // it('does not rewrite get property colon notation in template text', () => {
   //    const { code } = preprocessNSX('`const obj = { get foo: ref(0) }`')
   //    expect(code).toBe('`const obj = { get foo: ref(0) }`')
   // })

   it('rewrites get property colon notation with other properties', () => {
      const { code } = preprocessNSX('start({ bar: 0, get foo: ref(0) })')
      expect(code).toBe('start({ bar: 0, gÆt_foo: ref(0) })')
   })

   it('rewrites get property colon notation with trapped comments', () => {
      const { code } = preprocessNSX('const obj = { get /* note */ foo: ref(0) }')
      expect(code).toBe('const obj = { gÆt_ƒº_note_ºƒ_foo: ref(0) }')
   })

   it('rewrites get property colon notation with zero whitespace before colon', () => {
      const { code } = preprocessNSX('const obj = { get foo:ref(0), get bar: ref(1) }')
      expect(code).toBe('const obj = { gÆt_foo:ref(0), gÆt_bar: ref(1) }')
   })

   it('records edit for get property colon notation', () => {
      const source = 'const obj = { get foo: ref(0) }'
      const { edits } = preprocessNSX(source)
      expect(edits.some((e) => 
         e.pos === source.indexOf('get foo') && e.original === 'get foo')).toBe(true)
      expect(edits.some((e) => 
         e.pos === source.indexOf('get foo') && e.transformed === 'gÆt_foo')).toBe(true)
   })
})

// describe('unwriteGetVariableDeclarations', () => {
//    it('restores from edits with exact original text', () => {
//       const source = 'get count = ref(0)'
//       const { code, edits } = preprocessNSX(source)
//       const restored = unwriteGetDeclarations(code, edits)
//       expect(restored).toBe(source)
//    })

//    it('preserves multi-space gap between get and identifier', () => {
//       const source = 'get  count = ref(0)'
//       const { code, edits } = preprocessNSX(source)
//       const restored = unwriteGetDeclarations(code, edits)
//       expect(restored).toBe(source)
//    })

//    it('preserves trapped block comment exactly', () => {
//       const source = 'get /* note */ count = ref(0)'
//       const { code, edits } = preprocessNSX(source)
//       const restored = unwriteGetDeclarations(code, edits)
//       expect(restored).toBe(source)
//    })

//    it('preserves underscore in trapped comment', () => {
//       const source = 'get /* note_underscore */ count = ref(0)'
//       const { code, edits } = preprocessNSX(source)
//       const restored = unwriteGetDeclarations(code, edits)
//       expect(restored).toBe(source)
//    })

//    it('preserves multiple trapped comments exactly', () => {
//       const source = 'get /* note */ /* note2*/count = ref(0)'
//       const { code, edits } = preprocessNSX(source)
//       const restored = unwriteGetDeclarations(code, edits)
//       expect(restored).toBe(source)
//    })

//    it('allows zero whitespace before =', () => {
//       const source = 'get count= ref(0)'
//       const { code, edits } = preprocessNSX(source)
//       const restored = unwriteGetDeclarations(code, edits)
//       expect(restored).toBe(source)
//    })

//    it('restores multiple get declarations correctly', () => {
//       const source = 'get a = ref(0)\nget b = ref(1)'
//       const { code, edits } = preprocessNSX(source)
//       const restored = unwriteGetDeclarations(code, edits)
//       expect(restored).toBe(source)
//    })
// })

// describe('unwriteGetPropertyColonNotation', () => {
//    it('restores from edits with exact original text', () => {
//       const source = 'const obj = { get foo: ref(0) }'
//       const { code, edits } = preprocessNSX(source)
//       const editsForProperty = edits.filter(e => source.includes('get foo'))
//       const restored = unwriteGetDeclarations(code, editsForProperty)
//       expect(restored).toContain('get foo')
//    })

//    it('preserves multi-space gap between get and key', () => {
//       const source = 'const obj = { get  foo: ref(0) }'
//       const { code, edits } = preprocessNSX(source)
//       const editsForProperty = edits.filter(e => source.includes('get  foo'))
//       const restored = unwriteGetDeclarations(code, editsForProperty)
//       expect(restored).toContain('get  foo')
//    })

//    it('preserves trapped block comments exactly', () => {
//       const source = 'const obj = { get /* note */ foo: ref(0) }'
//       const { code, edits } = preprocessNSX(source)
//       const editsForProperty = edits.filter(e => source.includes('get /* note */ foo'))
//       const restored = unwriteGetDeclarations(code, editsForProperty)
//       expect(restored).toContain('get /* note */ foo')
//    })

//    it('allows zero whitespace before colon', () => {
//       const source = 'const obj = { get foo:ref(0) }'
//       const { code, edits } = preprocessNSX(source)
//       const editsForProperty = edits.filter(e => source.includes('get foo'))
//       const restored = unwriteGetDeclarations(code, editsForProperty)
//       expect(restored).toContain('get foo')
//    })

//    it('restores multiple get properties correctly', () => {
//       const source = 'const obj = { get foo:ref(0), get bar: ref(1) }'
//       const { code, edits } = preprocessNSX(source)
//       const restored = unwriteGetDeclarations(code, edits)
//       expect(restored).toContain('get foo')
//       expect(restored).toContain('get bar')
//    })
// })

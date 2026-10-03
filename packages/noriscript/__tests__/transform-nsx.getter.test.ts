import { describe, expect, it } from 'vitest'
import { preprocessNSX } from '../src/1-preprocess'
import { parseNSX } from '../src/2-parse'
import { transformNSX } from '../src/3-transform'
import { printTSX } from '../src/4-generate'


describe('transform', () => {
   it('transforms simple accessor variable declarations', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0)`
      )
      expect(code).toBe(
         `let count = ref(0)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n`
      )
   })
   
   // FIX: disambiguate from colon notation
   it.skip('transforms simple accessor variable declarations with type annotation', () => {
      const { code, edits } = preprocessNSX(
         `get count: Ref<number> = ref(0)`
      )
      expect(code).toBe(
         `let count: Ref<number> = ref(0)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count: Ref<number> = assertª(ref(0));\n`
      )
   })

   it('transforms accessor variable reads', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `console.log(count)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `console.log(count)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `console.log(count());\n`
      )
   })

   it('transforms accessor variable reads in assignment right', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `a = count.name`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `a = count.name`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `a = count().name;\n`
      )
   })

   it('transforms accessor variable reads - member expression', () => {
      const { code, edits } = preprocessNSX(
         `get frog = ref({ name: 'kermit' });\n` +
         `console.log(frog.name)`
      )
      expect(code).toBe(
         `let frog = ref({ name: 'kermit' });\n` +
         `console.log(frog.name)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const frog = assertª(ref({\n\tname: 'kermit'\n}));\n` +
         `console.log(frog().name);\n`
      )
   })

   it('transforms accessor variable reads - in conditional body', () => {
      const { code, edits } = preprocessNSX(
         `get frog = ref({ name: 'kermit' });\n` +
         `if (a) frog`
      )
      expect(code).toBe(
         `let frog = ref({ name: 'kermit' });\n` +
         `if (a) frog`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const frog = assertª(ref({\n\tname: 'kermit'\n}));\n` +
         `if (a)\n\tfrog();\n`
      )
   })

   it('transforms accessor variable reads - nullish operator', () => {
      const { code, edits } = preprocessNSX(
         `get frog = ref({ name: 'kermit' });\n` +
         `console.log(frog?.name ?? 'frog')`
      )
      expect(code).toBe(
         `let frog = ref({ name: 'kermit' });\n` +
         `console.log(frog?.name ?? 'frog')`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const frog = assertª(ref({\n\tname: 'kermit'\n}));\n` +
         `console.log(frog()?.name ?? 'frog');\n`
      )
   })

   it('transforms accessor variable reads - within derivation', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `get doubleCount = ref(() => count * 2)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `let doubleCount = ref(() => count * 2)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `const doubleCount = assertª(ref(() => count() * 2));\n`
      )
   })

   // it.skip('transforms accessor variable reads with optional postfix', () => {
   //    const { code, edits } = preprocessNSX(
   //       `get count = ref(0);\n` +
   //       `count?;\n` +
   //       `console.log(count?)`
   //    )
   //    expect(code).toBe(
   //       `let count = ref(0);\n` +
   //       `countØ;\n` +
   //       `console.log(countØ)`
   //    )
   //    const ast = parseNSX('test.nsx', code)
   //    const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
   //    const generated = printTSX(tsxTree)
   //    expect(generated.code).toBe(
   //       `import { assertª } from "@luent/noriscript";\n` +
   //       `const count = assertª(ref(0));\n` +
   //       `count?.();\n` +
   //       `console.log(count?.());\n` 
   //    )
   // })

   it('transforms accessor variable writes (assignment expression)', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `count = 2`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `count = 2`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value = 2;\n`
      )
   })

   it('transforms accessor variable writes (update expression)', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `count++`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `count++`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value++;\n`
      )
   })

   it('transforms accessor variable getter access', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `console.log(countª)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `console.log(count);\n`
      )
   })

   it('transforms derivation expression', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `observe((count * 2)@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `observe((count * 2)!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `observe(() => (count() * 2));\n`
      )
   })

   it('transforms derivation sequence expression', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `observe((console.log('hi'), count * 2)@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `observe((console.log('hi'), count * 2)!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `observe(() => ((console.log('hi'), count() * 2)));\n`
      )
   })

   it('transforms derivation type casting expression', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `observe((count * 2 as number)@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `observe((count * 2 as number)!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `observe(() => (count() * 2 as number));\n`
      )
   })


   it('transforms async derivation expression', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `observe((await count)@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `observe((await count)!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `observe(async () => (await count()));\n`
      )
   })

   it('transforms immediately invoked derivation expression', () => {
      const { code, edits } = preprocessNSX(
         `get count = ref(0);\n` +
         `observe((count * 2)@())`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `observe((count * 2)!())`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@luent/noriscript";\n` +
         `const count = assertª(ref(0));\n` +
         `observe((() => (count() * 2))());\n`
      )
   })

   // { const c = 0 ; return a + b }@()
   //
   // preprocess
   // (ª=>{ const c = 0 ; return a + b })()
   //
   // final
   // (() => { const c = 0 ; return a + b })()
   it('transforms immediately invoked derivation expression-block bodied', () => {
      const { code, edits } = preprocessNSX(
         `observe({ const c = 0 ; return a + b }@())`
      )
      expect(code).toBe(
         `observe((ª=>{ const c = 0 ; return a + b })())`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `observe((() => {\n` +
         `\tconst c = 0;\n` +
         `\treturn a + b;\n` +
         `}\n)());\n`
      )
   })

   it('transforms accessor property declarations via colon notation', () => {
      const { code, edits } = preprocessNSX(
         `const obj = { get count: ref(0), a, b: 0, get frog: ref('kermit') }`
      )
      expect(code).toBe(
         `const obj = { gª, count: ref(0), a, b: 0, gª, frog: ref('kermit') }`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, absorbsª, absorbª } from "@luent/noriscript";\n` +
         `const obj = absorbsª({\n` +
         `\tcount: absorbª(assertª(ref(0))),\n` +
         `\ta,\n` +
         `\tb: 0,\n` +
         `\tfrog: absorbª(assertª(ref('kermit')))` +
         `\n});\n`
      )
   })


   it('transforms getter normalization for object property access', () => {
      const { code, edits } = preprocessNSX(
         `console.log(obj.count@)`
      )
      expect(code).toBe(
         `console.log(obj.countª)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { ªªof } from "@luent/noriscript";\n` +
         `console.log(ªªof(obj).count);\n`
      )
   })

   it('transforms getter normalization for object property access--bracket notation', () => {
      const { code, edits } = preprocessNSX(
         `console.log(obj[count]@)`
      )
      expect(code).toBe(
         `console.log(obj[count]!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { ªªof } from "@luent/noriscript";\n` +
         `console.log(ªªof(obj)[count]);\n`
      )
   })

   it('transforms getter normalization for optional object property access--bracket notation', () => {
      const { code, edits } = preprocessNSX(
         `console.log(obj[count]?@)`
      )
      expect(code).toBe(
         `console.log(obj[count]!!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { ªªof } from "@luent/noriscript";\n` +
         `console.log(ªªof(obj, "?")[count]);\n`
      )
   })

   it('transforms getter normalization for definite object property access--bracket notation', () => {
      const { code, edits } = preprocessNSX(
         `console.log(obj[count]!@)`
      )
      expect(code).toBe(
         `console.log(obj[count]!!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { ªªof } from "@luent/noriscript";\n` +
         `console.log(ªªof(obj, "!")[count]);\n`
      )
   })

   it('transforms getter normalization for optional object property access', () => {
      const { code, edits } = preprocessNSX(
         `console.log(obj.count?@)`
      )
      expect(code).toBe(
         `console.log(obj.count!!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { ªªof } from "@luent/noriscript";\n` +
         `console.log(ªªof(obj, "?").count);\n`
      )
   })

   it('transforms getter normalization for definite object property access', () => {
      const { code, edits } = preprocessNSX(
         `console.log(obj.count!@)`
      )
      expect(code).toBe(
         `console.log(obj.count!!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { ªªof } from "@luent/noriscript";\n` +
         `console.log(ªªof(obj, "!").count);\n`
      )
   })


   it('transforms getter normalization', () => {
      const { code, edits } = preprocessNSX(
         `const count = ref(0);\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `const count = ref(0);\n` +
         `console.log(countª)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@luent/noriscript";\n` +
         `const count = ref(0);\n` +
         `console.log(toª(count));\n`
      )
   })

   it('transforms getter normalization with non-null assertion', () => {
      const { code, edits } = preprocessNSX(
         `let count = ref(0);\n` +
         `console.log(count!@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `console.log(count!!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@luent/noriscript";\n` +
         `let count = ref(0);\n` +
         `console.log(toª(count!));\n`
      )
   })

   it('transforms getter normalization with optional chaining', () => {
      const { code, edits } = preprocessNSX(
         `let count = ref(0);\n` +
         `console.log(count?@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `console.log(count!!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@luent/noriscript";\n` +
         `let count = ref(0);\n` +
         `console.log(toª(count, "?"));\n`
      )
   })


   it('transforms getter normalization with call expressions', () => {
      const { code, edits } = preprocessNSX(
         `const run = () => 'hi';\n` +
         `console.log(run()@)`
      )
      expect(code).toBe(
         `const run = () => 'hi';\n` +
         `console.log(run()!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@luent/noriscript";\n` +
         `const run = () => 'hi';\n` +
         `console.log(toª(run()));\n`
      )
   })

   it('transforms getter normalization with call expressions with optional chaining', () => {
      const { code, edits } = preprocessNSX(
         `const run = () => 'hi';\n` +
         `console.log(run()?@)`
      )
      expect(code).toBe(
         `const run = () => 'hi';\n` +
         `console.log(run()!!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@luent/noriscript";\n` +
         `const run = () => 'hi';\n` +
         `console.log(toª(run(), "?"));\n`
      )
   })


   it('transforms getter normalization with call expressions with non-null assertion', () => {
      const { code, edits } = preprocessNSX(
         `const run = () => 'hi';\n` +
         `console.log(run()!@)`
      )
      expect(code).toBe(
         `const run = () => 'hi';\n` +
         `console.log(run()!!)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@luent/noriscript";\n` +
         `const run = () => 'hi';\n` +
         `console.log(toª(run()!));\n`
      )
   })


   it('transforms getter normalization with call expressions with type casting', () => {
      const { code, edits } = preprocessNSX(
         `const run = () => 'hi';\n` +
         `console.log(run()@ as Get<string>)`
      )
      expect(code).toBe(
         `const run = () => 'hi';\n` +
         `console.log(run()! as Get<string>)`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@luent/noriscript";\n` +
         `const run = () => 'hi';\n` +
         `console.log(toª(run()) as Get<string>);\n`
      )
   })

   it('transforms getter normalization with parameters', () => {
      const { code, edits } = preprocessNSX(
         `function foo(bar@) {\n` +
         `\tconsole.log(bar)\n` +
         `\tconsole.log(bar@)\n` +
         `}`
      )
      expect(code).toBe(
         `function foo(barª) {\n` +
         `\tconsole.log(bar)\n` +
         `\tconsole.log(barª)\n` +
         `}`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@luent/noriscript";\n` +
         `function foo(bar) {\n` +
         `\tbar = toª(bar);\n` +
         `\tconsole.log(bar());\n` +
         `\tconsole.log(bar);\n` +
         `}\n\n`
      )
   })

   it('transforms getter normalization with default parameters', () => {
      const { code, edits } = preprocessNSX(
         `function foo(bar@ = 0) {\n` +
         `\tconsole.log(bar)\n` +
         `\tconsole.log(bar@)\n` +
         `}`
      )
      expect(code).toBe(
         `function foo(barª = 0) {\n` +
         `\tconsole.log(bar)\n` +
         `\tconsole.log(barª)\n` +
         `}`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, toª } from "@luent/noriscript";\n` +
         `function foo(bar = assertª(0)) {\n` +
         `\tbar = toª(bar);\n` +
         `\tconsole.log(bar());\n` +
         `\tconsole.log(bar);\n` +
         `}\n\n`
      )
   })

   it('works with new lines', () => {
      const { code, edits } = preprocessNSX('function ref(a: number){\n}\n\nfunction frog() {\n   get count = ref(0);\n   return;\n}\n\nconst count = 0')
      expect(code).toBe('function ref(a: number){\n}\n\nfunction frog() {\n   let count = ref(0);\n   return;\n}\n\nconst count = 0')
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe('import { assertª } from "@luent/noriscript";\nfunction ref(a: number) {\n}\n\nfunction frog() {\n\tconst count = assertª(ref(0));\n\treturn;\n}\n\nconst count = 0;\n')
   })

})

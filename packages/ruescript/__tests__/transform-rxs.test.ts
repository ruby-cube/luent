import { describe, expect, it } from 'vitest'
import { preprocessRXS } from '../src/1-preprocess'
import { parseRXS } from '../src/2-parse'
import { transformRXS } from '../src/3-transform'
import { printTSX } from '../src/4-generate'


describe('transform', () => {
   it('transforms simple accessor variable declarations', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0)`
      )
      expect(code).toBe(
         `let count = ref(0)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n`
      )
   })

   it('transforms accessor variable reads', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `console.log(count)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `console.log(count)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `console.log(count());\n`
      )
   })

   // it.skip('transforms accessor variable reads with optional postfix', () => {
   //    const { code, edits } = preprocessRXS(
   //       `get count = ref(0);\n` +
   //       `count?;\n` +
   //       `console.log(count?)`
   //    )
   //    expect(code).toBe(
   //       `let count = ref(0);\n` +
   //       `countØ;\n` +
   //       `console.log(countØ)`
   //    )
   //    const ast = parseRXS('test.rxs', code)
   //    const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
   //    const generated = printTSX(tsxTree)
   //    expect(generated.code).toBe(
   //       `import { assertª } from "@rue/ruescript";\n` +
   //       `const count = assertª(ref(0));\n` +
   //       `count?.();\n` +
   //       `console.log(count?.());\n` 
   //    )
   // })

   it('transforms accessor variable writes (assignment expression)', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `count = 2`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `count = 2`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value = 2;\n`
      )
   })

   it('transforms accessor variable writes (update expression)', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `count++`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `count++`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, assertµ } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `assertµ(count).value++;\n`
      )
   })

   it('transforms accessor variable getter access', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `console.log(count);\n`
      )
   })

   it('transforms derivation expression', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `watch((count * 2)@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `watch((count * 2)!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `watch(() => (count * 2));\n`
      )
   })

   it('transforms derivation sequence expression', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `watch((console.log('hi'), count * 2)@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `watch((console.log('hi'), count * 2)!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `watch(() => ((console.log('hi'), count * 2)));\n`
      )
   })

   it('transforms derivation type casting expression', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `watch((count * 2 as number)@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `watch((count * 2 as number)!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `watch(() => (count * 2 as number));\n`
      )
   })


   it('transforms async derivation expression', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `watch((await count)@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `watch((await count)!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `watch(async () => (await count));\n`
      )
   })

   it('transforms immediately invoked derivation expression', () => {
      const { code, edits } = preprocessRXS(
         `get count = ref(0);\n` +
         `watch((count * 2)@())`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `watch((count * 2)!())`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª } from "@rue/ruescript";\n` +
         `const count = assertª(ref(0));\n` +
         `watch((() => (count * 2))());\n`
      )
   })

   // { const c = 0 ; return a + b }@()
   //
   // preprocess
   // { const c = 0 ; return a + b }(ª)
   //
   // final
   // (() => { const c = 0 ; return a + b })()
   it.skip('transforms immediately invoked derivation expression-block bodied', () => {
      const { code, edits } = preprocessRXS(
         `watch({ const c = 0 ; return a + b }@())`
      )
      expect(code).toBe(
         `watch({ const c = 0 ; return a + b }(ª))`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `watch((() => { const c = 0 ; return a + b })());\n`
      )
   })

   it('transforms accessor property declarations via colon notation', () => {
      const { code, edits } = preprocessRXS(
         `const obj = { get count: ref(0), a, b: 0, get frog: ref('kermit') }`
      )
      expect(code).toBe(
         `const obj = { gª, count: ref(0), a, b: 0, gª, frog: ref('kermit') }`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { assertª, absorbsª, absorbª } from "@rue/ruescript";\n` +
         `const obj = absorbsª({\n` +
         `\tcount: absorbª(assertª(ref(0))),\n` +
         `\ta,\n` +
         `\tb: 0,\n` +
         `\tfrog: absorbª(assertª(ref('kermit')))` +
         `\n});\n`
      )
   })


   it('transforms getter normalization for object property access', () => {
      const { code, edits } = preprocessRXS(
         `console.log(obj.count@)`
      )
      expect(code).toBe(
         `console.log(obj.countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { ªof } from "@rue/ruescript";\n` +
         `console.log(ªof(obj).count);\n`
      )
   })

   it.skip('transforms getter normalization for object property access--bracket notation', () => {
      const { code, edits } = preprocessRXS(
         `console.log(obj[count]@)`
      )
      expect(code).toBe(
         `console.log(obj[count]!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { ªof } from "@rue/ruescript";\n` +
         `console.log(ªof(obj)[count]);\n`
      )
   })

   it.skip('transforms getter normalization for optional object property access--bracket notation', () => {
      const { code, edits } = preprocessRXS(
         `console.log(obj[count]!@)`
      )
      expect(code).toBe(
         `console.log(obj[count]!!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { ªof } from "@rue/ruescript";\n` +
         `console.log(ªof(obj, '?')[count]);\n`
      )
   })

   it.skip('transforms getter normalization for definite object property access--bracket notation', () => {
      const { code, edits } = preprocessRXS(
         `console.log(obj[count]!@)`
      )
      expect(code).toBe(
         `console.log(obj[count]!!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { ªof } from "@rue/ruescript";\n` +
         `console.log(ªof(obj, '!')[count]);\n`
      )
   })

   it.skip('transforms getter normalization for optional object property access', () => {
      const { code, edits } = preprocessRXS(
         `console.log(obj.count!@)`
      )
      expect(code).toBe(
         `console.log(obj.count!!)`
      )
      // const ast = parseRXS('test.rxs', code)
      // const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      // const generated = printTSX(tsxTree)
      // expect(generated.code).toBe(
      //    `import { ªof } from "@rue/ruescript";\n` +
      //    `console.log(ªof(obj, '?').count);\n`
      // )
   })

   it.skip('transforms getter normalization for definite object property access', () => {
      const { code, edits } = preprocessRXS(
         `console.log(obj.count!@)`
      )
      expect(code).toBe(
         `console.log(obj.count!!)`
      )
      // const ast = parseRXS('test.rxs', code)
      // const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      // const generated = printTSX(tsxTree)
      // expect(generated.code).toBe(
      //    `import { ªof } from "@rue/ruescript";\n` +
      //    `console.log(ªof(obj, '!').count);\n`
      // )
   })


   it('transforms getter normalization', () => {
      const { code, edits } = preprocessRXS(
         `const count = ref(0);\n` +
         `console.log(count@)`
      )
      expect(code).toBe(
         `const count = ref(0);\n` +
         `console.log(countª)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@rue/ruescript";\n` +
         `const count = ref(0);\n` +
         `console.log(toª(count));\n`
      )
   })

   it('transforms getter normalization with non-null assertion', () => {
      const { code, edits } = preprocessRXS(
         `let count = ref(0);\n` +
         `console.log(count!@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `console.log(count!!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@rue/ruescript";\n` +
         `let count = ref(0);\n` +
         `console.log(toª(count!));\n`
      )
   })

   it('transforms getter normalization with optional chaining', () => {
      const { code, edits } = preprocessRXS(
         `let count = ref(0);\n` +
         `console.log(count?@)`
      )
      expect(code).toBe(
         `let count = ref(0);\n` +
         `console.log(count!!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@rue/ruescript";\n` +
         `let count = ref(0);\n` +
         `console.log(toª(count, '?'));\n`
      )
   })


   it('transforms getter normalization with call expressions', () => {
      const { code, edits } = preprocessRXS(
         `const run = () => 'hi';\n` +
         `console.log(run()@)`
      )
      expect(code).toBe(
         `const run = () => 'hi';\n` +
         `console.log(run()!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@rue/ruescript";\n` +
         `const run = () => 'hi';\n` +
         `console.log(toª(run()));\n`
      )
   })

   it('transforms getter normalization with call expressions with optional chaining', () => {
      const { code, edits } = preprocessRXS(
         `const run = () => 'hi';\n` +
         `console.log(run()?@)`
      )
      expect(code).toBe(
         `const run = () => 'hi';\n` +
         `console.log(run()!!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@rue/ruescript";\n` +
         `const run = () => 'hi';\n` +
         `console.log(toª(run(), '?'));\n`
      )
   })


   it('transforms getter normalization with call expressions with non-null assertion', () => {
      const { code, edits } = preprocessRXS(
         `const run = () => 'hi';\n` +
         `console.log(run()!@)`
      )
      expect(code).toBe(
         `const run = () => 'hi';\n` +
         `console.log(run()!!)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@rue/ruescript";\n` +
         `const run = () => 'hi';\n` +
         `console.log(toª(run()!));\n`
      )
   })


   it('transforms getter normalization with call expressions with type casting', () => {
      const { code, edits } = preprocessRXS(
         `const run = () => 'hi';\n` +
         `console.log(run()@ as Get<string>)`
      )
      expect(code).toBe(
         `const run = () => 'hi';\n` +
         `console.log(run()! as Get<string>)`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { toª } from "@rue/ruescript";\n` +
         `const run = () => 'hi';\n` +
         `console.log(toª(run()) as Get<string>);\n`
      )
   })

   it('transforms jsx attribute shorthand', () => {
      const { code, edits } = preprocessRXS(
         `<Tooltip something='true' {tooltip}></Tooltip>`
      )
      expect(code).toBe(
         `<Tooltip something='true' ßtooltipß></Tooltip>`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `<Tooltip something='true' tooltip={tooltip}></Tooltip>;\n`
      )
   })

   it('works with new lines', () => {
      const { code, edits } = preprocessRXS('function ref(a: number){\n}\n\nfunction frog() {\n   get count = ref(0);\n   return;\n}\n\nconst count = 0')
      expect(code).toBe('function ref(a: number){\n}\n\nfunction frog() {\n   let count = ref(0);\n   return;\n}\n\nconst count = 0')
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe('import { assertª } from "@rue/ruescript";\nfunction ref(a: number) {\n}\n\nfunction frog() {\n\tconst count = assertª(ref(0));\n\treturn;\n}\n\nconst count = 0;\n')
   })


   it('parses multiple jsx roots', () => {
      const ast = parseRXS('test.rxs', `
          function a() {
            const b = {
               a,
               a,
               a
            }
            const n = /*<T>*/(b: T) => { }

            ª=><div></div>
            ª=><>{If(
            )}</>
            ª=><div></div>
         }
      `)
      console.log('ast', ast.program.body[0].body.body[0])
   })
})

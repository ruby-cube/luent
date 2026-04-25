import { describe, expect, it } from "vitest";
import { preprocessRXS } from "../src/1-preprocess";
import { parseRXS } from "../src/2-parse";
import { transformRXS } from "../src/3-transform";
import { printTSX } from "../src/4-generate";

describe('RueScript JSX transforms', () => {

   it.only('transforms jsx attribute shorthand', () => {
      const { code, edits } = preprocessRXS(
         `<Tooltip something='true' {tooltip}></Tooltip>`
      )
      expect(code).toBe(
         `<Tooltip something='true' ßtooltipß></Tooltip>`
      )
      const ast = parseRXS('test.rxs', code)
      const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `<Tooltip something='true' tooltip={tooltip}></Tooltip>;\n`
      )
   })

   it.only('parses multiple jsx roots', () => {
      // const ast = parseRXS('test.rxs', `
      //    function foo() {
      //       {}<div></div>
      //       {}<div></div>
      //       {If(a,ˇ=>{
      //          {}<p>hi</p>
      //          {}<p>hi</p>
      //          {}<p>hi</p>
      //       })}
      //       {}<div></div>
      //    }
      // `)
      const ast = parseRXS('test.rxs', `
         function foo() {
           {}<div></div>
            {If(a, ˇ=>{
                {If(b
                  <div></div>
                )}
            })}
           {}<div></div>
         }
      `)
      console.log('ast', ast.program.body)
      // console.log(ast.program.body[0].body.body[4].body[0].expression.arguments.at(-1))
   })

   it('can parse template function prefix', () => {
      const ast = parseRXS('test.rxs', `
         const o = ˇ=<div>
            ˇ={If(b,ˇ=>
               {If(a, 
                  ˇ=<div/>
               )}
            )}
         </div>`)
      console.log(ast.program.body)
      // const { ast: tsxTree, transformed } = transformRXS(ast.program, edits)
      // expect(transformed).toBe(true)
      // const generated = printTSX(tsxTree)
      // expect(generated.code).toBe(
      //    `import { assertª, assertµ } from "@rue/ruescript";\n` +
      //    `const foo = assertª(ref(0));\n` +
      //    `watch((() => {\n` + `\tconst a = 0;\n\treturn a;\n}\n));\n` + // TODO: remove parentheses if not IIDE
      //    `const count = assertª(ref(0));\n` +
      //    `assertµ(count).value = 2;\n`
      // )
   })
})
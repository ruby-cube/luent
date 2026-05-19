import { describe, expect, it } from "vitest";
import { preprocessNSX } from "../src/1-preprocess";
import { parseNSX } from "../src/2-parse";
import { transformNSX } from "../src/3-transform";
import { printTSX } from "../src/4-generate";

describe('NextScript JSX transforms', () => {

   it('transforms jsx attribute shorthand', () => {
      const { code, edits } = preprocessNSX(
         `<Tooltip something='true' {tooltip}></Tooltip>`
      )
      expect(code).toBe(
         `<Tooltip something='true' ßtooltipß></Tooltip>`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      // expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `<Tooltip something='true' tooltip={tooltip}></Tooltip>;\n`
      )
   })

   it('transforms <Component>', () => {
      const { code, edits } = preprocessNSX(
         `<Component><div>hi</div></Component>`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { JSXComponent } from "@rue/nextscript";\n` +
         `JSXComponent(<><div>hi</div></>);\n`
      )
   })

   it('transforms <Component as={{ open }}>', () => {
      const { code, edits } = preprocessNSX(
         `<Component as={{ open }}><div>hi</div></Component>`
      )
      const ast = parseNSX('test.nsx', code)
      const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      expect(transformed).toBe(true)
      const generated = printTSX(tsxTree)
      expect(generated.code).toBe(
         `import { JSXComponentAs } from "@rue/nextscript";\n` +
         `JSXComponentAs({\n\topen\n}, <><div>hi</div></>);\n`
      )
   })

   it('parses multiple jsx roots', () => {
      // const ast = parseNSX('test.nsx', `
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
      const ast = parseNSX('test.nsx', `
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

   it.skip('can parse template function prefix', () => {
      const ast = parseNSX('test.nsx', `
         const o = ˇ=<div>
            ˇ={If(b,ˇ=>
               {If(a, 
                  ˇ=<div/>
               )}
            )}
         </div>`)
      console.log(ast.program.body)
      // const { ast: tsxTree, transformed } = transformNSX(ast.program, edits)
      // expect(transformed).toBe(true)
      // const generated = printTSX(tsxTree)
      // expect(generated.code).toBe(
      //    `import { assertª, assertµ } from "@rue/nextscript";\n` +
      //    `const foo = assertª(ref(0));\n` +
      //    `watch((() => {\n` + `\tconst a = 0;\n\treturn a;\n}\n));\n` + // TODO: remove parentheses if not IIDE
      //    `const count = assertª(ref(0));\n` +
      //    `assertµ(count).value = 2;\n`
      // )
   })
})
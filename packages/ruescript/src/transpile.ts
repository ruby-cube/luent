import { preprocessRXS } from "./1-preprocess.ts"
import { parseRXS } from "./2-parse.ts"
import { transformRXS } from "./3-transform.ts"
import { printTSX } from "./4-generate.ts"

export function transpileRueScript(file: string, source: string) {
   const { code, edits } = preprocessRXS(source)
   const preTree = parseRXS(file, code)
   console.log('errors', preTree.errors)
   const { ast: transformedTree } = transformRXS(preTree.program, edits)
   const generated = printTSX(transformedTree)
   console.log('===================')
   console.log(generated.code)
   console.log('===================')
   return {
      source,
      transpiled: { ast: transformedTree, code: generated.code },
      map: generated.map
   }
}
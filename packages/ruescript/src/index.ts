import { preprocessRXS } from "./1-preprocess"
import { parseRXS } from "./2-parse"
import { transformRXS } from "./3-transform"
import { printTSX } from "./4-generate"

export function transpileRueScript(file: string, source: string) {
   const { code, edits } = preprocessRXS(source)
   const preTree = parseRXS(file, code)
   const transformedTree = transformRXS(preTree.program, edits)
   const generated = printTSX(transformedTree)
   return {
      source,
      transpiled: { ast: transformedTree, code: generated.code },
      map: generated.map
   }
}
import { preprocessRXS } from "./1-preprocess"
import { parseRXS } from "./2-parse"
import { transformRXS } from "./3-transform"
import { printTSX } from "./4-generate"

export function compileRueScript(file: string, source: string) {
   const { code, edits } = preprocessRXS(source)
   const ast = parseRXS(file, code)
   const tsxTree = transformRXS(ast.program, edits)
   return printTSX(tsxTree)
}
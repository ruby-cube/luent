import { preprocessNSX } from "./1-preprocess.ts"
import { parseNSX } from "./2-parse.ts"
import { transformNSX } from "./3-transform.ts"
import { printTSX } from "./4-generate.ts"

export function transpileNextScript(file: string, source: string) {
  const { code, edits } = preprocessNSX(source)
  const preTree = parseNSX(file, code)
  console.log('errors', preTree.errors)
  const { ast: transformedTree } = transformNSX(preTree.program, edits)
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
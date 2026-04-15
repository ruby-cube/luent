import { get } from "node:http"
import { preprocessRXS } from "./1-preprocess"
import { parseRXS } from "./2-parse"
import { transformRXS } from "./3-transform"
import { printTSX } from "./4-generate"
import { isFunction } from "@rue/utils"

export function transpileRueScript(file: string, source: string) {
   const { code, edits } = preprocessRXS(source)
   const preTree = parseRXS(file, code)
   const { ast: transformedTree } = transformRXS(preTree.program, edits)
   const generated = printTSX(transformedTree)

   console.log('map:', generated.map)

   return {
      source,
      transpiled: { ast: transformedTree, code: generated.code },
      map: generated.map
   }
}

export function assertª<T extends () => any>(getter: T): T {
   if (typeof getter !== 'function' || getter.length !== 0) {
      throw new TypeError(`Getter must be a function: ${getter}`)
   }
   return getter
}
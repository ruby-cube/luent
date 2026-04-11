import { Segment } from "@rue/ruescript/src/5-generate";
import { CodeMapping } from "@volar/language-core";
import { walk } from "zimmerframe";
import { Node } from 'oxc-parser'



const something = function () {

}


export function generateMappings(source: string, transpiled: { ast: Node, code: string }, map: Segment[][]): CodeMapping[] {
   const mappings = []

   walk(transpiled.ast, null, {
      Identifier(node) {
         mappings.push({
            sourceOffsets: [node.start],
            generatedOffsets: [],
            lengths: [node.name.length],
            data: {
               completion: true,
               format: true, 
               navigation: true, // goto definition, references, rename
               semantic: true, // hover, type info, symbol relationships, semantic highlighting
               structure: true, // outline view, code folding regions, breadcrumbs, document symbols 
               verification: true, // type errors, syntax errors, etc
            },
         })
      },
      FunctionDeclaration() {

      },
      FunctionExpression() {

      },
      ArrowFunctionExpression() {

      }
   })

   return [] as any as CodeMapping[]
}

// this.mappings = [{
//    sourceOffsets: [0],
//    generatedOffsets: [0],
//    lengths: [length],
//    data: {
//       completion: true,
//       format: true,
//       navigation: true,
//       semantic: true,
//       structure: true,
//       verification: true,
//    },
// }];
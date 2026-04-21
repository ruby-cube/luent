import { Program } from "oxc-parser";
import { Edit } from "../src/1-preprocess";
import { walk } from 'zimmerframe'

/**
 *  - adjust positions to source positions
 *  - unwrite invalid preprocess rewrites
 * 
 * @param ast 
 * @param edits 
 */
export function postprocess(ast: Program, edits: Edit[]) {
   // TODO: build offsets from edits

   const editMap = buildEditMap(edits)



   const adjusted = walk(ast, null, {
      _(nodes, { next }) {
         // TODO: adjust positions from offsets

         if (editMap.has(start)) {

         }
         next()
      },
   })

   return adjusted
}

function buildEditMap(edits: Edit[]) {
   const editMap = new Map()
   for (const edit of edits) {
      editMap.set(edit.pos, edit)
   }
   return editMap
}

function unwriteInvalidEdit(generated: string, edits: Edit[], mappings: []) {


}
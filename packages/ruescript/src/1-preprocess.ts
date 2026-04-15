
type BaseEdit = {
   type: string
   pos: number
   original: string
   transformed: string
   valid: undefined | boolean // pattern is in valid transform context (e.g. non-string/non-comment)--context unknown until after parsing
}

export type Edit = GetDeclarationEdit

export type GetDeclarationEdit = {
   type: 'GetDeclaration'
   identifier: string,
   gap: string
} & BaseEdit

function encodeGap(group: string): string {
   return group
      .replace(/[ \t]/g, '_')
      .replace(/\/\*/g, 'ƒº')
      .replace(/\*\//g, 'ºƒ')
}

/**
 * Applies edits to the code and returns transformed code
 * 
 * @param code source
 * @param edits Assumes edits are in order from lowest pos to highest pos
 * @returns 
 */
function applyEdits(code: string, edits: Edit[]): string {
   if (edits.length === 0) {
      console.log('*** early return', code)
      return code
   }

   let result = code

   for (const edit of edits) {
      result = result.slice(0, edit.pos) + edit.transformed + result.slice(edit.pos + edit.original.length)
   }
   return result
}

class RXSPreprocessor {
   edits: Edit[] = []
   code: string = ''

   constructor(readonly source: string) {
   }
   
   transform() {
      this.rewriteGetVariableDeclarations()
      this.rewriteGetPropertyColonNotation()
      const edits = this.edits = this.edits.toSorted((a, b) => b.pos - a.pos)
      console.log('edits', edits.length)
      this.code = applyEdits(this.source, edits)
      return this
   }

   /**
    * - Replaces `get` variable declaration pattern with intermediary valid js.
    * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string)
    * 
    * Example:
    * `get count = ref(0)` -->
    * `gÆt_count = ref(0)`
    */
   rewriteGetVariableDeclarations() {
      const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([a-zA-Z_$][a-zA-Z0-9_$]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?==(?![=>]))/g

      const matches = this.source.matchAll(pattern)
      for (const match of matches) {
         const index = match.index ?? 0
         const original = match[0]
         const gap = match[1]
         const identifier = match[2]
         const postGap = match[3]
         const transformed = 'gÆt' + encodeGap(gap) + identifier + postGap
         
         this.edits.push({
            type: 'GetDeclaration',
            pos: index,
            original,
            transformed,
            valid: undefined,
            identifier,
            gap
         })
      }
   }

   /**
    * - Replaces `get` property colon notation pattern with intermediary valid js.
    * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string or not in object literal)
    * 
    * Example:
    * `get count: ref(0)` -->
    * `gÆt_count: ref(0)`
    */
   rewriteGetPropertyColonNotation() {
      const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([a-zA-Z_$][a-zA-Z0-9_$]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?=:)/g

      const matches = this.source.matchAll(pattern)
      for (const match of matches) {
         const index = match.index ?? 0
         const original = match[0]
         const gap = match[1]
         const identifier = match[2]
         const postGap = match[3]
         const transformed = 'gÆt' + encodeGap(gap) + identifier + postGap

         this.edits.push({
            type: 'GetDeclaration',
            pos: index,
            original,
            transformed,
            valid: undefined,
            gap,
            identifier
         })
      }
   }
}

// export function unwriteGetDeclarations(string: string, edits: Edit[] = []) {
//    let result = string
//    for (let i = edits.length - 1; i >= 0; i--) {
//       const edit = edits[i]
//       result = result.slice(0, edit.pos) + edit.original + result.slice(edit.pos + edit.original.length)
//    }
//    return result
// }





/**
 * Preprocess rxs source into valid tsx
 */
export function preprocessRXS(source: string) {
   // (1) TODO: pre-parser // tree of string, regex, code leaf nodes, and object literals, template literals, JSXText
   // (2) walk tree and rewrite code to valid jsx
   return new RXSPreprocessor(source).transform() // walks rough ast for preprocessing
}





import { ACCESSOR_POSTFIX, OPTIONAL_POSTFIX } from "./3-transform"

type BaseEdit = {
   type: string
   pos: number
   original: string
   transformed: string
   valid: undefined | boolean // pattern is in valid transform context (e.g. non-string/non-comment)--context unknown until after parsing
}

export type Edit = GetDeclarationEdit

export type GetDeclarationEdit = {
   type: 'GetDeclaration' | 'GetPropertyColonNotation' | 'AccessorPostfixOperator' | 'OptionalPostfix'
   identifier: string,
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
      return code
   }

   let result = code

   for (const edit of edits) {
      result = result.slice(0, edit.pos) + edit.transformed + result.slice(edit.pos + edit.original.length)
   }
   return result
}

export class Edits {
   lastIndex = 0;

   constructor(
      private edits: Edit[]
   ) {

   }

   find(pos: number) {
      const limit = this.edits.length;
      for (let i = this.lastIndex; i < limit; i++) {
         const edit = this.edits[i]
         if (pos >= edit.pos && pos < edit.pos + edit.transformed.length) {
            this.lastIndex = i;
            return edit
         }
      }
   }
}



class RXSPreprocessor {
   _edits: Edit[] = []
   edits!: Edits
   code: string = ''

   constructor(readonly source: string) {
   }

   transform() {
      this.rewriteGetVariableDeclarations()
      this.rewriteGetPropertyColonNotation()
      this.rewriteAccessorOperator()
      this.rewriteOptionalPostfix()
      const edits = this._edits.toSorted((a, b) => a.pos - b.pos)
      this.code = applyEdits(this.source, edits)
      this.edits = new Edits(edits)
      return this
   }

   /**
    * - Replaces `get` variable declaration pattern with intermediary valid js.
    * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string)
    * 
    * Example:
    * `get count = ref(0)` -->
    * `let count = ref(0)`
    */
   rewriteGetVariableDeclarations() {
      const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([a-zA-Z_$][a-zA-Z0-9_$]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?==(?![=>]))/g

      const matches = this.source.matchAll(pattern)
      for (const match of matches) {
         const [original, before, identifier, after] = match
         const transformed = 'let' + before + identifier + after

         this._edits.push({
            type: 'GetDeclaration',
            pos: match.index,
            original,
            transformed,
            valid: undefined,
            identifier
         })
      }
   }

   rewriteAccessorOperator() {
      const pattern = /([^$\w])([$A-Za-z_][\w$]*)@([^$\w])/g;

      const matches = this.source.matchAll(pattern)

      for (const match of matches) {
         const [original, before, identifier, after] = match
         const transformed = before + identifier + ACCESSOR_POSTFIX + after

         this._edits.push({
            type: 'AccessorPostfixOperator',
            pos: match.index,
            original,
            transformed,
            valid: undefined,
            identifier
         })
      }
   }

   /**
    * - Replaces `get` property colon notation pattern with intermediary valid js.
    * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string or not in object literal)
    * 
    * Example:
    * `get count: ref(0)` -->
    * `ge, count: ref(0)`
    */
   rewriteGetPropertyColonNotation() {
      const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([a-zA-Z_$][a-zA-Z0-9_$]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?=:)/g

      const matches = this.source.matchAll(pattern)
      for (const match of matches) {
         const [original, before, identifier, after] = match
         const index = match.index
         const transformed = 'ge,' + before + identifier + after

         this._edits.push({
            type: 'GetPropertyColonNotation',
            pos: index,
            original,
            transformed,
            valid: undefined,
            identifier
         })
      }
   }

   /**
    * Optional Postfix
    * source: count?;
    * prepro: countØ;
    * final: count?.()
   */
   rewriteOptionalPostfix() {
      const pattern = /([$A-Za-z_][\w$]*)\?;/g;

      const matches = this.source.matchAll(pattern)
      for (const match of matches) {
         const [original, identifier] = match
         const index = match.index
         const transformed = identifier + OPTIONAL_POSTFIX + ';'

         this._edits.push({
            type: 'OptionalPostfix',
            pos: index,
            original,
            transformed,
            valid: undefined,
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





import { ACCESSOR_EXPRESSION_POSTFIX, ACCESSOR_VARIABLE_POSTFIX } from "./3-transform.ts"

type BaseEdit = {
   type: string
   index: number,
   anchor: number
   anchorType: 'start' | 'end'
   original: string
   transformed: string
   // valid: undefined | boolean // pattern is in valid transform context (e.g. non-string/non-comment)--context unknown until after parsing
}

export type Edit = AccessorVariableEdit | AccessorExpressionEdit | BaseEdit

export type AccessorVariableEdit = {
   type: 'GetDeclaration' | 'GetPropertyColonNotation' | 'AccessorVariablePostfix'
   identifier: string,
} & BaseEdit

export type AccessorExpressionEdit = {
   type: 'AccessorExpressionPostfix' | 'OptionalAccessorPostfix' | 'NonNullAccessorPostfix' | 'BracketAccessorPostfix'
} & BaseEdit

const AccessorEditType = {
   '?': 'OptionalAccessorPostfix',
   '!': 'NonNullAccessorPostfix',
   ']': 'BracketAccessorPostfix',
   ')': 'AccessorExpressionPostfix',
}

function encodeGap(group: string): string {
   return group
      .replace(/[ \t]/g, '_')
      .replace(/\/\*/g, 'ƒº')
      .replace(/\*\//g, 'ºƒ')
}

// TODO: current regexes are temporary naive implementations that need to be replaced with more robust searches

/**
 * Applies edits to the code and returns transformed code
 * 
 * @param code source
 * @param edits Assumes edits
 * - are in order from lowest pos to highest pos
 * - edits do not overlap // TODO: I don't know if I can guarantee this
 * @returns 
 */
function applyEdits(code: string, edits: Edit[]): string {
   if (edits.length === 0) {
      return code
   }

   let result = code

   for (const edit of edits) {
      result = result.slice(0, edit.index) + edit.transformed + result.slice(edit.index + edit.original.length)
   }
   return result
}

export class Edits {
   prefixes: Edit[];
   postfixes: Edit[];

   lastPrefix: number;
   lastPostfix: number
   constructor(
      edits: Edit[]
   ) {
      const prefixes: Edit[] = this.prefixes = []
      const postfixes: Edit[] = this.postfixes = []
      
      for (const edit of edits) {
         if (edit.anchorType === 'start') {
            prefixes.push(edit)
         }
      }
      for (const edit of edits) {
         if (edit.anchorType === 'end') {
            postfixes.push(edit)
         }
      }
      
      this.lastPrefix = 0;
      this.lastPostfix = postfixes.length - 1
   }

   findStart(anchor: number) {
      const edits = this.prefixes
      const limit = edits.length;
      for (let i = this.lastPrefix; i < limit; i++) {
         const edit = edits[i]
         if (anchor >= edit.anchor && anchor < edit.anchor + edit.transformed.length) {
            this.lastPrefix = i;
            return edit
         }
      }
   }

   findEnd(anchor: number) {
      const edits = this.postfixes
      for (let i = this.lastPostfix; i >= 0; i--) {
         const edit = edits[i]
         if (anchor <= edit.anchor && anchor > edit.anchor - edit.transformed.length) {
            this.lastPostfix = i;
            return edit
         }
      }
   }
}

// TODO: make sure regex is correct

class RXSPreprocessor {
   _edits: Edit[] = []
   edits!: Edits
   code: string = ''

   constructor(readonly source: string) {
   }

   transform() {
      this.rewriteGetVariableDeclarations()
      this.rewriteGetPropertyColonNotation()
      this.rewriteAcessorVariablePostfix()
      this.rewriteExpressionPostfix()

      const edits = this._edits.toSorted((a, b) => a.index - b.index)
      this.code = applyEdits(this.source, edits)
      this.edits = new Edits(edits)
      return this
   }

   /**
    * - Replaces `get` variable declaration pattern with intermediary valid js.
    * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string)
    * 
    * Example:
    * `get count =` -->
    * `let count =`
    */
   rewriteGetVariableDeclarations() {
      const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([a-zA-Z_$][a-zA-Z0-9_$]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?==(?![=>]))/g

      const matches = this.source.matchAll(pattern)
      for (const match of matches) {
         const [original, before, identifier, after] = match
         const index = match.index
         const transformed = 'let' + before + identifier + after

         this._edits.push({
            type: 'GetDeclaration',
            index,
            anchor: index,
            anchorType: 'start',
            original,
            transformed,
            identifier
         })
      }
   }

   /**
    * - Replaces `get` property colon notation pattern with intermediary valid js.
    * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string or not in object literal)
    * 
    * Example:
    * `get count:` -->
    * `gª, count:`
    */
   rewriteGetPropertyColonNotation() {
      const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([a-zA-Z_$][a-zA-Z0-9_$]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?=:)/g

      const matches = this.source.matchAll(pattern)
      for (const match of matches) {
         const [original, before, identifier, after] = match
         const index = match.index
         const transformed = 'gª,' + before + identifier + after

         this._edits.push({
            type: 'GetPropertyColonNotation',
            index,
            anchor: index,
            anchorType: 'start',
            original,
            transformed,
            identifier
         })
      }
   }

   rewriteAcessorVariablePostfix() {

      const pattern = /([\p{ID_Continue}$\u200C\u200D])@([\s/().;,<:=])/gu;

      const matches = this.source.matchAll(pattern)

      for (const match of matches) {
         const [original, identifier] = match
         const index = match.index
         const transformed = identifier + ACCESSOR_VARIABLE_POSTFIX

         this._edits.push({
            type: 'AccessorVariablePostfix',
            index,
            anchor: index + 1,
            anchorType: 'end',
            original: original.slice(0, -1),
            transformed: transformed,
            identifier
         })
      }
   }

   // expression postfix
   // nonnullable postfix
   // optional postfix
   // bracket postfix
   rewriteExpressionPostfix() {
      const pattern = /([)?!\]])@([\s/()])/g
      const matches = this.source.matchAll(pattern)

      for (const match of matches) {
         const [original, before, after] = match
         const index = match.index
         
         this._edits.push({
            type: AccessorEditType[before as keyof typeof AccessorEditType],
            index,
            anchor: index + 2, // NOTE: range for non-null expression ends after !
            anchorType: 'end',
            original,
            transformed: (before === '?' ? '!' : before) + ACCESSOR_EXPRESSION_POSTFIX + after
         })

      }
   }

   /**
    * Optional Postfix
    * source: count?;
    * prepro: countØ;
    * final: count?.()
   */
   // rewriteOptionalPostfix() {
   //    const pattern = /([$A-Za-z_][\w$]*)\?;/g;

   //    const matches = this.source.matchAll(pattern)
   //    for (const match of matches) {
   //       const [original, identifier] = match
   //       const index = match.index
   //       const transformed = identifier + OPTIONAL_POSTFIX + ';'

   //       this._edits.push({
   //          type: 'OptionalPostfix',
   //          pos: index,
   //          original,
   //          transformed,
   //          valid: undefined,
   //          identifier
   //       })
   //    }
   // }

   /**
    * Optional Postfix (parenthesized)
    * source: (count?)
    * prepro: (countØ);
    * final: (count?.())
   */
   // rewriteParenthesizedOptionalPostfix() {
   //    const pattern = /\(([$A-Za-z_][\w$]*)\?\)/g;
   //    const matches = this.source.matchAll(pattern)
   //    for (const match of matches) {
   //       const [original, identifier] = match
   //       const index = match.index
   //       const transformed = '(' + identifier + OPTIONAL_POSTFIX + ')'

   //       this._edits.push({
   //          type: 'OptionalPostfix',
   //          pos: index,
   //          original,
   //          transformed,
   //          valid: undefined,
   //          identifier
   //       })
   //    }
   // }
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





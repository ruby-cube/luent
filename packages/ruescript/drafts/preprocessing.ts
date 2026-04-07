type Insert = {
   pos: number
   length: number
}

export type Edit = {
   pos: number
   length: number
   original: string
}

function encodeGroup(group: string): string {
   return group
      .replace(/[ \t]/g, '_')
      .replace(/\/\*/g, 'ƒº')
      .replace(/\*\//g, 'ºƒ')
}

function decodeGroup(group: string): string {
   return group
      .replace(/ƒº/g, '/*')
      .replace(/ºƒ/g, '*/')
      .replace(/_/g, ' ')
}

class RxsPreprocessor {
   edits: Edit[] = []
   inserts: Insert[] = []

   constructor(public source: string) { }

   transform() {
      this.rewriteGetDeclarations()
      this.rewriteGetPropertyColonNotation()
      return { code: this.source, edits: this.edits }
   }

   rewriteGetDeclarations() {
      const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([a-zA-Z_$][a-zA-Z0-9_$]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?==(?![=>]))/g

      this.source = this.source.replace(pattern, (match, group1, ident, group3, offset) => {
         const replacement = 'gÆt' + encodeGroup(group1) + ident + group3
         this.edits.push({ pos: offset, length: match.length, original: match })
         return replacement
      })
   }

   rewriteGetPropertyColonNotation() {
      const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([a-zA-Z_$][a-zA-Z0-9_$]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?=:)/g

      this.source = this.source.replace(pattern, (match, group1, ident, group3, offset) => {
         const replacement = 'gÆt' + encodeGroup(group1) + ident + group3
         this.edits.push({ pos: offset, length: match.length, original: match })
         return replacement
      })
   }
}

export function unwriteGetDeclarations(string: string, edits: Edit[] = []) {
   let result = string
   for (let i = edits.length - 1; i >= 0; i--) {
      const edit = edits[i]
      result = result.slice(0, edit.pos) + edit.original + result.slice(edit.pos + edit.length)
   }
   return result
}

export function unwriteGetPropertyColonNotation(string: string, edits: Edit[] = []) {
   let result = string
   for (let i = edits.length - 1; i >= 0; i--) {
      const edit = edits[i]
      result = result.slice(0, edit.pos) + edit.original + result.slice(edit.pos + edit.length)
   }
   return result
}




/**
 * Preprocess rxs source into valid tsx
 */
export function preprocessRxsSource(source: string) {
   return new RxsPreprocessor(source).transform()
}





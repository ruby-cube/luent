import * as vscode from "vscode";
// FIX: AI slop

function collectAtTokens(code) {
   const tokens = []
   const atRegex = /[A-Za-z_$][\w$]*@/g

   for (const match of code.matchAll(atRegex)) {
      const atStart = (match.index || 0) + match[0].length - 1
      tokens.push({ start: atStart, length: 1 })
   }

   return tokens
}

const LEGEND = new vscode.SemanticTokensLegend(['rxsGetterAccess'], [])

const provider = {
   provideDocumentSemanticTokens(document) {
      const code = document.getText()
      const atTokens = collectAtTokens(code)
      const builder = new vscode.SemanticTokensBuilder(LEGEND)

      for (const token of atTokens) {
         const startPos = document.positionAt(token.start)
         const endPos = document.positionAt(token.start + token.length)
         builder.push(new vscode.Range(startPos, endPos), 'rxsGetterAccess', [])
      }

      return builder.build()
   },
}

function activate(context) {
   const selector = [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
      { language: 'typescript', scheme: 'untitled' },
      { language: 'typescriptreact', scheme: 'untitled' },
      { language: 'typescriptreact', pattern: '**/*.rxs' },
   ]

   const registration = vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, LEGEND)
   context.subscriptions.push(registration)
}

function deactivate() { }

export { activate, deactivate }

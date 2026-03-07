// @ts-check
'use strict'

const vscode = require('vscode')

// ── Token collection ──────────────────────────────────────────────────────────
// The `get` keyword is intentionally NOT classified here — the tmLanguage
// grammar injection handles it as `storage.type`, which is what themes use for
// `let` and `const`. Emitting a semantic `keyword` token would override that
// with `keyword.control` colouring and produce a different shade.
//
// The semantic provider only handles `@` markers, which tmLanguage cannot
// colour reliably (it has no way to know which `@` are qrx operators).

/**
 * @param {string} code
 * @returns {{ start: number, length: number }[]}
 */
function collectAtTokens(code) {
  const tokens = []

  // Every `identifier@` — mark the trailing `@` as an operator.
  const atRegex = /[A-Za-z_$][\w$]*@/g
  for (const match of code.matchAll(atRegex)) {
    const atStart = (match.index || 0) + match[0].length - 1
    tokens.push({ start: atStart, length: 1 })
  }

  return tokens
}

// ── Legend ────────────────────────────────────────────────────────────────────
//   'qrxRefAccess' → custom type for the `@` ref-access marker; default colour
//                    is set in the workspace's .vscode/settings.json via
//                    editor.semanticTokenColorCustomizations
//
const LEGEND = new vscode.SemanticTokensLegend(['qrxRefAccess'], [])

// ── Provider ──────────────────────────────────────────────────────────────────
/** @type {vscode.DocumentSemanticTokensProvider} */
const provider = {
  provideDocumentSemanticTokens(document, _cancelToken) {
    const code = document.getText()
    const atTokens = collectAtTokens(code)

    const builder = new vscode.SemanticTokensBuilder(LEGEND)

    for (const t of atTokens) {
      const startPos = document.positionAt(t.start)
      const endPos = document.positionAt(t.start + t.length)
      builder.push(new vscode.Range(startPos, endPos), 'qrxRefAccess', [])
    }

    return builder.build()
  },
}

// ── Activation ────────────────────────────────────────────────────────────────
/** @param {vscode.ExtensionContext} _ctx */
function activate(_ctx) {
  // Register for all TS/TSX files (covers .ts, .tsx, and .qrx files that the
  // user has associated with typescriptreact, which is the typical setup).
  const selector = [
    { language: 'typescript', scheme: 'file' },
    { language: 'typescriptreact', scheme: 'file' },
    { language: 'typescript', scheme: 'untitled' },
    { language: 'typescriptreact', scheme: 'untitled' },
  ]

  vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, LEGEND)
}

function deactivate() {}

module.exports = { activate, deactivate }

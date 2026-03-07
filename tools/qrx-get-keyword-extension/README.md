# QRX Get Keyword Highlighting

Local VS Code extension that provides syntax highlighting for qrx-style sugar in TS/TSX files.

## What it highlights

**Via semantic tokens** (primary — works for all themes):

- `get` in `get count = Ion(0)` — classified as `keyword`
- Trailing `@` on reactive identifiers (`count@`, `showFractions@`, `kit.halfCount@`) — classified as `operator`

**Via TextMate grammar injection** (fallback for themes without semantic token support):

- `get` in `get varname =`, `get varname:`, and `get varname(...)` forms

## Install

1. Package the extension:

```bash
cd tools/qrx-get-keyword-extension
npx @vscode/vsce package --allow-missing-repository
```

2. In VS Code: **Extensions** panel → `...` menu → **Install from VSIX...**
3. Pick the generated `.vsix` file.
4. Reload VS Code window.

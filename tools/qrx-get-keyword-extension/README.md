# QRX Get Keyword Highlighting

Local VS Code extension that injects a TextMate rule so `get` is highlighted like a keyword in qrx-style declarations:

- `get count = ...`
- `get halfCount: ...`
- `get halfCount(...)`

## Install

1. Package the extension:

```bash
cd tools/qrx-get-keyword-extension
npx @vscode/vsce package
```

2. In VS Code: **Extensions** panel → `...` menu → **Install from VSIX...**
3. Pick the generated `.vsix` file.
4. Reload VS Code window.

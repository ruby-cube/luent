# NextScript for VS Code

This extension wires NextScript language support into TypeScript using a Volar-based TS Server plugin.

## Capabilities

- TypeScript language features for `.nsx` files through Volar + TS Server plugin:
  - hover
  - completion
  - go to definition / references
  - rename
  - diagnostics
- Semantic token for NextScript `@` ref access markers.
- TextMate injection for `get` keyword highlighting in NextScript patterns.

## Notes

- Formatting and linting integration are intentionally not provided yet.
- Use workspace TypeScript (`typescript.tsdk`) for best results.

# RueScript for VS Code

This extension wires RueScript language support into TypeScript using a Volar-based TS Server plugin.

## Capabilities

- TypeScript language features for `.rxs` files through Volar + TS Server plugin:
  - hover
  - completion
  - go to definition / references
  - rename
  - diagnostics
- Semantic token for RueScript `@` ref access markers.
- TextMate injection for `get` keyword highlighting in RueScript patterns.

## Notes

- Formatting and linting integration are intentionally not provided yet.
- Use workspace TypeScript (`typescript.tsdk`) for best results.

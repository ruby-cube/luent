# NoriScript for VS Code

This extension wires NoriScript language support into TypeScript using a Volar-based TS Server plugin.

## Capabilities

- TypeScript language features for `.nsx` files through Volar + TS Server plugin:
  - hover
  - completion
  - go to definition / references
  - rename
  - diagnostics
- Semantic token for NoriScript `@` ref access markers.
- TextMate injection for `get` keyword highlighting in NoriScript patterns.

## Notes

- Formatting and linting integration are intentionally not provided yet.
- Use workspace TypeScript (`typescript.tsdk`) for best results.

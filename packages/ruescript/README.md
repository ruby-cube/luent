## `.rxs` IntelliSense

RueScript language service support is provided through the Volar-based TS Server plugin in `plugins/tsserver-plugin-ruescript`.

If IntelliSense in `.rxs` files is missing in VS Code:

1. Ensure workspace settings include:
   - `typescript.tsdk: node_modules/typescript/lib`
   - `typescript.tsserver.pluginPaths: ["./plugins/tsserver-plugin-ruescript"]`
   - `files.associations` for `*.rxs -> typescriptreact`
2. Restart TypeScript Server with `TypeScript: Restart TS Server`.
3. If behavior is stale, run `Developer: Reload Window`.

### Current scope

- Supported now: TypeScript language-service capabilities for `.rxs` (`hover`, `completion`, definitions/references/rename, diagnostics).
- Intentionally deferred: formatting and linting integration.

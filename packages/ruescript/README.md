NOTE: This readme was AI-generated.

## `.rxs` IntelliSense

If IntelliSense in `.rxs` files is missing or slow in VS Code:

1. Ensure workspace settings include:
	 - `typescript.tsdk: node_modules/typescript/lib`
	 - `typescript.tsserver.pluginPaths: ["./plugins/tsserver-plugin-ruescript"]`
	 - `files.associations` for `*.rxs -> typescriptreact`
2. Restart TypeScript server (`TypeScript: Restart TS Server`).
3. If behavior is stale, run `Developer: Reload Window` once.

### TS pipeline for `.rxs` imports

- `.rxs` are resolved through the RueScript TS pipeline as virtual transformed `.ts`/`.tsx` modules.
- This enables typed imports like `import { Counter } from "./Counter.rxs"` from regular `.ts`/`.tsx` files without manual per-file declaration stubs.
- Typecheck entrypoint in this repo is `pnpm run typecheck` (backed by `rxs-tsc`), not plain `tsc`.
- The TS Server plugin resolves RueScript through the package export `@rue/ruescript/tsserver`, not a repo-relative transformer path.
- After changing plugin internals (`plugins/tsserver-plugin-ruescript`) or the tsserver export surface in RueScript, run `TypeScript: Restart TS Server` once to refresh editor diagnostics.
- If diagnostics still look stale after restart, run `Developer: Reload Window`.
- Browser DevTools pretty-print can visually reformat transformed calls (for example showing `fn( () => ...)`); use raw module output (e.g. Vite `?import`) to verify exact emitted spacing.

### Performance knobs

- `semanticCooldownMs` (in `tsconfig.json` plugin config)
	- Higher values reduce semantic-diagnostic churn while typing.
	- Lower values increase immediacy of semantic updates.
- Current setting in this repo: `0` (for immediate semantic updates).

For temporary profiling, you can set plugin options:
- `profile: true`
- `slowMs: <threshold>`

Then inspect `TypeScript: Open TS Server Log` for `[tsserver-plugin-ruescript] [perf]` lines.

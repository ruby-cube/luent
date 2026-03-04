# Rue

<aside>
⚠️ <b>Experimental:</b> The projects in this repo are works-in-progress, not well-tested, with volatile APIs. Look and play, but definitely don’t use…
</aside>

<p align="right"><a href="#">[src]</a></p>

## Overview

Hello world, I know you’re tired of JS frameworks. You don’t need this framework, but at the very least what you’ll find here is:
- an exploration of intuitive abstractions and mental models that unify various aspects of reactivity and reduce cognitive load
- an API that supports encapsulation and declarative code so you create less spaghetti
- attempts at ironing out rough edges and bug-prone patterns encountered in the four major frameworks (React, Vue, Solid, and Svelte) so you can focus on app logic instead of wrestling with the framework

Our current goal is to establish an intuitive API that feels pleasant to work with. Once the API is stable, we can focus on more efficient implementations and performance optiminations under the hood.

<p align="right"><a href="#readme-top">[top]</a></p>

## Features
Some special features include:
- a reactivity system that’s compatible with domain models and data structures authored as JavaScript classes, regardless of the presence of private properties
- readable async code
- simple-to-use state machines

## `.luex` IntelliSense

If IntelliSense in `.luex`/`.lue` files is missing or slow in VS Code:

1. Ensure workspace settings include:
	 - `typescript.tsdk: node_modules/typescript/lib`
	 - `typescript.tsserver.pluginPaths: ["./packages/quarky-tsserver-plugin"]`
	 - `files.associations` for `*.luex -> typescriptreact` and `*.lue -> typescript`
2. Restart TypeScript server (`TypeScript: Restart TS Server`).
3. If behavior is stale, run `Developer: Reload Window` once.

### TS pipeline for `.luex` imports

- `.lue`/`.luex` are resolved through the Quarky TS pipeline as virtual transformed `.ts`/`.tsx` modules.
- This enables typed imports like `import { Counter } from "./Counter.luex"` from regular `.ts`/`.tsx` files without manual per-file declaration stubs.
- Typecheck entrypoint in this repo is `pnpm run typecheck` (backed by `quarky-tsc`), not plain `tsc`.
- After changing plugin internals (`packages/quarky-tsserver-plugin`), run `TypeScript: Restart TS Server` once to refresh editor diagnostics.
- If diagnostics still look stale after restart, run `Developer: Reload Window`.

### Performance knobs

- `semanticCooldownMs` (in `tsconfig.json` plugin config)
	- Higher values reduce semantic-diagnostic churn while typing.
	- Lower values increase immediacy of semantic updates.
- Recommended default in this repo: `500`.

For temporary profiling, you can set plugin options:
- `profile: true`
- `slowMs: <threshold>`

Then inspect `TypeScript: Open TS Server Log` for `[quarky-tsserver-plugin] [perf]` lines.




<p align="right"><a href="#readme-top">[top]</a></p>

© 2025 - present [Ruby Y Wang](https://github.com/ruby-cube)

# Contributing to Luent
[coming soon]

<p align="right"><a href="#readme-top">[top]</a></p>

## Navigating the Monorepo
The Luent monorepo currently contains four key packages:
- @rue/luent - the core framework package
- @rue/quarky - the reactivity system
- @rue/flask - the batch cleanup and lifecycle manager
- @rue/nextscript - the TypeScript + JSX language extension

<p align="right"><a href="#readme-top">[top]</a></p>

## Monorepo Install Behavior
`pnpm install` only installs the current package by default. To bootstrap the workspace, run:

```bash
pnpm run i:stable
```

<p align="right"><a href="#readme-top">[top]</a></p>
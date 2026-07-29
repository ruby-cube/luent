# Contributing to Luent
[coming soon]

<p align="right"><a href="#readme-top">[top]</a></p>

## Navigating the Monorepo
The Luent monorepo currently contains four key packages:
- luent - the core framework package
- @luent/quarky - the reactivity system
- @luent/flask - the batch cleanup and lifecycle manager
- @luent/nextscript - the TypeScript + JSX language extension

<p align="right"><a href="#readme-top">[top]</a></p>

## Monorepo Install Behavior
`pnpm install` only installs the current package by default. To bootstrap the entire workspace from the root folder, run:

```bash
pnpm run i:stable
```

<p align="right"><a href="#readme-top">[top]</a></p>
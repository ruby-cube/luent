# Contributing to Luent
[coming soon]

<p align="right"><a href="#readme-top">[top]</a></p>

## Monorepo Install Behavior
This repo uses pnpm with `recursiveInstall: false` in [pnpm-workspace.yaml](pnpm-workspace.yaml), so `pnpm install` only installs the current package by default.

To bootstrap the entire workspace explicitly, run:

```bash
pnpm -r install
```

For package-scoped work, prefer filtered commands such as:

```bash
pnpm --filter ./websites/nextscript-site add -D vitepress@next
```

<p align="right"><a href="#readme-top">[top]</a></p>
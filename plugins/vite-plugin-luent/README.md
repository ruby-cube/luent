# vite-plugin-luent

A Vite plugin for transpiling Luent TSX/JSX/NSX sources during development and builds.

## Installation

```bash
npm install vite-plugin-luent
```

## Usage

```js
import { defineConfig } from 'vite'
import luent from 'vite-plugin-luent'

export default defineConfig({
  plugins: [luent()],
})
```

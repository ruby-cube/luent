import { CodeGlimpses } from "./CodeGlimpses";
export { getPortals, runWithPortals, RenderPage } from '@rue/luent'
import { createRoot, writeRoot } from '@rue/luent'
export * from "@rue/websites-shared";

export const writeIsland = {
  'code-glimpses': () => writeRoot(CodeGlimpses),
}

export const islands = {
  'code-glimpses': () => class extends HTMLElement {
    constructor() {
      super()
      createRoot(CodeGlimpses).mount(this)
    }
  }
}


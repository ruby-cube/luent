import { CodeGlimpses } from "./CodeGlimpses";
export { getPortals, runWithPortals, RenderPageWithStyles, transformPortals } from '@rue/luent'
import { mount, MICROCLASS_MERGE, writeIsland, provideRoot } from '@rue/luent'
import { Code } from "@rue/websites-shared";
export * from "@rue/websites-shared";
import { twMerge } from 'tailwind-merge';
import { highlightCode } from "./highlighter";

export const Islands = {
  'code-glimpses': () => writeIsland(() => {
    provideRoot(MICROCLASS_MERGE, twMerge)
    return CodeGlimpses()
  }),
  'nsx-code': (nsName, tsName, nsCode, tsCode) => writeIsland(() => {
    provideRoot(MICROCLASS_MERGE, twMerge)
    return <Code
      trusted
      main={{ name: nsName, code: nsCode }}
      alt={{ name: tsName, code: tsCode, lang: tsName }}
      highlight={highlightCode}
    />
  }),
}

export const islands = {
  'code-glimpses': () => class extends HTMLElement {
    constructor() {
      super()
      mount(() => {
        provideRoot(MICROCLASS_MERGE, twMerge)
        return CodeGlimpses()
      }, this)
    }
  },
  // 'code-glimpses': () => {
  //   mount(() => {
  //     provideRoot(MICROCLASS_MERGE, twMerge)
  //     return CodeGlimpses()
  //   }, '#code-glimpses')
  // },

  'nsx-code': () => {
    console.log('#### defining nsx-code')
    return class extends HTMLElement {
    constructor() {
      console.log('constructing nsx-code')
      super()
    }
    mounted = false;
    connectedCallback() {
      if (this.mounted) return;
      this.mounted = true;
      console.log('#### mounting nsx-code')
      const ns = this.getAttribute('ns-name') || 'nsx'
      const ts = this.getAttribute('ts-name') || 'tsx'
      const nsCode = this.getAttribute('ns-code') || 'broken'
      const tsCode = this.getAttribute('ts-code') || 'nul'
      mount(() => {
        
        provideRoot(MICROCLASS_MERGE, twMerge)
        return <Code
          trusted
          main={{ name: ns, code: nsCode }}
          alt={{ name: ts, code: tsCode, lang: ts }}
          highlight={highlightCode}
        />
      }, this)
    }
  }},

}


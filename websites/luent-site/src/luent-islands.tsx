import { CodeGlimpses } from "./CodeGlimpses";
export { getPortals, runWithPortals, RenderPageWithStyles, transformPortals } from '@rue/luent'
import { mount, MICROCLASS_MERGE, writeIsland, provideRoot } from '@rue/luent'
export * from "@rue/websites-shared";
import { twMerge } from 'tailwind-merge';
import { highlightCode } from "./highlighter";
import { Code, extractParams, parseNSXBlock } from "@rue/websites-shared";

function renderCodeGlimpses() {
  provideRoot(MICROCLASS_MERGE, twMerge)
  return CodeGlimpses()
}

function renderNSXCode(setup: { nsName: string, tsName: string, nsCode: string, tsCode: string }) {
  const { nsName, tsName, nsCode, tsCode } = setup;
  console.log('nsName', nsName)
  console.log('nsCode', nsCode)
  console.log('tsName', tsName)
  console.log('tsCode', tsCode)
  provideRoot(MICROCLASS_MERGE, twMerge)
  return <Code
    trusted
    main={{ name: nsName, code: nsCode }}
    alt={{ name: tsName, code: tsCode, lang: tsName }}
    highlight={highlightCode}
  />
}



export const Islands = {
  'code-glimpses': () => writeIsland(renderCodeGlimpses),
  'nsx-code': (inner: string) => writeIsland(() => {
    console.log('inner nsx code string', inner)
    return renderNSXCode(parseNSXBlock(inner))
  })
}

export const islands = {
  // 'code-glimpses': () => class extends HTMLElement {
  //   connectedCallback() {
  //     mount(() => {
  //       provideRoot(MICROCLASS_MERGE, twMerge)
  //       return CodeGlimpses()
  //     }, this)
  //   }
  // },
  'code-glimpses': ({ node }: { node: HTMLElement }) => {
    console.log('#### mounting node', node)
    mount(renderCodeGlimpses, node)
  },

  'nsx-code': ({ inner, node }: { inner: string, node: HTMLElement }) => {
    mount(() => renderNSXCode(parseNSXBlock(extractParams(inner))), node)
  },
  // 'nsx-code': () => {
  //   console.log('#### defining nsx-code')
  //   return class extends HTMLElement {
  //   constructor() {
  //     console.log('constructing nsx-code')
  //     super()
  //   }
  //   mounted = false;
  //   connectedCallback() {
  //     if (this.mounted) return;
  //     this.mounted = true;
  //     console.log('#### mounting nsx-code')
  //     const ns = this.getAttribute('ns-name') || 'nsx'
  //     const ts = this.getAttribute('ts-name') || 'tsx'
  //     const nsCode = this.getAttribute('ns-code') || 'broken'
  //     const tsCode = this.getAttribute('ts-code') || 'nul'
  //     mount(() => {

  //       provideRoot(MICROCLASS_MERGE, twMerge)
  //       return <Code
  //         trusted
  //         main={{ name: ns, code: nsCode }}
  //         alt={{ name: ts, code: tsCode, lang: ts }}
  //         highlight={highlightCode}
  //       />
  //     }, this)
  //   }
  // }},

}


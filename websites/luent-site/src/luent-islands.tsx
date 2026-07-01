import { CodeGlimpses } from "./CodeGlimpses";
export { getPortals, runWithPortals, RenderPageWithStyles, transformPortals } from '@rue/luent'
import { mount, MICROCLASS_MERGE, writeIsland, provideRoot, atTick } from '@rue/luent'
export * from "@rue/websites-shared";
import { twMerge } from 'tailwind-merge';
import { highlightCode } from "./highlighter";
import { Code, extractParams, isMounted, MountIslands, parseNSXBlock, WriteIslands } from "@rue/websites-shared";
import { LanguageToggle } from "./LanguageToggle";

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

const LANGUAGE_TOGGLE = 'section.VPSidebarItem p.text'

export const Islands: WriteIslands = {
  'code-glimpses': () => writeIsland(renderCodeGlimpses),
  'ns-code': (inner) => writeIsland(() => {
    console.log('inner nsx code string', inner)
    return renderNSXCode(parseNSXBlock(inner))
  }),
  'language-toggle': () => writeIsland(LanguageToggle)
}

export const islands: MountIslands = {
  // 'code-glimpses': () => class extends HTMLElement {
  //   connectedCallback() {
  //     mount(() => {
  //       provideRoot(MICROCLASS_MERGE, twMerge)
  //       return CodeGlimpses()
  //     }, this)
  //   }
  // },
  'language-toggle': () => {
    atTick(() => {
      const node = document.querySelector(LANGUAGE_TOGGLE)
      console.log('hydrating language-toggle', node)
      if (!node || isMounted(node)) return;
      node.innerHTML = ''
      mount(LanguageToggle, node)
    })
  },
  'code-glimpses': ({ node }) => {
    console.log('#### mounting node', node)
    mount(renderCodeGlimpses, node)
  },

  'ns-code': ({ inner, node }: { inner: string, node: HTMLElement }) => {
    mount(() => renderNSXCode(parseNSXBlock(extractParams(inner))), node)
  },
  // 'ns-code': () => {
  //   console.log('#### defining ns-code')
  //   return class extends HTMLElement {
  //   constructor() {
  //     console.log('constructing ns-code')
  //     super()
  //   }
  //   mounted = false;
  //   connectedCallback() {
  //     if (this.mounted) return;
  //     this.mounted = true;
  //     console.log('#### mounting ns-code')
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


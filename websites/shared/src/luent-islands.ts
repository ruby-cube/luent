import { getPortals, RenderPageWithStyles, runWithPortals } from "@rue/luent";
import { type MarkdownOptions } from "VitePress"
import { encodeStyleTags } from "./style-rules";
import { AnyObject } from "@rue/types";

type MarkdownIt = Exclude<MarkdownOptions['config'], undefined> extends (arg: infer P) => any ? P : never

export function isCustomElement(tag: string) {
  return tag.includes('-')
}

export function hydrate(app: any, islands: AnyObject) {
  if (typeof window == 'undefined') return;

  if (!customElements.get('style-scope')) {
    customElements.define('style-scope', class StyleScope extends HTMLElement {
      connectedCallback() {
        const template = this.querySelector('template')
        const content = template?.content.cloneNode(true) as DocumentFragment | undefined

        const slot = content ?? document.createElement('slot')
        const root = this.attachShadow({ mode: 'open' });
        root.appendChild(slot)
        // if (template) template.remove()
      }
    });
  }

  if (!customElements.get('await-mount')) {
    customElements.define('await-mount', class AwaitMount extends HTMLElement {
      connectedCallback() {
        const template = this.querySelector('template')
        const content = template?.childNodes ??[]
        // this.innerHTML = ''
        this.append(...content)
      }
    });
  }

  // define custom elements
  for (const key in islands) {
    // if (key === 'code-glimpses') {
    //   islands[key]()
    // }
    if (!customElements.get(key)) {
      customElements.define(key, islands[key]())
    }
  }
}

declare global {
  namespace JSX {
    interface CustomElements {
      'style-scope': {}
    }
  }
}

export function transformMarkdownIslands(md: MarkdownIt, Islands: AnyObject) {
  const pages = new Set()
  let withPageContext: (cb: () => any) => any;

  md.block.ruler.before('fence', 'luent_island', (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const line = state.src.slice(start, state.eMarks[startLine])
    const isLuentIsland = line.startsWith(':::luent')
    const isNSXBlock = line.startsWith(':::nsx')
    if (!isLuentIsland && !isNSXBlock) return false
    if (silent) return true

    const page = state.env?.relativePath
    if (page) {
      if (!pages.has(page)) {
        pages.add(page)
        withPageContext = RenderPageWithStyles()
      }
    }
    else {
      return false;
    }
    if (isLuentIsland) {
      const next = state.bMarks[startLine + 1] + state.tShift[startLine + 1]
      const spec = state.src.slice(next, state.eMarks[startLine + 1])
      const name = spec.trim()
      const islandHtml = renderFallback(name, Islands[name], withPageContext, page)
      // const islandTokenContent = `<luent-island id='${name}'></luent-island><await-mount>${islandHtml}</await-mount>`
      const islandTokenContent = `<await-mount><template><${name}></${name}></template>${islandHtml}</await-mount>`

      state.tokens.push({
        type: 'html_block',
        tag: '',
        nesting: 0,
        level: state.level,
        content: islandTokenContent,

        block: true,
        map: [startLine, startLine + 3],
        markup: ''
      } as any)

      state.line = startLine + 3
      return true
    }

    return nsxCodeBlockRule(state, startLine, endLine, Islands, withPageContext, page)
  })
}

// :::nsx
// ```nsx
// function Counter() {
//   get count = ion(0)
//   return (
//     <div></div>
//   )
// }
// ```
// ```tsx
// function Counter() {
//   const $count = ion(0)
//   return (
//     <div></div>
//   )
// }
// ```
// :::

// const nsName = 'nsx'
// const tsName = 'tsx'
// const nsCode = `function Counter() {
//    get count = ion(0)
//    return (
//      <div></div>
//    )
//  }`
// const tsCode = `function Counter() {
//   const $count = ion(0)
//   return (
//     <div></div>
//   )
// }`

// const islandTokenContent = `<await-mount><nsx-code ns-name='${nsName}' ts-name='${tsName}' ns-code='${nsCode}' ts-code='${tsCode}'></nsx-code><template #fallback>${islandHtml}</template></await-mount>`

function renderFallback(name: string, write: () => string, withPageContext: (cb: () => any) => string, page: string) {
  const html = write
    ? withPageContext(() => runWithPortals(write, page))
    : `<div data-luent-island-error="${name}">Unknown island: ${name}</div>`
  return encodeStyleTags(typeof html === 'string' ? html : String(html ?? ''))
}

function escapeAttr(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\n', '&#10;')
    .replaceAll('\r', '&#13;')
}

function nsxCodeBlockRule(state, startLine: number, endLine: number, Islands: AnyObject, withPageContext: (cb: () => any) => any, page: string) {
  let nextLine = startLine + 1
  let closeLine = -1

  while (nextLine < endLine) {
    const pos = state.bMarks[nextLine] + state.tShift[nextLine]
    const end = state.eMarks[nextLine]
    const line = state.src.slice(pos, end).trim()

    if (line === ':::') {
      closeLine = nextLine
      break
    }

    nextLine++
  }

  if (closeLine === -1) return false

  const innerStart = state.bMarks[startLine + 1]
  const innerEnd = state.eMarks[closeLine - 1]
  const inner = state.src.slice(innerStart, innerEnd)

  const blocks = [...inner.matchAll(/```(\w+)\n([\s\S]*?)```/g)]

  const nsxBlock = blocks.find(match => match[1] === 'nsx' || match[1] === 'ns')
  const tsxBlock = blocks.find(match => match[1] === 'tsx' || match[1] === 'ts')

  if (!nsxBlock || !tsxBlock) return false

  const nsName = nsxBlock[1]
  const tsName = tsxBlock[1]
  const nsCode = escapeAttr(nsxBlock[2].trimEnd())
  const tsCode = escapeAttr(tsxBlock[2].trimEnd())

  const islandHtml = renderFallback('nsx-code', () => Islands['nsx-code'](nsName, tsName, nsCode, tsCode), withPageContext, page)

  const islandTokenContent =
    `<await-mount>` +
    `<nsx-code ` +
    `ns-name='${nsName}' ` +
    `ts-name='${tsName}' ` +
    `ns-code='${nsCode}' ` +
    `ts-code='${tsCode}'` +
    `></nsx-code>` +
    `<template #fallback>${islandHtml}</template>` +
    `</await-mount>`
  console.log('NSX CODE BLOCK', islandTokenContent)

  state.tokens.push({
    type: 'html_block',
    tag: '',
    nesting: 0,
    level: state.level,
    content: islandTokenContent,
    block: true,
    map: [startLine, closeLine + 1],
    markup: ':::'
  } as any)

  state.line = closeLine + 1
  return true
}
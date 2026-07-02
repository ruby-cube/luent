import { getPortals, RenderPageWithStyles, runWithPortals, renderInShadow } from "@rue/luent";
import { type MarkdownOptions } from "VitePress"
import { encodeStyleTags } from "./style-rules";
import { AnyObject } from "@rue/types";
import { escapeHTML, unescapeHTML } from "@rue/utils";

export type WriteIslands = { [key: string]: (inner: string) => void }
type Island = { inner: string, node: HTMLElement }
export type MountIslands = { [key: string]: (island: Island) => void }

type MarkdownIt = Exclude<MarkdownOptions['config'], undefined> extends (arg: infer P) => any ? P : never

export function isCustomElement(tag: string) {
  return tag.includes('-')
}



export function mountIslands(islands: AnyObject, page: string) {
  if (typeof window == 'undefined') return;
  console.log('#### HYDRATING!!', page)
  // define custom elements
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

  // if (!customElements.get('await-mount')) {
  //   customElements.define('await-mount', class AwaitMount extends HTMLElement {
  //     connectedCallback() {
  //       console.log('#### hydrating <await-mount>')
  //       const template = this.querySelector('template')
  //       if (!template) throw new Error('await mount requires a template')
  //       console.log('#### TEMPLATE', template)
  //       if (template.content.childNodes.length) {
  //         const content = template.content.cloneNode(true) as DocumentFragment | undefined
  //         this.replaceChildren(content!)
  //       }
  //       else {
  //         // for <ns-code> because the nodes are not in document fragment for some reason
  //         // this.innerHTML = ''
  //         // this.append(...(template?.childNodes ?? []))
  //       }
  //     }
  //   });
  // }

  for (const key in islands) {
    if (key === 'language-toggle') {
      if (page.startsWith('/guide/')) islands[key]()
      continue;
    }
    // if (!customElements.get(key)) {
    //   console.log('#### defining island:', key)
    //   customElements.define(key, islands[key]())
    // }
    const nodes = document.querySelectorAll(key)
    console.log('#### Hydrating', key, nodes)
    for (const node of nodes) {
      if (node.getAttribute('data-mounted') === '') continue;
      node.setAttribute('data-mounted', '')
      const inner = node.innerHTML
      node.innerHTML = ''
      islands[key]({ inner, node })
    }
  }
}

export function isMounted(node: Element) {
  if (node.getAttribute('data-mounted') === '') return true;
  node.setAttribute('data-mounted', '')
  return false;
}


declare global {
  namespace JSX {
    interface CustomElements {
      'style-scope': {}
    }
  }
}

export function TransformLuentIslands(Islands: AnyObject) {
  const pages = new Set()
  let withPageContext: (cb: () => any) => any;

  return (state, startLine: number, endLine: number, silent: boolean) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const line = state.src.slice(start, state.eMarks[startLine])
    const isLuentIsland = line.startsWith(':::luent ')
    if (!isLuentIsland) return false
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
    const name = line.slice(':::luent '.length, state.eMarks[startLine]).trim()

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
    console.log('NAME', name, ':')

    const islandHtml = renderFallback('luent-island', () => Islands[name](inner), withPageContext, page)

    const islandTokenContent =
      `<${name}>` +
      `<template><pre>${escapeHTML(inner)}</pre></template>` +
      `${islandHtml}` +
      `</${name}>`

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

// const islandTokenContent = `<await-mount><ns-code ns-name='${nsName}' ts-name='${tsName}' ns-code='${nsCode}' ts-code='${tsCode}'></ns-code><template #fallback>${islandHtml}</template></await-mount>`

function renderFallback(name: string, write: () => string, withPageContext: (cb: () => any) => string, page: string) {
  const html = write
    ? withPageContext(() => runWithPortals(write, page))
    : `<div data-luent-island-error="${name}">Unknown island: ${name}</div>`
  return encodeStyleTags(html)
}


// function nsxCodeBlockRule(state, startLine: number, endLine: number, Islands: AnyObject, withPageContext: (cb: () => any) => any, page: string) {
//   let nextLine = startLine + 1
//   let closeLine = -1

//     const pos = state.bMarks[nextLine] + state.tShift[nextLine]
//     const end = state.eMarks[nextLine]
//     const line = state.src.slice(pos, end).trim()

//     if (line === ':::') {
//       closeLine = nextLine
//       break
//     }

//     nextLine++
//   }

//   if (closeLine === -1) return false

//   const innerStart = state.bMarks[startLine + 1]
//   const innerEnd = state.eMarks[closeLine - 1]
//   const inner = state.src.slice(innerStart, innerEnd)

//   const blocks = [...inner.matchAll(/```(\w+)\n([\s\S]*?)```/g)]

//   const nsxBlock = blocks.find(match => match[1] === 'nsx' || match[1] === 'ns')
//   const tsxBlock = blocks.find(match => match[1] === 'tsx' || match[1] === 'ts')

//   if (!nsxBlock || !tsxBlock) return false

//   const nsName = nsxBlock[1]
//   const tsName = tsxBlock[1]
//   const nsCode = nsxBlock[2].trimEnd()
//   const tsCode = tsxBlock[2].trimEnd()

//   const islandHtml = renderFallback('ns-code', () => Islands['ns-code'](nsName, tsName, nsCode, tsCode), withPageContext, page)

//   const islandTokenContent =
//     `<await-mount>` +
//     `<template><ns-code ` +
//     `ns-name='${nsName}' ` +
//     `ts-name='${tsName}' ` +
//     `ns-code='${nsCode}' ` +
//     `ts-code='${tsCode}'` +
//     `></ns-code></template>` +
//     `${islandHtml}` +
//     `</await-mount>`

//   state.tokens.push({
//     type: 'html_block',
//     tag: '',
//     nesting: 0,
//     level: state.level,
//     content: islandTokenContent,
//     block: true,
//     map: [startLine, closeLine + 1],
//     markup: ':::'
//   } as any)

//   state.line = closeLine + 1
//   return true
// }

type ParsedNSXBlock = {
  nsName: string
  tsName: string
  nsCode: string
  tsCode: string
}


export function extractParams(content: string) {
  console.log('innerHTML', content)
  // Match:
  // <name>
  //   <template>'...'</template>
  //   ...
  // </name>

  const match = content.match(
    /<template><pre>([\s\S]*?)<\/pre><\/template>/
  )

  if (!match) {
    console.log('no match')
    return ''
  }
  return match[1]
}

export function parseNSXBlock(input: string): ParsedNSXBlock {
  const decodedInput = unescapeHTML(input)
  const fenceRegex =
    /```([^\s`\r\n]*)(?:[ \t]*\r?\n|[ \t]+)([\s\S]*?)```/gm

  const blocks = [...decodedInput.matchAll(fenceRegex)]

  if (blocks.length !== 2) {
    throw new Error(`Expected exactly 2 fenced code blocks, found ${blocks.length}.`)
  }

  const [nsBlock, tsBlock] = blocks

  const nsName = nsBlock[1].trim()
  const tsName = tsBlock[1].trim()
  const nsCode = nsBlock[2]
  const tsCode = tsBlock[2]

  return {
    nsName,
    tsName,
    nsCode,
    tsCode,
  }
}
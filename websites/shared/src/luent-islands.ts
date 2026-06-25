import { getPortals, RenderPage, runWithPortals } from "@rue/luent";
import { DefaultTheme, TransformContext, type MarkdownOptions } from "VitePress"
import { encodeStyleTags } from "./style-rules";
import { AnyObject } from "@rue/types";
import { defineComponent, onMounted, ref, type VNode } from 'vue'

type MarkdownIt = Exclude<MarkdownOptions['config'], undefined> extends (arg: infer P) => any ? P : never

export function isCustomElement(tag: string) {
  return tag.includes('-') && tag !== 'await-mount'
}

// TODO: get rid of Vue dependency
const AwaitMount = defineComponent({
  name: 'await-mount',
  setup(_, { slots }) {
    const mounted = ref(false)

    onMounted(() => {
      mounted.value = true
    })

    return () => {
      if (!mounted.value) {
        return slots.fallback?.() ?? null
      }

      return slots.default?.() ?? null
    }
  }
})

export function hydrate(app: any, islands: AnyObject) {
  app.component('await-mount', AwaitMount)

  if (typeof window == 'undefined') return;

  if (!customElements.get('style-scope')) {
    customElements.define('style-scope', class StyleScope extends HTMLElement {
      connectedCallback() {
        const template = this.querySelector('template')
        const content = template?.content.cloneNode(true) as DocumentFragment | undefined

        const slot = content ?? document.createElement('slot')
        const root = this.attachShadow({ mode: 'open' });
        root.appendChild(slot)
        if (template) template.remove()
      }
    });
  }

  // define custom elements
  for (const key in islands) {
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

export function transformMarkdownIslands(md: MarkdownIt, writeIsland: AnyObject) {
  const pages = new Set()
  let withPageContext: (cb: () => any) => any;

  md.block.ruler.before('fence', 'luent_island', (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const line = state.src.slice(start, state.eMarks[startLine])

    if (!line.startsWith(':::luent')) return false
    if (silent) return true

    const page = state.env?.relativePath
    if (page) {
      if (!pages.has(page)) {
        pages.add(page)
        withPageContext = RenderPage()
      }
    }
    else {
      return false;
    }

    const next = state.bMarks[startLine + 1] + state.tShift[startLine + 1]
    const spec = state.src.slice(next, state.eMarks[startLine + 1])
    const name = spec.trim()
    const write = writeIsland[name]
    const html = write
      ? withPageContext(() => runWithPortals(write, page))
      : `<div data-luent-island-error="${name}">Unknown island: ${name}</div>`
    const islandHtml = encodeStyleTags(typeof html === 'string' ? html : String(html ?? ''))
    const islandTokenContent = `<await-mount><${name}></${name}><template #fallback>${islandHtml}</template></await-mount>`

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
  })
}

export function transformPortals(code: string, ctx: TransformContext<NoInfer<DefaultTheme.Config>>) {
  const portals = getPortals(ctx.page)
  if (!portals || portals.head.length === 0 && portals.body.length === 0) {
    return code;
  }

  const newCode = code
    .replace('</head>', `${portals.head.join('\n')}\n</head>`)
    .replace('</body>', `${portals.body.join('\n')}\n</body>`)
  return newCode
}
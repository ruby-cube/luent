import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'
import LuentPlugin from '../../../plugins/vite-plugin-luent/index.js'
import { markdownShikiConfig } from './theme/shiki-setup.js'
import { islands, getPortals, runWithPortals, RenderPage, writeIsland } from './.luent-islands/server/index.js'

function encodeStyleTags(html: string): string {
  return html.replace(/<style(?=[\s>])[^>]*>([\s\S]*?)<\/style>/gi, (_, css: string) => {
    // const encodedCss = Buffer.from(css, 'utf8').toString('base64')
    return `<style-rules>${css}</style-rules>`
  })
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: 'docs',

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.includes('-') && tag !== 'await-mount',
      }
    }
  },

  markdown: {
    config(md) {
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
        console.log('PAGE??', page)

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
    },
    ...markdownShikiConfig
  },

  transformHtml(code, id, ctx) {
    const portals = getPortals(ctx.page)
    if (!portals || portals.head.length === 0 && portals.body.length === 0) {
      return code;
    }

    const newCode = code
      .replace('</head>', `${portals.head.join('\n')}\n</head>`)
      .replace('</body>', `${portals.body.join('\n')}\n</body>`)
    return newCode
  },

  vite: {
    resolve: {
      // Keep Vite defaults so VitePress internal extensionless imports resolve,
      // and add .nsx for NextScript files.
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.nsx']
    },
    esbuild: {
      charset: 'utf8'
    },
    server: {
      fs: {
        strict: false
      }
    },
    plugins: [
      ...(LuentPlugin() as any[])
    ],
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __SSR__: false,
      __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
      __STYLE__: JSON.stringify(process.env.NODE_ENV === 'style')
    },
    // Keep static assets (logo, etc.) in ../public while docs live in ./docs.
    publicDir: resolve(__dirname, '../public')
  },
  title: 'NextScript',
  description: 'NextScript documentation and resources',
  themeConfig: {
    logo: '/assets/nextscript-logo-512px.png',
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Learn', link: '/guide/getter-syntax' },
      { text: 'Demos', link: '/demos/habit-tracker' },
      { text: 'Code Glimpses', link: '/#code-glimpses' },
      { text: 'Motivation', link: 'https://github.com/ruby-cube/luent/tree/main/packages/nextscript#motivation' },
      { text: 'Design Principles', link: 'https://github.com/ruby-cube/luent/tree/main/packages/nextscript#design-principles' }
    ],
    footer: {
      message: 'Built with Vitepress + Luent',
    },
    sidebar: {
      '/guide/': [
        {
          text: 'Learn',
          items: [
            {
              text: 'Getter Syntax',
              link: '/guide/getter-syntax',
              items: [
                { text: 'Accessor Variables', link: '/guide/getter-syntax#accessor-variables' },
                { text: '@ Postfix Operator', link: '/guide/getter-syntax#the-postfix-operator' }
              ]
            },
            { text: 'JSX Syntax', link: '/guide/jsx-syntax' },
            { text: 'JSX Terminology', link: '/guide/terminology' }
          ]
        },
      ],
      '/demos/': [
        {
          text: 'Demos',
          items: [
            {
              text: 'Habit Tracker', link: '/demos/habit-tracker',
            },
            { text: 'Drawing Canvas', link: '/demos/doodle-canvas' },
            { text: 'EmojiQuest', link: '/demos/emoji-quest' },
            { text: 'Folder Tree', link: '/terminology' },
            { text: 'Bottomless Void', link: '/terminology' },
          ]
        }

      ]
    },

    outline: {
      level: [2, 3]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ruby-cube/luent/tree/main/packages/nextscript' }
    ]
  }
})

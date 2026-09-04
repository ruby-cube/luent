import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'
import { markdownShikiConfig } from './theme/shiki-setup.js'
import { TransformLuentIslands, extractPortals, injectPortals, Islands, isCustomElement } from './.luent-islands/server/index.js'
import { createSharedViteConfig } from '../../shared/vite.shared.js'



// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: 'docs',

  vue: {
    template: {
      compilerOptions: {
        isCustomElement
      }
    }
  },

  markdown: {
    html: true,
    config(md) {
      console.log('TRANSFORM MARKDOWN')
      md.block.ruler.before('fence', 'luent_island', TransformLuentIslands(Islands))
    },
    ...markdownShikiConfig
  },

  // NOTE: this only runs during build, not dev
  transformHtml(code, id, ctx) {
    const { html, portals } = extractPortals(code)
    return injectPortals(html, portals)
  },

  vite: {
    ...createSharedViteConfig(),
    server: {
      fs: {
        strict: false
      }
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
      { text: 'Design Principles', link: 'https://github.com/ruby-cube/luent/tree/main/packages/nextscript#design-principles' },
      { text: 'pre-alpha', link: '/' },
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
                { text: 'Accessor variables', link: '/guide/getter-syntax#accessor-variables' },
                { text: 'Accessor properties', link: '/guide/getter-syntax#accessor-properties' },
                { text: 'Accessor operator', link: '/guide/getter-syntax#accessor-operator' },
                { text: 'Derivation expressions', link: '/guide/getter-syntax#derivation-expressions' },
                { text: 'Parameter declarations', link: '/guide/getter-syntax#parameter-declarations' },
                { text: 'Destructuring declarations', link: '/guide/getter-syntax#destructuring-declarations' },
                { text: 'Type guards', link: '/guide/getter-syntax#type-guards' }
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

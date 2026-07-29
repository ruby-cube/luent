import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'
import { TransformLuentIslands, transformPortals, Islands, isCustomElement } from './.luent-islands/server/index.js'
import { createSharedViteConfig } from '../../shared/vite.shared.js'
import { markdownShikiConfig } from './theme/shiki-setup.js'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: 'docs',
  ignoreDeadLinks: true,
  vue: {
    template: {
      compilerOptions: {
        isCustomElement
      }
    }
  },

  markdown: {
    config(md) {
      console.log('TRANSFORM MARKDOWN')
      md.block.ruler.before('fence', 'luent_island', TransformLuentIslands(Islands))
    },
    ...markdownShikiConfig
  },

  transformHtml(code, id, ctx) {
    console.log('TRANSFORM HTML')
    return transformPortals(code, ctx.page)
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

  title: "Luent",
  description: "Luent documentation and resources",
  themeConfig: {
    // siteTitle: false,
    siteTitle: 'v0.0.0',
    logo: {
      dark: '/assets/luent-logo-dark.png',
      light: '/assets/luent-logo-light.png'
    },

    footer: {
      message: 'Built with Vitepress + Luent',
    },
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Learn', link: '/guide/interactive-islands' },
      { text: 'Demos', link: '/demos/habit-tracker' },
      { text: 'Tour', link: '/markdown-examples' },
      { text: 'Reference', link: '/api/overview' },
      { text: 'Motivation', link: 'https://github.com/ruby-cube/luent/tree/main#motivation' },
      { text: 'Design Principles', link: 'https://github.com/ruby-cube/luent/tree/main/#design-principles' },
      { text: 'Introducing NextScript', link: 'https://github.com/ruby-cube/luent/tree/main/#design-principles' },
    ],

     sidebar: {
      '/api/': [{
        text: 'API reference',
        items: [{
          text: 'Overview',
          link: '/api/overview'
        }]
      }],
      '/guide/': [
       {
        text: 'Language',
        collapsed: false,
        items: [{
          text: '&nbsp;&nbsp;&nbsp;&nbsp;nsx&nbsp;&nbsp;&nbsp;&nbsp;tsx'
        }]
      },
      {
        text: 'Essentials',
        items: [
          { text: 'Interactive islands', link: '/guide/interactive-islands' },
          {
            text: 'Reactive State', link: '/guide/reactive-state', items: [
              // { text: 'Atomic Reactive State', link: '/guide/getter-syntax#accessor-variables' },
              // { text: 'Derived Reactive State', link: '/guide/getter-syntax#accessor-variables' },
              // { text: 'Inline Derivations', link: '/guide/getter-syntax#the-postfix-operator' },
              // { text: 'Reactive Structures', link: '/guide/getter-syntax#the-postfix-operator' },
              // { text: 'Encapsulation', link: '/guide/getter-syntax#the-postfix-operator' },
              // { text: 'Debugging', link: '/guide/getter-syntax#the-postfix-operator' },
            ]
          },
          { text: '[] Reactive Structures', link: '/guide/reactive-structures' },
          {
            text: 'Template Control Flow', link: '/guide/template-control-flow', items: [
              // { text: 'Iterative Rendering', link: '/guide/' },
              // { text: 'Control Flow', link: '/guide/' },
              // { text: 'Dynamic Views', link: '/guide/' },
              // { text: 'Preserving Views', link: '/guide/' },
              // { text: 'Lifecycle Hooks', link: '/guide/' },
            ]
          },
          {
            text: 'Element Bindings', link: '/guide/element-bindings', items: [
              // { text: 'Events', link: '/guide/' },
              // { text: 'Styles', link: '/guide/' },
              // { text: 'Attributes', link: '/guide/' }
            ]
          },
          {
            text: '~ Component Bindings', link: '/guide/component-bindings', items: [
              // { text: 'Direct Input', link: '/guide/' },
              // { text: 'Indirect Input', link: '/guide/' },
              // { text: 'Dependency Injection', link: '/guide/' },
              // { text: 'Events', link: '/guide/' },
              // { text: 'Styles', link: '/guide/' },
              // { text: 'Slots', link: '/guide/' },
              // { text: 'Auto-binding', link: '/guide/' }
            ]
          },

          { text: '[] Contextual Bindings', link: '/guide/contextual-bindings' },
          { text: 'The Render Cycle', link: '/guide/the-render-cycle' },
          { text: 'Preserving Views', link: '/guide/preserving-views' },
          { text: 'Lifecycle Hooks', link: '/guide/lifecycle-hooks' },
          { text: 'Node Access', link: '/guide/node-access' },
          { text: 'Reusable Logic', link: '/guide/reusable-logic' }
        ]
      },
      {
        text: 'Extended Topics',
        items: [
          { text: '~ Debugging Reactivity', link: '/guide/debugging-reactivity' },
          { text: 'Reactions', link: '/guide/reactions' },
          { text: 'Reactivity in Depth', link: '/guide/reactivity-in-depth' },
          // {
          //   text: '[] More Reactivity', link: '/markdown-examples', items: [
          //     // { text: 'Writable Derivations', link: '/guide/' },
          //   ]
          // }
        ]
      },
      {
        text: 'Special Topics',
        items: [
          { text: '[] Mutation Safety', link: '/guide/mutation-safety' },
          { text: 'Error Rendering', link: '/guide/error-rendering' },
          { text: 'Async Rendering', link: '/guide/async-rendering' },
          { text: 'Portals', link: '/guide/portals' },
          { text: 'Transitions', link: '/guide/transitions' },
          { text: '~ Finite States', link: '/guide/' },
          { text: '~ Custom Reactive Structures', link: '/guide/' },
          { text: 'Client-side Routing [planned]' },
          { text: 'Server Side [planned]' }
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
            {
              text: 'Palettable', link: '/demos/palettable',
            },
            { text: 'Drawing Canvas', link: '/demos/doodle-canvas' },
            { text: 'EmojiQuest', link: '/demos/emoji-quest' },
            { text: 'Folder Tree', link: '/terminology' },
            { text: 'Bottomless Void', link: '/terminology' },
          ]
        }

      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ruby-cube/luent/' }
    ],

    outline: {
      level: [2, 3]
    }
  },
  lastUpdated: true,
})

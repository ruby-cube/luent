import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",
  vite: {
    // Keep static assets (logo, etc.) in ../public while docs live in ./docs.
    publicDir: resolve(__dirname, '../public')
  },

  title: "Luent",
  description: "Luent documentation and resources",
  themeConfig: {
    siteTitle: false,
    logo: {
      dark: '/assets/luent-logo-dark.png',
      light: '/assets/luent-logo-light.png'
    },
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Learn', link: '/' },
      { text: 'API', link: '/markdown-examples' },
      { text: 'Demos', link: '/markdown-examples' },
      { text: 'Code Glimpses', link: '/markdown-examples' },
      { text: 'Motivation', link: 'https://github.com/ruby-cube/luent/tree/main#motivation' },
      { text: 'Design Principles', link: 'https://github.com/ruby-cube/luent/tree/main/#design-principles' },
      { text: 'Introducing NextScript', link: 'https://github.com/ruby-cube/luent/tree/main/#design-principles' },
    ],

    sidebar: [
      {
        text: 'Learn',
        items: [
          { text: 'nsx/tsx' }
        ]
      },
      {
        text: 'Essentials',
        items: [
          { text: 'Anatomy of an App', link: '/guide/anatomy-of-an-app' },
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
          { text: 'Reactive Structures', link: '/guide/reactive-structures' },
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
            text: 'Element Bindings', link: '/markdown-examples', items: [
              // { text: 'Events', link: '/guide/' },
              // { text: 'Styles', link: '/guide/' },
              // { text: 'Attributes', link: '/guide/' }
            ]
          },
          {
            text: 'Component Bindings', link: '/markdown-examples', items: [
              // { text: 'Direct Input', link: '/guide/' },
              // { text: 'Indirect Input', link: '/guide/' },
              // { text: 'Dependency Injection', link: '/guide/' },
              // { text: 'Events', link: '/guide/' },
              // { text: 'Styles', link: '/guide/' },
              // { text: 'Slots', link: '/guide/' },
              // { text: 'Auto-binding', link: '/guide/' }
            ]
          },

          { text: 'Contextual Bindings', link: '/guide/portals' },
          { text: 'Lifecycle Hooks', link: '/guide/portals' },
          { text: 'Node Access', link: '/guide/' },
          { text: 'Reusable Logic', link: '/guide/reusable-logic' }
        ]
      },
      {
        text: 'Extended Topics',
        items: [
          {
            text: 'More Reactivity', link: '/markdown-examples', items: [
              // { text: 'Finite States', link: '/guide/' },
              // { text: 'Writable Derivations', link: '/guide/' },
              // { text: 'Reactive Tasks', link: '/guide/' },
              // { text: 'Untracked', link: '/guide/' },
              // { text: 'Debugging Reactivity', link: '/guide/' },
              // { text: 'Custom Reactive Structures', link: '/guide/' },
            ]
          },
          {
            text: 'More Control Flow', link: '/guide/more-control-flow', items: [
              // { text: 'Error Rendering', link: '/guide/' },
              // { text: 'Async Rendering', link: '/guide/' },
              // { text: 'Prioritized Rendering', link: '/guide/' },
              // { text: 'Lazy Loading', link: '/guide/' },
            ]
          },
        ]
      },
      {
        text: 'Special Topics',
        items: [
          { text: 'Mutable Bindings', link: '/guide/' },
          { text: 'Portals', link: '/guide/portals' },
          { text: 'Transitions', link: '/guide/transitions' },
          { text: 'Schedulers', link: '/guide/' },
          { text: 'Cleanup', link: '/guide/' },
          { text: 'Client-side Routing [planned]', link: '/markdown-examples' },
          { text: 'Server Side [planned]' }
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ruby-cube/luent/' }
    ],

    outline: {
      level: [2, 3]
    }
  },
  lastUpdated: true,
})

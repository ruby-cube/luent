import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: 'docs',
  vite: {
    // Keep static assets (logo, etc.) in ../public while docs live in ./docs.
    publicDir: resolve(__dirname, '../public')
  },

  title: 'NextScript',
  description: 'NextScript documentation and resources',
  themeConfig: {
    logo: '/assets/nextscript-logo-512px.png',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Features', link: '/getter-syntax' },
      { text: 'Examples', link: '/markdown-examples' },
      { text: 'Motivation', link: 'https://github.com/ruby-cube/luent/tree/main/packages/nextscript#motivation' },
      { text: 'Design Principles', link: 'https://github.com/ruby-cube/luent/tree/main/packages/nextscript#design-principles' },
    ],
    sidebar: [
      {
        text: 'Features',
        items: [
          {
            text: 'Getter Syntax',
            link: '/getter-syntax',
            items: [
              { text: 'Accessor Variables', link: '/getter-syntax#accessor-variables' },
              { text: '@ Postfix Operator', link: '/getter-syntax#the-postfix-operator' }
            ]
          },
          { text: 'JSX Syntax', link: '/jsx-syntax' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ruby-cube/luent/tree/main/packages/nextscript' }
    ]
  }
})

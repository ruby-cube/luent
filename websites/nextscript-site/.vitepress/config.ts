import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'
import LuentPlugin from '../../../plugins/vite-plugin-luent/index.js'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: 'docs',
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
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Features', link: '/guide/getter-syntax' },
      { text: 'Demos', link: '/demos/habit-tracker' },
      { text: 'Motivation', link: 'https://github.com/ruby-cube/luent/tree/main/packages/nextscript#motivation' },
      { text: 'Design Principles', link: 'https://github.com/ruby-cube/luent/tree/main/packages/nextscript#design-principles' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Features',
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
            { text: 'Terminology', link: '/guide/terminology' }
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
            { text: 'Drawing Canvas', link: '/jsx-syntax' },
            { text: 'Video Player', link: '/terminology' },
          ]
        }
        
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ruby-cube/luent/tree/main/packages/nextscript' }
    ]
  }
})

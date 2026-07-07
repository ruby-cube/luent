// https://vitepress.dev/guide/custom-theme
import { type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import { islands, mountIslands, smoothScrollHomepage } from "../../src/luent-islands.js"
// import { h } from 'vue'

export default {
  extends: DefaultTheme,
  // Layout() {
  //   return h(DefaultTheme.Layout, null, {
  //     'sidebar-nav-before': () => h('language-toggle')
  //   })
  // },
  enhanceApp({ router }) {
    router.onAfterRouteChange = (page) => {
      mountIslands(islands, page)
      smoothScrollHomepage(document.documentElement, page)
    }
  }
} satisfies Theme

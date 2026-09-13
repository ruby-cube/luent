// https://vitepress.dev/guide/custom-theme
import { type Theme, useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './style.css'
import { islands, mountIslands, smoothScrollHomepage } from "../../src/luent-islands.js"
import CustomHome from './CustomHome.vue'
import { installVitePressScrollRestoration } from '../../../shared/src/vitepress-scroll-restoration'

const Layout = () => {
  const { frontmatter } = useData()
  if (frontmatter.value?.layout === 'home') {
    return h(DefaultTheme.Layout, null, {
      'home-hero-before': () => h(CustomHome)
    })
  }
  return h(DefaultTheme.Layout)
}

export default {
  extends: DefaultTheme,
  Layout,
  // Layout() {
  //   return h(DefaultTheme.Layout, null, {
  //     'sidebar-nav-before': () => h('language-toggle')
  //   })
  // },
  enhanceApp({ router }) {
    let previousPage = router.route.path
    const prevBeforeRouteChange = router.onBeforeRouteChange

    router.onBeforeRouteChange = async (to) => {
      previousPage = router.route.path
      if (!prevBeforeRouteChange) return
      return prevBeforeRouteChange(to)
    }

    installVitePressScrollRestoration(router, {
      onAfterRouteChange: (page) => {
        if (typeof document === 'undefined') return
        mountIslands(islands, page)
        smoothScrollHomepage(document.documentElement, page, previousPage)
      }
    })
  }
} satisfies Theme

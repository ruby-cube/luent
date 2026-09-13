// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HeroCode from './HeroCode.vue'
import './style.css'
import '../../../shared/src/style-rules'
import { islands, mountIslands, smoothScrollHomepage } from '../../src/luent-islands.js'
import { installVitePressScrollRestoration } from '../../../shared/src/vitepress-scroll-restoration'


export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-image': () => {
        console.warn('rendering hero')
        return h(HeroCode)
      }
    })
  },
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
        if (typeof document === 'undefined') return;
        mountIslands(islands, page)
        smoothScrollHomepage(document.documentElement, page, previousPage)
      }
    })
  }
} satisfies Theme


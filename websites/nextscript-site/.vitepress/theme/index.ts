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
    installVitePressScrollRestoration(router, {
      onAfterRouteChange: (page) => {
        mountIslands(islands, page)
        smoothScrollHomepage(document.documentElement, page)
      }
    })
  }
} satisfies Theme


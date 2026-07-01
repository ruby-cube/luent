// https://vitepress.dev/guide/custom-theme
import { defineComponent, h, onMounted, ref, type VNode } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HeroCode from './HeroCode.vue'
import './style.css'
import '../../../shared/src/style-rules'
import { islands, mountIslands } from '../../src/luent-islands.js'


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
  enhanceApp({ app, router, siteData }) {
    console.log('hydrating :)')
    mountIslands(islands)
  }
} satisfies Theme


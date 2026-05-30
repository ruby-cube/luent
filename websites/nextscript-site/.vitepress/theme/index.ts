// https://vitepress.dev/guide/custom-theme
import { h, type VNode } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'

function mountHeroCodePanel(el: Element | null) {
  if (!el || typeof window === 'undefined') return
  import('../../src/load-hero-code-panel').then(({ loadHeroCodePanel }) => {
    loadHeroCodePanel('#hero-code-panel-root')
  })
}

function createHeroImageSlot(): VNode {
  return h('div', {
    id: 'hero-code-panel-root',
    onVnodeMounted(vnode: VNode) {
      mountHeroCodePanel(vnode.el as Element | null)
    }
  })
}

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-image': () => createHeroImageSlot()
    })
  },
  enhanceApp({ app, router, siteData }) {
    // ...
  }
} satisfies Theme

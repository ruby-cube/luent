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

function mountHomeTour() {
  if (typeof window === 'undefined') return
  const hasRoot = document.querySelector('#home-tour-root')
  if (!hasRoot) return
  import('../../src/load-home-tour').then(({ loadHomeTour }) => {
    loadHomeTour('#home-tour-root')
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
    if (typeof window === 'undefined') return

    const mount = () => {
      window.requestAnimationFrame(() => {
        mountHomeTour()
      })
    }

    mount()
    router.onAfterRouteChange = mount
  }
} satisfies Theme

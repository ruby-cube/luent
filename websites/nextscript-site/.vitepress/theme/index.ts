// https://vitepress.dev/guide/custom-theme
import { h, type VNode } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HeroCode from './HeroCode.vue'
import './style.css'

// function mountHeroCodePanel(el: Element | null) {
//   if (!el || typeof window === 'undefined') return
//   import('../../src/load-hero-code-panel').then(({ loadHeroCodePanel }) => {
//     loadHeroCodePanel('#hero-code-panel-root')
//   })
// }

function mountHomeTour() {
  if (typeof window === 'undefined') return
  const hasRoot = document.querySelector('#home-tour-root')
  if (!hasRoot) return
  import('../../src/load-home-tour').then(({ loadHomeTour }) => {
    loadHomeTour('#home-tour-root')
  })
}

let hashRealignTimers: number[] = []

function clearHashRealignTimers() {
  for (const timer of hashRealignTimers) {
    window.clearTimeout(timer)
  }
  hashRealignTimers = []
}

function realignHashScroll(route?: string) {
  if (typeof window === 'undefined') return
  clearHashRealignTimers()

  const hashIndex = route?.indexOf('#') ?? -1
  const hash = hashIndex >= 0 ? route!.slice(hashIndex + 1) : window.location.hash.slice(1)
  if (!hash) return

  let targetId = hash
  try {
    targetId = decodeURIComponent(hash)
  } catch {
    // Fall back to raw hash if decoding fails.
  }

  // Re-apply hash scrolling over a short bounded window to absorb async layout
  // shifts (lazy mounts, font metrics, responsive recalculation) on first nav.
  const retryDelays = [0, 40, 120, 260, 480]
  for (const delay of retryDelays) {
    const timer = window.setTimeout(() => {
      const currentHash = window.location.hash.slice(1)
      if (!currentHash) return

      let currentTargetId = currentHash
      try {
        currentTargetId = decodeURIComponent(currentHash)
      } catch {
        // Fall back to raw hash if decoding fails.
      }

      if (currentTargetId !== targetId) return

      const target = document.getElementById(targetId)
      target?.scrollIntoView({ block: 'start', behavior: 'auto' })
    }, delay)
    hashRealignTimers.push(timer)
  }
}

// function createHeroImageSlot(): VNode {
//   return h('div', {
//     id: 'hero-code-panel-root',
//     onVnodeMounted(vnode: VNode) {
//       mountHeroCodePanel(vnode.el as Element | null)
//     }
//   })
// }

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-image': () => h(HeroCode)
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
    realignHashScroll()
    const previousOnAfterRouteChange = router.onAfterRouteChange
    router.onAfterRouteChange = (to) => {
      previousOnAfterRouteChange?.(to)
      mount()
      realignHashScroll(to)
    }
  }
} satisfies Theme

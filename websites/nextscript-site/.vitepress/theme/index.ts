// https://vitepress.dev/guide/custom-theme
import { defineComponent, h, onMounted, ref, type VNode } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HeroCode from './HeroCode.vue'
import './style.css'
import '../../src/style-rules'
import { islands } from '../../src/luent-islands'

const AwaitMount = defineComponent({
  name: 'await-mount',
  setup(_, { slots }) {
    const mounted = ref(false)

    onMounted(() => {
      mounted.value = true
    })

    return () => {
      if (!mounted.value) {
        return slots.fallback?.() ?? null
      }

      return slots.default?.() ?? null
    }
  }
})

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
    app.component('await-mount', AwaitMount)

    if (typeof window == 'undefined') return;

    if (!customElements.get('style-scope')) {
      customElements.define('style-scope', class StyleScope extends HTMLElement {
        connectedCallback() {
          const template = this.querySelector('template')
          const content = template?.content.cloneNode(true) as DocumentFragment | undefined

          const slot = content ?? document.createElement('slot')
          const root = this.attachShadow({ mode: 'open' });
          root.appendChild(slot)
          if (template) template.remove()
        }
      });
    }

    // define custom elements
    for (const key in islands) {
      if (!customElements.get(key)) {
        customElements.define(key, islands[key]())
      }
    }
  }
} satisfies Theme

declare global {
  namespace JSX {
    interface CustomElements {
      'style-scope': {}
    }
  }
}
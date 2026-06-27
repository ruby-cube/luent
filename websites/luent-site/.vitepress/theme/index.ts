// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import { islands, hydrate } from "../../src/luent-islands.js"

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    hydrate(app, islands)
  }
} satisfies Theme

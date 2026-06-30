// https://vitepress.dev/guide/custom-theme
import { onContentUpdated, type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import { islands, hydrate } from "../../src/luent-islands.js"

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    onContentUpdated(() => console.log('#### CONTENT UPDATED'))
    hydrate(app, islands)
  }
} satisfies Theme

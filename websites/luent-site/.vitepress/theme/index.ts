// https://vitepress.dev/guide/custom-theme
import { type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import { islands, mountIslands } from "../../src/luent-islands.js"

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    router.onAfterRouteChange = () => {
      mountIslands(islands)
    }
  }
} satisfies Theme

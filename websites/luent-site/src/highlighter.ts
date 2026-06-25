import { createHighlighter } from 'shiki'
import { shikiLanguages, shikiThemeNames, shikiThemes } from '../.vitepress/theme/shiki-setup'

const highlighterPromise = createHighlighter({
  themes: [...shikiThemes],
  langs: [...shikiLanguages]
})

export async function highlightCode(code: string, lang: string) {
  const highlighter = await highlighterPromise
  return highlighter.codeToHtml(code, {
    lang,
    themes: shikiThemeNames,
    defaultColor: false
  })
}
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import tsGrammar from 'shiki/dist/langs/typescript.mjs'
import tsxGrammar from 'shiki/dist/langs/tsx.mjs'
import { nsxGrammar, shikiThemeNames, shikiThemes } from '../.vitepress/theme/shiki-setup'

const highlighterPromise = createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  themes: shikiThemes as any,
  langs: [...tsGrammar, ...tsxGrammar, nsxGrammar] as any
})

export async function highlightCode(code: string, lang: string) {
  const highlighter = await highlighterPromise
  return highlighter.codeToHtml(code, {
    lang,
    themes: shikiThemeNames,
    defaultColor: false
  })
}
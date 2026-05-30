import { createHighlighter } from 'shiki'
import { shikiLanguages, shikiThemeNames, shikiThemes } from '../.vitepress/theme/shiki-setup'

const highlighterPromise = createHighlighter({
  themes: [...shikiThemes],
  langs: [...shikiLanguages]
})

export async function renderCodeToHtml(code: string, lang: 'nsx' | 'tsx') {
  const highlighter = await highlighterPromise
  return highlighter.codeToHtml(code, {
    lang,
    themes: shikiThemeNames,
    defaultColor: false
  })
}

function toHtml(code: string) {
  return code
    .replace(/&/g, '&#x26;')
    .replace(/</g, '&#x3C;')
    .replace(/>/g, '&#x3E;')
}

export function codeHtml(code: string) {
  return `<pre class='shiki'><code>${toHtml(code)}</code></pre>`
}

function unwrapShikiCode(html: string) {
  const match = html.match(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/)
  return match?.[1] ?? html
}

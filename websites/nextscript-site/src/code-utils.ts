import { createHighlighter } from 'shiki'
import { shikiLanguages, shikiThemeNames, shikiThemes } from '../.vitepress/theme/shiki-setup'
import { MaybeIon } from '@rue/luent'

const highlighterPromise = createHighlighter({
  themes: [...shikiThemes],
  langs: [...shikiLanguages]
})

export function trusted(html: MaybeIon<string>) {
  return {
    trusted: true,
    html
  }
}

export async function renderCodeToHtml(code: string, lang: string) {
  const highlighter = await highlighterPromise
  return highlighter.codeToHtml(code, {
    lang,
    themes: shikiThemeNames,
    defaultColor: false
  })
}

export function toHtml(code: string) {
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

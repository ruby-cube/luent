import { MaybeIon } from '@rue/luent'

export function trusted(html: MaybeIon<string>) {
  return {
    trusted: true,
    html
  }
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

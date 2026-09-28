import { IonOr } from 'luent'
import { escapeHTML } from '@luent/utils'

export function trusted(html: IonOr<string>) {
  return {
    trusted: true,
    html
  }
}



export function codeHtml(code: string) {
  // must escape double curly braces because Vue parses it as interpolation
  const escaped = escapeHTML(code)
    .replaceAll('{{', '&#123;&#123;')

  return `<pre class='shiki'><code>${escaped}</code></pre>`
}

function unwrapShikiCode(html: string) {
  const match = html.match(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/)
  return match?.[1] ?? html
}

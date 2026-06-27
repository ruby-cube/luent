import { MaybeIon } from '@rue/luent'
import { toHtml } from '@rue/utils'

export function trusted(html: MaybeIon<string>) {
  return {
    trusted: true,
    html
  }
}



export function codeHtml(code: string) {
  return `<pre class='shiki'><code>${toHtml(code)}</code></pre>`
}

function unwrapShikiCode(html: string) {
  const match = html.match(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/)
  return match?.[1] ?? html
}

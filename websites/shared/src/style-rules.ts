/**
 * VitePress strips <style> tags. By replacing style tags with <style-rules>, we by-pass the stripping of styles.
 */
if (typeof window !== 'undefined' && !customElements.get('style-rules')) {
  customElements.define('style-rules', class extends HTMLElement {
    connectedCallback() {
      // Turn <style-rules>css...</style-rules> into a real <style> tag.
      const css = this.textContent ?? ''
      const style = document.createElement('style')
      style.textContent = css
      this.replaceWith(style)
    }
  })
}

export function encodeStyleTags(html: string): string {
  return html.replace(/<style(?=[\s>])[^>]*>([\s\S]*?)<\/style>/gi, (_, css: string) => {
    // const encodedCss = Buffer.from(css, 'utf8').toString('base64')
    return `<style-rules>${css}</style-rules>`
  })
}


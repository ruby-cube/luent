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

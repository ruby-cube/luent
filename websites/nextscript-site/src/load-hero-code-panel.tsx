import { component, createRoot } from '@rue/luent'
import { codeHtml, renderCodeToHtml } from './code-utils'

function trusted(html: string) {
  return {
    trusted: true,
    html
  }
}

const codeSnippet = 
  codeHtml(`function Total({ start }) {
  get count = ion(start)
  get qty = ion(0)

  <:component>
    <button on:click={() => count++}>{count@}</button>
    <button on:click={() => qty++}>x {qty@}</button>
    <p>total: {(count * qty)@}</p>
  </:component>
}`)

function HeroCodePanel() {
  return component(
    <div class='ns-hero-code' aria-label='NextScript example code'>
      <div class='ns-hero-code__header'>
        <span class='ns-hero-code__dot ns-hero-code__dot--red' />
        <span class='ns-hero-code__dot ns-hero-code__dot--amber' />
        <span class='ns-hero-code__dot ns-hero-code__dot--green' />
        <span class='ns-hero-code__title'>total.nsx</span>
      </div>
      <pre class='ns-hero-code__body'>
        <code
          innerHTML={trusted(
            codeSnippet
          )}
        />
      </pre>
    </div>
  )
}

export function loadHeroCodePanel(mountTarget = '#hero-code-panel-root') {
  const host = document.querySelector(mountTarget)
  if (!host) return
  host.innerHTML = ''
  createRoot(() => <HeroCodePanel />).mount(mountTarget)
}

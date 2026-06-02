import { component, createRoot } from '@rue/luent'
import { toHtml } from './code-utils'

// const codeSnippet =
//   `get count = ion(start)
// get qty = ion(0)
// get total = ion(() => count * qty)

// watch(total@, () => {
//   if (total >= limit) log('limit reached')
// })`
// const codeSnippet =
//   `function Counter() {
//   get count = ion(0);

//   <:component>
//     <button on:click={() => count++}>
//       Clicked {count@} times
//     </button>
//   </:component>
// }`
const codeSnippet =
  `function Total({ count@ }: { count: Ion<number> }) {
  get qty = ion(0)

  <:component>
    <div>{count@}</div>
    <button on:click={() => qty++}>x {qty@}</button>
    <div>= {(count * qty)@} total</div>
  </:component>
}`



// <let/count=0>
// <button onClick() { count++ }>
//   Clicked ${count} times
// </button>

// function Counter() {
//   let count = ion(0);
//   <:>
//   <button on:click={() => count++}>
//    Clicked {count@} times
//   </button>
// }



// const TYPEWRITER_START_DELAY_MS = 250
// const TYPEWRITER_STEP_MS = 28

// function clearTypewriterTimers(codeNode: HTMLElement) {
//   const timeoutId = Number(codeNode.dataset.typewriterTimeoutId)
//   if (Number.isFinite(timeoutId) && timeoutId > 0) {
//     window.clearTimeout(timeoutId)
//   }

//   const intervalId = Number(codeNode.dataset.typewriterIntervalId)
//   if (Number.isFinite(intervalId) && intervalId > 0) {
//     window.clearInterval(intervalId)
//   }
// }

// function startTypewriter(host: Element) {
//   const codeNode = host.querySelector<HTMLElement>('.ns-hero-code__content')
//   if (!codeNode) return

//   clearTypewriterTimers(codeNode)

//   if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
//     codeNode.textContent = codeSnippet
//     codeNode.classList.remove('is-typing')
//     return
//   }

//   codeNode.textContent = ''
//   codeNode.classList.add('is-typing')

//   let cursor = 0
//   const startTimeout = window.setTimeout(() => {
//     const interval = window.setInterval(() => {
//       cursor += 1
//       codeNode.textContent = codeSnippet.slice(0, cursor)

//       if (cursor >= codeSnippet.length) {
//         window.clearInterval(interval)
//         codeNode.classList.remove('is-typing')
//       }
//     }, TYPEWRITER_STEP_MS)

//     codeNode.dataset.typewriterIntervalId = String(interval)
//   }, TYPEWRITER_START_DELAY_MS)

//   codeNode.dataset.typewriterTimeoutId = String(startTimeout)
// }

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
        <code class='ns-hero-code__content'>
          {codeSnippet}
        </code>
      </pre>
    </div>
  )
}

export function loadHeroCodePanel() {
  createRoot(() => <HeroCodePanel />).mount('#hero-code-panel-root')
}

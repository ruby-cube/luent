import { ion } from "@luent/quarky";

function escapeHTML(code: string) {
  return code
    .replace(/&/g, '&#x26;')
    .replace(/</g, '&#x3C;')
    .replace(/>/g, '&#x3E;')
}

function codeHtml(code: string) {
  return `<code><pre>${escapeHTML(code)}</pre></code>`
}

const nsx =
  `
import { component, css, Style } from 'luent'
import { ion } from '@luent/quarky'

export function Counter() {
  get count = ion(0);

  return (

    <>
      <button class='counter' on:click={e => $count.value++}>{$count}</button>
      {Style(css\`
        .counter {
          background-color: red;
          padding: 1rem;
          width: 3rem;
          border-radius: 5px;
        }
      \`)}
    </>
  )
}
    `
const $nsx = ion(codeHtml(nsx))

export function TestInnerHTML() {
  return (

    <>
      <h1>Hello world</h1>
      <div>{{ trusted: true, html: $nsx }}</div>
    </>
  )
}

import { component, css, Style } from '@rue/luent'
import { ion } from '@rue/quarky'

export function Counter() {
  const $count = ion(0);

  return component(
    <>
      <button class='counter' on:click={e => $count.value++}>{$count}</button>
      {Style(css`
        .counter {
          background-color: red;
          padding: 1rem;
          width: 3rem;
          border-radius: 5px;
        }
      `)}
    </>
  )
}
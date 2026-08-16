import { css, ion, Style } from "luent";

export function Counter() {
  const $count = ion(0, {
    increment() { $count.value++ }
  })
  return <>
    <button
      class="count-btn"
      type="button"
      on:click={$count.increment}
    >
      count is {$count}
    </button>
    
    {Style(css`
      .count-btn {
        margin-top: .3rem;
        padding: .8rem 2.1rem;
        border-radius: 999px;
        background: var(--btn);
        color: #FFFFFF;
        font-weight: 600;
        font-size: .95rem;
        transition: background .2s
      }
  
      .count-btn:hover {
        background: var(--btn-hover)
      }  
    `)}
  </>
}
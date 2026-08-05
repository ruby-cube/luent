import { css, ion, Style } from "luent"

export function Counter() {
  const $count = ion(0)

  return <>
    <div on:click={() => $count.value++} style='user-select: none'>
      Count is {$count}
    </div>
  </>
}

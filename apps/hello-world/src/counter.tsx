import { ion } from "luent"

export function Counter() {
  const $count = ion(0)

  return <>
    <div on:click={() => $count.value++} style='user-select: none'>
      count is {$count}
    </div>
  </>
}

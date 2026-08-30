import { ion } from "luent"

export function Counter() {
  const $count = ion(0)
  return <>
    <button on:click={() => $count.value++}>{$count}</button>
  </>
}
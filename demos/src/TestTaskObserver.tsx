import { awaitTick, ion } from "luent"

export function TestTaskObserver() {

  const $count = ion(0)

  awaitTick(async oo => {
    await fetchSomething()
    console.log('count:', oo($count))
  })

  return <>
    <button on:click={() => $count.value++}>increment</button>
  </>
}

function fetchSomething() {
  return new Promise(resolve => {
    setTimeout(resolve, 1000)
  })
}
import { component, template } from "luent"
import { ion, runIonicTask, SYNC } from "@luent/quarky"


export function TestIonicEffect() {
  const $count = ion(0, {
    increment() {
      console.log("incrementing")
      $count.value = $count() + 1
    }
  })

  runIonicTask(() => {
    $count.increment()
  })

  return (

    <button on:click={$count.increment}>click for effect</button>
  )
}

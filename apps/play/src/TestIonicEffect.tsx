import { component } from "@rue/lumo"
import { BEFORE_RENDER, watchEffect, ion, SYNC, watch } from "@rue/quarky"


export function TestIonicEffect() {
    const $count = ion(0, {
        increment() {
            console.log("incrementing")
            $count.value = $count() + 1
        }
    })

    watchEffect(() => {
        $count.increment()
    }, { phase: SYNC })

    return component(
        <button on:click={$count.increment}>click for effect</button>
    )
}

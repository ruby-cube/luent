import { Component } from "@rue/lumo"
import { BEFORE_RENDER, watchEffect, ion, SYNC, watch } from "@rue/quarky"


export function TestIonicEffect() {
    const $count = ion(0, {
        increment() {
            console.log("incrementing")
            $count.as($count() + 1)
        }
    })

    watchEffect(() => {
        console.log("running effect")
        $count.increment()
    }, { phase: SYNC })

    return Component(
        <button on:click={$count.increment}>click for effect</button>
    )
}

import { Component } from "@rue/lumo"
import { BEFORE_RENDER, initializeIonicEffect, ion, SYNC, watch } from "@rue/quarky"


export function TestIonicEffect() {
    const $count = ion(0, {
        increment() {
            console.log("incrementing")
            $count.set($count() + 1)
        }
    })

    initializeIonicEffect(() => {
        console.log("running effect")
        $count.increment()
    }, { phase: SYNC })

    return Component(
        <button onclick={$count.increment}>click for effect</button>
    )
}

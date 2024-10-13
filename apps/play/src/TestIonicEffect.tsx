import { Component } from "@rue/lumo"
import { BEFORE_RENDER, watchIonicEffect, Ion, SYNC, watch } from "@rue/quarky"


export function TestIonicEffect() {
    const $count = Ion(0, {
        increment() {
            console.log("incrementing")
            $count.set($count() + 1)
        }
    })

    watchIonicEffect(() => {
        console.log("running effect")
        $count.increment()
    }, { phase: SYNC })

    return Component(
        <button onclick={$count.increment}>click for effect</button>
    )
}

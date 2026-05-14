import { Component, template } from "@rue/luent"
import {  ion, queueIonicTask, SYNC } from "@rue/quarky"


export function TestIonicEffect() {
    const $count = ion(0, {
        increment() {
            console.log("incrementing")
            $count.value = $count() + 1
        }
    })

    queueIonicTask(() => {
        $count.increment()
    }, { phase: SYNC })

    return Component(
        <button on:click={$count.increment}>click for effect</button>
    )
}

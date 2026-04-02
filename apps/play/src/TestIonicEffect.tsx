import { template } from "@rue/luent"
import {  ion, queueIonicTask, SYNC } from "@rue/quarky"


export function TestIonicEffect() {
    const $count = Ion(0, {
        increment() {
            console.log("incrementing")
            $count.value = $count() + 1
        }
    })

    queueIonicTask(() => {
        $count.increment()
    }, { phase: SYNC })

    return template(
        <button on:click={$count.increment}>click for effect</button>
    )
}

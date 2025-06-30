import { component } from "@rue/lumo"
import {  ion, ionicTask, SYNC } from "@rue/quarky"


export function TestIonicEffect() {
    const $count = ion(0, {
        increment() {
            console.log("incrementing")
            $count.state = $count() + 1
        }
    })

    ionicTask(() => {
        $count.increment()
    }, { phase: SYNC })

    return component(
        <button on:click={$count.increment}>click for effect</button>
    )
}

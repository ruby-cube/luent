import { $Node, Component, CreateIf, ElseCreate } from "@rue/lumo";
import { $, DerivedIon, Ion, watch } from "../../../packages/quarky/src";
import { onActivated, onCreated, onDeactivate, onDestroy } from "../../../packages/lumo/src/dynamic/lifecycle";

export function MountIf() {
    const $count = Ion(0)
    // const $doubleCount = DerivedIon(() => $count() * 2)
    function increment() {
        $count.update(count => count + 1)
    }

    // const $count2 = Ion(0)
    // const $sum = $(() => $count() + $count2())
    // function increment2() {
    //     $count2.update(count => count + 1)
    // }


    const $active = Ion(true)
    function toggleActive() {
        $active.update(active => !active)
    }

    // const $ready = Ion(true)
    // function toggleReady() {
    //     $ready.update(ready => !ready)
    // }

    // watch(() => $count() * 2, (double) => {
    //     console.log("double count!", double)
    // })

    // const $activeAndReady = $(() => $active() && $ready(), true)

    return Component(
        <>
            {[
                CreateIf($active, () =>
                    <Counter></Counter>
                ),
                ElseCreate(() =>
                    <p>bye</p>
                )
            ]}
            {/* <div>Both: {$activeAndReady}</div> */}
            <button onclick={toggleActive}>toggle active {$active}</button>
            {/* <button onclick={increment}>increment {$count}</button> */}
            {/* <button onclick={toggleReady}>toggle ready {$ready}</button> */}
            {/* <div>{$sum}</div>
            <button onclick={increment2}>increment {$count2}</button> */}
        </>
    )
}

function Counter() {
    const $count = Ion(0)

    const $button = $Node()
    const $countDiv = $Node()

    // onNodesCreated(
    //     [$button, $countDiv],
    //     ([button, countDiv]) => {

    //     }
    // )

    watch(() => [$button(), $countDiv()], ([button, countDiv]) => {
        console.log("node ref", button, countDiv)
    }, {
        phase: Phase.RENDER,
        once: true
    })

    watch($count, () => {
        console.log("sync phase")
    }, { phase: Phase.SYNC })

    watch($count, () => {
        console.log("pre-render phase")
    }, { phase: Phase.BEFORE_RENDER })

    watch($count, () => {
        console.log("render phase")
    }, { phase: Phase.RENDER })

    watch($count, () => {
        console.log("post-render phase")
    }, { phase: Phase.AFTER_RENDER })

    onCreated(() => {
        console.log("created")
    })

    onActivated(() => {
        console.log("activated yo")
    })

    onDeactivate(() => {
        console.log("deactivate")
    })

    onDestroy(() => {
        console.log("destroyd")
    })

    $count.setTo(1)

    return Component(
        <>
            <div ref={$countDiv}>{$count}</div>
            <button onclick={() => $count.update(count => count + 1)} ref={$button}>increment</button>
        </>
    )
}


//@ts-nocheck
import { NodeRef, Component, If, Else, stopPropagation } from "@rue/lumo";
import { $, AFTER_RENDER, BEFORE_RENDER, DerivedIon, ion, ON_RENDER, SYNC, watch } from "../../../packages/quarky/src";
import { onActivated, onCreated, onDeactivate, onDestroy } from "../../../packages/lumo/src/dynamic/lifecycle";

export function MountIf() {
    const $count = ion(0)
    // const $doubleCount = DerivedIon(() => $count() * 2)
    function increment() {
        $count.set(count => count + 1)
    }

    // const $count2 = ion(0)
    // const $sum = $(() => $count() + $count2())
    // function increment2() {
    //     $count2.update(count => count + 1)
    // }


    const $active = ion(true)
    function toggleActive() {
        $active.set(active => !active)
    }

    // const $ready = ion(true)
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
                If($active, () =>
                    <Counter></Counter>
                ),
                Else(() =>
                    <p>bye</p>
                )
            ]}
            {/* <div>Both: {$activeAndReady}</div> */}
            <button onClick={toggleActive}>toggle active {$active}</button>
            {/* <button onClick={increment}>increment {$count}</button> */}
            {/* <button onClick={toggleReady}>toggle ready {$ready}</button> */}
            {/* <div>{$sum}</div>
            <button onClick={increment2}>increment {$count2}</button> */}
        </>
    )
}

function Counter() {
    const $count = ion(0)

    const $button = NodeRef()
    const $countDiv = NodeRef()

    // onNodesCreated(
    //     [$button, $countDiv],
    //     ([button, countDiv]) => {

    //     }
    // )

    watch(() => [$button(), $countDiv()], ([button, countDiv]) => {
        console.log("node ref", button, countDiv)
    }, {
        run: ON_RENDER,
        once: true
    })

    watch($count, () => {
        console.log("sync phase")
    }, { phase: SYNC })

    watch($count, () => {
        console.log("pre-render phase")
    }, { phase: BEFORE_RENDER })

    watch($count, () => {
        console.log("render phase")
    }, { phase: ON_RENDER })

    watch($count, () => {
        console.log("post-render phase")
    }, { phase: AFTER_RENDER })

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

    $count.set(1)

    return Component(
        <>
            <div ref={$countDiv}>{$count}</div>
            <button onClick-this-$button-v={[$count.set($count() + 1), stopPropagation]} ref={$button}>increment</button >
    {/* <Counter>{$count()}</Counter> */ }
        </>
    )
}


// slot: renderfunction, component, readonly ion, primitive value
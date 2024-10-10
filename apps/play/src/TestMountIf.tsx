import { NodeRef, Component, If, Else, stopPropagation, watch } from "@rue/lumo";
import { AFTER_RENDER, BEFORE_RENDER, Ion, ON_RENDER, SYNC } from "@rue/quarky";

export function MountIf() {
    const $count = Ion(0, {
        increment() {
            $count.set($count() + 1)
        }
    })
    // const $doubleCount = DerivedIon(() => $count() * 2)

    // const $count2 = Ion(0)
    // const $sum = $(() => $count() + $count2())
    // function increment2() {
    //     $count2.update(count => count + 1)
    // }


    const $active = Ion(true, {
        toggle() {
            $active.set(!$active())
        }
    })

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
                If($active, () =>
                    <Counter></Counter>
                ),
                Else(() =>
                    <p>bye</p>
                )
            ]}
            {/* <div>Both: {$activeAndReady}</div> */}
            <button onclick={$active.toggle}>toggle active {$active}</button>
            {/* <button onclick={increment}>increment {$count}</button> */}
            {/* <button onclick={toggleReady}>toggle ready {$ready}</button> */}
            {/* <div>{$sum}</div>
            <button onclick={increment2}>increment {$count2}</button> */}
        </>
    )
}

function Counter() {
    const _this = $thisComponent()
    const $count = Ion(0)

    const $button = NodeRef('button')
    const $countDiv = NodeRef('div')

    // onNodesCreated(
    //     [$button, $countDiv],
    //     ([button, countDiv]) => {

    //     }
    // )

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

    _this.onCreated(() => {
        console.log("created")
        const button = $button()
        const countDiv = $countDiv()
        console.log("node ref", button, countDiv)
    })

    // onActivated(() => {
    //     console.log("activated yo")
    // })

    // onDeactivate(() => {
    //     console.log("deactivate")
    // })

    _this.onDestroy(() => {
        console.log("destroyd")
    })

    $count.set(1)

    return Component(
        <>
            <div ref={$countDiv}>{$count}</div>
            <button onclick-this-$button-v={[$count.set($count() + 1), stopPropagation]} ref={$button}>increment</button >
            {/* <Counter>{$count()}</Counter> */}
        </>
    )
}


// slot: renderfunction, component, readonly Ion, primitive value
import { Component } from "@rue/lumo";
import { DerivedIon, Ion, ionize, isAnyIon, watch, watchIonicEffect } from "@rue/quarky";
import { asPropIon } from "../../../packages/quarky/src/ionize/PropIon";

export function TestSelectiveTracking() {

    const $active = Ion(false, {
        toggle() {
            $active.set(!$active())
        }
    })

    const $ready = Ion(true, {
        toggle() {
            $ready.set(!$ready())
        }
    })

    const $count = Ion(0, {
        increment() {
            $count.set($count() + 1)
        }
    })

    const $doubleCount = DerivedIon(() => $count() * 2)

    const $frog = ionize({
        name: 'kermit'
    }, {
        changeName(name: string) {
            $frog.name = name
        }
    })

    const X = true as const;

    watchIonicEffect(() => {
        console.log($doubleCount(X))
        if ($active(X)) {
            console.log($count())
            console.log('active')
        }
        else if ($ready(X)) {
            console.log($count())
            console.log('ready')
        }
        else {
            console.log('neither')
        }
    }, {
        only: [X]
    })

    function reInputChange(event: InputEvent) {
        // $frog.changeName(event.target?.value)
        $frogName.set(event.target.value)
        // console.log($frog.name)
    }

    const $frogName = asPropIon($frog, 'name')

    watch($frogName, (name) => {
        console.log('frog name changed', name)
    })

    return Component(
        () =>
            <>
                <div>{$count}</div>
                <p>{$frogName}</p>
                <button onclick={$count.increment}>increment</button>
                <button onclick={$active.toggle}>toggle active</button>
                <button onclick={$ready.toggle}>toggle ready</button>
                <input oninput={reInputChange}></input>
            </>
    )
}
import { Component } from "@rue/lumo";
import { DerivedIon, ion, ionize, isIon, watch, watchIonicEffect } from "@rue/quarky";
import { asPropIon } from "../../../packages/quarky/src/ionize/PropIon";

export function TestSelectiveTracking() {

    const $active = ion(false, {
        toggle() {
            $active.as(!$active())
        }
    })

    const $ready = ion(true, {
        toggle() {
            $ready.as(!$ready())
        }
    })

    const $count = ion(0, {
        increment() {
            $count.as($count() + 1)
        }
    })

    const $doubleCount = ion(() => $count() * 2)

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
        $frogName.as(event.target.value)
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
                <button on:click={$count.increment}>increment</button>
                <button on:click={$active.toggle}>toggle active</button>
                <button on:click={$ready.toggle}>toggle ready</button>
                <input value={$frogName}></input>
            </>
    )
}
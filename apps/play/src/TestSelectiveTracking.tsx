import { component } from "@rue/lumo";
import { DerivedIon, ion, ionic, ionize, isIon, watch, watchEffect } from "@rue/quarky";

export function TestSelectiveTracking() {

    const $active = ion(false, {
        toggle() {
            $active.value = !$active()
        }
    })

    const $ready = ion(true, {
        toggle() {
            $ready.value = !$ready()
        }
    })

    const $count = ion(0, {
        increment() {
            $count.value = $count() + 1
        }
    })

    const $doubleCount = ion(() =>$count() * 2)

    const $frog = ionize({
        name: 'kermit'
    }, {
        changeName(name: string) {
            $frog.name = name
        }
    })

    const $ = true as const;

    watchEffect((tracker) => {
        if ($active()) {
            tracker.stop()
            console.log($count())
            console.log('active')
         }
         else if ($ready()) {
           tracker.stop()
            console.log($count())
            console.log('ready')
        }
        else {
            console.log('neither')
        }
    })

    function reInputChange(event: InputEvent) {
        // $frog.changeName(event.target?.value)
        $frogName.value = event.target.value
        // console.log($frog.name)
    }

    const $frogName = asPion($frog, 'name')

    watch($frogName, (name) => {
        console.log('frog name changed', name)
    })

    return component(
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
import { Component, NodeRef, watch } from "@rue/lumo"
import { ionize, } from "@rue/quarky"
import { asPropIon } from "../../../packages/quarky/src/ionize/PropIon"

export function TestCleanupScheduler() {
    const $stopButton = NodeRef('button')
    const $frog = ionize({
        name: 'kermit'
    }, {
        setName(name: string) {
            $frog.name = name
        }
    })



    // })

    const $frogName = asPropIon($frog, 'name')

    function reInputChange(event: InputEvent) {
        $frog.setName((event.target as HTMLInputElement).value)
    }

    function initWatcher(){
        watch($frog, () => {
            console.log('frog changed name', $frog.name)
        }, { until: [$stopButton()!, 'click'] })
    }


    return Component(
        () =>
            <>
                <p>{$frogName}</p>
                <input oninput={reInputChange}></input>
                <button ref={$stopButton}>stop</button>
                <button onclick={initWatcher}>start</button>
            </>
    )
}



//@ts-nocheck
import { collectEffects, EffectFlask, getActiveFlask } from "@luent/flask";
import { flaskablePromise } from "../../../packages/flask/flaskablePromises";
import { watchEffect } from "@luent/quarky";
import { abort } from "process";
import { component, template } from "luent";

collectEffects(async () => {
    console.log(getActiveFlask())
    const promise = flaskablePromise(new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('resolved')
        }, 2000)
    }))

    console.log(promise);

    const awaitedResult = await promise.then((result) => {
        console.log("then result", result)
        console.log(getActiveFlask())
        return 'yay';
    }).then((result) => {
        console.log(getActiveFlask())
        console.log("next then", result)
        return result
    })


    console.log(getActiveFlask())
    console.log("awaitedResult", awaitedResult)
}, 'promise test')



/*
- provide
- provideIfNeeded

- provideFromRoot
- provideGround
- constAppState/Global
- letAppState/Global

- fromContext
- fromGround
- fromRoot

Dynamic node
- flask?
- context
- onCreated
- onDiscard
- onRemount
- beforeDetach

context.get()
context.getGlobal()
context.global.get()
context.app.get()
*/


const _this = $this()
const { onCreated, fromContext } = _this;

const dog = _this.fromGround(_dog_)

observe($list, async () => {

    await fetch()

    useDoor()
})

// what about preserve??, activate and unmount?
// derived ions
// cases: 
// - you want a observer or listener to outlive its context (not needed if initialized in handler or an effect)
// - listeners or watchers initialized in a handler or an effect


function reClick(_this: ThisComponent) {

    observe($frog, () => {

    }, { until: _this.onDiscard }) // manual cleanup //include info about preservation on _this.onDiscard
}
// what if I don't want to discard until parent is destroyed? Expose a stop function?


listen(document, 'click', () => {

    listen(button, 'click', reClick, {
        until: _this.onDiscard
    }) //manual clean up required
}) //auto clean up

// opt out of auto-cleanup
const observer = observe($list, () => {

}, { outlive: true })

// batch opt out
function useMouse(flask) {
    observe($list, () => {

    })



    return {
        discard() {
            flask.emitDiscard()
        }
    }
}

const mouse = collectEffects(useMouse, { outlive: true })

function SideBar(
    setup: {
        ['o--color']: string
    }
) {

    const { 'o--color': color } = setup

    watchEffect(async () => {

        const abort = AbortSignal()

        defineEffectCleanup(() => {
            abort()
        })
        const result = await fetch('', { until: abort })
    })


    return (

        <ProviderBlock> // dog is provided here...
            <ChildBlock dog={slot.fromContext(_dog_)}>hi</ChildBlock>
        </ProviderBlock>
    )
}




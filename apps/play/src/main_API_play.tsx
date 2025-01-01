//@ts-nocheck
import { collectEffects, EffectFlask, getFlask } from "@rue/flask";
import { flaskablePromise } from "../../../packages/flask/flaskablePromises";
import { watchEffect } from "@rue/quarky";
import { abort } from "process";
import { component } from "@rue/lumo";

collectEffects(async () => {
    console.log(getFlask())
    const promise = flaskablePromise(new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('resolved')
        }, 2000)
    }))

    console.log(promise);

    const awaitedResult = await promise.then((result) => {
        console.log("then result", result)
        console.log(getFlask())
        return 'yay';
    }).then((result) => {
        console.log(getFlask())
        console.log("next then", result)
        return result
    })


    console.log(getFlask())
    console.log("awaitedResult", awaitedResult)
}, 'promise test')



/*
- provide
- provideIfNeeded

- provideFromRoot
- provideGlobal
- constAppState/Global
- letAppState/Global

- fromContext
- fromGlobal
- fromApp

Dynamic node
- flask?
- context
- onCreated
- onDestroy
- onReactivate
- onDeactivate

context.get()
context.getGlobal()
context.global.get()
context.app.get()
*/


const _this = $this()
const { onCreated, fromContext } = _this;

const dog = _this.fromGlobal(_dog_)

watch($list, async () => {

    await fetch()

    useDoor()
})

// what about preserve??, activate and deactivate?
// derived ions
// cases: 
// - you want a watcher or listener to outlive its context (not needed if initialized in handler or an effect)
// - listeners or watchers initialized in a handler or an effect


function reClick(_this: ThisComponent) {

    watch($frog, () => {

    }, { until: _this.onDestroy }) // manual cleanup //include info about preservation on _this.onDestroy
}
// what if I don't want to destroy until parent is destroyed? Expose a stop function?


listen(document, 'click', () => {

    listen(button, 'click', reClick, {
        until: _this.onDestroy
    }) //manual clean up required
}) //auto clean up

// opt out of auto-cleanup
const watcher = watch($list, () => {

}, { outlive: true })

// batch opt out
function useMouse(flask) {
    watch($list, () => {

    })



    return {
        destroy() {
            flask.dispose()
        }
    }
}

const mouse = collectEffects(useMouse, { outlive: true })

function SideBar(
    setup: {
        ['$--color']: string
    }
) {

    const { '$--color': color } = setup

    watchEffect(async () => {

        const abort = AbortSignal()

        defineEffectCleanup(() => {
            abort()
        })
        const result = await fetch('', { until: abort })
    })


    return component(
        <ProviderBlock> // dog is provided here...
            <ChildBlock dog={slot.fromContext(_dog_)}>hi</ChildBlock>
        </ProviderBlock>
    )
}




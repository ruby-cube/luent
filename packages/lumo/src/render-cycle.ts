import { Flask, getActiveFlask, getFlask } from "@rue/flask"
import { createEffectCycleHook, watch as _watch, useReactivitySystem, createEffectCycleScheduler, Effect, createOneoff, Ion, $currentCycle, setUpAnimationCycleManager, $currentCycleManager, } from "@rue/quarky"
import { createAwaitableHook } from "@rue/utils"
import { asWatchSubject, IonSubject, isQuarkyIon } from "../../quarky/src/watch/WatchSubject"
import { createWatchedDerivation } from "../../quarky/src/ionic/WatchedDerivation"

export const {
   SYNC,
   PRERENDER,
   INTERNAL_RENDER,
   RENDER,
   INTERNAL_POSTRENDER
} = useReactivitySystem()

setUpAnimationCycleManager()

export const POSTRENDER = 'postrender'


// export const onPrerender = createEffectCycleHook(PRERENDER)
// export const onInternalRender = createEffectCycleHook(INTERNAL_RENDER)
// export const onRender = createEffectCycleHook(RENDER)
// export const onPostrender = createEffectCycleHook(INTERNAL_POSTRENDER)


export const atPrerender = createEffectCycleScheduler(PRERENDER)


export function queueInternalRender(fn: () => void, flask: Flask) { //TODO: needs to be able to be cancelled if action is cancelled
   const effect = createOneoff(fn, INTERNAL_RENDER)
   $currentCycleManager().current.scheduleEffect(effect)
   flask.onDiscard(() => effect.destroy())
}

// export const queueInternalRender = (fn: Function) => {
//    console.log('running internal render'),
//    fn()
// }


// export const queueInternalRender = createEffectCycleScheduler(INTERNAL_RENDER)
export const atRender = createEffectCycleScheduler(RENDER)
export const atPostrender = createEffectCycleScheduler(INTERNAL_POSTRENDER)


//QUESTION: Not sure how this will interact with microtasks, especially with onRender being a microtask
export const $postevent = createAwaitableHook(atPrerender)
export const $internalrender = createAwaitableHook((fn: () => void) => queueInternalRender(fn, getFlask()))
export const $renderphase = createAwaitableHook(atRender)
export const $postrender = createAwaitableHook(atPostrender)
// export const $endofrendercycle = createAwaitableHook(onRenderCycleEnd)

//NOTE: there may be multiple effect cycles per event
// queueEffect (onPrerender)
// afterEffects 
// 


// export function afterEffects<T extends (() => void) | undefined = undefined>(task?: T): T extends () => void ? void : Promise<void> {
//    if (task) {
//       onEventCycleEnd(task)
//       return undefined as T extends () => void ? void : Promise<void>
//    }
//    return effectsComplete() as T extends () => void ? void : Promise<void>
// }



// watch($active, async () => {
//    const { width } = measureWidth()

//    await $render()
//    column.width = width;

//    await $postlude()
//    updateDatabase()

// })

// watch($active, () => {
//    const { width } = measureWidth()

//    onRender(() => {
//       column.width = width;
//    })

//    onPostlude(() => {
//       updateDatabase()
//    })
// })




// // await is good if you need to share state and 
// watch($active)
//    .beforeRender(() => {

//       const { width } = measureWidth()

//       await onRender()

//       column.width = width;

//       if (!something) return;

//       await afterRender()

//       updateDatabase()
//    })

// watch(() => {
//    if (!$active()) return;

//    const { width } = measureWidth()

//    await renderphase()
//    column.width = width;

//    if (!something) return;

//    await postlude()
//    updateDatabase()
// })

// watch($active, async () => {
//    await postlude()
//    doSomething()
// })



// watch($active, async () => {
//    const { width } = measureWidth()

//    watch($count, async () => {
//       await postlude({ cancel: onAbort })
//       column.width = width;
//    })
// }) //TODO: { sync: true } with batched as default, no phases. Phases will be the responsibility of the ui framework

// watch($active).beforeRender(() => {
//    const { width } = measureWidth()

//    await watch($count).afterRender()

//    column.width = width;
// })






/**
 * Optimized barebones ion-only watch function. links effect to atoms and flask. No async context used.
 * @param ion 
 * @param render 
 * @param eager 
 * @returns 
 */
export function watchForRender(ion: Ion, render: (previous: unknown) => void, flask: Flask, eager: boolean = false) {
   const subject = new IonSubject(isQuarkyIon(ion) ? ion : createWatchedDerivation(ion, true))

   let prevState = subject.trackedCall()

   if (subject.inert) return;

   const effect = new Effect(() => {
      const newState = subject.trackedCall()
      render(prevState)
      prevState = newState;
   }, PRERENDER)

   subject.linkEffect(effect, eager)

   flask.onDiscard(/* listener.stop */() => effect.destroy());
   flask.onDemount(/* listener.pause */() => effect.unlink());
   flask.onRemount(/* listener.resume */() => subject.linkEffect(effect, true));
}


export const RUN_EAGERLY = true;









// const $todoID = ion('kldk')
// const $data = ion()

// ionicTask(async w => {
//    await postlude()

//    if (w($active)) {

//    }
//    else {

//    }

//    const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${w($todoID)}`)
//    $data.state = await response.json()
// })






// export const [
//    SYNC,
//    PRELUDE,
//    RENDER,
//    POSTLUDE,
//    COMPLETION
// ] = useReactivity([ //(default to queueTask for all phases)
//    definePhase('PRELUDE', (runPhase: VoidFunction) => queueMicrotask(() => queueMicrotask(runPhase))), // allows devs room to use queueMicrotask 
//    definePhase('RENDER', requestAnimationFrame),
//    definePhase('POSTLUDE', queueMicrotask)
// ])



// const PRELUDE = 'PRELUDE'
// const RENDER = 'RENDER'
// const POSTLUDE = 'POSTLUDE'



// watch($count, async () => {
//    await $render_phase();

//    await $prelude(); // this would schedule to the next event's prelude? which may or may not be before or after the next render (depending on )
// })

// // TODO:
// // default phase: post-event
// // must use sync: true for sync

// watch($dog, async ({ state }) => {
//    const width = catEl.width + state

//    await $renderphase();
//    petsEl.width = width;

//    await $postrender();
//    petsEl.focus()
// })

// ionicTask((w, initial) => {

// }, { phase: RENDER })

// //TODO: figure out updating ui vs updating database, e.g. animating drag, then posting final position to db

// function reMouseDown() {
//    listen('mousemove', e => {
//       doAction(UPDATE_POSITION, [e.clientX, e.clientY])
//    })

//    listen('mouseup', () => {
//       doAction(UPDATE_POSITION, [e.clientX, e.clientY])
//       const success = await dispatch(POST_POSITION, { x, y })
//       if (!success)
//          doAction(UPDATE_POSITION, [prevX, prevY])
//    })
// }

// watch($dog, async ({ state }) => {
//    const width = catEl.width + state

//    await $updatephase('db');
//    petsEl.width = width;

//    await $postupdate();
//    petsEl.focus()

//    await $updatecomplete();

// })

// watch($dog, async ({ state }) => {
//    const width = catEl.width + state

//    await $updatephase('db');
//    petsEl.width = width;

//    await $postupdate();
//    petsEl.focus()
// })

// const INSERT_TEXT = defineAction({
//    do(action) {
//       return (document, word, index) => {
//          action.snapshot(document, DEEP);
//          return document.insertText(word, index)
//       }
//    },
//    catch(err, action) {
//       action.rollback()
//    }
// })





// function reKeydown() {
//    const output = doAction(INSERT_TEXT, [2])
// }

// const INSERT_TEXT = defineAction({
//    name: 'insert-text',
//    do(action, document, word, index) {
//       action.snapshot(document, DEEP);
//       return document.insertText(word, index)
//    },
//    catch(err, action) {
//       action.rollback()
//    }
// })
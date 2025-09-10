import { Flask, getFlask } from "@rue/flask"
import { IonSubject, watch as _watch, configureUpdateCycle, useUpdateCycleScheduler, Effect, createOneoff, Ion, $activeUpdate, scheduleEagerEffect, getCurrentPhase, postcycleTask, } from "@rue/quarky"
import { createAwaitableHook } from "@rue/utils"
import { __DEV__getTrace, getInternalTrace, traceAsyncPath } from "../../flask/debug"

export const {
   SYNC,
   PRERENDER,
   INTERNAL_RENDER,
   RENDER,
   INTERNAL_POSTRENDER,
   POSTCYCLE: POSTRENDER
} = configureUpdateCycle({
   phases: [
      { name: 'PRERENDER', scheduler: queueMicrotask, canLaze: true },
      { name: 'INTERNAL_RENDER', scheduler: queueMicrotask },
      { name: 'RENDER', scheduler: queueMicrotask },
      { name: 'INTERNAL_POSTRENDER', scheduler: queueMicrotask }
   ],
   defaultPhase: 'POSTCYCLE'
})






// export const onPrerender = createEffectCycleHook(PRERENDER)
// export const onInternalRender = createEffectCycleHook(INTERNAL_RENDER)
// export const onRender = createEffectCycleHook(RENDER)
// export const onPostrender = createEffectCycleHook(INTERNAL_POSTRENDER)


export const queuePrerenderTask = useUpdateCycleScheduler(PRERENDER)


export function queueInternalRender(fn: () => void, flask: Flask) { //TODO: needs to be able to be cancelled if action is cancelled
   if (getCurrentPhase() === INTERNAL_RENDER) {
      fn()
      return;
   }
      fn.__DEVName = 'queueInternalRender'
      fn.__DEVTrace = getInternalTrace('internal render')
   const effect = createOneoff(fn, INTERNAL_RENDER)
   $activeUpdate().cycle.scheduleEffect(effect)
   flask.onDiscard(() => effect.destroy())
}

// export const queueInternalRender = (fn: Function) => {
//    console.log('running internal render'),
//    fn()
// }


// export const queueInternalRender = useUpdateCycleScheduler(INTERNAL_RENDER)
export const queueRenderTask = useUpdateCycleScheduler(RENDER)
export const queueInternalPostrenderTask = useUpdateCycleScheduler(INTERNAL_POSTRENDER)
export const queuePostrenderTask = (task: ()=>void)=>{
   queueInternalPostrenderTask(postcycleTask(task))
}


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
export function watchToRender<T>(ion: Ion<T>, render: (state: { current: T, previous: T }) => void, flask: Flask, eager: boolean = false) {
   const subject = new IonSubject(ion)

   let prevState = subject.trackedCall()

   if (subject.inert) {
      return;
   }

   let stale = false;
   let paused = false;

   const effect = new Effect(() => {
      if (paused) {
         stale = true;
         return;
      }
      stale = false;
      _render()
   }, PRERENDER)

   function _render() {
      const newState = subject.trackedCall()
      render({ current: newState, previous: prevState })
      prevState = newState;
   }

   if (eager) {
      scheduleEagerEffect(_render, PRERENDER)
   }

   subject.linkEffect(effect)

   flask.onDiscard(/* listener.stop */() => {
      effect.destroy()
   });
   flask.onDemount(/* listener.pause */() => {
      paused = true;
      effect.unlinkAtoms()
   });
   flask.onRemount(/* listener.resume */() => {
      paused = false;
      if (stale) {
         effect.run?.()
      }
      subject.linkEffect(effect)
   });
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
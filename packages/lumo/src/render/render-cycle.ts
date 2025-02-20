//@ts-nocheck
import { $_run_with_, SchedulerOptions } from "@rue/flask"
import { $effectCycle, createEffectCycleHook, definePhase, onEffectCycleComplete, PHASE_ONE, queueTask, setDefaultPhase, useReactivity, watch } from "@rue/quarky"


export const [
   SYNC,
   PRELUDE,
   RENDER,
   POSTLUDE,
   COMPLETION
] = useReactivity([ //(default to queueTask for all phases)
   definePhase('PRELUDE', queueTask),
   definePhase('RENDER', requestAnimationFrame),
   definePhase('POSTLUDE', queueTask)
])

export const onPrelude = createEffectCycleHook(PRELUDE)
export const onRender = createEffectCycleHook(RENDER)
export const onPostlude = createEffectCycleHook(POSTLUDE)
export const onCompletion = onEffectCycleComplete




// watch($active, () => {
//    const { width } = measureWidth()

//    await renderPhase()
//    column.width = width;

//    await postludePhase()
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

//    await renderPhase()
//    column.width = width;

//    if (!something) return;

//    await postludePhase()
//    updateDatabase()
// })

// watch($active, async () => {
//    await postludePhase()
//    doSomething()
// })



// watch($active, async () => {
//    const { width } = measureWidth()

//    watch($count, async () => {
//       await postludePhase({ cancel: onAbort })
//       column.width = width;
//    })
// }) //TODO: { sync: true } with batched as default, no phases. Phases will be the responsibility of the ui framework

// watch($active).beforeRender(() => {
//    const { width } = measureWidth()

//    await watch($count).afterRender()

//    column.width = width;
// })





type Task = () => void

let _renderPhase: Promise | undefined;

let _postludePhase: Promise | undefined;

export function renderPhase() {
   if (!_renderPhase) {
      onCompletion(() => {
         _renderPhase = undefined
      })
   }
   return _renderPhase ?? (_renderPhase = new Promise(onRender))
}

export function postludePhase() {
   console.log('postludePhase')
   if (!_postludePhase) {
      onCompletion(() => {
         _postludePhase = undefined
      })
   }
   return _postludePhase ?? (_postludePhase = new Promise((resolve)=>onPostlude(()=>(console.log('resolving'), resolve()))))
}




// initial event
// onPrelude
// onRender
// onPostlude

// function watch(options?: { sync?: boolean }) {
//    options.phase = options?.sync ? SYNC : $effectCycle().currentPhase || PHASE_ONE
// }

// const $todoID = ion('kldk')
// const $data = ion()

// ionicTask(async w => {
//    await postludePhase()

//    if (w($active)) {

//    }
//    else {

//    }

//    const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${w($todoID)}`)
//    $data.state = await response.json()
// })
import { ResumableListener } from "@rue/flask"
import { $effectCycle, createEffectCycleHook, definePhase, onEffectCycleComplete, PHASE_ONE, queueTask, setDefaultPhase, useReactivity, watch as _watch, WatchSubjects, Effect } from "@rue/quarky"


export const [
   SYNC,
   PRELUDE,
   RENDER,
   POSTLUDE,
   COMPLETION
] = useReactivity([ //(default to queueTask for all phases)
   definePhase('PRELUDE', (runPhase: VoidFunction) => queueMicrotask(() => queueMicrotask(runPhase))), // allows devs room to use queueMicrotask 
   definePhase('RENDER', requestAnimationFrame),
   definePhase('POSTLUDE', queueMicrotask)
])

export const onPrelude = createEffectCycleHook(PRELUDE)
export const onRender = createEffectCycleHook(RENDER)
export const onPostlude = createEffectCycleHook(POSTLUDE)
export const onCompletion = onEffectCycleComplete




// watch($active, () => {
//    const { width } = measureWidth()

//    await renderphase()
//    column.width = width;

//    await postlude()
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





type Task = () => void
type RenderCyclePhases = {
   prelude: Promise<void> | undefined;
   render: Promise<void> | undefined;
   postlude: Promise<void> | undefined;
}

const renderCyclePhases: RenderCyclePhases = {
   prelude: undefined,
   render: undefined,
   postlude: undefined,
}

function createRenderCyclePhase(
   phases: RenderCyclePhases,
   phase: keyof RenderCyclePhases,
   hook: (resolve: (...args: any[]) => any) => any
) {
   return function cyclePhase() {
      if (!phases[phase]) {
         onCompletion(() => {
            phases[phase] = undefined
         })
      }
      return phases[phase] ?? (phases[phase] = new Promise(hook))
   }
}

export const prelude = createRenderCyclePhase(renderCyclePhases, 'prelude', onPrelude)
export const renderphase = createRenderCyclePhase(renderCyclePhases, 'render', onRender)
export const postlude = createRenderCyclePhase(renderCyclePhases, 'postlude', onPostlude)





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
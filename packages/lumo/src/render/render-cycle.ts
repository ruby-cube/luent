import { createEffectCycleHook, queueTask } from "@rue/quarky"


export const [
   SYNC,
   BEFORE_RENDER,
   RENDER,
   AFTER_RENDER,
   onRenderComplete
] = configureEffectCycle([ //(default to queueTask for all phases)
   definePhase('BEFORE_RENDER', queueTask),
   definePhase('RENDER', beforeRepaint),
   definePhase('AFTER_RENDER', queueTask)
])


function beforeRepaint(cb: () => void) {
   const id = requestAnimationFrame(cb)
   return {
      cancel: () => cancelAnimationFrame(id)
   }
}


export const beforeRender = createEffectCycleHook(BEFORE_RENDER)
export const onRender = createEffectCycleHook(RENDER)
export const afterRender = createEffectCycleHook(AFTER_RENDER)


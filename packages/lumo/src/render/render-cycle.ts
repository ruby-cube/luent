import { createEffectCycleHook, definePhase, onEffectCycleComplete, queueTask, setUpEffectCycle } from "@rue/quarky"


export const [
   SYNC,
   BEFORE_RENDER,
   RENDER,
   AFTER_RENDER,
   RENDER_CYCLE_COMPLETE
] = setUpEffectCycle([ //(default to queueTask for all phases)
   definePhase('BEFORE_RENDER', queueTask),
   definePhase('RENDER', requestAnimationFrame),
   definePhase('AFTER_RENDER', queueTask)
])

export const beforeRender = createEffectCycleHook(BEFORE_RENDER)
export const onRender = createEffectCycleHook(RENDER)
export const afterRender = createEffectCycleHook(AFTER_RENDER)
export const onRenderComplete = onEffectCycleComplete


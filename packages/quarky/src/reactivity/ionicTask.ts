import { $listen, SustainedListenerOptions } from "@rue/flask";
import { getPhase, scheduleEagerEffect, WatchDebugOptions } from "./Watcher";
import { Glass } from "@rue/types";
import { Effect } from "./EffectQueue";
import { FunctionalSubstance } from "./Substance";
import { Phase, POSTLUDE, PRELUDE, RENDER, TICK } from "./RenderCycle";


type _IonicTaskOptions = {
   phase?: Phase;
   sync?: boolean;
   retrack?: boolean; // defaults to true
} & Glass<SustainedListenerOptions & WatchDebugOptions>

type IonicTask = (initial: boolean) => void

function _queueIonicTask(task: IonicTask, options?: _IonicTaskOptions) {

   const retrack = options?.retrack === undefined ? true : options.retrack
   const phase = getPhase(options)

   let initial = true;

   const wrappedEffect = () => {
      try {
         task(initial)
      }
      finally {
         initial = false;
      }
   }

   const subject = new FunctionalSubstance(wrappedEffect, retrack)


   // TODO: options.preserve means non-pausable watcher
   // const preserve = options?.preserve


   return $listen(wrappedEffect, options || {}, {
      enroll(_task) {
         const effect = new Effect(_task, phase)
         scheduleEagerEffect(() => {
            subject.trackedCall()
            subject.linkEffect(effect)
         }, phase)
         return effect;
      },
      remove(effect: Effect) {
         effect.destroy()
      }
   });
}

type IonicTaskOptions = {[K in keyof _IonicTaskOptions as K extends 'phase' ? never: K]: _IonicTaskOptions[K]}


export function queueIonicPrelude(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, {...options ?? {}, phase: PRELUDE })
}

export function queueIonicRender(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: RENDER })
}

export function queueIonicPostlude(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: POSTLUDE })
}

export function queueIonicTask(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: TICK })
}


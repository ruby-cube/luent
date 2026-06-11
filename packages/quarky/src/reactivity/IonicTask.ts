import { $listen, SustainedListenerOptions } from "@rue/flask";
import { getPhase, scheduleEagerEffect, WatchDebugOptions } from "./Watcher";
import { Glass } from "@rue/types";
import { Effect } from "./Effect";
import { FunctionSubject } from "./Subject";
import { Traceable } from "../debug/Traceable";
import { LAYOUT, Phase, PRELUDE, RENDER, SYNC, TICK } from "./RenderCycle";


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

   const subject = new FunctionSubject(wrappedEffect, retrack)
   subject.asTraceable = new Traceable('ionic task:' + options?.devName) // TODO: add phase details


   // TODO: options.preserve means non-pausable watcher
   // const preserve = options?.preserve


   return $listen(() => subject.trackedCall(), options || {}, {
      enroll(_task) {
         const effect = new Effect(_task, phase)
         scheduleEagerEffect(() => {
            _task()
            subject.linkEffect(effect)
         }, phase)
         return effect;
      },
      remove(effect: Effect) {
         effect.destroy()
      }
   });
}

type IonicTaskOptions = { [K in keyof _IonicTaskOptions as K extends 'phase' ? never : K]: _IonicTaskOptions[K] }


function queueIonicPrelude(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: PRELUDE })
}

function runIonicTask(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: SYNC })
}

function queueIonicRender(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: RENDER })
}

function queueIonicLayout(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: LAYOUT })
}

// export function queueIonicPostlude(task: IonicTask, options?: IonicTaskOptions) {
//    return _queueIonicTask(task, { ...options ?? {}, phase: POSTLUDE })
// }

export function trackEffect(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: TICK })
}

trackEffect.atPrelude = queueIonicPrelude
trackEffect.atRender = queueIonicRender
trackEffect.atLayout = queueIonicLayout
trackEffect.sync = runIonicTask

import { $listen, SustainedListenerOptions } from "@luent/flask";
import { getPhase, scheduleEagerReaction, WatchDebugOptions } from "./Watcher";
import { Glass } from "@luent/types";
import { Reaction } from "./Reaction";
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

   const wrappedReaction = () => {
      try {
         task(initial)
      }
      finally {
         initial = false;
      }
   }

   const subject = new FunctionSubject(wrappedReaction, retrack)
   subject.asTraceable = new Traceable('ionic task:' + options?.devName) // TODO: add phase details


   // TODO: options.preserve means non-pausable watcher
   // const preserve = options?.preserve


   return $listen(() => subject.trackedCall(), options || {}, {
      enroll(_task) {
         const reaction = new Reaction(_task, phase)
         scheduleEagerReaction(() => {
            _task()
            subject.linkReaction(reaction)
         }, phase)
         return reaction;
      },
      remove(reaction: Reaction) {
         reaction.destroy()
      }
   });
}

type IonicTaskOptions = { [K in keyof _IonicTaskOptions as K extends 'phase' ? never : K]: _IonicTaskOptions[K] }


export function ionicPrelude(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: PRELUDE })
}

export function runIonicTask(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: SYNC })
}

export function ionicRender(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: RENDER })
}

export function ionicLayout(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: LAYOUT })
}

// export function queueIonicPostlude(task: IonicTask, options?: IonicTaskOptions) {
//    return _queueIonicTask(task, { ...options ?? {}, phase: POSTLUDE })
// }

export function ionicTick(task: IonicTask, options?: IonicTaskOptions) {
   return _queueIonicTask(task, { ...options ?? {}, phase: TICK })
}


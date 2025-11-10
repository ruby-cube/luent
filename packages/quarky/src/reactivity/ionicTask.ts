import { $listen, SustainedListenerOptions } from "@rue/flask";
import { getPhase, scheduleEagerEffect, WatchDebugOptions } from "./watch";
import { Glass } from "@rue/types";
import { Effect } from "./EffectQueue";
import { FunctionalSubstance } from "./Substance";
import { Phase } from "./EffectCycle";


type IonicTaskOptions = {
   phase?: Phase;
   sync?: boolean;
   retrack?: boolean; // defaults to true
} & Glass<SustainedListenerOptions & WatchDebugOptions>

type IonicTask = (initial: boolean) => void

export function queueIonicTask(task: IonicTask, options?: IonicTaskOptions) {

   const retrack = options?.retrack === undefined ? true : options.retrack

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

   let phase = getPhase(options)

   // wrappedEffect = maybePostcycleTask(wrappedEffect, phase)

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


// export function setUpIonicTask(
//    subject: WatchedSubstance,
//    task: Task,
//    options: EffectOptions,
// ) {

// }



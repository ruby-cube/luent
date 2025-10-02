import { $listen, SustainedListenerOptions } from "@rue/flask";
import {  getPhase, scheduleEagerEffect, WatchDebugOptions } from "./watch";
import { Glass } from "@rue/types";
import { IonicTask } from "../ionic/x_IonicEffect";
import { IonicTaskSubject } from "./WatchSubject";
import { maybePostcycleTask, Phase, SYNC } from "./UpdateCycle";
import { createOneoff, Effect } from "./EffectQueue";



//  wrappedEffect = phase === 'postrender' ? delayedTask(wrappedEffect) : wrappedEffect;
//    phase = phase === 'postrender' ? 3 : phase;

         // scheduleEagerEffect(delayedTask(() => {
         //    subject.trackedCall()
         //    subject.linkEffect(effect)
         // }), phase)


type IonicTaskOptions = {
   phase?: Phase;
   sync?: boolean;
   retrack?: boolean; // defaults to true
} & Glass<SustainedListenerOptions & WatchDebugOptions>

export function queueIonicTask(task: IonicTask, options?: IonicTaskOptions) {

   const retrack = options?.retrack === undefined ? true : options.retrack

   let initial = true;

   let wrappedEffect = () => {
      try {
         task(initial)
      }
      finally {
         initial = false;
      }
   }

   const subject = new IonicTaskSubject(wrappedEffect, retrack)

   let phase = getPhase(options)

   wrappedEffect = maybePostcycleTask(wrappedEffect, phase)

   // TODO: options.preserve means non-pausable watcher
   // const preserve = options?.preserve


   return $listen(wrappedEffect, options || {}, {
      enroll(_task) {
         const effect = new Effect(_task, phase)
         scheduleEagerEffect(() => {
            maybePostcycleTask(() => subject.trackedCall(), phase)()
            subject.linkEffect(effect)
         }, phase)
         return effect;
      },
      remove(effect: Effect) {
         effect.destroy()
      }
   });
}

type Task = () => void

// export function setUpIonicTask(
//    subject: WatchSubject,
//    task: Task,
//    options: EffectOptions,
// ) {

// }





import { $listen, SustainedListenerOptions } from "@rue/flask";
import {  getPhase, scheduleEagerEffect, WatchDebugOptions } from "./watch";
import { Glass } from "@rue/types";
import { IonicTask } from "../ionic/x_IonicEffect";
import { IonicTaskSubject } from "./WatchSubject";
import { maybePostcycleTask, Phase, SYNC } from "./UpdateCycle";
import { createOneoff, Effect } from "./EffectQueue";

type IonicTaskOptions = {
   phase?: Phase;
   sync?: boolean;
   retrack?: boolean; // defaults to true
} & Glass<SustainedListenerOptions & WatchDebugOptions>

export function initIonicTask(task: IonicTask, options?: IonicTaskOptions) {
   console.log('init task')

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
            maybePostcycleTask(() => subject.trackedCall, phase)()
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





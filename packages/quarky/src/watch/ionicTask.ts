import { $listen, SustainedListenerOptions } from "@rue/flask";
import { delayedTask, EffectOptions, getPhase, scheduleEagerEffect, WatchDebugOptions } from "./watch";
import { Glass } from "@rue/types";
import {  IonicTask } from "../ionic/x_IonicEffect";
import { IonicTaskSubject } from "./WatchSubject";
import { Phase, SYNC } from "../effect-cycle/EffectCycle";
import { createOneoff, Effect } from "../effect-cycle/EffectQueue";

type IonicTaskOptions = {
   phase?: Phase;
   sync?: boolean;
   retrack?: boolean; // defaults to true
} & Glass<SustainedListenerOptions & WatchDebugOptions>

export function ionicTask(task: IonicTask, options?: IonicTaskOptions) {

   const retrack = options?.retrack === undefined ? true : options.retrack

   let initial = true;

   let wrappedEffect = () => {
      console.trace('running effect!!!!')
      try {
         task(initial)
      }
      finally {
         initial = false;
      }
   }

   
   const subject = new IonicTaskSubject(wrappedEffect, retrack)

   let phase = getPhase(options)

   wrappedEffect = phase === 'postrender' ? delayedTask(wrappedEffect) : wrappedEffect;
   phase = phase === 'postrender' ? 3 : phase;

   // TODO: options.preserve means non-pausable watcher
   // const preserve = options?.preserve


   return $listen(wrappedEffect, options || {}, {
      enroll(_task) {
         const effect = new Effect(_task, phase)
         scheduleEagerEffect(delayedTask(() => {
            subject.trackedCall()
            subject.linkEffect(effect)
         }), phase)
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





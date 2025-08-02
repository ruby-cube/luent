import { SustainedListenerOptions } from "@rue/flask";
import { EffectOptions, setUpWatcher, WatchDebugOptions } from "./watch";
import { Glass } from "@rue/types";
import { createIonicEffect, IonicTask } from "../ionic/x_IonicEffect";
import { IonicTaskSubject } from "./WatchSubject";
import { Phase } from "../effect-cycle/EffectCycle";

type IonicTaskOptions = {
   phase?: Phase;
   sync?: boolean;
   retrack?: boolean; // defaults to true
} & Glass<SustainedListenerOptions & WatchDebugOptions>

export function ionicTask(task: IonicTask, options?: IonicTaskOptions) {
   const opts = {
      ...options ?? {},
      eager: false // false because we manually call it via tracked call
   } as EffectOptions
   const retrack = opts.retrack === undefined ? true : opts.retrack

   let initial = true;

   function wrappedEffect() {
      try {
         task(initial)
      }
      finally {
         initial = false;
      }
   }

   const watchSubject = new IonicTaskSubject(wrappedEffect, retrack)

   watchSubject.trackedCall()

   return setUpWatcher(
      watchSubject,
      wrappedEffect,
      opts,
   )
}

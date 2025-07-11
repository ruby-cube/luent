import { SustainedListenerOptions } from "@rue/flask";
import { EffectOptions, setUpWatcher, WatchDebugOptions } from "./watch";
import { Glass } from "@rue/types";
import { createIonicEffect, IonicTask } from "../ionic/IonicEffect";
import { IonicTaskSubject } from "./WatchSubject";

type IonicTaskOptions = {
   phase?: string;
   sync?: boolean;
   retrack?: boolean; // defaults to true
} & Glass<SustainedListenerOptions & WatchDebugOptions>

export function ionicTask(task: IonicTask, options?: IonicTaskOptions) {
   const opts = {
      ...options ?? {},
      eager: true
   } as EffectOptions
   const retrack = opts.retrack === undefined ? true : opts.retrack

   const wrappedEffect = createIonicEffect(task, retrack)

   const watchSubject = new IonicTaskSubject(wrappedEffect, retrack)

   return setUpWatcher(
      watchSubject,
      wrappedEffect,
      opts,
   )
}

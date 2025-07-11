import { SustainedListenerOptions, ThisFlask } from "@rue/flask";
import { EffectOptions, getPhase, setUpWatcher, WatchDebugOptions } from "./watch";
import { Glass } from "@rue/types";
import { createIonicEffect, IonicTask } from "../ionic/IonicEffect";

type IonicTaskOptions = {
   phase?: string;
   sync?: boolean;
   // cycle?: "current" | "next"; //QUESTION: How does this work?? Do we really need this?
   retrack?: boolean; // defaults to true
} & Glass<SustainedListenerOptions & WatchDebugOptions>

export function ionicTask(task: IonicTask, options?: IonicTaskOptions) {
   const opts = {
      ...options ?? {},
      eager: true
   } as EffectOptions
   const retrack = opts.retrack === undefined ? true : opts.retrack

   const wrappedEffect = createIonicEffect(task, retrack)

   return setUpWatcher(
      [wrappedEffect.asWatched], //FIX:
      wrappedEffect,
      opts,
   )
}

import { SustainedListenerOptions, ThisFlask } from "@rue/flask";
import { createIonicTask, IonicTask } from "../ionic/IonicTask";
import { EffectOptions, getPhase, setUpWatcher, WatchDebugOptions } from "./watch";
import { Glass } from "@rue/types";

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
   const phase = opts.phase = getPhase(options)

   const wrappedEffect = createIonicTask(task, retrack)

   return setUpWatcher(
      wrappedEffect.asWatched,
      wrappedEffect,
      phase,
      opts,
      wrappedEffect.asCompound
   )
}
import { SustainedListenerOptions, ThisFlask } from "@rue/flask";
import { createIonicTask, IonicTask } from "../ionic/IonicTask";
import { EffectOptions, getPhase, scheduleEffectEagerly, setUpWatcher, WatchDebugOptions } from "./watch";
import { Glass } from "@rue/types";

type IonicTaskOptions = {
   phase?: number;
   sync?: boolean;
   // cycle?: "current" | "next"; //QUESTION: How does this work?? Do we really need this?
   retrack?: boolean; // defaults to true
} & Glass<SustainedListenerOptions & WatchDebugOptions>

export function ionicTask(task: IonicTask, options?: IonicTaskOptions) {
   const _options = (options ?? {}) as EffectOptions
   const retrack = _options.retrack === undefined ? true : _options.retrack
   const phase = _options.phase = getPhase(options)

   const wrappedEffect = createIonicTask(task, retrack)

   scheduleEffectEagerly(wrappedEffect, phase);

   return setUpWatcher(
      wrappedEffect.asWatched,
      wrappedEffect,
      phase,
      _options,
      wrappedEffect.asCompound
   )
}
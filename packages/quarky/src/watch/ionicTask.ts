import {SustainedListenerOptions, ThisFlask } from "@rue/flask";
import { PHASE_ONE } from "../effect-cycle/EffectCycle";
import { createIonicTask, IonicTask } from "../ionic/IonicTask";
import { scheduleEffectEagerly, setUpWatcher, WatchDebugOptions } from "./watch";
import { Glass } from "@rue/types";

type IonicTaskOptions = {
   // cycle?: "current" | "next"; //QUESTION: How does this work?? Do we really need this?
   retrack?: boolean;
} & Glass<SustainedListenerOptions & WatchDebugOptions>

export function ionicTask(task: IonicTask, options?: IonicTaskOptions) {
   const retrack = options?.retrack ?? false;

   const wrappedEffect = createIonicTask(task, retrack)

   scheduleEffectEagerly(wrappedEffect, PHASE_ONE);

   return setUpWatcher(
      wrappedEffect.asWatched,
      wrappedEffect,
      PHASE_ONE,
      options || {},
      wrappedEffect.asCompound
   )
}
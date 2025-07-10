import { triggerEffects } from "../compound/Compound";
import { Watched } from "../watch/Watched";
import { detachedCall, IonicCompound, IonicCompoundMorph } from "./IonicCompound";

/**
 * NOTES: 
 * - Ionic effects don't need a dirty state because if they are called, it means they're dirty
 */

type IonicEffect = IonicCompoundMorph

export type IonicTask<S = unknown> = (initial: boolean) => S

export function createIonicEffect(task: IonicTask, retrack: boolean = true) {
   const compound: IonicCompound = new IonicCompound()

   let fn = initialize;
   let initial = true;
   let state: unknown;
   function effect() {
      try {
         return state = fn(initial)
      }
      finally {
         initial = false;
      }
   }

   function initialize(initial: boolean) {
      fn = runEffect
      return detachedCall(() => compound.trackedCall(() => task(initial)))
   }

   function runEffect(initial: boolean) {
      if (retrack) {
         return detachedCall(() => compound.retrackedCall(() => task(initial)))
      }
      else {
         return task(initial)
      }
   }

   effect.asCompound = compound;
   effect.asWatched = new Watched(effect as IonicEffect)

   return effect
}




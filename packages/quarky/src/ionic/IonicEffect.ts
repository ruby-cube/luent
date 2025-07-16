import { IonicCompound, IonicCompoundMorph } from "./IonicCompound";

/**
 * NOTES: 
 * - Ionic effects don't need a stale state because if they are called, it means they're stale
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
      return compound.trackedCall(() => task(initial))
   }

   function runEffect(initial: boolean) {
      if (retrack) {
         return compound.retrackedCall(() => task(initial))
      }
      else {
         return task(initial)
      }
   }

   effect.asCompound = compound;

   return effect
}




import { noop } from "@rue/utils";
import { triggerEffects } from "../compound/Compound";
import { Watched } from "../watch/Watched";
import { IonicCompound, IonicCompoundMorph } from "./IonicCompound";
import { StateChangeEvent } from "../watch/watch";



/**
 * NOTES: 
 * - Ionic effects don't need a dirty state because if they are called, it means they're dirty
 * - TODO: DEPRECATE once ionicTask is stable
 */

type IonicEffect = IonicCompoundMorph

export type IonicTask<S = unknown> = (initial: boolean) => S

export function createIonicEffect(task: IonicTask, retrack: boolean = true) {
   const compound: IonicCompound<IonicEffect> = new IonicCompound(effect)
   compound.trigger = trigger

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
   effect.asWatched = new Watched(effect as IonicEffect)
   effect.watch = noop as () => Watched;
   effect.unwatch = noop;

   return effect
}

function trigger(this: IonicCompound<IonicEffect>): void {
   triggerEffects(this)
}


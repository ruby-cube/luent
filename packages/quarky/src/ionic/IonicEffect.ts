import { noop } from "@rue/utils";
import { triggerEffects } from "../Compound/Compound";
import { Watched } from "../watch/Watched";
import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";

/**
 * NOTES: 
 * - Ionic effects don't need a dirty state because if they are called, it means they're dirty
 */

type IonicEffect = MaybeIonicCompound

export type IonicTask<S = unknown> = (prevState?: S) => S

export function createIonicEffect(task: IonicTask, retrack: boolean = true) {
   const compound: IonicCompound<IonicEffect> = new IonicCompound(effect)
   compound.trigger = trigger

   let fn = initialize;

   function effect() {
      return fn()
   }

   function initialize() {
      fn = runEffect
      compound.trackedCall(task)
   }

   function runEffect() {
      if (retrack) {
         compound.trackedCall(task)
      }
      else {
         task()
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


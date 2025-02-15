import { noop } from "@rue/utils";
import { triggerEffects } from "../compound/Compound";
import { Watched } from "../watch/Watched";
import { IonicCompound, IonicCompoundMorph } from "./IonicCompound";
import { ChangeEvent } from "../watch/watch";

/**
 * NOTES: 
 * - Ionic effects don't need a dirty state because if they are called, it means they're dirty
 */

type IonicEffect = IonicCompoundMorph

export type IonicTask<S = unknown> = (event: ChangeEvent<S>) => S

export function createIonicEffect(task: IonicTask, retrack: boolean = true) {
   const compound: IonicCompound<IonicEffect> = new IonicCompound(effect)
   compound.trigger = trigger

   let fn = initialize;

   let state: unknown;
   function effect() {
      state = fn(new ChangeEvent(state, state))
      return state;
   }

   function initialize(event: ChangeEvent) {
      fn = runEffect
      return compound.trackedCall(()=>task(event))
   }

   function runEffect(event: ChangeEvent) {
      if (retrack) {
         return compound.trackedCall(()=>task(event))
      }
      else {
         return task(event)
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


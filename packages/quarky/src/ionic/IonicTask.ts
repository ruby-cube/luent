import { debug, noop } from "@rue/utils";
import { triggerEffects } from "../compound/Compound";
import { Watched } from "../watch/Watched";
import { IonicCompound, IonicCompoundMorph } from "./IonicCompound";

/**
 * NOTES: 
 * - Ionic effects don't need a dirty state because if they are called, it means they're dirty
 */


type IonicFunction = () => unknown

export type IonicTask = (watch: (ionicFn: IonicFunction) => unknown, initial: boolean) => void | Promise<void>

export function createIonicTask(task: IonicTask, retrack: boolean = true) {
   const compound: IonicCompound<IonicCompoundMorph> = new IonicCompound(effect)
   compound.trigger = trigger

   let initial = true;
   let syncCall = false;

   function watch(fn: IonicFunction) {
      if (!syncCall){
         debug.warn('watch() must be called synchronously within ionic task')
         return fn();
      }
      if (!initial && !retrack) return fn()
      return compound.trackedCall(fn)
   }

   function effect() {
      if (retrack) compound.untrackParticles()
         syncCall = true;
      try{
         task(watch, initial)
      }
      finally{
         syncCall = false
         initial = false;
      }
   }

   effect.asCompound = compound;
   effect.asWatched = new Watched(effect as IonicCompoundMorph)
   effect.watch = noop as () => Watched;
   effect.unwatch = noop;

   return effect
}

function trigger(this: IonicCompound): void {
   triggerEffects(this)
}


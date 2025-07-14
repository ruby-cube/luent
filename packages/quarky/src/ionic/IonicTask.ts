import { debug, isFunction, noop } from "@rue/utils";
import { triggerEffects } from "../compound/Compound";
import { WatchedAtom } from "../watch/WatchedAtom";
import { IonicCompound, IonicCompoundMorph } from "./IonicCompound";

/**
 * NOTES: 
 * - Ionic effects don't need a dirty state because if they are called, it means they're dirty
 */


type IonicFunction = () => unknown

export type IonicTask = (watch: (ionicFn: IonicFunction | unknown) => unknown, initial: boolean) => void | Promise<void>

export function createIonicTask(task: IonicTask, retrack: boolean = true) {
   const compound: IonicCompound = new IonicCompound()

   let initial = true;
   let syncCall = false;

   function watch(fn: IonicFunction | unknown) {
      if (!isFunction(fn)) throw new Error('Compiler failed to transform watch argument')
      if (!syncCall) {
         debug.warn('watch() must be called synchronously within ionic task')
         return fn();
      }
      if (!initial && !retrack) return fn()
      return compound.trackedCall(fn as () => unknown)
   }

   function effect() {
      if (retrack) compound.untrackAtoms()
      syncCall = true;
      try {
         task(watch, initial)
      }
      finally {
         syncCall = false
         initial = false;
      }
   }

   effect.asCompound = compound;
   effect.asWatchedAtom = new WatchedAtom(effect as IonicCompoundMorph)

   return effect
}

function trigger(this: IonicCompound): void {
   triggerEffects(this)
}


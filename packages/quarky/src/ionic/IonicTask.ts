import { noop } from "@rue/utils";
import { triggerEffects } from "../compound/Compound";
import { Watched } from "../watch/Watched";
import { IonicCompound, IonicCompoundMorph } from "./IonicCompound";
import { $effectCycle, EffectCycle, onEffectCycleComplete } from "../effect-cycle/EffectCycle";

/**
 * NOTES: 
 * - Ionic effects don't need a dirty state because if they are called, it means they're dirty
 */


type IonicFunction = () => unknown

export type IonicTask = (watch: (ionicFn: IonicFunction) => unknown, initial: boolean) => void | Promise<void>

export function createIonicTask(task: IonicTask, retrack: boolean = true) {
   const compound: IonicCompound<IonicCompoundMorph> = new IonicCompound(effect)
   compound.trigger = trigger

   let initialized = false;
   let currentEffectCycle: EffectCycle | undefined

   function watch(fn: IonicFunction) {
      if ($effectCycle() !== currentEffectCycle)
         throw new Error("Ionic Task cannot watch beyond the effect cycle that it was originally called in")
      // NOTE: this means we cannot schedule for next cycle.. we need more research to know if this is a problem
      if (initialized && !retrack) return fn()
      return compound.trackedCall(fn)
   }

   function effect() {
      currentEffectCycle = $effectCycle()
      if (retrack) compound.untrackParticles()
      if (!initialized)
         onEffectCycleComplete(() => {
            initialized = true
            currentEffectCycle = undefined;
         })
      task(watch, !initialized)
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


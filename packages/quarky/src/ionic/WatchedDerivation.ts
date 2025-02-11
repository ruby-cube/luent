import { triggerEffects } from "../Compound/Compound";
import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";
import { QUARKS } from "../Quarks";
import { unwatch, watch, Watched } from "../watch/Watched";

/**
 * NOTES: 
 * - Watched derivations don't need a dirty state because if they are called, it means they're dirty
 */

export function createWatchedDerivation(derivation: () => any, retrack: boolean) {
   const quarks: MaybeIonicCompound = {
      asCompound: undefined,
      asWatched: undefined,
      watch,
      unwatch: () => unwatch.call(quarks)
   }
   const compound: IonicCompound = new IonicCompound(quarks)
   compound.trigger = () => triggerEffects(compound)

   quarks.asCompound = compound;
   quarks.asWatched = new Watched(quarks)

   let fn = retrack ? retrackedCall : initialize;
   function $watchedDerivedState() {
      return fn()
   }
   $watchedDerivedState[QUARKS] = quarks

   function initialize() {
      fn = derivation
      return compound.trackedCall(derivation)
   }

   function retrackedCall() {
      return compound.trackedCall(derivation)
   }
   return $watchedDerivedState;
}
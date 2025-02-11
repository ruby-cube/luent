import { triggerEffects } from "../Compound/Compound";
import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";
import { QUARK } from "../Quark";
import { unwatch, watch, Watched } from "../watch/Watched";

/**
 * NOTES: 
 * - Watched derivations don't need a dirty state because if they are called, it means they're dirty
 */

export function createWatchedDerivation(derivation: () => any, retrack: boolean) {
   const quark: MaybeIonicCompound = {
      asCompound: undefined,
      asWatched: undefined,
      watch,
      unwatch: () => unwatch.call(quark)
   }
   const compound: IonicCompound = new IonicCompound(quark)
   compound.trigger = () => triggerEffects(compound)

   quark.asCompound = compound;
   quark.asWatched = new Watched(quark)

   let fn = retrack ? retrackedCall : initialize;
   function $watchedDerivedState() {
      return fn()
   }
   $watchedDerivedState[QUARK] = quark

   function initialize() {
      fn = derivation
      return compound.trackedCall(derivation)
   }

   function retrackedCall() {
      return compound.trackedCall(derivation)
   }
   return $watchedDerivedState;
}
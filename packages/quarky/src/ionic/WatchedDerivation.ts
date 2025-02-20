import { triggerEffects } from "../compound/Compound";
import { IonicCompound, IonicCompoundMorph } from "./IonicCompound";
import { hasQuark, QUARK, quarkOf } from "../Quark";
import { unwatch, watch, Watched } from "../watch/Watched";

/**
 * NOTES: 
 * - Watched derivations don't need a dirty state because if they are called, it means they're dirty
 */

const WATCHED_DERIVATION = 'watched derivation'

export function isWatchedDerivation(value: unknown): value is WatchedDerivation {
   return hasQuark(value) && (<WatchedDerivation>quarkOf(value)).type === WATCHED_DERIVATION
}

type WatchedDerivation = { type: string } & IonicCompoundMorph

export function createWatchedDerivation(derivation: () => any, retrack: boolean) {
   const quark: WatchedDerivation = {
      type: WATCHED_DERIVATION,
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
      return compound.retrackedCall(derivation)
   }
   return $watchedDerivedState;
}
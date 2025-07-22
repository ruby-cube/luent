import { IonicCompound, IonicCompoundMorph } from "./IonicCompound";
import { hasQuark, Quark, QUARK, quarkOf } from "../Quark";
import { isLazyUpdate, queueUpdate } from "../effect-cycle/ReactivitySystem";
import { NULL } from "../ion/AtomicIon";

/**
 * NOTES: 
 * - WatchedAtom derivations don't need a stale state because if they are called, it means they're stale
 */

const WATCHED_DERIVATION = 'watched derivation'

export function isWatchedDerivation(value: unknown): value is WatchedDerivation {
   return hasQuark(value) && (<WatchedDerivation>quarkOf(value)).quarkType === WATCHED_DERIVATION
}

type WatchedDerivation = Quark<typeof WATCHED_DERIVATION> & IonicCompoundMorph & { 
   inert: boolean ,
   state: unknown,
   tState: unknown
}

export function createWatchedDerivation(derivation: () => any, retrack: boolean) {
   const quark: WatchedDerivation = {
      inert: false,
      quarkType: WATCHED_DERIVATION,
      asCompound: new IonicCompound(),
      entity: undefined,
      state: undefined,
      tState: NULL
   }

   const compound = quark.asCompound
   compound.entity = quark;

   let fn = retrack ? retrackedCall : initialize;
   function $watchedDerivedState() {
      return fn()
   }
   $watchedDerivedState[QUARK] = quark

   function initialize() {
      fn = derivation
      const value = compound.trackedCall(derivation)
      if (compound.atoms.size === 0) quark.inert = true;
      if (isLazyUpdate()){
         quark.tState = value;
         queueUpdate(()=>{
            quark.state = value;
            quark.tState = NULL;
         })
         return value;
      }
      quark.state = value;
      return value
   }

   function retrackedCall() {
      const value = compound.retrackedCall(derivation)
      if (isLazyUpdate()){
         quark.tState = value;
         queueUpdate(()=>{
            quark.state = value;
            quark.tState = NULL;
         })
         return value;
      }
      quark.state = value;
      return value;
   }
   return $watchedDerivedState;
}
import { IonicCompound, IonicCompoundMorph } from "./IonicCompound";
import { hasQuark, Quark, QUARK, quarkOf } from "../Quark";
import { $activeUpdate, isLazyUpdate } from "../reactivity/ReactiveSystem";
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
   inert: boolean,
   state: unknown,
   pState: unknown
}

export function createWatchedDerivation(derivation: () => any, retrack: boolean) {
   const quark: WatchedDerivation = {
      inert: false,
      quarkType: WATCHED_DERIVATION,
      asCompound: new IonicCompound(),
      entity: undefined,
      state: undefined,
      pState: NULL
   }

   const compound = quark.asCompound
   compound.entity = quark;

   let fn = initialize;
   function $watchedDerivedState() {
      console.log('create watched derivation')
      return fn()
   }
   $watchedDerivedState[QUARK] = quark

   function initialize() {
      console.log('initializing watched derivation')
      fn = retrack ? retrackedCall : derivation
      const value = compound.trackedCall(derivation)
      if (compound.atoms.length === 0) quark.inert = true;
      console.log('$$$ Watched derivation', compound.atoms)
      if (isLazyUpdate()) {
         quark.pState = value;
         const update = $activeUpdate()
         update.onComplete(() => {
            quark.state = value;
            quark.pState = NULL;
         })
         update.onCancel(() => {
            quark.pState = NULL;
         })
         return value;
      }
      quark.state = value;
      return value
   }

   function retrackedCall() {
      const value = compound.retrackedCall(derivation)
      if (isLazyUpdate()) {
         quark.pState = value;
         const update = $activeUpdate()
         update.onComplete(() => {
            quark.state = value;
            quark.pState = NULL;
         })
         update.onCancel(() => {
            quark.pState = NULL;
         })
         return value;
      }
      quark.state = value;
      return value;
   }
   return $watchedDerivedState;
}
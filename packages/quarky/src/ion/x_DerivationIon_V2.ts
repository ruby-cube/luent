import { IonicCompound, IonicCompoundMorph } from "../abstract/IonicCompound";
import { AnyObject } from "@rue/types";
import { Flask, getActiveFlask } from "@rue/flask";
import { quarkOf, QUARK, hasQuark, Quark } from "../abstract/Quark";
// import { attachCapsuleMethods, Capsule } from "../capsule/Capsule";
import { emitSignal } from "../debug/debug";
import { asTrackedAtom } from "../reactivity/Atom";
import { Ion } from "./Ion";
import { Traceable } from "../debug/Traceable";
import { Effect } from "../reactivity/EffectQueue";
import { SYNC, $activeUpdate, Mutation } from "../reactivity/Update";
import { track } from "../reactivity/Compound";
import { SimpleState } from "../reactivity/State";



/**
* Managed Derivation Ion
* - memoization **
* ---retracking
* - provide previous state to derivation
* - encapsulates with methods
* ---- manage dev traces through quarky capsule **
**/

// /** INTERNAL */
export type $DerivedState = Ion & {
   [QUARK]: {
      inert: boolean
      state: SimpleState
      staleState: SimpleState
      derivation: (prev?: unknown) => unknown
      staleMarker: Effect | undefined
   }
   & Quark
}

class ManagedDerivation extends IonicCompound {
   inert: boolean = false
   state = new SimpleState(undefined as unknown)
   staleState = new SimpleState(false)
   staleMarker: Effect | undefined
   quarkType = DERIVATION_ION
   __DEV__asTraceable = new Traceable()

   constructor(
      public derivation: (prev?: unknown) => unknown,
      public entity: $DerivedState

   ) {
      super()
   }
}

/** 
 * INTERNAL 
 * */

export const DERIVATION_ION = Symbol('Derivation Ion')

export function isManagedDerivation(value: unknown): value is $DerivedState {
   return hasQuark(value) && quarkOf(<$DerivedState>value).quarkType === DERIVATION_ION
}

export function createManagedDerivation(
   derivation: (previousValue?: unknown) => unknown,
   methods?: AnyObject,
   retrack: boolean = true,
   quark?: ManagedDerivation,
) {
   const creationFlask = getActiveFlask()

   let fn = initialize
   const $derived = (() => fn()) as $DerivedState

   function initialize() {
      const compound = ion
      const value = compound.trackCall(derivation)
      const atoms = compound.atoms
      if (atoms.length === 0) {
         fn = getState
         ion.inert = true;
         // no reactivity, no memoization
         return value;
      }
      else {
         if (__DEV__) emitSignal();
         fn = getMemoizedState
         const update = $activeUpdate()
         ion.state.set(value, update)
         ion.staleState.set(false, update)
         assertValidCall() // prevents memory leaks caused by usng memoized ion outside of its creation scope
         const effect = ion.staleMarker = new Effect(() => {
            const update = $activeUpdate()
            const stale = ion.staleState
            if (stale.pendingUpdate && stale.pendingUpdate !== update) {
               // TODO: what about race conditions?? 
               // Ideally the triggering set will deal with the race condition so derivations don't have to
               console.warn('[DEV RESEARCH] race condition for derivation stale marker')
            }
            stale.set(true, update)
         }, SYNC)
         linkAtoms(compound, effect)
         creationFlask?.onDiscard(() => {
            effect.destroy()
            compound!.untrackAtoms()
            fn = initialize;
         })
         return value;
      }
   }

   function assertValidCall() {
      const flask = getActiveFlask()
      assertValidInitialization(flask, creationFlask) // prevents memory leaks caused by usng memoized ion outside of its creation scope
   }

   function getMemoizedState() {
      // TODO: not sure if I should assert initialization only or all calls
      assertValidCall()
      const stale = ion.staleState.get();
      if (!stale || !retrack) track(ion)

      const prevState = ion.state.get();

      const value =
         (retrack && stale) ? retrackedCall(ion)
            : stale ? derivation(prevState)
               : prevState;

      if (stale) {
         const update = $activeUpdate()
         const staleState = ion.staleState
         if (staleState.pendingUpdate && staleState.pendingUpdate !== update) {
            // TODO: what about race conditions??
            console.warn('[DEV RESEARCH] race condition for derivation stale marker')
         }
         ion.state.set(value, update)
         staleState.set(false, update)
      }

      return value;
   }

   function getState() {
      const state = ion.state
      const update = $activeUpdate()
      if (state.pendingUpdate && state.pendingUpdate !== update) {
         // TODO: what about race conditions??
         console.warn('[DEV RESEARCH] race condition for derivation stale marker')
      }
      return state.set(derivation(state.get()), update)
   }

   const ion: ManagedDerivation = quark ?? new ManagedDerivation(derivation, $derived) // TODO: if inert, no need for ManagedDerivation...

   // ion.asCompound.entity = ion;

   $derived[QUARK] = ion
   // $derived.labelName = undefined
   // $derived.__DEV__label = __DEV__label


   // if (methods) {
   //    attachCapsuleMethods('MemoizedDerivationIon', $derived, methods)
   // }

   return $derived;
}

function retrackedCall(ion: ManagedDerivation) {
   const { derivation, staleMarker } = ion
   const compound = ion
   staleMarker!.unlinkAtoms()
   const value = compound.retrackCall(() => derivation(ion.state))
   linkAtoms(compound, staleMarker!)
   return value;
}

function linkAtoms(compound: IonicCompound, effect: Effect) {
   compound.forEachAtom(atom => {
      effect.link(asTrackedAtom(atom))
   })
}

// function unlinkAtoms(compound: IonicCompound, effect: Effect) {
//    const atoms = compound.atoms;
//    for (const atom of atoms) {
//       effect.destroy()
//    }
// }


// function trigger(this: IonicCompound<>): void {
//    this.quark.stale = true;
//    this.quark.asParticle?.triggerCompounds()
//    triggerEffects(this)
// }

/* Not sure if this is correct. 
Memory leaks occur when an object is referenced outside of its creation scope in a way that does not reassign it with the new version of the object, ie collecting it in an array, map, or set.
*/
function assertValidInitialization(initializationFlask: Flask | undefined, creationFlask: Flask | undefined) {
   if (true) return;
   // TODO:
   // if (!creationFlask) return;
   // if (!initializationFlask) {
   //    if (creationFlask.creationScopeID === "0") // both are in global creation scope
   //       return;
   //    debug.warn("Memory leak alert A. A memoized ion cannot be called outside its creation scope.")
   //    return;
   // }
   // if (initializationFlask.creationScopeID === creationFlask.creationScopeID) return;
   // if (!flaskAContainsFlaskB(creationFlask, initializationFlask))
   //    debug.warn("Memory leak alert B. A memoized ion cannot be called outside its creation scope.")
}

function flaskAContainsFlaskB(flaskA: Flask, flaskB: Flask) {
   let outer = flaskB.outer
   do {
      if (outer?.creationScopeID === flaskA.creationScopeID)
         return true;
      outer = outer?.outer;
   }
   while (outer)
   return false;
}

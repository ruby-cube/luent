import { IonicCompound, IonicCompoundMorph, trackMemoized } from "./IonicCompound";
import { AnyObject } from "@rue/types";
import { Flask, getActiveFlask } from "@rue/flask";
import { quarkOf, QUARK, hasQuark, QuarkOf, Quark } from "../Quark";
import { attachCapsuleMethods, Capsule } from "../capsule/Capsule";
import { emitSignal } from "../debug/debug";
import { asWatchedAtom } from "../watch/WatchedAtom";
import { Ion } from "../ion/Ion";
import { Traceable } from "../debug/Traceable";
import { debug } from "@rue/utils";
import { Effect } from "../effect-cycle/EffectQueue";
import { SYNC } from "../effect-cycle/EffectCycle";



/**
* Managed Derivation Ion
* - memoization **
* ---retracking
* - provide previous state to derivation
* - encapsulates with methods
* ---- manage dev traces through quarky capsule **
**/

// /** INTERNAL */
export type $DerivedState = Ion & Capsule & {
   [QUARK]: {
      inert: boolean
      state: unknown
      dirty: boolean
      derivation: (prev?: unknown) => unknown
      markDirtyEffect: Effect | undefined
   }
   & Quark<typeof DERIVATION_ION, $DerivedState>
   & IonicCompoundMorph
}

/** 
 * INTERNAL 
 * */
export type ManagedDerivation = QuarkOf<$DerivedState>

export const DERIVATION_ION = Symbol('Derivation Ion')

export function isManagedDerivation(value: unknown): value is $DerivedState {
   return hasQuark(value) && quarkOf(<$DerivedState>value).quarkType === DERIVATION_ION
}

export function createMaybeMemoizedIon(
   derivation: (previousValue?: unknown) => unknown,
   methods?: AnyObject,
   retrack: boolean = true,
   quark?: ManagedDerivation,
) {
   const creationFlask = getActiveFlask()

   let fn = initialize
   const $derived = () => fn()

   function initialize() {
      const compound = ion.asCompound;
      const value = compound.trackedCall(derivation)
      const atoms = compound.atoms
      if (atoms.size === 0) {
         fn = getState
         ion.inert = true;
         // no reactivity, no memoization
         return value;
      }
      else {
         if (__DEV__) emitSignal();
         // getActiveTracker()?.track(ion)
         fn = getMemoizedState
         ion.state = value;
         assertValidCall() // prevents memory leaks caused by usng memoized ion outside of its creation scope
         const effect = ion.markDirtyEffect = new Effect(() => (ion.dirty = true))
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
      //TODO: not sure if I should assert initialization only or all calls
      assertValidCall()
      if (!ion.dirty || !retrack) trackMemoized(ion)

      const value =
         (retrack && ion.dirty) ? retrackedCall(ion)
            : ion.dirty ? derivation(ion.state)
               : ion.state;

      if (ion.dirty) {
         ion.state = value;
         ion.dirty = false;
      }
      return value;
   }

   function getState() {
      return ion.state = derivation(ion.state)
   }

   const ion: ManagedDerivation = quark ?? {
      inert: false,
      dirty: false,
      state: undefined,
      derivation,
      markDirtyEffect: undefined,
      entity: $derived,
      quarkType: DERIVATION_ION,
      asCompound: new IonicCompound(),
      asTraceable: new Traceable()

   }

   $derived[QUARK] = ion
   // $derived.labelName = undefined
   // $derived.__DEV__label = __DEV__label


   if (methods) {
      attachCapsuleMethods('MemoizedDerivationIon', $derived, methods)
   }

   return $derived;
}

function retrackedCall(ion: ManagedDerivation) {
   const { derivation, markDirtyEffect } = ion
   const compound = ion.asCompound
   markDirtyEffect!.remove()
   const value = compound.retrackedCall(() => derivation(ion.state))
   linkAtoms(compound, markDirtyEffect!)
   return value;
}

function linkAtoms(compound: IonicCompound, effect: Effect) {
   const atoms = compound.atoms;
   for (const atom of atoms) {
      asWatchedAtom(atom).link(effect, SYNC)
   }
}

// function unlinkAtoms(compound: IonicCompound, effect: Effect) {
//    const atoms = compound.atoms;
//    for (const atom of atoms) {
//       effect.destroy()
//    }
// }


// function trigger(this: IonicCompound<>): void {
//    this.quark.dirty = true;
//    this.quark.asParticle?.triggerCompounds()
//    triggerEffects(this)
// }

/* Not sure if this is correct. 
Memory leaks occur when an object is referenced outside of its creation scope in a way that does not reassign it with the new version of the object, ie collecting it in an array, map, or set.
*/
function assertValidInitialization(initializationFlask: Flask | undefined, creationFlask: Flask | undefined) {
   if (!creationFlask) return;
   if (!initializationFlask) {
      if (creationFlask.creationScopeID === "0") // both are in global creation scope
         return;
      debug.warn("Memory leak alert A. A memoized ion cannot be called outside its creation scope.")
      return;
   }
   if (initializationFlask.creationScopeID === creationFlask.creationScopeID) return;
   if (!flaskAContainsFlaskB(creationFlask, initializationFlask))
      debug.warn("Memory leak alert B. A memoized ion cannot be called outside its creation scope.")
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

import { Effect } from "../reactivity/EffectQueue";
import { FunctionalSubstance, IonSubject } from "../reactivity/Substance";
import { SimpleState } from "../reactivity/State";
import { hasQuark, QUARK, quarkOf } from "../abstract/Quark";
import { AnyObject } from "@rue/types";
import { Traceable } from "../debug/Traceable";
import { SYNC } from "../reactivity/EffectCycle";


// function createMemoizedDerivationIon(derive: (prev: unknown) => unknown) {
//    let initialized = false;

//    const substance = new FunctionalSubstance(() => {
//       if (initialized) {
//          return $derivedState()
//       }
//       else {
//          initialized = true;
//          return derive(undefined)
//       }
//    }, true) // TODO: do not watch output, remove Ion()

//    const isStale = new SimpleState(false)
//    const state = new SimpleState(substance.trackedCall())

//    function $derivedState(): unknown {
//       if (isStale.get()) {
//          const update = state.lock()
//          if (!update) return derive(substance.trackedCall())
//          state.set(derive(substance.trackedCall()))
//          isStale.set(false);
//       }
//       return state.get()
//    }
//    $derivedState['~ion'] = true as const

//    substance.linkEffect(new Effect(() => { // TODO: need to cancel if update is canceled
//       isStale.set(true);
//    }, SYNC))

//    return $derivedState
// }

class DerivationIon {
   __DEV__asTraceable = new Traceable()
   quarkType = DERIVATION_ION

   constructor(
      private substance: FunctionalSubstance
   ) { }

   get inert() {
      return !this.substance.reactive
   }
}

export const DERIVATION_ION = Symbol('Derivation Ion')

export function isManagedDerivation(value: unknown): value is $DerivedState {
   return hasQuark(value) && quarkOf(<$DerivedState>value).quarkType === DERIVATION_ION
}

export function createMemoizedDerivation(
   derive: (prev?: unknown) => unknown,
   methods?: AnyObject, // TODO:
   retrack: boolean = true,
) {
   const isStale = new SimpleState(true)
   const state = new SimpleState(undefined)

   const substance = new FunctionalSubstance(() => {
      return derive(state.get())
   }, retrack)

   function $derivedState() {
      if (isStale.get()) {
         const value = state.set(substance.trackedCall())
         if (substance.reactive) isStale.set(false)
         return value
      }
      return state.get();
   }

   $derivedState['~ion'] = true as const;
   $derivedState[QUARK] = new DerivationIon(substance)

   substance.linkEffect(new Effect(() => { // TODO: need to cancel if update is canceled
      isStale.set(true);
   }, SYNC))

   return $derivedState
}

// function createMemo(derive: (prev: unknown) => unknown) {
//    let isStale = false;
//    let state: unknown;
//    let get = initialize

//    function initialize() {
//       get = getValue
//       return state = derive(undefined)
//    }

//    function getValue() {
//       if (isStale) {
//          isStale = false
//          return state = derive(state)
//       }
//       return state;
//    }

//    function $derivation() {
//       return get()
//    }

//    return $derivation
// }
import { Effect } from "../reactivity/EffectQueue";
import { FunctionalSubstance, IonSubstance } from "../reactivity/Substance";
import { SimpleState } from "../reactivity/State";
import { hasQuark, QUARK, quarkOf } from "../abstract/Quark";
import { AnyObject } from "@rue/types";
import { Traceable } from "../debug/Traceable";
import { SYNC } from "../reactivity/RenderCycle";
import { getActiveUpdate } from "../reactivity/Update";
import { track } from "../reactivity/Compound";


class DerivationIonQuark {
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

export function isManagedDerivation(value: unknown) {
   return hasQuark(value) && quarkOf(value).quarkType === DERIVATION_ION
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

   let trackCall = () => {
      // initial call
      const value = trackedCall()
      substance.linkEffect(new Effect(() => { // TODO: need to cancel if update is canceled
         isStale.set(true);
      }, SYNC))
      // subsequent calls
      trackCall = trackedCall 
      return value
   }

   function trackedCall() {
      const value = state.set(substance.trackedCall())
      if (substance.reactive) isStale.set(false)
      return value
   }

   function $derivedState() {
      track(substance)
      if (isStale.get()) {
         return trackCall()
      }
      return state.get();
   }


   $derivedState['~ion'] = true as const;
   $derivedState[QUARK] = new DerivationIonQuark(substance)

   return $derivedState
}

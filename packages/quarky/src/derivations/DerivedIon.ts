import { isAtomicIon, AtomicIon, attachIonMethods } from "../ion/AtomicIon";
import { IonicDerivation } from "./IonicDerivation";
import { META } from "../ReactiveEntity";
import { __devCheckIfTracked, getActiveTracker } from "./DependencyTracker";
import { AnyObject } from "@rue/types";
import { ProtectedIon } from "../ion/ReinedIon";
import { AnyIon, Ion, IonMethods, isIon } from "../ion/Ion";
import { DerivedNeutron } from "../ion/Neutron";
import { getActiveFlask } from "@rue/flask";
import { Traceable } from "../debug";

// The $ function has various purposes
// - it marks a function as a reactive getter so that it can be distinguished from normal functions
// - it tracks the value of a derived signal and memoizes if needed
// - visually groups an arrow function getter and visually marks reactivity
// Signals created from $ function are not necessarily derived. They may be simple reactive getters, but for simplicity of code, they are all called derived signals and given derived signal props
// Note that siganl with only one dependency could still be a derived signal.


export const DERIVED_ION = Symbol('DerivedIon')

export type DerivedIon<T = any> = {
   (): T
   [META]: MetaDerivedIon
   untrack: () => void
}



export type ReactiveGet<T = any> = ((_?: any) => T) | DerivedIon<T> | AtomicIon<T>;

export function isDerivedIon(maybeDerivedIon: any): maybeDerivedIon is DerivedIon {
   return maybeDerivedIon?.[META]?.type === DERIVED_ION;
}




export class MetaDerivedIon extends IonicDerivation {

   override type = DERIVED_ION
   asDefaultReined?: ProtectedIon
   asReadonly?: ProtectedIon
   __DEV__asTraceable?: Traceable;

   constructor(
      override readonly o: DerivedIon,
      retrack: boolean,
      public hasMethods: boolean = false,
      public inert: boolean = false
   ) {
      super(o, DERIVED_ION, retrack);
      if (__DEV__) this.__DEV__asTraceable = new Traceable()
   }

   value: any;

   updateValue(value: any) {
      this.value = value;
   }
}


export function createDerivedIon<T extends any>(
   pureGetter: (previousValue?: T) => T,
   methods?: AnyObject,
   retrack: boolean = true,
   inert: boolean = false
): DerivedIon<T> | DerivedNeutron<T> {
   const derived = new MetaDerivedIon(<DerivedIon>$derivedIon, retrack, !!methods, inert);

   if (inert) {
      //@ts-expect-error
      pureGetter[META]
         = derived

      if (methods) {
         for (const key in methods) {
            //@ts-expect-error
            pureGetter[key]
               = methods[key].bind(pureGetter)
         }
      }
      return pureGetter as DerivedNeutron;
   }

   function $derivedIon() {
      // const tracker = getActiveTracker()
      // if (tracker) {
      //    if (derived.dirty) {
      //       const newValue = pureGetter(derived.value);
      //       derived.forwardAtoms(derived.atoms) //NOTE: Added this mindlessly trying to get nested derivations to work
      //       derived.updateValue(newValue);
      //       if (!retrack) derived.undirty()
      //       return newValue;
      //    }
      //    derived.forwardAtoms(derived.atoms) //NOTE: Added this mindlessly trying to get nested derivations to work
      //    return derived.value;
      // }

      // if (!initialized || derived.dirty && retrack) {
      const initialized = !!derived.atoms;
      const value = !initialized ? derived.trackAtoms(pureGetter)
         : (derived.dirty && retrack) ? derived.trackAtoms(() => pureGetter(derived.value))
            : derived.dirty ? pureGetter(derived.value) : derived.value;

      derived.forwardAtoms(derived.atoms!)
      if (!initialized || derived.dirty)
         derived.updateValue(value)
      if (!retrack) derived.undirty()
      return value;
      // }

      // if (derived.dirty) {
      //    const newValue = pureGetter(derived.value);
      //    derived.forwardAtoms(derived.atoms)
      //    derived.updateValue(newValue)
      //    derived.undirty()
      //    return newValue;
      // }

      // derived.forwardAtoms(derived.atoms)
      // return derived.value; // memoized value
   }

   $derivedIon[META] = derived
   $derivedIon.untrack =   function untrack() {
      derived.untrackAtoms()
   }

   if (methods) {
      attachIonMethods('MemoizedDerivationIon', $derivedIon as Ion, methods)
   }

   const flask = getActiveFlask()
   if (flask) {
      flask.onDiscard(() => { //TODO: what about if a derived ion is created outside of a flask?? or if you want to bind the derived ion to an outer flask?
         derived.untrackAtoms()
      })
   }

   return <DerivedIon><unknown>$derivedIon;
}

export type WritableDerivedIon<T = any, M extends AnyObject = {}> = {
   (): T
   [META]: MetaDerivedIon;
   untrack: () => void;
} & M

export function createWritableDerivedIon<T, M>(pureGetter: () => T, methods: M & IonMethods, inert: boolean = false) {
   const writable = createDerivedIon(pureGetter, methods, inert);
   return writable;
}


export type ReactiveDerivedIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? WritableDerivedIon<T, M> : DerivedIon<T>

// export function DerivedIon<T, M>(derivation: () => T, methods?: M & { [key: string]: (...args: any[]) => any }): ReactiveDerivedIon<T, M> {
//     if (isIon(derivation)) throw new Error('INVALID INPUT: Ions cannot be made into ions')
//     if (methods) return createWritableDerivedIon(derivation, methods) as ReactiveDerivedIon<T, M>
//     return createDerivedIon(derivation) as ReactiveDerivedIon<T, M>
// }

export function isNamedDerivation(value: any) {
   return value instanceof Function && isIon(value)
}
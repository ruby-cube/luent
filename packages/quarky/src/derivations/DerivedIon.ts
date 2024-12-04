import { isAtomicIon, AtomicIon, attachIonMethods } from "../ion/AtomicIon";
import { IonicDerivation } from "./IonicDerivation";
import { META } from "../ReactiveEntity";
import { __devCheckIfTracked, getActiveTracker } from "./DependencyTracker";
import { AnyObject } from "@rue/types";
import { ProtectedIon } from "../ion/ProtectedIon";
import { AnyIon, isIon } from "../ion/Ion";
import { DerivedRef } from "../ion/Ref";
import { getDynamicNode } from "../../../lumo/src/dynamic/nodestack";

// The $ function has various purposes
// - it marks a function as a reactive getter so that it can be distinguished from normal functions
// - it tracks the value of a derived signal and memoizes if needed
// - visually groups an arrow function getter and visually marks reactivity
// Signals created from $ function are not necessarily derived. They may be simple reactive getters, but for simplicity of code, they are all called derived signals and given derived signal props
// Note that siganl with only one dependency could still be a derived signal.


export const DERIVED_ION = Symbol('DerivedIon')

export type DerivedIon<T = any> = {
   (selected?: true): T
   [META]: MetaDerivedIon
   untrack: () => void
}



export type ReactiveGet<T = any> = ((_?: any) => T) | DerivedIon<T> | AtomicIon<T>;

export function isDerivedIon(maybeDerivedIon: any): maybeDerivedIon is DerivedIon {
   return maybeDerivedIon?.[META]?.type === DERIVED_ION;
}




export class MetaDerivedIon extends IonicDerivation {

   override type = DERIVED_ION
   asProtected?: ProtectedIon
   asReadonly?: ProtectedIon

   constructor(
      override readonly o: DerivedIon,
      retrack: boolean,
      public hasMethods: boolean = false,
      public inert: boolean = false
   ) {
      super(o, DERIVED_ION, retrack);
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
): DerivedIon<T> | DerivedRef<T> {
   const derived = new MetaDerivedIon(<DerivedIon>$derivedIon, retrack, !!methods, inert);

   if (inert) {
      const proto = {
         [META]: derived
      } as AnyObject

      if (methods) {
         for (const key in methods) {
            proto[key] = methods[key].bind(proto)
         }
      }
      Object.setPrototypeOf(pureGetter, proto)

      return pureGetter as DerivedRef;
   }

   let initialized = false;

   function $derivedIon(selected?: boolean) {
      const tracker = getActiveTracker()
      if (tracker && tracker.selective && !selected) {
         if (derived.dirty) {
            const newValue = pureGetter(derived.value);
            derived.updateValue(newValue);
            if (!retrack) derived.undirty()
            return newValue;
         }
         return derived.value;
      }

      if (!initialized || derived.dirty && retrack) {
         const value = derived.trackAtoms(!initialized ? pureGetter : () => pureGetter(derived.value));
         derived.forwardAtoms(derived.atoms)
         derived.updateValue(value)
         derived.undirty()
         initialized = true;
         return value;
      }

      if (derived.dirty) {
         const newValue = pureGetter(derived.value);
         derived.forwardAtoms(derived.atoms)
         derived.updateValue(newValue)
         derived.undirty()
         return newValue;
      }

      derived.forwardAtoms(derived.atoms)

      return derived.value; // memoized value
   }

   const proto = {
      [META]: derived,
      untrack() {
         derived.untrackAtoms()
      }
   } as AnyObject

   if (methods) {
      attachIonMethods(proto, methods)
   }

   Object.setPrototypeOf($derivedIon, proto)
   const dynamicNode = getDynamicNode()
   if (dynamicNode) {
      dynamicNode.onDestroy(() => { //TODO: what about if a derived ion is created outside of a dynamic node??
         derived.untrackAtoms()
      })
   }

   return <DerivedIon><unknown>$derivedIon;
}

export type WritableDerivedIon<T = any, M extends AnyObject = {}> = {
   (selected?: true): T
   [META]: MetaDerivedIon;
   untrack: () => void;
} & M

export function createWritableDerivedIon<T, M>(pureGetter: () => T, methods: M & { [key: string]: (...args: any[]) => any }, inert: boolean = false) {
   const writable = createDerivedIon(pureGetter, methods, inert);
   return writable;
}


export type ReactiveDerivedIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? WritableDerivedIon<T, M> : DerivedIon<T>

// export function DerivedIon<T, M>(derivation: () => T, methods?: M & { [key: string]: (...args: any[]) => any }): ReactiveDerivedIon<T, M> {
//     if (isIon(derivation)) throw new Error('INVALID INPUT: Ions cannot be made into ions')
//     if (methods) return createWritableDerivedIon(derivation, methods) as ReactiveDerivedIon<T, M>
//     return createDerivedIon(derivation) as ReactiveDerivedIon<T, M>
// }


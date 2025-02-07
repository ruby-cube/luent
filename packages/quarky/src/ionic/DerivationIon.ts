import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";
import { __devCheckIfTracked } from "./x_DependencyTracker";
import { AnyObject } from "@rue/types";
import { AnyIon, Ion, IonMethods } from "../ion/Ion";
import { DerivedNeutron } from "../ion/Neutron";
import { getActiveFlask } from "@rue/flask";
import { quarksOf, QUARKS, Quarks, isQuarky } from "../QuarkyEntity";
import { __DEV__initTraceability, attachCapsuleMethods, Capsule, CapsuleQuarks } from "../capsule/Capsule";
import { Muon } from "../reactivity/reactivity-system";
import { MaybeIonicAtom } from "./IonicAtom";

/**
* Managed Derivation Ion
* - memoization **
* ---retracking
* - provide previous state to derivation
* - encapsulates with methods
* ---- manage dev traces through quarky capsule **
**/

// /** INTERNAL */
export type $MemoizedIon = Muon & Capsule & {
   [QUARKS]: MemoizedIon
}

/** 
 * INTERNAL 
 * */
export type MemoizedIon = {
}
   & Quarks<$MemoizedIon>
   & CapsuleQuarks
   & MaybeIonicAtom
   & MaybeIonicCompound

export const MEMOIZED_ION = Symbol('Memoized Ion')

export function isMemoizedIon(value: unknown): value is $MemoizedIon {
   return isQuarky(value) && quarksOf(value).type === MEMOIZED_ION
}



export class MemoizedCompound<T extends MemoizedIon = MemoizedIon> extends IonicCompound<MemoizedIon> {

   constructor(
      readonly compound: MemoizedIon
   ) {
      super(compound);
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
   memoize: boolean = false // change to memoize
): DerivedIon<T> | DerivedNeutron<T> {
   const derived = new DerivedIonQuarks(<DerivedIon>$derivedIon);

   if (!memoize) {
      //@ts-expect-error
      pureGetter[QUARKS]
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
      if (!retrack) derived.dirty = false;
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

   $derivedIon[QUARKS] = derived
   $derivedIon.untrack = function untrack() {
      derived.untrackAtoms()
   }

   __DEV__initTraceability(derived)

   if (methods) {
      attachCapsuleMethods('MemoizedDerivationIon', $derivedIon as Ion, methods)
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
   untrack: () => void;
} & M & QuarkyEntity<DerivedIonQuarks>

export function createWritableDerivedIon<T, M>(pureGetter: () => T, methods: M & IonMethods, inert: boolean = false) {
   const writable = createDerivedIon(pureGetter, methods, inert);
   return writable;
}


export type ReactiveDerivedIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? WritableDerivedIon<T, M> : DerivedIon<T>

// export function DerivedIon<T, M>(derivation: () => T, methods?: M & { [key: string]: (...args: any[]) => any }): ReactiveDerivedIon<T, M> {
//     if (isMuon(derivation)) throw new Error('INVALID INPUT: Ions cannot be made into ions')
//     if (methods) return createWritableDerivedIon(derivation, methods) as ReactiveDerivedIon<T, M>
//     return createDerivedIon(derivation) as ReactiveDerivedIon<T, M>
// }

export function isNamedDerivation(value: any) {
   return value instanceof Function && isMuon(value)
}
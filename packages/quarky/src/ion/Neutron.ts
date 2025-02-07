import { AnyObject } from "@rue/types";
import { createDerivationIon, createWritableDerivedIon, DerivedIon, DerivedIonQuarks, WritableDerivedIon } from "../ionic/DerivationIon";
import { AnyIon, isMuon } from "./Ion";
import { createPrimaryIon, AtomicIon, } from "./PrimaryIon";
import { isFunction } from "@rue/utils";
import { QUARKS } from "../QuarkyEntity";
import { Traceable } from "../debug/debug";

const INERT = true;

type _Neutron<T, M> = M extends { [key: string]: (...args: any[]) => any } ? AtomicIon<T, M> : AtomicIon<T>
export type Neutron<T, M = undefined> = M extends { [key: string]: (...args: any[]) => any } ? AtomicIon<T, M> : AtomicIon<T>

export function neutron<T, M>(value?: T & (() => unknown), methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : _DerivedNeutron<T, M>
export function neutron<T, M>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : _Neutron<T, M>
export function neutron<T, M>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : T extends () => unknown ? _DerivedNeutron<T, M> : _Neutron<T, M> {
   if (isMuon(value)) {
      if (__DEV__ && methods) console.warn(`Cannot make a ref from existing ion. Methods will not be attached`)
      return value as T extends AnyIon ? T : T extends () => unknown ? _DerivedNeutron<T, M> : _Neutron<T, M>
   }
   if (isFunction(value)) {
      if (methods) return createWritableDerivedIon(<() => unknown>value, methods, INERT) as T extends AnyIon ? T : T extends () => unknown ? _DerivedNeutron<T, M> : _Neutron<T, M>
      return createDerivationIon(<() => unknown>value, undefined, INERT) as T extends AnyIon ? T : T extends () => unknown ? _DerivedNeutron<T, M> : _Neutron<T, M>
   }
   return createPrimaryIon(value, methods, INERT) as T extends AnyIon ? T : T extends () => unknown ? _DerivedNeutron<T, M> : _Neutron<T, M>
}

export type WritableDerivedNeutron<T = any, M extends AnyObject = {}> = {
   (): T
   [QUARKS]: DerivedIonQuarks;
} & M

export type DerivedNeutron<T = any> = {
   (): T
   [QUARKS]: DerivedIonQuarks;
}

type _DerivedNeutron<T, M> = M extends { [key: string]: (...args: any[]) => any } ? WritableDerivedIon<T, M> : DerivedIon<T>

// export function DerivedNeutron<T, M, D>(derivation: D & (() => T), methods?: M & { [key: string]: (...args: any[]) => any }): D extends AnyIon ? D : _DerivedNeutron<T, M> {
//     if (isMuon(derivation)) return derivation as D extends AnyIon ? D : _DerivedNeutron<T, M>; //TODO: Error message?
//     if (methods) return createWritableDerivedIon(derivation, methods, INERT) as D extends AnyIon ? D : _DerivedNeutron<T, M>
//     return createDerivationIon(derivation, undefined, INERT) as D extends AnyIon ? D : _DerivedNeutron<T, M>
// }

 //TODO: I don't know how I should handle read-only, and traceability for neutrons. Should they have quarks?

/** INTERNAL */
export function createPrimaryNeutron(
   state: any,
   methods?: object,
   inert: boolean = false
) {
   const $ion = (inert ? () => state
      : () => getReactiveState(ion)) as $PrimaryIon


   let stateIsIonized = isIonizedModel(state)

   const ion: PrimaryIon = {
      state,
      stateIsIonized,
      entity: $ion,
      type: PRIMARY_ION,
      asIonicAtom: undefined,
      asWatchSubject: undefined
   }
   __DEV__initTraceability(ion)

   $ion[QUARKS] = ion
   $ion.__DEV__labelName = undefined
   $ion.__DEV__label = __DEV__label

   const capsuleName = 'PrimaryIon'

   Object.defineProperty($ion, 'state', {
      get() {
         return ion.state;
      },
      set: inert ? value => {
         __DEV__traceMethodCall(capsuleName, $ion, 'state')
         return state = shouldIonize(value, stateIsIonized) ? ionize(value) : value
      } : value => {
         __DEV__traceMethodCall(capsuleName, $ion, 'state')
         return setReactiveState(ion, ion.state, value);
      }
   })

   if (methods) {
      attachCapsuleMethods(capsuleName, $ion, methods)
   }

   return $ion
}
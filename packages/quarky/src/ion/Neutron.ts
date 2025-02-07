import { AnyObject } from "@rue/types";
import { createDerivedIon, createWritableDerivedIon, DerivedIon, DerivedIonQuarks, WritableDerivedIon } from "../ionic/DerivationIon";
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
      return createDerivedIon(<() => unknown>value, undefined, INERT) as T extends AnyIon ? T : T extends () => unknown ? _DerivedNeutron<T, M> : _Neutron<T, M>
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
//     return createDerivedIon(derivation, undefined, INERT) as D extends AnyIon ? D : _DerivedNeutron<T, M>
// }

export class NeutronQuarks<T = unknown> {

   asReined?: ProtectedIon
   asReadonly?: ProtectedIon
   __DEV__asTraceable?: Traceable;

   constructor(
      readonly o: AtomicIon<T>,
      public state: T,
      readonly stateIsIonized: boolean = false, //Is this important for neutron?
   ) {
      if (__DEV__) this.__DEV__asTraceable = new Traceable()
   }
}

export function createNeutron(value: any, methods?: AnyObject) {
   const metaIon = new AtomicIonQuarks(<AtomicIon>$ion, value, isIonizedModel(value))

   function $ion() {
      return metaIon.state;
   }

   $ion[QUARKS] = metaIon
   $ion.__DEV__labelName = undefined
   $ion.__DEV__label = __DEV__label

   Object.defineProperty($ion, 'state', {
      get() {
         return metaIon.value //TODO: not sure if this should allow tracking or not by calling $ion()
      },
      set(value: T) {
         setValue(metaIon, value, metaIon.value);
         __DEV__traceMethodCall('AtomicIon', $ion, 'state')
      }
   })

   if (methods) {
      attachCapsuleMethods('AtomicIon', $ion as Ion, methods)
   }

   return $ion
}
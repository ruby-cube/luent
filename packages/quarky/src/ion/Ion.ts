import { AnyObject } from "@rue/types";
import { createDerivationIon, createWritableDerivedIon, ReactiveDerivedIon, WritableDerivedIon } from "../ionic/DerivationCapsule";
import { asPropIon, isPropIon, PropIon } from "../ionized/PrimaryPion";
import { AtomicIon, createPrimaryIon, isAtomicIon } from "./PrimaryIon";
import { isFunction } from "@rue/utils";
import { QUARKS } from "../QuarkyEntity";
import { isMuon } from "../muon/Muon";

export type MaybeIon<T> = Ion<T> | T;

export type AnyIon<T = any> = ()=>T
// DerivedIon<T> | AtomicIon<T> | ProtectedIon<T> | WritableDerivedIon<T> | PropIon<T>





export type Ion<T = any, M extends AnyObject = {}> = (() => T)
   & {
      [QUARKS]: any
   } & M

type ReactiveIon<T, M> = M extends AnyObject ? AtomicIon<T, M> : AtomicIon<T>

export type IonMethods = { [key: PropertyKey]: (...args: any[]) => any }

// API
export function ion<T, M>(value?: T & (() => any), methods?: M & IonMethods): T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
export function ion<T, M>(value?: T, methods?: M & IonMethods): ReactiveIon<T, M>
export function ion<T, M>(value?: T, methods?: M & IonMethods): T extends AnyIon ? T : T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M> {
   if (isMuon(value)) {
      if (__DEV__ && methods) console.warn(`Cannot make an existing ion into an ion. Methods will not be attached`)
      return value as T extends AnyIon ? T : T extends (args?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
   }
   if (isFunction(value)) {
      if (methods)
         return createWritableDerivedIon(
            <(prev?: any) => unknown>value,
            methods
         ) as T extends AnyIon ? T : T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
      return createDerivationIon(<(prev?: any) => unknown>value) as T extends AnyIon ? T : T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
   }
   return createPrimaryIon(value, methods) as T extends AnyIon ? T : T extends (args?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
}

ion.of = asPropIon

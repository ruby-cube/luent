import { AnyObject } from "@rue/types";
import { createDerivedIon, createWritableDerivedIon, DerivedIon, isDerivedIon, ReactiveDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { asPropIon, isPropIon, PropIon } from "../ionize/PropIon";
import { AtomicIon, createAtomicIon, isAtomicIon } from "./AtomicIon";
import { ProtectedIon } from "./ReinedIon";
import { META } from "../ReactiveEntity";
import { isFunction } from "@rue/utils";

export type MaybeIon<T> = Ion<T> | T;

export type AnyIon<T = any> = DerivedIon<T> | AtomicIon<T> | ProtectedIon<T> | WritableDerivedIon<T> | PropIon<T>

export function isIon(maybeIon: any): maybeIon is AnyIon {
   return isFunction(maybeIon) && /^\$[a-z]/.test(maybeIon.name) && maybeIon.length === 0
   // if (isAtomicIon(maybeIon) || isDerivedIon(maybeIon) || isPropIon(maybeIon)) return true; //TODO: Add WritableIon
   // return false;
}



export type Ion<T = any, M extends AnyObject = {}> = (() => T)
   & {
      [META]: any
   } & M

type ReactiveIon<T, M> = M extends AnyObject ? AtomicIon<T, M> : AtomicIon<T>

export type IonMethods = { [key: PropertyKey]: (...args: any[]) => any }

// API
export function ion<T, M>(value?: T & (() => any), methods?: M & IonMethods): T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
export function ion<T, M>(value?: T, methods?: M & IonMethods): ReactiveIon<T, M>
export function ion<T, M>(value?: T, methods?: M & IonMethods): T extends AnyIon ? T : T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M> {
   if (isIon(value)) {
      if (__DEV__ && methods) console.warn(`Cannot make an existing ion into an ion. Methods will not be attached`)
      return value as T extends AnyIon ? T : T extends (args?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
   }
   if (isFunction(value)) {
      if (methods)
         return createWritableDerivedIon(
            <(prev?: any) => unknown>value,
            methods
         ) as T extends AnyIon ? T : T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
      return createDerivedIon(<(prev?: any) => unknown>value) as T extends AnyIon ? T : T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
   }
   return createAtomicIon(value, methods) as T extends AnyIon ? T : T extends (args?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
}

ion.of = asPropIon

import { isWritableIon, ProtectedIon, reinIon, READONLY, isReinedIon } from "./ion/ReinedIon";
import { Ionized, isIonizedModel } from "./ionize/ionize";
import { AnyObject } from "@rue/types";
import { composeExposedKeys, isReinedIonizedModel, REINED_META, reinIonizedModel } from "./ionize/ReinedIonizedModel";
import { Ion } from "./ion/Ion";
import { createReadonlyObject, isReadonlyObject, READONLY_TARGET } from "./readonly";
import { META } from "./ReactiveEntity";
import { isFunction, isObject } from "@rue/utils";


// export type ReadonlyIon<T = any> = {
//     (): T;
//     [READONLY_ION]: true
//     [META]: ReactiveEntity
// }

// export const READONLY_ION = Symbol('readonlySignal');
type RemoveArrayRepeats<T extends readonly any[]> = {
   [K in keyof T]: (
      T[number] extends { [P in keyof T]: P extends K ? never : T[P] }[number]
      ? '[INVALID INPUT] repeated property name'
      : T[K]
   )
}

type Reined<T, X extends any[] = never[]> = T extends Ionized<infer O, infer M> ? ReinedIonized<O, M, X>
   : T extends Ion<infer S, infer M> ? Ion<MaybeReined<S>, { [K in TupleToUnion<X>]: M[K] }>
   : T extends AnyObject ? ReinedObject<T, X>
   : T

type MaybeReined<T> = T extends { [META]: any } ? Reined<T> : T extends (...args: any[]) => any ? ReinedMethod<T> : T extends {} ? Reined<T> : T;

type TupleToUnion<T extends any[]> = T[number]

type ReinedObject<O, X extends any[]> =
   X extends never[] ? { readonly [K in keyof O]: MaybeReined<O[K]> }
   : IncludesProps<O, TupleToUnion<X>> extends true ? { readonly [K in keyof Pick<O, TupleToUnion<X>>]: MaybeReined<Pick<O, TupleToUnion<X>>[K]> }
   : {
      readonly [K in keyof O as O[K] extends (...args: any[]) => any ? never : K]: MaybeReined<O[K]>
   } & {
      readonly [K in TupleToUnion<X>]: MaybeReined<O[K]>
   }

type ReinedIonized<O extends AnyObject, M, X extends any[]> =
   X extends never[] ?
   // Default Reined (all props and all methods except prefixed with underscore)
   Ionized<{
      readonly [K in keyof O as K extends `_${string}` ? never : K]: MaybeReined<O[K]>;
   }, { readonly [K in keyof M as K extends `_${string}` ? never : K]: ReinedMethod<M[K]> }>
   : IncludesProps<O, TupleToUnion<X>> extends true ?
   // Reined with selected props & methods
   Ionized<{
      readonly [K in keyof O as K extends TupleToUnion<X> ? K : never]: MaybeReined<O[K]>
   }, {
         readonly [K in TupleToUnion<X> as K extends keyof M ? K : never]: ReinedMethod<M[K]>
      }>
   // Reined with all props and selected methods
   : Ionized<{
      readonly [K in keyof O as K extends TupleToUnion<X> ? K : O[K] extends (...args: any[]) => any ? never : K]: MaybeReined<O[K]>
   }, {
         readonly [K in TupleToUnion<X> as K extends keyof M ? K : never]: ReinedMethod<M[K]>
      }>

type ReinedMethod<M> = M extends (...args: infer P) => infer R ? (...args: ReinedParams<P>) => MaybeReined<R> : M

type ReinedParams<P extends any[]> = { [K in keyof P]: P[K] extends (...args: infer CBP) => infer R ? (...args: ReinedCBParams<CBP>) => R : P[K] }
type ReinedCBParams<P extends any[]> = { [K in keyof P]: P[K] extends Ionized<any> ? Reined<P[K]> : P[K] }


type Readonly<O extends AnyObject> = {
   readonly [K in keyof O as O[K] extends (...args: any[]) => any ? never : K]: O[K]
}

type IncludesProps<O, X extends keyof O | PropertyKey> = {
   [K in X]: K extends keyof O ? O[K] extends (...args: any[]) => any ? never : true : never
} extends { [key: string]: never } ? false : true;

export function rein<T, M extends (keyof T)[] | []>(entity: T, ...exposedKeys: M & RemoveArrayRepeats<M>): Reined<T, M> {
   //NOTE: Temporarily disabling rein
   // if (isWritableIon(entity)) {
   //    return reinIon(entity, exposedKeys) as Reined<T, M>
   // }
   // if (isIonizedModel(entity)) {
   //    return reinIonizedModel(entity, exposedKeys) as Reined<T, M>
   // }
   // if (isObject(entity))
   //    return reinObject(entity, exposedKeys) as Reined<T, M>
   // if (isFunction(entity))
   //    return entity as Reined<T, M>
   return entity as Reined<T, M>
}

function reinObject(entity: AnyObject, exposedKeys: PropertyKey[]) {
   if (exposedKeys.length)
      return createCustomReinedObject(entity, exposedKeys);
   if (isReadonlyObject(entity) || isReinedObject(entity))
      return entity;
   return createReinedObject(entity);
}

function createReinedObject(obj: AnyObject) {
   return new Proxy(obj, {
      get(target, key, receiver) {
         if (key === REINED_TARGET) return target;
         return Reflect.get(target, key, receiver);
      },
      set() {
         console.warn('Set operation failed. Object is readonly.')
         return false;
      }
   })
}

function createCustomReinedObject(obj: AnyObject, exposedKeys: PropertyKey[]) {
   const target = isReinedObject(obj) ? obj[REINED_TARGET] : isReadonlyObject(obj) ? obj[READONLY_TARGET] : obj
   const _exposedKeys = composeExposedKeys(exposedKeys, obj)

   if (!_exposedKeys)
      return obj; // readonly, no selected props

   const reinedMeta = {
      isExposedKey(key: PropertyKey) {
         return _exposedKeys.has(key)
      }
   }

   return new Proxy(target, {
      get(target, key, receiver) {
         if (key === REINED_TARGET) return target;
         if (key === REINED_META) return reinedMeta;
         if (_exposedKeys.has(key))
            return Reflect.get(target, key, receiver);
         return undefined;
      },
      set() {
         console.warn('Set operation failed. Object is readonly.')
         return false;
      }
   })
}

export const REINED_TARGET = Symbol('reined target')

export function isReinedObject(value: any) {
   return value instanceof Object && REINED_TARGET in value;
}

export function isReined(value: any) {
   return isReinedIon(value) || isReadonlyObject(value) || isReinedIonizedModel(value)
}
import { isWritableIon, ProtectedIon, reinIon, READONLY } from "./ion/ReinedIon";
import { Ionized, isIonizedModel } from "./ionize/ionize";
import { AnyObject } from "@rue/types";
import { reinIonizedModel } from "./ionize/ReinedIonizedModel";
import { Ion } from "./ion/Ion";
import { createReadonlyObject, isReadonlyObject, READONLY_TARGET } from "./readonly";


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

type Reined<T, X extends any[]> = T extends Ionized<infer O, infer M> ? ReinedIonized<O, M, X>
   : T extends Ion<infer S, infer M> ? ReinedIon<S, M, TupleToUnion<X>>
   : T extends AnyObject ? ReinedObject<T, TupleToUnion<X>>
   : T


type TupleToUnion<T extends any[]> = T[number]
type ReinedIon<S, M, X extends keyof Partial<M>> = Ion<S, { [K in X]: M[K] }>
type ReinedObject<O, X extends keyof Partial<O>> = Pick<O, X>
type ReinedIonized<O extends AnyObject, M, X extends any[]> =
   X extends never[] ? Ionized<{ // Default Reined
      readonly [K in keyof O as O[K] extends (...args: any[]) => any ? never : K]: O[K];
   }, { readonly [K in keyof M]: M[K] extends true ? K extends keyof O ? O[K] : never : M[K] }>
   : IncludesProps<O, TupleToUnion<X>> extends true ? Ionized<{
      readonly [K in keyof O as K extends TupleToUnion<X> ? O[K] extends (...args: any[]) => any ? never : K : O[K] extends (...args: any[]) => any ? never : never]: O[K]
   }, {
         readonly [K in TupleToUnion<X> as K extends keyof M ? K : never]: K extends keyof M ? M[K] extends true ? K extends keyof O ? O[K] : never : M[K] : never
      }>
   : Ionized<{
      readonly [K in keyof O as O[K] extends (...args: any[]) => any ? never : K]: O[K]
   }, {
         readonly [K in TupleToUnion<X> as K extends keyof M ? K : never]: K extends keyof M ? M[K] extends true ? K extends keyof O ? O[K] : never : M[K] : never
      }>



type Readonly<O extends AnyObject> = {
   readonly [K in keyof O as O[K] extends (...args: any[]) => any ? never : K]: O[K]
}

type IncludesProps<O, X extends keyof O | PropertyKey> = {
   [K in X]: K extends keyof O ? O[K] extends (...args: any[]) => any ? never : true : never
} extends { [key: string]: never } ? false : true;

export function rein<T, M extends (keyof T)[] | []>(entity: T, ...exposedKeys: M & RemoveArrayRepeats<M>): Reined<T, M> {
   if (isWritableIon(entity)) {
      return reinIon(entity, exposedKeys) as Reined<T, M>
   }
   if (isIonizedModel(entity)) {
      return reinIonizedModel(entity, exposedKeys) as Reined<T, M>
   }
   if (entity instanceof Function)
      return entity as Reined<T, M>
   if (entity instanceof Object)
      return reinObject(entity, exposedKeys) as Reined<T, M>
   return entity as Reined<T, M>
}

function reinObject(entity: AnyObject, exposedKeys: PropertyKey[]) {
   if (exposedKeys.length === 0)
      return createReadonlyObject(entity);
   return createReinedObject(entity, exposedKeys);
}

function createReinedObject(obj: AnyObject, exposedKeys: PropertyKey[]) {
   const target = isReinedObject(obj) ? obj[REINED_TARGET] : isReadonlyObject(obj) ? obj[READONLY_TARGET] : obj
   const _exposedKeys = new Set(exposedKeys)

   return new Proxy(target, {
      get(target, key, receiver) {
         if (key === REINED_TARGET) return target;
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
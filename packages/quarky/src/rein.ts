import { isWritableIon, ProtectedIon, protectIon, READONLY } from "./ion/ProtectedIon";
import { Ionized, isIonizedModel } from "./ionize/ionize";
import { AnyObject } from "@rue/types";
import { isProtectedIonicModel, isReadonlyIonicModel, protectIonicModel } from "./ionize/ProtectedIonicModel";
import { Ion } from "./ion/Ion";


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

type Reined<T, X extends any[]> = T extends Ionized<infer O, infer M> ? IsReadonly<X> extends true ? ReadonlyIonized<O> : ReinedIonized<O, M, TupleToUnion<X>>
   : T extends Ion<infer S, infer M> ? IsReadonly<X> extends true ? Ion<S> : ReinedIon<S, M, TupleToUnion<X>>
   : T extends AnyObject ? IsReadonly<X> extends true ? Readonly<T> : ReinedObject<T, TupleToUnion<X>>
   : T


type TupleToUnion<T extends any[]> = T[number]
type ReinedIon<S, M, X extends keyof Partial<M>> = Ion<S, { [K in X]: M[K] }>
type ReinedObject<O, X extends keyof Partial<O>> = Pick<O, X>
type ReinedIonized<O extends AnyObject, M, X extends keyof Partial<O & M>> =
   Ionized<Readonly<IncludesProps<O, X> extends true ? Pick<O, X> : O>, {
      [K in X as K extends keyof M ? K : never]: K extends keyof M ? M[K] : never
   }>

type ReadonlyIonized<T extends AnyObject> = Ionized<Readonly<T>>


type Readonly<O extends AnyObject> = {
   readonly [K in keyof O as O[K] extends (...args: any[]) => any ? never : K]: O[K]
}

type IncludesProps<O, X extends keyof O | PropertyKey> = {
   [K in X]: K extends keyof O ? O[K] extends (...args: any[]) => any ? never : true : never
} extends { [key: string]: never } ? false : true;


type IsReadonly<M> = M extends (typeof READONLY)[] ? true : false;


export function rein<T, M extends ((keyof T) | typeof READONLY)[]>(entity: T, ...methodKeys: M & RemoveArrayRepeats<M>): Reined<T, M> {
   if (entity instanceof Function || methodKeys.length === 0 && isProtectedIonicModel(entity) || isReadonlyIonicModel(entity))
      return entity as Reined<T, M>;
   if (isWritableIon(entity)) {
      return protectIon(entity, methodKeys) as Reined<T, M>
   }
   const _entity = toUnprotected(entity);
   if (isIonizedModel(_entity)) {
      return protectIonicModel(_entity, methodKeys) as Reined<T, M>
   }
   if (_entity instanceof Object) //TODO: 
      return (__DEV__ ? createReadonlyObject(_entity) : entity) as Reined<T, M>
   return entity as Reined<T, M>
}

function toUnprotected(entity: any) {
   if (isProtectedIonicModel(entity)) {
      return Object.getPrototypeOf(entity)
   }
   return entity;
}

export function readonly<T>(entity: T) {
   return rein(entity, READONLY)
}



function createReadonlyObject(obj: AnyObject) { //TODO: what about Arrays, Maps, and Sets?
   return new Proxy(obj, {
      get(target, key, receiver) {
         return Reflect.get(target, key, receiver);
      },
      set() {
         console.warn('Set operation failed. Object is readonly.')
         return false;
      }
   })
}


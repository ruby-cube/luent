import { isWritableIon, ProtectedIon, reinIon, READONLY } from "./ion/ReinedIon";
import { Ionized, isIonizedModel } from "./ionize/ionize";
import { AnyObject } from "@rue/types";
import { isReinedIonizedModel, isReadonlyIonizedModel, reinIonizedModel } from "./ionize/ReinedIonizedModel";
import { Ion } from "./ion/Ion";
import { createReadonlyObject } from "./readonly";


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

type Reined<T, X extends any[]> = T extends Ionized<infer O, infer M> ? ReinedIonized<O, M, TupleToUnion<X>>
   : T extends Ion<infer S, infer M> ?  ReinedIon<S, M, TupleToUnion<X>>
   : T extends AnyObject ? ReinedObject<T, TupleToUnion<X>>
   : T


type TupleToUnion<T extends any[]> = T[number]
type ReinedIon<S, M, X extends keyof Partial<M>> = Ion<S, { [K in X]: M[K] }>
type ReinedObject<O, X extends keyof Partial<O>> = Pick<O, X>
type ReinedIonized<O extends AnyObject, M, X extends keyof Partial<O & M>> =
   Ionized<Readonly<IncludesProps<O, X> extends true ? Pick<O, X> : O>, {
      [K in X as K extends keyof M ? K : never]: K extends keyof M ? M[K] : never
   }>

// type ReadonlyIonized<T extends AnyObject> = Ionized<Readonly<T>>


type Readonly<O extends AnyObject> = {
   readonly [K in keyof O as O[K] extends (...args: any[]) => any ? never : K]: O[K]
}

type IncludesProps<O, X extends keyof O | PropertyKey> = {
   [K in X]: K extends keyof O ? O[K] extends (...args: any[]) => any ? never : true : never
} extends { [key: string]: never } ? false : true;


// type IsReadonly<M> = M extends (typeof READONLY)[] ? true : false;


export function rein<T, M extends (keyof T)[]>(entity: T, ...methodKeys: M & RemoveArrayRepeats<M>): Reined<T, M> {
   //TODO: how to handle reined and readonly entities passed into rein
   if (entity instanceof Function || methodKeys.length === 0 && isReinedIonizedModel(entity) || isReadonlyIonizedModel(entity))
      return entity as Reined<T, M>;
   if (isWritableIon(entity)) {
      return reinIon(entity, methodKeys) as Reined<T, M>
   }
   if (isIonizedModel(entity)) {
      return reinIonizedModel(entity, methodKeys) as Reined<T, M>
   }
   if (entity instanceof Object) //TODO: 
      return (__DEV__ ? createReadonlyObject(entity) : entity) as Reined<T, M>
   return entity as Reined<T, M>
}

function toUnreined(entity: any) {
   if (isReinedIonizedModel(entity)) {
      return Object.getPrototypeOf(entity)
   }
   return entity;
}



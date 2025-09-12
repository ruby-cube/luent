
//NOTE: It may be tempting to abstract the TypeDefs into a TypeDef with Generics, but because typescript
// does not have higher order generics, this is not currently possible. Must manually type them all.

import { Ion, isIon, MutableIon } from "@rue/quarky";
// import { AsyncState } from "@rue/flask";

export type HandleEvent<E = {}> = keyof E extends never ? (() => void)|((event: E) => void) : (event: E) => void

export const MU_IONS = 'mu_ions'

export const MU = Symbol('mu')

// export const [getActiveMuIons, muIonsStack] = AsyncState<Set<Ion>>(MU_IONS)

export function assertMutableIon(value: unknown): asserts value is MutableIon<unknown> {
   if (!isIon(value) || !('state' in value)) throw new Error('[INVALID INPUT] attributes prefixed with mu: must receive a mutable ion')
}


export type MaybeIon<T> = T | Ion<T>


/**
 * Types all properties as readonly and hides any function that is not marked pure.
 * Deep read-only--Makes any nested objects read-only as well.
 **/
export type DeepReadonly<T> = T extends Function ? T : T extends (infer E)[] ? readonly DeepReadonly<E>[] : T extends Object ? Readonly<T> : T;


export type Readonly<T> = {
   readonly [K in keyof T
   as T[K] extends Function ? never : K]: DeepReadonly<T[K]>
}
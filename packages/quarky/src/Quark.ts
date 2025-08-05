import { isFunction, isObject } from "@rue/utils";

export const QUARK = Symbol('quark')

export type Quark<Q extends string | symbol = string | symbol, T = any> = {
   quarkType: string | symbol,
   // entity: T
}

export type QuarkOf<T extends { [QUARK]: Quark }> = T extends { [QUARK]: infer Q } ? Q : never

export type HasQuark<T = Quark> = { [QUARK]: T }

// export type EntityQuark<T> = {
//    // type: string | symbol,
//    entity: T,
// }

export function hasQuark(value: unknown): value is { [QUARK]: Quark } {
   return (isObject(value) || isFunction(value))  && QUARK in value;
}

export function quarkOf<T extends { [QUARK]: Quark }>(obj: T): T[typeof QUARK] {
   return obj[QUARK]
}






import { AnyObject } from "@rue/types";

export const QUARK = Symbol('quark')

export function hasQuark(value: unknown): value is { [QUARK]: Quark } {
   return value instanceof Object && QUARK in value;
}

export function quarkOf<T extends {[QUARK]:Quark}>(obj: T ): T[typeof QUARK] {
   return obj[QUARK] 
}



export type Quark = AnyObject

export type QuarkOf<T extends { [QUARK]: Quark }> = T extends { [QUARK]: infer Q } ? Q : never


export type EntityQuark<T> = {
   // type: string | symbol,
   entity: T,
}

export type HasQuark<T = Quark> = {[QUARK]:T}
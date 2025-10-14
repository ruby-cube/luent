import { isFunction, isObject } from "@rue/utils";


export const QUARK = Symbol('quark')

/**
 * The internal version of reactive primitives.
 */
export type Quark = {
   quarkType: string | symbol,
}

export function hasQuark(value: unknown): value is { [QUARK]: Quark } {
   return (isObject(value) || isFunction(value))  && QUARK in value;
}

export function quarkOf<T extends { [QUARK]: Quark }>(obj: T): T[typeof QUARK] {
   return obj[QUARK]
}






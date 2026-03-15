import { AnyObject } from "@rue/types";
import { isFunction, isObject } from "@rue/utils";


export const QUARK = Symbol('quark')

/**
 * The internal version of reactive primitives.
 */
// export type Quark = {
//    quarkType: string | symbol,
// }

export function hasQuark(value: unknown): value is { [QUARK]: {} } {
   return (isObject(value) || isFunction(value)) && QUARK in value;
}

export function quarkOf<T extends { [QUARK]: any }>(obj: T): T extends { [QUARK]: infer Q } ? Q : never {
   return obj[QUARK]
}
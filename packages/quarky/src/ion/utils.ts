import { isFunction } from "@rue/utils";
import { QUARK } from "../abstract/Quark";
import { Ion } from "./Ion";
import { Inert } from "./Get";

/**
 * Checks if value was created by ion(). Plain getters will return false.
 * @param value 
 * @returns boolean
 */
export function isIon(value: unknown): value is Ion {
   // const getter = isFunction(value) && value.length === 0
   // const realIon = isFunction(value) && QUARK in value
   // if (getter !== realIon) console.error('isGetter', getter, 'but isIon', realIon)

   return isFunction(value) && QUARK in value
   // value.length === 0
}

export function toIon<T>(value: T): T extends Ion ? T : Ion<T> {
   return (isGetter(value) ? value : Inert(value)) as T extends Ion ? T : Ion<T>
}

export function toValue<T>(maybeFn: T): T extends () => infer R ? R : T {
   return isFunction(maybeFn) && maybeFn.length === 0 ? maybeFn() : maybeFn as T extends () => infer R ? R : T;
}

export function isGetter(value: unknown): value is () => any {
   if (value instanceof Function && value.length === 0 !== isIon(value)) 
      console.warn(value, 'isGetter', !isIon(value), 'isIon', isIon(value))
   return value instanceof Function && value.length === 0;
}
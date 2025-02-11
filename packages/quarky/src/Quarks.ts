import { AnyObject } from "@rue/types";
import { Ion } from "./ion/Ion";

export const QUARKS = Symbol('quarks')

export function hasQuarks(value: unknown): value is { [QUARKS]: Quarks } {
   return value instanceof Object && QUARKS in value;
}

export function quarksOf<T extends {[QUARKS]:Quarks}>(obj: T ): T[typeof QUARKS] {
   return obj[QUARKS] 
}



export type Quarks = object

export type QuarksOf<T extends { [QUARKS]: Quarks }> = T extends { [QUARKS]: infer Q } ? Q : never


export type EntityQuarks<T> = {
   // type: string | symbol,
   entity: T,
}
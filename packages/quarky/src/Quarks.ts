import { AnyObject } from "@rue/types";

type QuarkyEntity<T = Quarks> = {
   [QUARKS]: T
}

export const QUARKS = Symbol('quarks')

export function hasQuarks(value: any): value is QuarkyEntity {
   return QUARKS in value;
}

export function quarksOf<T extends QuarkyEntity>(obj: T): T[typeof QUARKS] {
   return obj[QUARKS];
}

export interface Quarks<T = object> {
   entity: T,
   type: string | symbol
}

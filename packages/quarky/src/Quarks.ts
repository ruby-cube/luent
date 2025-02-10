export const QUARKS = Symbol('quarks')

export function hasQuarks(value: unknown): value is { [QUARKS]: Quarks } {
   return value instanceof Object && QUARKS in value;
}

export function quarksOf<T extends { [QUARKS]: Quarks }>(obj: T): T[typeof QUARKS] {
   return obj[QUARKS];
}


export type Quarks = {
   type: string | symbol
}
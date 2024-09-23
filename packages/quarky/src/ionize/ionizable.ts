import { AnyObject } from "@rue/types";

type Constructor = Function

const ionizableClasses: Set<Constructor> = new Set([Array, Map, Set, Object])

export function registerIonizableClass(constructor: Constructor) {
    if (!(constructor instanceof Function)) throw new Error(`INVALID INPUT`)
    ionizableClasses.add(constructor)
}

export function registerIonizableClasses(constructors: Constructor[]) {
    for (const constructor of constructors) {
        registerIonizableClass(constructor)
    }
}

export function isIonizable(value: AnyObject) {
    if (!(value instanceof Object)) return false;
    return ionizableClasses.has(value.constructor)
}

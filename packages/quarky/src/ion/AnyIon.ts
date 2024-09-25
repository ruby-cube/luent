import { isObjectLiteral } from "@rue/utils";
import { READONLY_ION } from "../asReadonly";
import { DerivedIon, isDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { isPropIon } from "../ionize/PropIon";
import { AtomicIon, isIon } from "./AtomicIon";

export function isAnyIon(maybeIon: any): maybeIon is DerivedIon | AtomicIon {
    if (!(maybeIon instanceof Function)) return false;
    if (isIon(maybeIon) || isDerivedIon(maybeIon) || READONLY_ION in maybeIon || isPropIon(maybeIon)) return true;
    return false;
}

export function Ion<T>(def: { get: () => T, set: (value: T) => T }): WritableDerivedIon<T>
export function Ion<T>(derivation: () => T): DerivedIon<T>
export function Ion<T, S extends { [key: string]: (...args: any) => any }, M extends { [key: string]: (...args: any) => any }>(value: T, methodsOrSetter?: { set?: S, methods?: M } | ((...args: any[]) => any)): AtomicIon<T, S & M>
export function Ion<T, S extends { [key: string]: (...args: any) => any }, M extends { [key: string]: (...args: any) => any }>(def: T | (() => T) | { get: () => T, set: (value: T) => T }, methodsOrSetter?: { set?: S, methods?: M }| ((...args: any[]) => any)): AtomicIon<T, S & M> | DerivedIon<T> | WritableDerivedIon<T> {
    if (def instanceof Function) return DerivedIon(def);
    if (isWritableDef(def)) return WritableDerivedIon(def);
    return AtomicIon(def, methodsOrSetter) as AtomicIon<T, S & M>
}

function isWritableDef(def: any): def is { get: () => any, set: (value: any) => any } {
    return def instanceof Object && isObjectLiteral(def) && 'get' in def && 'set' in def && def.get instanceof Function && def.set instanceof Function;
}


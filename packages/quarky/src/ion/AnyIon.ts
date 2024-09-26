import { isObjectLiteral } from "@rue/utils";
import { READONLY_ION } from "../asReadonly";
import { DerivedIon, isDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { isPropIon, PropIon } from "../ionize/PropIon";
import { AtomicIon, isIon } from "./AtomicIon";
import { AnyObject } from "@rue/types";

export type AnyIon<T = any> = DerivedIon<T> | AtomicIon<T> | WritableDerivedIon<T> | PropIon<T>

export function isAnyIon(maybeIon: any): maybeIon is AnyIon {
    if (!(maybeIon instanceof Function)) return false;
    if (isIon(maybeIon) || isDerivedIon(maybeIon) || READONLY_ION in maybeIon || isPropIon(maybeIon)) return true; //TODO: Add WritableIon
    return false;
}

type _AtomicIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? AtomicIon<T, M> : AtomicIon<T>
type _WritableDerivedIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? WritableDerivedIon<T, M> : AtomicIon<T>

export function Ion<T, M>(def: { get: () => T, set: (value: T) => T },  methods?: M & { [key: string]: (...args: any[]) => any }): _WritableDerivedIon<T, M>
export function Ion<T>(derivation: () => T): DerivedIon<T>
export function Ion<T, M>(value: T, methods?: M & { [key: string]: (...args: any[]) => any }): _AtomicIon<T, M>
export function Ion<T, M>(def: T | (() => T) | { get: () => T, set: (value: T) => T }, methods?: M & { [key: string]: (...args: any[]) => any }): _AtomicIon<T, M>  | DerivedIon<T> | _WritableDerivedIon<T, M> {
    if (def instanceof Function) return DerivedIon(def);
    if (isWritableDef(def)) return WritableDerivedIon(def, methods);
    return AtomicIon(def, methods) as _AtomicIon<T, M>
}

function isWritableDef(def: any): def is { get: () => any, set: (value: any) => any } {
    return def instanceof Object && isObjectLiteral(def) && 'get' in def && 'set' in def && def.get instanceof Function && def.set instanceof Function;
}


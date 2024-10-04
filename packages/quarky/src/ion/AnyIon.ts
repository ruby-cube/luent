import { isObjectLiteral } from "@rue/utils";
import { DerivedIon, isDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { isPropIon, PropIon } from "../ionize/PropIon";
import { Ion, ReactiveIon, isIon } from "./Ion";
import { ProtectedIon } from "./ProtectedIon";

export type AnyIon<T = any> = DerivedIon<T> | ReactiveIon<T> | ProtectedIon<T>| WritableDerivedIon<T> | PropIon<T>

export function isAnyIon(maybeIon: any): maybeIon is AnyIon {
    if (isIon(maybeIon) || isDerivedIon(maybeIon) || isPropIon(maybeIon)) return true; //TODO: Add WritableIon
    return false;
}

type _AtomicIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? ReactiveIon<T, M> : ReactiveIon<T>
type _WritableDerivedIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? WritableDerivedIon<T, M> : ReactiveIon<T>

export function ion<T, M>(def: { get: () => T, set: (value: T) => T },  methods?: M & { [key: string]: (...args: any[]) => any }): _WritableDerivedIon<T, M>
export function ion<T>(derivation: () => T): DerivedIon<T>
export function ion<T, M>(value: T, methods?: M & { [key: string]: (...args: any[]) => any }): _AtomicIon<T, M>
export function ion<T, M>(def: T | (() => T) | { get: () => T, set: (value: T) => T }, methods?: M & { [key: string]: (...args: any[]) => any }): _AtomicIon<T, M>  | DerivedIon<T> | _WritableDerivedIon<T, M> {
    if (isAnyIon(def)) return def;
    if (def instanceof Function) return DerivedIon(def);
    if (isWritableDef(def)) return WritableDerivedIon(def, methods);
    return Ion(def, methods) as _AtomicIon<T, M>
}

function isWritableDef(def: any): def is { get: () => any, set: (value: any) => any } {
    return def instanceof Object && isObjectLiteral(def) && 'get' in def && 'set' in def && def.get instanceof Function && def.set instanceof Function;
}


const INERT = true;

export function ref<T, M>(def: { get: () => T, set: (value: T) => T },  methods?: M & { [key: string]: (...args: any[]) => any }): _WritableDerivedIon<T, M>
export function ref<T>(derivation: () => T): DerivedIon<T>
export function ref<T, M>(value: T, methods?: M & { [key: string]: (...args: any[]) => any }): _AtomicIon<T, M>
export function ref<T, M>(def: T | (() => T) | { get: () => T, set: (value: T) => T }, methods?: M & { [key: string]: (...args: any[]) => any }): _AtomicIon<T, M>  | DerivedIon<T> | _WritableDerivedIon<T, M> {
    if (isAnyIon(def)) return def;
    if (def instanceof Function) return DerivedIon(def, undefined, INERT);
    if (isWritableDef(def)) return WritableDerivedIon(def, methods, INERT);
    return Ion(def, methods, INERT) as _AtomicIon<T, M>
}
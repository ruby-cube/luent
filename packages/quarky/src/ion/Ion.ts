import { AnyObject } from "@rue/types";
import { createDerivedIon, createWritableDerivedIon, DerivedIon, isDerivedIon, ReactiveDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { asPropIon, isPropIon, PropIon } from "../ionize/PropIon";
import { AtomicIon, createAtomicIon, isAtomicIon } from "./AtomicIon";
import { ProtectedIon } from "./ProtectedIon";

export type AnyIon<T = any> = DerivedIon<T> | AtomicIon<T> | ProtectedIon<T> | WritableDerivedIon<T> | PropIon<T>

export function isIon(maybeIon: any): maybeIon is AnyIon {
    if (isAtomicIon(maybeIon) || isDerivedIon(maybeIon) || isPropIon(maybeIon)) return true; //TODO: Add WritableIon
    return false;
}



export type Ion<T = any, M extends AnyObject = {}> = (() => T)
    & {
        (selected?: true): T
    } & M





// export type ReactiveGet<T = any> = () => T
// export type Get<T = any> = () => T

type ReactiveIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? AtomicIon<T, M> : AtomicIon<T>


// API
export function ion<T, M>(value?: T & (() => unknown), methods?: M & { [key: string]: (...args: any[]) => any }): T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
export function ion<T, M>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): ReactiveIon<T, M>
export function ion<T, M>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M> {
    if (isIon(value)) {
        if (__DEV__ && methods) console.warn(`Cannot make an existing ion into an ion. Methods will not be attached`)
        return value as T extends AnyIon ? T : T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
    }
    if (value instanceof Function) {
        if (methods) return createWritableDerivedIon(<() => unknown>value, methods) as T extends AnyIon ? T : T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
        return createDerivedIon(<() => unknown>value) as T extends AnyIon ? T : T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
    }
    return createAtomicIon(value, methods) as T extends AnyIon ? T : T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
}

ion.from = asPropIon


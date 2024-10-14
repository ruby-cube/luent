import { AnyObject } from "@rue/types";
import { createDerivedIon, createWritableDerivedIon, DerivedIon, MetaDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { META } from "../ReactiveEntity";
import { AnyIon, isAnyIon } from "./AnyIon";
import { createIon, Ion, MetaIon } from "./Ion";

const INERT = true;

type InertIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? Ion<T, M> : Ion<T>
export type Ref<T, M = undefined> = M extends { [key: string]: (...args: any[]) => any } ? Ion<T, M> : Ion<T>

export function ref<T, M>(value?: T & (() => unknown), methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : InertDerivedIon<T, M>
export function ref<T, M>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : InertIon<T, M>
export function ref<T, M>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : T extends ()=>unknown ? InertDerivedIon<T, M> : InertIon<T, M> {
    if (isAnyIon(value)) {
        if (__DEV__ && methods) console.warn(`Cannot make a ref from existing ion. Methods will not be attached`)
        return value as T extends AnyIon ? T : T extends ()=>unknown ? InertDerivedIon<T, M> : InertIon<T, M>
    }
    if (value instanceof Function) {
        if (methods) return createWritableDerivedIon(<() => unknown>value, methods, INERT) as T extends AnyIon ? T : T extends ()=>unknown ? InertDerivedIon<T, M> : InertIon<T, M>
        return createDerivedIon(<() => unknown>value, undefined, INERT) as T extends AnyIon ? T : T extends ()=>unknown ? InertDerivedIon<T, M> : InertIon<T, M>
    }
    return createIon(value, methods, INERT) as T extends AnyIon ? T : T extends ()=>unknown ? InertDerivedIon<T, M> : InertIon<T, M>
}

export type WritableDerivedRef<T = any, M extends AnyObject = {}> = {
    (selected?: true): T
    [META]: MetaDerivedIon;
} & M

export type DerivedRef<T = any> = {
    (selected?: true): T
    [META]: MetaDerivedIon;
}

type InertDerivedIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? WritableDerivedIon<T, M> : DerivedIon<T>

// export function DerivedRef<T, M, D>(derivation: D & (() => T), methods?: M & { [key: string]: (...args: any[]) => any }): D extends AnyIon ? D : InertDerivedIon<T, M> {
//     if (isAnyIon(derivation)) return derivation as D extends AnyIon ? D : InertDerivedIon<T, M>; //TODO: Error message?
//     if (methods) return createWritableDerivedIon(derivation, methods, INERT) as D extends AnyIon ? D : InertDerivedIon<T, M>
//     return createDerivedIon(derivation, undefined, INERT) as D extends AnyIon ? D : InertDerivedIon<T, M>
// }
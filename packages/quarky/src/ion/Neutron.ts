import { AnyObject } from "@rue/types";
import { createDerivedIon, createWritableDerivedIon, DerivedIon, MetaDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { META } from "../ReactiveEntity";
import { AnyIon, isIon } from "./Ion";
import { createAtomicIon, AtomicIon, MetaIon } from "./AtomicIon";
import { isFunction } from "@rue/utils";

const INERT = true;

type _Neutron<T, M> = M extends { [key: string]: (...args: any[]) => any } ? AtomicIon<T, M> : AtomicIon<T>
export type Neutron<T, M = undefined> = M extends { [key: string]: (...args: any[]) => any } ? AtomicIon<T, M> : AtomicIon<T>

export function neutron<T, M>(value?: T & (() => unknown), methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : _DerivedNeutron<T, M>
export function neutron<T, M>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : _Neutron<T, M>
export function neutron<T, M>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : T extends ()=>unknown ? _DerivedNeutron<T, M> : _Neutron<T, M> {
    if (isIon(value)) {
        if (__DEV__ && methods) console.warn(`Cannot make a ref from existing ion. Methods will not be attached`)
        return value as T extends AnyIon ? T : T extends ()=>unknown ? _DerivedNeutron<T, M> : _Neutron<T, M>
    }
    if (isFunction(value)) {
        if (methods) return createWritableDerivedIon(<() => unknown>value, methods, INERT) as T extends AnyIon ? T : T extends ()=>unknown ? _DerivedNeutron<T, M> : _Neutron<T, M>
        return createDerivedIon(<() => unknown>value, undefined, INERT) as T extends AnyIon ? T : T extends ()=>unknown ? _DerivedNeutron<T, M> : _Neutron<T, M>
    }
    return createAtomicIon(value, methods, INERT) as T extends AnyIon ? T : T extends ()=>unknown ? _DerivedNeutron<T, M> : _Neutron<T, M>
}

export type WritableDerivedNeutron<T = any, M extends AnyObject = {}> = {
    (): T
    [META]: MetaDerivedIon;
} & M

export type DerivedNeutron<T = any> = {
    (): T
    [META]: MetaDerivedIon;
}

type _DerivedNeutron<T, M> = M extends { [key: string]: (...args: any[]) => any } ? WritableDerivedIon<T, M> : DerivedIon<T>

// export function DerivedNeutron<T, M, D>(derivation: D & (() => T), methods?: M & { [key: string]: (...args: any[]) => any }): D extends AnyIon ? D : _DerivedNeutron<T, M> {
//     if (isIon(derivation)) return derivation as D extends AnyIon ? D : _DerivedNeutron<T, M>; //TODO: Error message?
//     if (methods) return createWritableDerivedIon(derivation, methods, INERT) as D extends AnyIon ? D : _DerivedNeutron<T, M>
//     return createDerivedIon(derivation, undefined, INERT) as D extends AnyIon ? D : _DerivedNeutron<T, M>
// }
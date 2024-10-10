import { AnyObject } from "@rue/types";
import { createDerivedIon, createWritableDerivedIon, DerivedIon, MetaDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { META } from "../ReactiveEntity";
import { AnyIon, isAnyIon } from "./AnyIon";
import { createIon, Ion, MetaIon } from "./Ion";

const INERT = true;

type InertIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? Ion<T, M> : Ion<T>

export function ref<T, M>(value: T, methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : InertIon<T, M> {
    if (isAnyIon(value)) return value as T extends  AnyIon  ? T : InertIon<T, M>
    return createIon(value, methods, INERT) as T extends  AnyIon  ? T : InertIon<T, M>
}

export type WritableDerivedRef<T = any, M extends AnyObject = {}> = {
    (): T;
    [META]: MetaDerivedIon;
} & M

export type DerivedRef<T = any> = {
    (): T;
    [META]: MetaDerivedIon;
} 

type InertDerivedIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? WritableDerivedIon<T, M> : DerivedIon<T>

export function derivedRef<T, M, D>(derivation: D & (() => T), methods?: M & { [key: string]: (...args: any[]) => any }): D extends AnyIon? D : InertDerivedIon<T, M> {
    if (isAnyIon(derivation)) return derivation as D extends AnyIon  ? D : InertDerivedIon<T, M>;
    if (methods) return createWritableDerivedIon(derivation, methods, INERT) as D extends AnyIon ? D : InertDerivedIon<T, M>
    return createDerivedIon(derivation, undefined, INERT) as D extends AnyIon ? D : InertDerivedIon<T, M>
}
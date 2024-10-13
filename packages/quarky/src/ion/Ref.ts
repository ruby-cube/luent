import { AnyObject } from "@rue/types";
import { createDerivedIon, createWritableDerivedIon, DerivedIon, MetaDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { META } from "../ReactiveEntity";
import { AnyIon, isAnyIon } from "./AnyIon";
import { createIon, Ion, MetaIon } from "./Ion";

const INERT = true;

type InertIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? Ion<T, M> : Ion<T>
export type Ref<T, M = undefined> = M extends { [key: string]: (...args: any[]) => any } ? Ion<T, M> : Ion<T>

export function Ref<T, M = undefined>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : InertIon<T, M> {
    if (isAnyIon(value)) return value as T extends  AnyIon  ? T : InertIon<T, M> //TODO: error message?
    return createIon(value, methods, INERT) as T extends  AnyIon  ? T : InertIon<T, M>
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

export function DerivedRef<T, M, D>(derivation: D & (() => T), methods?: M & { [key: string]: (...args: any[]) => any }): D extends AnyIon? D : InertDerivedIon<T, M> {
    if (isAnyIon(derivation)) return derivation as D extends AnyIon  ? D : InertDerivedIon<T, M>; //TODO: Error message?
    if (methods) return createWritableDerivedIon(derivation, methods, INERT) as D extends AnyIon ? D : InertDerivedIon<T, M>
    return createDerivedIon(derivation, undefined, INERT) as D extends AnyIon ? D : InertDerivedIon<T, M>
}
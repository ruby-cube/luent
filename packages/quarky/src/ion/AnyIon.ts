import { DerivedIon, isDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { isPropIon, PropIon } from "../ionize/PropIon";
import { Ion, isIon } from "./Ion";
import { ProtectedIon } from "./ProtectedIon";

export type AnyIon<T = any> = DerivedIon<T> | Ion<T> | ProtectedIon<T> | WritableDerivedIon<T> | PropIon<T>

export function isAnyIon(maybeIon: any): maybeIon is AnyIon {
    if (isIon(maybeIon) || isDerivedIon(maybeIon) || isPropIon(maybeIon)) return true; //TODO: Add WritableIon
    return false;
}

type ReactiveIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? Ion<T, M> : Ion<T>

export function ion<T, M>(value: T, methods?: M & { [key: string]: (...args: any[]) => any }): ReactiveIon<T, M> {
    if (isAnyIon(value)) return value as  ReactiveIon<T, M>
    return Ion(value, methods) as  ReactiveIon<T, M>
}




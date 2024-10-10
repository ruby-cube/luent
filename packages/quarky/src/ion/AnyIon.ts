import { DerivedIon, isDerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { isPropIon, PropIon } from "../ionize/PropIon";
import { Ion, isIon } from "./Ion";
import { ProtectedIon } from "./ProtectedIon";

export type AnyIon<T = any> = DerivedIon<T> | Ion<T> | ProtectedIon<T> | WritableDerivedIon<T> | PropIon<T>

export function isAnyIon(maybeIon: any): maybeIon is AnyIon {
    if (isIon(maybeIon) || isDerivedIon(maybeIon) || isPropIon(maybeIon)) return true; //TODO: Add WritableIon
    return false;
}





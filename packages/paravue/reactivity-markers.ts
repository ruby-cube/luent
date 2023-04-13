import { ComputedRef, Ref, isRef } from "vue";
import { ExtensibleRef, isExtensibleRef } from "./ExtensibleRef";

export type ReactiveRef = Ref | ComputedRef | ExtensibleRef;

export function r$<T extends ReactiveRef>(ref: T): T extends { value: infer V } ? V : T {
    if (isRef(ref) || isExtensibleRef(ref)) return (<Ref>ref).value;
    return ref as T extends { value: infer V } ? V : T;
}

export const nr = r$;

export function set$<T>(ref: { value: T } | any, value: T) {
    if (value && isRef(ref)) ref.value = value;
}


export function v$<T>(value: T): T {
    return value;
}

export const nv = v$;

// export function r$<T>(ref: T): T extends ReactiveRef ? T extends {value: infer V} ? V : T : T {
//     if (isRef(ref) || isExtensibleRef(ref)) return ref.value;
//     return ref as T extends ReactiveRef ? T extends {value: infer V} ? V : T : T;
// }

import { AnyObject } from "@rue/types";

// export function $<T extends AnyObject>(argA: T, argB: keyof T): DerivedSignal<T>
// export function $<T extends any>(argA: () => T, argB: boolean): DerivedSignal<T>
// export function $<T extends any>(argA: () => T | T, argB?: boolean | keyof T): DerivedSignal<T> {
//     const retrack = typeof argB === "boolean" ? argB : false
//     const pureGetter = argA

//     return $DerivedSignal(pureGetter, retrack)
// }
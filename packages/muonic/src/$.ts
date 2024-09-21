import { AnyObject } from "@rue/types";

// export function $<T extends AnyObject>(argA: T, argB: keyof T): DerivedIon<T>
// export function $<T extends any>(argA: () => T, argB: boolean): DerivedIon<T>
// export function $<T extends any>(argA: () => T | T, argB?: boolean | keyof T): DerivedIon<T> {
//     const retrack = typeof argB === "boolean" ? argB : false
//     const pureGetter = argA

//     return $DerivedIon(pureGetter, retrack)
// }
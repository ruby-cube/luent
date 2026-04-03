import { Ion, isIon, MutableIon } from "../quarky/src/ion/Ion";

// export function isNonNull<T>(value: T): value is NonNullable<T extends Ion<infer V> ? NonNullable<V> : T> {
//    if (isIon(value)) return value() != null;
//    return value != null;
// }

// export function isDefined() {

// }

// export function isNonNull<T>(value: T): value is Exclude<T, null | undefined> {
//   if (isSignal(value)) return value() != null;
//   return value != null;
// }

// const $target = ion(null as { hi: 'hi' } | null, {
//    other() {

//    }
// })

// const $frog = null as (typeof $target | null)
// // as Ion<number | null>

// if (isNonNull($frog)) {
//    $frog().hi
// }

// if (isNonNull($target)) {
//    $target().hi
// }

// if (isNullish($frog)) {
//    $frog().hi
// }

// if (isNullish($target)) {
//    $target().hi
// }


// export function isNonNull<T>(value: Ion<T>): value is Ion<Exclude<T, null | undefined>>{
// // export function isNonNull<T>(value: T): value is Exclude<T, null | undefined>;
// // export function isNonNull(value: unknown): boolean {
//    if (isIon(value)) return value() != null;
//    return value != null;
// }

// Helper type to extract inner type of a signal and make it non-nullable
type NonNullableInner<T> =
   T extends Ion<infer V> ? Ion<NonNullable<V>> : Exclude<T, null | undefined>;

// Overload: Signal case
// export function isNonNull<T, M>(value: Ion<T> & M | null | undefined): value is Ion<NonNullable<T>> & M;

// // Overload: Non-signal case
// export function isNonNull<T>(value: T): value is Exclude<T, null | undefined>;

// export function isNonNull(value: unknown): boolean {
//    if (isIon(value)) return value() != null;
//    return value != null;
// }

// export function isNullish<T, M>(value: Ion<T | null | undefined> & M): value is Ion<null | undefined> & M;

// // Overload: Non-signal case
// export function isNullish<T>(value: T | null | undefined): value is null | undefined;

// export function isNullish(value: unknown): boolean {
//    if (isIon(value)) return value() != null;
//    return value != null;
// }
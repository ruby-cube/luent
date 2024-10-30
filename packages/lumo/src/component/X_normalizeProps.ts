// import { AtomicIon, ionize, Ionized } from "@rue/quarky";
// import { AnyObject } from "@rue/types";
// import { normalizeToArray } from "@rue/utils";
// import { toIon } from "../../../quarky/src/ion/toIons";

// type MaybeIon<T = any> = T | AtomicIon<T>

// type MaybeIonized<T extends AnyObject = AnyObject> = T | Ionized<T>;

// type Normalizers<T> = T extends MaybeIon<infer I> ? T extends I ?
//     ((value: T) => unknown) | ((value: T) => unknown)[]
//     : ((value: T) => AtomicIon<I>) | [...((value: T) => unknown)[], (value: T) => AtomicIon<I>]
//     : ((value: T) => unknown) | ((value: T) => unknown)[]

// type NormalizedProps<T, N> = {
//     [K in keyof T as T[K] extends MaybeIon<infer I> ? T[K] extends I ?
//     T[K] extends MaybeIonized<infer I> ? T[K] extends I ? K extends string ? `$${K}` : K : K : K :
//     K extends string ? `$${K}` : K : K]:
//     T[K] extends MaybeIon<infer I> ? T[K] extends I ?
//     T[K] extends MaybeIonized<infer I> ? T[K] extends I ? Ionized<I> : T[K] :  T[K] : AtomicIon<I> : T[K] 
// };

// export function toIonicProps<T extends AnyObject, N extends { [K in keyof T]?: T[K] extends undefined ? 'yes': 'no' }>(setup: T, normalizers: N): { [K in keyof NormalizedProps<T, N>]: NormalizedProps<T, N>[K] } {
//     const normalizedProps = {} as AnyObject;
//     for (const key in setup) {
//         const _normalizers = normalizeToArray(normalizers[key])
//         let value = setup[key];
//         let isIonic = false;
//         for (const normalize of _normalizers) {
//             if (!isIonic) isIonic = normalize === toIon || normalize === toIonized
//             value = normalize(value);
//         }
//         if (isIonic) normalizedProps['$' + key] = value;
//         else normalizedProps[key] = value;
//     }
//     return normalizedProps as { [K in keyof NormalizedProps<T, N>]: NormalizedProps<T, N>[K] }
// }

// //QUESTION: Do we need a toIonized function? yes for the variable name. Not sure if i need to an inert ionic model

// function toIonized<T extends AnyObject>(value: T) {
//     return value;
// }

// type Check<T> = T extends undefined ?'yes' : 'no'
// type Res = Check<MaybeIon<string|undefined>

// // Normalizers<Exclude<T[K], undefined>> | undefined : Normalizers<T[K]>

// const obj = toIonicProps({
//     cat: 'cat' as MaybeIon<string> | undefined,
//     dog: 9 as string | number,
//     frog: { name: 'kermit' } as MaybeIonized<{
//         name: string
//     }>
// }, {
//     cat: toIon,
//     dog: () => { },
// })

// const blo = ionize({
//     mo: 'sldkf'
// }, { setMo() { } })
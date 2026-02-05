import { AnyObject } from "@rue/types";
import { debug, isFunction, isObject } from "@rue/utils";
import { Ion, isIon, MutableIon } from "../ion/Ion";
import { MayBeMutableProxy } from "../mu";

/**
 * [v] ion access --for objects only (not collections)
 * [v] mutable ion vs readonly ions based on 
 * [v] deep ionize, don't nest ionize if already ionized
 * [v] allow both setting nested ionized properties with ionized and raw objects
 * [] deep ionize with methods like .splice
 * [] collections
 * [] How does typescript know if a class is ionizable or inert?
 */


/**
 * Ionized deeply
 */
export type Ionized<T extends object> = Properties<T> & { '~ionized': true }


// Properties<T>
// & InvertProperties<T, ReadonlyKeys<T>>
// & { '~ionized': true }

type Properties<T> = {
   [K in keyof T]: MaybeIonizeProperty<K, T[K]>
}

type Value<T> = T & { value?: true }

type InvertProperties<T, ROKeys> = {
   [K in keyof T as K extends number ? never : IsMethod<K, T[K]> extends true ? never : IsAbsorbedIon<K, T[K]> extends true ? K extends `$${infer N}` ? N : never : K extends string ? `$${K}` : never]:
   IsAbsorbedIon<K, T[K]> extends true ? T[K] extends Ion<infer S> ? Value<S> : never : K extends ROKeys ? Ion<MaybeIonize<T[K]>> : MutableIon<MaybeIonize<T[K]>>
}

type IsAbsorbedIon<K, T> = K extends `$${string}` ? T extends Ion ? true : false : false
type IsMethod<K, T> = K extends `$${string}` ? T extends Ion ? false : false : T extends Function ? true : false
export type IsIonized<T> = keyof T extends never ? false : T extends { '~ionized': true } ? true : false
// T extends Ion ? false : false : T extends Function ? true : false

type MaybeIonizeProperty<K, T> =
   IsIonized<T> extends true ? T
   : IsAbsorbedIon<K, T> extends true ? T
   : T extends Function ? MaybeIonizedMethod<T>
   : T extends object ? Ionized<T>
   : T

export type MaybeIonize<T> = IsIonized<T> extends true ? T
   : T extends Function ? T
   // : IsInert<T> extends true ? T & { inerton: true }
   : T extends object ? Ionized<T>
   : T




// export const Ionic = ionize


export type ToRaw<T> = IsIonized<T> extends true ? T extends Ionized<infer R> ? R : T : T

type MaybeIonizedMethod<M extends Function> = M extends (this: infer U, ...args: any) => any ? (ThisType<U> & { method: M })['method'] : M

/**
 * Wrap the return of a method of an ionizable class with this type helper in order to 
 * propagate any deep ionization that has been defined in the class's defineIonicCollective config
 */
export type IonizeBy<H, T> = IsIonized<H> extends true ?
   (T extends AnyObject ? Ionized<T> : T) : T

export type MaybeIonized<T> = T extends AnyObject ? Ionized<T> : T

export type ToRawItems<T> = any[] extends T ? T extends Array<infer I> ? ToRaw<I>[] : T : T




function getExistingIonizedModel(target: object, markMap?: object) {
   const existing = getIonizedModel(target)
   if (existing) {
      if (markMap) {
         throw Error('Cannot extend or modify existing ionized model with methods or markMap')
      }
      // debug.warn('CASE RESEARCH: ionizing raw target with existing ionized model') // we want to track how often devs will ionize a raw target but not track when we ionize a raw target internally. That's why we have a public `ionize` and an internal `ionizeModel`
      return existing
   }
   return existing
}

const protect = __DEV__ ? MayBeMutableProxy : (<T>(arg: T) => arg)

export type DeepIonic<T, N> = Ionized<{ [P in Exclude<keyof T, keyof N>]: T[P]; }> & { [K in keyof N]: N[K] extends (...args: any[]) => infer R ? R : never }
export type DeepIonized<T, N extends Partial<T>> = Ionized<{ [P in Exclude<keyof T, keyof N>]: T[P]; }> & N
export const Ionized = ionize
export const $$ = ionize

export function ionize<T extends object, O>(target: T & ThisType<Ionized<T>>, options?: O & IonizeOptions): O extends { nested: infer N } ? DeepIonic<T, N> : Ionized<T> {
   // TODO: store stack trace
   return protect(<unknown>getExistingIonizedModel(target, options) as O extends { nested: infer N } ? DeepIonized<T, N> : Ionized<T> ??
      <unknown>ionizeModel(target, options) as O extends { nested: infer N } ? DeepIonized<T, N> : Ionized<T>)
}



// **** THIS WORKS: I just need to figure out how to connect it to selective ionization config
export type NoExpand<T> = T extends infer O ? O : never;

export type Ionic<T, N = {}> = NoExpand<{ [K in keyof T]: K extends keyof N ? Ionic<T[K], N[K] extends { nested: infer NN } ? NN : {}> : T[K] } & { '~ionized': true }>

export function defineDeepIonize<O extends (arg: any) => any>(getConfig: O) {
   const config = getConfig({})
   function ionizer<T>(value: T & RawType<O>) { return ionize(value, config) as Ionic<RawType<O>, O extends (arg: any) => infer R ? R extends { nested: infer N } ? N : {} : {}> }
   ionizer.nested = config.nested as O extends (arg: any) => infer R ? R extends { nested: infer N } ? N : undefined : undefined
   return ionizer
}

type RawType<O> = O extends (arg: infer T) => any ? T extends object ? T : never : never





export function ionizeModel(target: object, options: IonizeOptions) {
   if (!isObject(target)) return target;
   // throw new Error(`INVALID INPUT: ionize or ionize must receive a reference value (object), not a primitive`)
   if (isIonicProxy(target) || isFunction(target) || isInert(target)) {
      if (options) debug.warn(`CASE RESEARCH: Target is ${isIonicProxy(target) ? 'ionized model' : isIon(target) ? 'ion' : 'inert'}. Cannot extend using ionize()`)
      return target
   }
   return createIonicProxy(target, options)
}




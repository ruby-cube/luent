import { AnyObject, Glass } from "@rue/types";
import { __DEV__asTraceable, emitSignal } from "../debug/debug";
import { createIonicModel, MethodHook } from "./IonicModel";
import { __DEV__trace } from "../debug/debug";
import { QUARK, quarkOf } from "../abstract/Quark";
import { isIonicProxy, QuarkyIonicProxy } from "./ModelQuark";
import { isObject } from "@rue/utils";
import { Ion } from "../ion/Ion";

export type IonicProxy = AnyObject & { '~ionic-proxy': true }


// export type DeepIonic<T, N> = Ionized<{ [P in Exclude<keyof T, keyof N>]: T[P]; }> & { [K in keyof N]: N[K] extends (...args: any[]) => infer R ? R : never }
// export type DeepIonized<T, N extends Partial<T>> = Ionized<{ [P in Exclude<keyof T, keyof N>]: T[P]; }> & N

// export function ionize<T extends object, O>(target: T & ThisType<Ionized<T>>, options?: O & IonizeOptions): O extends { nested: infer N } ? DeepIonic<T, N> : Ionized<T> {
//    // TODO: store stack trace
//    return protect(<unknown>getExistingIonizedModel(target, options) as O extends { nested: infer N } ? DeepIonized<T, N> : Ionized<T> ??
//       <unknown>ionizeModel(target, options) as O extends { nested: infer N } ? DeepIonized<T, N> : Ionized<T>)
// }

// **** THIS WORKS: I just need to figure out how to connect it to selective ionization config
export type Expand<T> = T extends infer O ? O : never;


type IonAccess<T extends AnyObject, M = {}> = Expand<{
   [K in keyof T as K extends `$${infer I}` ? T[K] extends () => any ? I : T[K] extends Function ? never : `$${K}` : T[K] extends Function ? never : K extends string ? `$${K}` : never]:
   K extends `$${string}`
   ? T[K] extends Ion<infer V>
   ? NestedType<K, M, V>
   : Ion<NestedType<K, M, T[K]>>
   : Ion<NestedType<K, M, T[K]>>
}>

type Methods<M> = Expand<{ 
   [K in keyof M as M[K] extends Function ? K : never]: M[K] 
}>

export type Ionic<T extends AnyObject, M extends AnyObject = {}> = T extends any[] ?
   Ionize<Expand<{
      [K in keyof T]: NestedType<K, M, T[K]>
   } & IonAccess<T, M> & Methods<M>>>
   : Ionize<Expand<Glass<{
      [K in keyof T]: NestedType<K, M, T[K]>
   } & IonAccess<T, M> & Methods<M>>>>

type NestedType<K, M, V> = K extends keyof M
   ? M[K] extends { '-as': infer N } ? N extends ((args: any) => infer R) ? R : N : V
   : K extends number
   ? M extends { [EACH]: infer O } ? O extends { '-as': infer N }
   ? N extends (arg: any) => infer R ? R : N
   : V
   : V
   : V

export const INTERNAL_OP = "[[INTERNAL]]"

export const EACH = Symbol('each')

const ionicModels: WeakMap<AnyObject, QuarkyIonicProxy> = new WeakMap()

export const asIonic = Ionic as <T>(obj: T) => IonicProxy & T

// export function asIonic<T extends AnyObject>(target: T, config?: AnyObject): IonicProxy & T {
//    if (isIonicProxy(target)) return target as any as IonicProxy & T;
//    const existing = ionicModels.get(target)
//    if (existing) {
//       if (__DEV__ && config && quarkOf(existing).extension !== config) {
//          console.warn(`[DEV RESEARCH] Ionic model config mismatch. Config of existing model is not identical to config provided by asIonic`)
//       }
//       return existing as any as IonicProxy & T
//    }
//    return Ionic(target, config)
// }

type PropertiesOf<T> = {
   [K in keyof T as T[K] extends Function ? never : K]: {
      '-as'?: (data: T[K]) => any,
      '@get'?: (value: T[K]) => void,
      '@set'?: (value: T[K]) => void
   }
}

type Ionize<T> = T & { '~ionic': true }

export function Ionic<T extends AnyObject, M>(target: T, config?: M & ThisType<T & M> & Partial<PropertiesOf<T>>): T extends { '~ionic': true } ? T : Ionic<T, M> {
   if (isIonicProxy(target)) {
      return target as any
   }
   if (!isObject(target)) return target;
   const existing = ionicModels.get(target)
   if (existing) {
      if (__DEV__ && config && quarkOf(existing).extension !== config) {
         console.warn(`[DEV RESEARCH] Ionic model config mismatch. Config of existing model is not identical to config provided by asIonic`)
      }
      return existing as any
   }
   const proxy = createIonicModel(target, config ?? {})
   ionicModels.set(target, proxy)
   return proxy as any
}





const author = Ionic({ profile: { name: 'frog' } }, { profile: { '-as': Ionic } })
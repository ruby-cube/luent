import { AnyObject, Glass, ReadonlyKeys } from "@rue/types";
import { debug, isObject } from "@rue/utils";
import { IonizedModelQuark } from "./IonizedModelQuark";
import { Inert, isInert } from "./inert";
import { AtomicIon, Ion, ion, isIon, Methods } from "../ion/Ion";
import { createIonizedModel, IonizedModel } from "./IonizedModel";
import { hasQuark, QUARK, quarkOf } from "../Quark";
import { MUTABLE } from "../ion/AtomicIon";
import { isIonizable } from "./makeIonizable";


// The current approach to reactivity depth is that all models are deeply reactive.
// However, reactivity is applied only to:
// - object literals that have NOT been marked inert
// - class instances whose DIRECT prototype has been registered as ionizable

//TODO: figure out the simplest way developers can add types to custom data strucures


const ionizedModels: WeakMap<AnyObject, IonizedModel> = new WeakMap()

export function registerIonizedModel(ionized: IonizedModel, target: AnyObject) {
   ionizedModels.set(target, ionized)
}

export function isIonizedModel(value: any): value is IonizedModel {
   if (!isObject(value)) return false;
   return hasQuark(value) && quarkOf(value) instanceof IonizedModelQuark;
}

export function asIonized(value: unknown) {
   return ionizedModels.get(value as AnyObject)
}


type AbsorbedIon<T> = {
   (...args: any[]): T;
   [QUARK]: any;
}

export type Readonly<T extends AnyObject = AnyObject> = {
   readonly [K in keyof T]: T[K]
}

/**
 * [v] ion access --for objects only (not collections)
 * [v] mutable ion vs readonly ions based on 
 * [v] deep ionize, don't nest ionize if already ionized
 * [] deep ionize with methods like .splice
 * [v] allow both setting nested ionized properties with ionized and raw objects
 * [] collections
 * [] How does typescript know if a class is ionizable or inert?
 */



/**
 * API
 */
export type Ionized<T, M = {}> =
   Properties<T>
   & InvertProperties<T, ReadonlyKeys<T>>
   & M
   & { '~ionized'?: true }

type Properties<T> = {
   [K in keyof T]: MaybeIonizeProperty<K, T[K]>
}

type Value<T> = T & { value?: true }

type InvertProperties<T, ROKeys> = {
   [K in keyof T as K extends number ? never : IsMethod<K, T[K]> extends true ? never : IsAbsorbedIon<K, T[K]> extends true ? K extends `$${infer N}` ? N : never : K extends string ? `$${K}` : never]?:
   IsAbsorbedIon<K, T[K]> extends true ? T[K] extends Ion<infer S> ? Value<S> : never : K extends ROKeys ? Ion<MaybeIonize<T[K]>> : Ion<MaybeIonize<T[K]>, { state: MaybeIonize<T[K]> }>
}

type IsAbsorbedIon<K, T> = K extends `$${string}` ? T extends Ion ? true : false : false
type IsMethod<K, T> = K extends `$${string}` ? T extends Ion ? false : false : T extends Function ? true : false
type IsIonized<T> = T extends { '~ionized'?: true } ? true : false
// T extends Ion ? false : false : T extends Function ? true : false

type MaybeIonizeProperty<K, T> =
   IsIonized<T> extends true ? T
   : IsAbsorbedIon<K, T> extends true ? T
   : T extends Function ? MaybeIonizedMethod<T>
   : T extends object ? Ionized<T>
   : T

type MaybeIonize<T> = IsIonized<T> extends true ? T : T extends Function ? T : T extends object ? Ionized<T> : T

export type ToRaw<T> = T extends Ionized<infer R> ? R : T

type MaybeIonizedMethod<M extends Function> = M extends (this: infer U, ...args: any) => any ? (ThisType<U> & { method: M })['method'] : M

/**
 * Wrap the return of a method of an ionizable class with this type helper in order to 
 * propagate any deep ionization that has been defined in the class's makeIonizable config
 */
export type IonizeByThis<H, T> = IsIonized<H> extends true ? MaybeIonize<T> : T

export type MaybeIonized<T> = ToRaw<T> | Ionized<T>
// T extends Ionized<infer O> ? O | T : T | Ionized<T>

// export function _ionize<T, M>(target: T & object, methods?: (M & Methods) & ThisType<T & M & { super: T }>): M extends AnyObject ? Ionized<T, M> : Ionized<T> {
//    return null as unknown as M extends AnyObject ? Ionized<T> & M : Ionized<T>
// }

const $location = ion('')

const frog = ionize({
   name: { nom: 'kermit' },
   setName(name: string) { return name },
   $location,
}, {
   doSomething() { }
})


const list = ionize([{ name: 'kermit' }])
const i = list[0]



// export type Ionized<T extends AnyObject, M extends {} = {}> = {
//    [K in keyof T as (K extends '~$methods' ? never : K extends keyof M ? M[K] extends boolean ? K : K extends string ? `_${K}` : K : K)]:
//    T[K] extends AbsorbedIon<infer V> ? K extends `$${string}` ? T[K] : V 
//    // T[K] extends { [QUARK]: any } | Inert ? T[K]
//    : T[K] extends (...args: any[]) => any ? IonizedGetter<T, K>
//    : T[K] extends { [key: PropertyKey]: any } ? Ionized<T[K]>
//    : T[K] extends { [key: PropertyKey]: any } | undefined ? Ionized<Exclude<T[K], undefined>> | undefined
//    : T[K]
// } & InvertIons<T, OmitTrue<M>> & OmitTrue<M> 
// & { [QUARK]: IonizedModelQuark }

// type OmitTrue<M extends {}> = { [K in keyof M as M[K] extends true ? never : K]: Exclude<M[K], true> }

type ReadonlyIon<T> = {
   (): T
   // [QUARK]: AtomicIonQuark;
}

type InvertIons<T extends AnyObject, M = {}> = {
   [K in keyof T as (K extends '~$methods' ? never : K extends keyof M ? never : T[K] extends AbsorbedIon<any> ? K extends `$${infer S}` ? S : K extends string ? `$${K}` : never : T[K] extends (...args: any[]) => any ? never : K extends `$${string}` ? never : K extends string ? `$${K}` : never)]:
   T[K] extends AbsorbedIon<infer V> ? K extends `$${string}` ? V : T[K]
   : ReadonlyIon<
      T[K] extends { [QUARK]: any } | ((...args: any[]) => any) | Inert ? T[K]
      : T[K] extends { [key: PropertyKey]: any } ? Ionized<T[K]>
      : T[K] extends { [key: PropertyKey]: any } | undefined ? Ionized<Exclude<T[K], undefined>> | undefined
      : T[K]
   >
}

type IonizedGetter<T, K extends keyof T> =
   T extends { '~$methods'?: AnyObject } ?
   K extends keyof Exclude<T['~$methods'], undefined> ?
   Exclude<T['~$methods'], undefined>[K]
   : T[K]
   : T[K]

// const $count = ion(0, { doSomething() { } })

// const cat = ionize({
//    count: $count,
//    chow: {
//       blog: 9
//    },
//    flower: 'hi',
//    doSomething() {

//    }
// }, { doOther() { }, doSomething() { } })

// & { [K in keyof Partial<T>]: true | ((...args: any[]) => any) }
// | { [K in keyof Partial<T>]?: boolean | ((...args: any[]) => any) } & { [key: PropertyKey]: (...args: any[]) => any }
// { [K in keyof Partial<T> | PropertyKey]: K extends keyof T ? true|  ((...args: any[]) => any): (...args: any[]) => any }
// { as: true | ((...args: any[]) => any) } | { as?: true | ((...args: any[]) => any) } & { [key: PropertyKey]: (...args: any[]) => any }
export type FlattenMaybeIonized<T> = T extends Ionized<infer R, infer M> ? R & M : never
export type ToRawItems<T> = T extends Array<infer I> ? ToRaw<I>[] : T

export type IsMaybeIonized<T> = T extends Ionized<infer R, infer M> | infer O ? R & M extends O ? O extends R & M ? true : false : false : false





//API
export function ionize<T, M>(target: T & object, methods?: (M & Methods) & ThisType<T & M & { super: T }>): M extends AnyObject ? Ionized<ToRawItems<T>, M> : Ionized<ToRawItems<T>> {
   return ionizeModel(target, methods, MUTABLE) as T extends Inert | Ion | Ionized<T> ? T : Ionized<T, M>
}

// ionize.deep = ionize //TODO: 

// ionize.mu = createMutableIonizedModel

// function createMutableIonizedModel(target: object, methods?: object |undefined){
// return ionizeModel(target, methods, MUTABLE)
// }

export function ionizeModel(target: object, methods: object | undefined, mutable: boolean = true) {
   if (!isObject(target)) throw new Error(`INVALID INPUT: ionize or ionize must receive a reference value (object), not a primitive`)
   //TODO: prevent going from encapsulated to mutable;
   if (!methods && isIonizedModel(target)) return target;
   if (isIon(target) || isInert(target)) {
      if (methods) throw new Error(`INVALID INPUT: Cannot add methods to an ion or non-ionizable target using ionize.`)
      return target
   }
   //TODO: What about a readonly object that is not an ionic model?
   if (!isIonizable(target.constructor)) {
      debug.warn(`The class ${target.constructor.name} must be made ionizable with makeIonizable() in order to ionize any instances of the class.`)
      return target
   }
   const rawTarget = toRaw(target)
   const existingIonizedModel = !methods ? ionizedModels.get(rawTarget) : undefined;
   if (existingIonizedModel) return existingIonizedModel
   return createIonizedModel(rawTarget, methods, mutable)
}

// function traceIonized() { //TODO: what about objects that are ionized by ionsOf()?
//    return extractTrace(getPublicTrace() 
// }

// function extractTrace(rawTrace: string) {
//    const rawTraceTail = rawTrace.split('at ionize').at(-1)!
//    const trimmedTraceTail = trimHead(rawTraceTail)
//    if (trimmedTraceTail.includes('at maybeIonize'))
//       return extractIonizedPropertyTrace(trimmedTraceTail)
//    return trimTail(trimmedTraceTail)
// }

// function extractIonizedPropertyTrace(rawTrace: string) {
//    const cutoff = rawTrace.includes('at Proxy.at') ? 'at Proxy.at'
//       : rawTrace.includes('at Proxy.') ? 'at Proxy.' : 'at Object.get'
//    const rawTraceTail = rawTrace.split(cutoff).at(-1)!
//    return trimTail(trimHead(rawTraceTail))
// }

// function trimHead(rawTrace: string) {
//    return rawTrace.slice(rawTrace.indexOf('at'))
// }

// function trimTail(rawTrace: string) {
//    return 'at' + rawTrace.split('at')[1].trimEnd()
// }

// export function ionizeWithMarks<
//    T extends AnyObject,
//    M extends { [K in keyof Partial<T>]: 'public' | typeof inert }
// >(target: T, marks: M): T extends Inert | Ion | Ionized<T> ? T : Ionized<Marked<T, M>> {
//    const publicMethods: AnyObject = {};
//    const inertProps: AnyObject = {}
//    for (const key in marks) {
//       if (marks[key] === 'public') {
//          publicMethods[key] = true
//       }
//       inertProps[key] = inert;
//    }
//    return ionize(target, undefined, publicMethods)
// }

// type Marked<T extends AnyObject, M extends { [K in keyof Partial<T>]: 'public' | typeof inert }> = Omit<T, keyof M> & { [K in keyof M]: M[K] extends typeof inert ? T[K] & Inert : T[K] } //TODO: Mark public

export function storeSnapshot(modelQuark: IonizedModelQuark, clone?: AnyObject) {
   // timeTraveler.takeSnapshot(toRaw(modelQuark), $effectCycle().count, clone)
}



type AsRaw<T> = T extends IonizedModelQuark<infer R> ? R : T extends IonizedModel<infer R> ? R : T

export function toRaw<T>(target: T): AsRaw<T> {
   if (target instanceof IonizedModelQuark) return target.rawTarget;
   if (isIonizedModel(target)) return quarkOf(target).rawTarget as AsRaw<T>;
   return target as AsRaw<T>; // already raw target
}


// export function exposeIons<T>(model: T): asserts model is T & AsIons<T> {
//    if (!isIonizedModel(model)) throw new Error("model must be ionized")
// }

// export function ions<T>(model: T): AsIons<T> {
//    return model as AsIons<T>
// }

// export function $$<T>(model: T): AsIons<T> {
//    return model as AsIons<T>
// }

// type AsIons<T> = {
//    [K in keyof T as T[K] extends (...args: any[])=>any ? never : K extends string ? `$${K}` : K]:  AtomicIon<T[K]>
// }



// const frog = ionize({
//    a: 2,
//    b: 4,
//    get somethingComplex() {
//       return this.a + this.b
//    }
// })







// function getNonTrackableKeys(target: AnyObject) {
//     return new Set(Object.getOwnPropertyNames(Object.getPrototypeOf(target)))
// }









// export function toWatchedProp(reactive: IonizedModel, key: PropertyKey) {
//     const modelQuark = reactive[QUARK]
//     const isIndex = toRaw(modelQuark) instanceof Array && isIntegerKey(key)
//     if (isIndex) {
//         (<MetaIonicCollection>modelQuark).addObservedEntryKey(key)
//     }
//     // clean up
//     const prop = asObservedProp(reactive, key)
//     const watchSubject = asWatched(prop)
//     watchSubject.onUnwatched(() => {
//         unobserve(prop, isIndex ? () => {
//             (<MetaIonicCollection>modelQuark).deleteObservedEntryKey(key)
//         } : undefined)
//     })
//     return prop;
// }


// function unobserve(prop: ObservedProp) {
//     const watchSubject = asWatched(prop)
//     const atom = asParticle(prop)
//     if (watchSubject.watchCount === 0 && atom.compounds.size === 0) {
//         prop.discard()
//     }
// }


// Because insertion of values don't yield differing new and old values for size and length in the setter,
// we need to manually check old and new values at time of mutation
// function isNonSettable(key: string, structureConfigs: any[]) {
//     if ((DataStructure === Set || DataStructure === Map) && key === 'size') return true;
//     return false;
// }





// export type ReactiveTraps<T extends Ionizable = Ionizable> = ProxyHandler<T>


// export function createReactiveTraps(
//     target: AnyObject,
//     get: (target: AnyObject, key: ProxyTargetKey, receiver: AnyObject) => any,
//     set?: (target: AnyObject, key: ProxyTargetKey, value: any, receiver: AnyObject) => boolean,
//     existingTraps?: ReactiveTraps,
// ) {
//     return {
//   get,
//   set,
//   getPrototypeOf: existingTraps ? existingTraps.getPrototypeOf : () => {
//       return Reflect.getPrototypeOf(target)
//   },
//   has: existingTraps ? existingTraps.has : (_: unknown, key: PropertyKey) => {
//       return Reflect.has(target, key)
//   },
//   deleteProperty: existingTraps ? existingTraps.deleteProperty : (_: unknown, key: any) => {
//       return Reflect.deleteProperty(target, key)
//   },
//   ownKeys: existingTraps ? existingTraps.ownKeys : () => {
//       return Reflect.ownKeys(target)
//   },
//   setPrototypeOf: existingTraps ? existingTraps.setPrototypeOf : (_: unknown, proto: ReactiveModelContainer | null) => {
//       return Reflect.setPrototypeOf(target, proto)
//   },
//   isExtensible: existingTraps ? existingTraps.isExtensible : () => {
//       return Reflect.isExtensible(target)
//   },
//   preventExtensions: existingTraps ? existingTraps.preventExtensions : () => {
//       return Reflect.preventExtensions(target)
//   },
//   getOwnPropertyDescriptor: existingTraps ? existingTraps.getOwnPropertyDescriptor : (_: unknown, key: PropertyKey) => {
//       return Reflect.getOwnPropertyDescriptor(target, key)
//   },
//   defineProperty: existingTraps ? existingTraps.defineProperty : (_: unknown, key: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => {
//       return Reflect.defineProperty(target, key, attributes)
//   }
//     }
// }
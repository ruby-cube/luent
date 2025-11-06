import { AnyObject, ReadonlyKeys } from "@rue/types";
import { debug, isFunction, isObject } from "@rue/utils";
import { ModelQuark } from "./ModelQuark";
import { Ion, isIon, MutableIon } from "../ion/Ion";
import { createIonicProxy, getIonizedModel, IonicProxy, IonizeOptions } from "./Ionic";
import { hasQuark, QUARK, quarkOf } from "../abstract/Quark";
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
   : T extends Inert<{}> ? T
   : IsAbsorbedIon<K, T> extends true ? T
   : T extends Function ? MaybeIonizedMethod<T>
   : T extends object ? Ionized<T>
   : T

export type MaybeIonize<T> = IsIonized<T> extends true ? T
   : T extends Function ? T
   // : IsInert<T> extends true ? T & { inerton: true }
   : T extends object ? Ionized<T>
   : T

// type IsCollection<T> = T extends EnrolledCollections[keyof EnrolledCollections] ? true : false



// type IonizeCollectionByMarkMap<T, MK, K> = MK extends Shallow ? Ionized<T> : Ionized<T,>
export const Ionic = ionize


export type ToRaw<T> = IsIonized<T> extends true ? T extends Ionized<infer R> ? R : T : T

type MaybeIonizedMethod<M extends Function> = M extends (this: infer U, ...args: any) => any ? (ThisType<U> & { method: M })['method'] : M

/**
 * Wrap the return of a method of an ionizable class with this type helper in order to 
 * propagate any deep ionization that has been defined in the class's defineIonicStructure config
 */
export type IonizeBy<H, T> = IsIonized<H> extends true ?
   (T extends AnyObject ? Ionized<T> : T) : T

export type MaybeIonized<T> = T extends AnyObject ? Ionized<T> : T
// T extends Ionized<infer O> ? O | T : T | Ionized<T>

// export function ionize<T, M>(target: T & object, methods?: (M & Methods) & ThisType<T & M & { super: T }>): M extends AnyObject ? Ionized<T, M> : Ionized<T> {
//    return ionizeModel(target, methods, MUTABLE) as M extends AnyObject ? Ionized<T> & M : Ionized<T>
// }

// const $location = ion('')

// const frog = ionize({
//    name: {
//       nom: 'kermit', qualities: {
//          gallant: true
//       }
//    },
//    setName(name: string) { return name },
//    $location,
// }, {
//    [MARK]: {
//       name: { qualities: inert }
//    },
//    doSomething() { }
// })

// const nom = frog.name


// class AnimationController {
//    canvas = document.createElement('canvas')
// }

// //@ts-expect-error
// frog.name = o





// const list = ionize([{ name: 'kermit' }])
// const i = list[0]


export type ToRawItems<T> = any[] extends T ? T extends Array<infer I> ? ToRaw<I>[] : T : T



type Proto = { [key: string]: (...args: any[]) => any }

export type InertMark = { '~markInert': true }
// export type IonizeWithInertItems = { '~markItemsInert': true }

// export type MarkMap = {
//    [key: PropertyKey]: MarkMap | InertMark | IonizeWithInertItems
// }

type Mark<T, MK> = MK extends undefined ? T : {
   [K in keyof T]:
   K extends keyof MK ?
   MK[K] extends InertMark ?
   Inert<T[K]>
   : MK[K] extends AnyObject ? Mark<T[K], MK[K]>
   : T[K]
   : T[K]
}

type IsInertMark<T> = T extends { '~markInert': true } ? true : false



// we need the markmap available to the maybeIonize function
// however lazy inert marking can cause discrepancies if the object is ionized 
// elsewhere before it can be marked inert. How can we manage this?
// [] TODO: For __DEV__, we need to store the trace of where an object is first ionized or marked inert. Then
// Then if we ever try to mark an ionized object inert, print where it was first ionized or marked
// QUESTION: Should we require a mark map then instead of devs calling inert on an object themselves?

//API
// export function ionize<T, PROTO>(target: T & object, proto?: (PROTO & Proto) & ThisType<T & PROTO & { super: T }>): PROTO extends AnyObject ? Ionized<ToRawItems<T>, PROTO> : Ionized<ToRawItems<T>> {
//    // TODO: store stack trace

//    return <unknown>getExistingIonizedModel(target, proto) as PROTO extends AnyObject ? Ionized<ToRawItems<T>, PROTO> : Ionized<ToRawItems<T>> ??
//       ionizeModel(target, proto, undefined) as PROTO extends AnyObject ? Ionized<ToRawItems<T>, PROTO> : Ionized<ToRawItems<T>>
// }

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

// export function defineDeepIonize<T extends object>(getConfig: () => IonizeOptions) {
//    return (obj: T) => ionize(obj, getConfig())
// }

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

// function _withInertItems<T, M>(target: T & object): M extends AnyObject ? Ionized<BasicInertItemCollection<ToRawItems<T>>, M> : Ionized<BasicInertItemCollection<ToRawItems<T>>> {
//    return ionizeModel(target, InertCollection.ITEMS) as M extends AnyObject ? Ionized<BasicInertItemCollection<ToRawItems<T>>, M> : Ionized<BasicInertItemCollection<ToRawItems<T>>>
// }

// _withInertItems['~markItemsInert'] = true as const

// export { _withInertItems as withInertItems }

// TODO:
// export function withInertKeys<T, M>(target: T & object, methods?: (M & Methods) & ThisType<T & M & { super: T }>): M extends AnyObject ? Ionized<Mark<ToRawItems<T>, ExtractMarks<M>>, M> : Ionized<ToRawItems<T>> {
//    return ionizeModel(target, methods, InertCollection.KEYS) as M extends AnyObject ? Ionized<Mark<ToRawItems<T>, ExtractMarks<M>>, M> : Ionized<ToRawItems<T>>
// }

// TODO:
// export function withInertEntries<T, M>(target: T & object, methods?: (M & Methods) & ThisType<T & M & { super: T }>): M extends AnyObject ? Ionized<Mark<ToRawItems<T>, ExtractMarks<M>>, M> : Ionized<ToRawItems<T>> {
//    return ionizeModel(target, methods, InertCollection.ENTRIES) as M extends AnyObject ? Ionized<Mark<ToRawItems<T>, ExtractMarks<M>>, M> : Ionized<ToRawItems<T>>
// }


// function mark<T extends object, MK>(obj: T, markMap: MK): Mark<T, MK> {
//    for (const key in markMap) {
//       const mk = markMap[key];
//       if (key in obj) {
//          if (isFunction(mk)) {
//             mk(obj[key as unknown as keyof T])
//          }
//          else if (isObject(mk)) {
//             const value = obj[key as unknown as keyof T]
//             if (isObject(value)) {
//                mark(value, mk)
//             }
//          }
//       }
//    }
//    return obj as Mark<T, MK>
// }

// ionize.deep = ionizeDeep

// ionize.mu = createMutableIonizedModel

// function createMutableIonizedModel(target: object, methods?: object |undefined){
// return ionizeModel(target, methods, MUTABLE)
// }



// function traceIonized() { // TODO: what about objects that are ionized by ionsOf()?
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
//    M extends { [K in keyof Partial<T>]: 'public' | InertMark }
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

// type Marked<T extends AnyObject, M extends { [K in keyof Partial<T>]: 'public' | InertMark }> = Omit<T, keyof M> & { [K in keyof M]: M[K] extends InertMark ? T[K] & Inert : T[K] } // TODO: Mark public

export function storeSnapshot(modelQuark: ModelQuark, clone?: AnyObject) {
   // timeTraveler.takeSnapshot(toRaw(modelQuark), $effectCycle().count, clone)
}

export function isIonicProxy(value: any): value is IonicProxy {
   if (!isObject(value)) return false;
   return hasQuark(value) && quarkOf(value) instanceof ModelQuark;
}


export function ionizeModel(target: object, options: IonizeOptions) {
   if (!isObject(target)) return target;
   // throw new Error(`INVALID INPUT: ionize or ionize must receive a reference value (object), not a primitive`)
   if (isIonicProxy(target) || isFunction(target) || isInert(target)) {
      if (options) debug.warn(`CASE RESEARCH: Target is ${isIonicProxy(target) ? 'ionized model' : isIon(target) ? 'ion' : 'inert'}. Cannot extend using ionize()`)
      return target
   }
   return createIonicProxy(target, options)
}

export function isIonKey(key: PropertyKey): key is string {
   return typeof key === 'string' && /^\$[a-z]/.test(key)
}


export function toRaw<T>(target: T): ToRaw<T> {
   if (target instanceof ModelQuark) {
      return target.rawTarget as ToRaw<T>;
   }
   if (isIonicProxy(target)) {
      return quarkOf(target).rawTarget as ToRaw<T>;
   }
   return target as ToRaw<T>; // already raw target
}


// export function exposeIons<T>(model: T): asserts model is T & AsIons<T> {
//    if (!isIonicProxy(model)) throw new Error("model must be ionized")
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









// export function toWatchedProp(reactive: IonicProxy, key: PropertyKey) {
//     const modelQuark = reactive[QUARK]
//     const isIndex = toRaw(modelQuark) instanceof Array && isIntegerKey(key)
//     if (isIndex) {
//         (<MetaIonicCollection>modelQuark).addObservedEntryKey(key)
//     }
//     // clean up
//     const prop = asObservedProp(reactive, key)
//     const watchSubject = asTrackedAtom(prop)
//     watchSubject.onUnwatched(() => {
//         unobserve(prop, isIndex ? () => {
//             (<MetaIonicCollection>modelQuark).deleteObservedEntryKey(key)
//         } : undefined)
//     })
//     return prop;
// }


// function unobserve(prop: ObservedProp) {
//     const watchSubject = asTrackedAtom(prop)
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
import { AnyObject } from "@rue/types";
import { isObject } from "@rue/utils";
import { timeTraveler } from "./TimeTraveler";
import { useRenderCycle } from "../effects/RenderCycle";
import { META } from "../ReactiveEntity";
import { MetaIonicModel, IONIZED_MODEL } from "./MetaIonicModel";
import { Inert, isInert } from "./inert";
import { AnyIon, Ion, ion, isIon } from "../ion/Ion";
import { DerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { AtomicIon, MetaIon } from "../ion/AtomicIon";
import { createCustomIonicModel, getStructureConfigs } from "./IonizedModel";
import { PropIon } from "./PropIon";


// The current approach to reactivity depth is that all models are deeply reactive.
// However, reactivity is applied only to:
// - object literals that have NOT been marked inert
// - class instances whose DIRECT prototype has been registered as ionizable

//TODO: figure out the simplest way developers can add types to custom data strucures

export type IonizedModel<T extends AnyObject = AnyObject> = Ionized<T> //TODO: add ion properties $


export type Readonly<T extends AnyObject = AnyObject> = {
   readonly [K in keyof T]: T[K]
}

type Ionizable = object | any[] | Set<unknown> | Map<any, any>


const ionizedModels: WeakMap<AnyObject, IonizedModel> = new WeakMap()

export function registerIonizedModel(ionicModel: IonizedModel, target: AnyObject) {
   ionizedModels.set(target, ionicModel)
}

export function isIonizedModel(value: any): value is Ionized<AnyObject> {
   if (!isObject(value)) return false;
   return value[META]?.type === IONIZED_MODEL;
}

type AbsorbedIon<T> = {
   (...args: any[]): T;
   [META]: any;
}

function test_isAnyIon<T>(arg: AbsorbedIon<T>): T {
   return null as unknown as T
}


export type Ionized<T extends AnyObject, M = {}> = {
   [K in keyof T as (K extends '$getters' ? never : K extends keyof M ? K extends string ? `_${K}` : K : K)]:
   T[K] extends AbsorbedIon<infer V> ? K extends `$${string}` ? T[K] : V :
   T[K] extends { [META]: any } | Inert ? T[K]
   : T[K] extends (...args: any[]) => any ? IonizedGetter<T, K>
   : T[K] extends { [key: PropertyKey]: any } ? Ionized<T[K]>
   : T[K]
} & InvertIons<T, M> & M & { [META]: MetaIonicModel }

type ReadonlyIon<T> = {
   (selected?: true): T
   [META]: MetaIon;
}

type InvertIons<T extends AnyObject, M = {}> = {
   [K in keyof T as (K extends '$getters' ? never : K extends keyof M ? never : T[K] extends AbsorbedIon<any> ? K extends `$${infer S}` ? S : K extends string ? `$${K}` : never : T[K] extends (...args: any[]) => any ? never : K extends `$${string}` ? never : K extends string ? `$${K}` : never)]:
   T[K] extends AbsorbedIon<infer V> ? K extends `$${string}` ? V : T[K] : ReadonlyIon<T[K] extends { [META]: any } | ((...args: any[]) => any) | Inert ? T[K]
      : T[K] extends { [key: PropertyKey]: any } ? Ionized<T[K]>
      : T[K]>
}

type IonizedGetter<T, K extends keyof T> = T extends { $getters: AnyObject } ? K extends keyof T['$getters'] ? T['$getters'][K] : T[K] : T[K]

const $count = ion(0, { doSomething() { } })

const cat = ionize({
   count: $count,
   chow: {
      blog: 9
   },
   flower: 'hi',
   doSomething() {

   }
}, { doOther() { }, doSomething() { } })


//API
export function ionize<T extends AnyObject, M extends {}>(target: T, methods?: M): T extends Inert | Ion | Ionized<T> ? T : Ionized<T, M> {
   if (isIonizedModel(target) || isIon(target) || isInert(target)) {
      if (methods) throw new Error(`INVALID INPUT: Cannot add methods to an ion or non-ionizable target using ionize.`)
      return target as unknown as T extends Inert | Ion | Ionized<T> ? T : Ionized<T, M>;
   }
   //TODO: What about a readonly object that is not an ionic model?
   if (!isObject(target)) throw new Error(`INVALID INPUT: ionize or ionize must receive a reference-type primitive (object)`)
   const existingIonicModel = ionizedModels.get(target)
   if (existingIonicModel) return existingIonicModel as T extends Inert | Ion | Ionized<T> ? T : Ionized<T, M>;
   return createIonicModel(target, methods) as T extends Inert | Ion | Ionized<T> ? T : Ionized<T, M>
}



export function storeSnapshot(metaIonicModel: MetaIonicModel, clone?: AnyObject) {
   timeTraveler.takeSnapshot(toRaw(metaIonicModel), useRenderCycle().count, clone)
}

// export function recordOp(reactive: IonizedModel, op: MutationRecord) {
//     useRenderCycle().recordOp(reactive, op)
// }


type AsRaw<T> = T extends MetaIonicModel<infer R> ? R : T extends IonizedModel<infer R> ? R : T

export function toRaw<T>(target: T): AsRaw<T> {
   if (target instanceof MetaIonicModel) return target.rawTarget;
   if (isIonizedModel(target)) return asMetaIonicModel(target).rawTarget as AsRaw<T>;
   return target as AsRaw<T>; // already raw target
}


// export function toRawIfNeeded(
//     newValue: any,
//     key?: ProxyTargetKey
// ) {
//     if (isIonizedModel(newValue)) return toRaw(newValue);
//     return newValue;
// }


export function createIonicModel(
   target: object,
   methods: object | undefined
): object {
   return createCustomIonicModel(getStructureConfigs(target), target, methods)
   // return isTuple(target) ? createIonicTuple(target, methods)
   //     : target instanceof Array ? createIonicArray(target, methods)
   //         : target instanceof Set ? createIonicSet(target, methods)
   //             : target instanceof Map ? createIonicMap(target, methods)
   //                 : createIonicObject(target, methods)
}











// function getNonTrackableKeys(target: AnyObject) {
//     return new Set(Object.getOwnPropertyNames(Object.getPrototypeOf(target)))
// }









// export function toWatchedProp(reactive: IonizedModel, key: PropertyKey) {
//     const metaIonicModel = reactive[META]
//     const isIndex = toRaw(metaIonicModel) instanceof Array && isIntegerKey(key)
//     if (isIndex) {
//         (<MetaIonicCollection>metaIonicModel).addObservedEntryKey(key)
//     }
//     // clean up
//     const prop = asObservedProp(reactive, key)
//     const watchSubject = asWatchSubject(prop)
//     watchSubject.onUnwatched(() => {
//         unobserve(prop, isIndex ? () => {
//             (<MetaIonicCollection>metaIonicModel).deleteObservedEntryKey(key)
//         } : undefined)
//     })
//     return prop;
// }


// function unobserve(prop: ObservedProp) {
//     const watchSubject = asWatchSubject(prop)
//     const atom = asIonicAtom(prop)
//     if (watchSubject.watchCount === 0 && atom.derivations.size === 0) {
//         prop.destroy()
//     }
// }


// Because insertion of values don't yield differing new and old values for size and length in the setter,
// we need to manually check old and new values at time of mutation
// function isNonSettable(key: string, structureConfigs: any[]) {
//     if ((DataStructure === Set || DataStructure === Map) && key === 'size') return true;
//     return false;
// }





// export function triggerIonicModelWithSetOp(
//     reactive: IonizedModel,
//     key: string | symbol,
//     newValue: any,
//     oldValue: any,
// ) {
//     if (isWatched(reactive)) {
//         useRenderCycle().recordOp(reactive, {
//             target: reactive,
//             op: {
//                 type: '[[set]]',
//                 key,
//                 newValue: newValue,
//                 oldValue
//             }
//         })

//         triggerIonicModel(reactive)
//     }

//     // if (isNestedWatched(reactive)) {
//     //     const [rootWatchedModel, keyPath] = getRootWatchedModelAndKeyPath(reactive)
//     //     recordOp(rootWatchedModel, {
//     //         target: reactive,
//     //         targetPath: keyPath,
//     //         root: rootWatchedModel,
//     //         op: {
//     //             type: '[[set]]',
//     //             key,
//     //             newValue: newValue,
//     //             oldValue
//     //         }
//     //     })

//     //     triggerIonicModel(rootWatchedModel)
//     // }
// }

export function asMetaIonicModel<T extends AnyObject>(reactive: Ionized<T>): MetaIonicModel<T> {
   return reactive[META] as MetaIonicModel<T>;
}


// export type ReactiveTraps<T extends Ionizable = Ionizable> = ProxyHandler<T>


// export function createReactiveTraps(
//     target: AnyObject,
//     get: (target: AnyObject, key: ProxyTargetKey, receiver: AnyObject) => any,
//     set?: (target: AnyObject, key: ProxyTargetKey, value: any, receiver: AnyObject) => boolean,
//     existingTraps?: ReactiveTraps,
// ) {
//     return {
//         get,
//         set,
//         // getPrototypeOf: existingTraps ? existingTraps.getPrototypeOf : () => {
//         //     return Reflect.getPrototypeOf(target)
//         // },
//         // has: existingTraps ? existingTraps.has : (_: unknown, key: PropertyKey) => {
//         //     return Reflect.has(target, key)
//         // },
//         // deleteProperty: existingTraps ? existingTraps.deleteProperty : (_: unknown, key: any) => {
//         //     return Reflect.deleteProperty(target, key)
//         // },
//         // ownKeys: existingTraps ? existingTraps.ownKeys : () => {
//         //     return Reflect.ownKeys(target)
//         // },
//         // setPrototypeOf: existingTraps ? existingTraps.setPrototypeOf : (_: unknown, proto: ReactiveModelContainer | null) => {
//         //     return Reflect.setPrototypeOf(target, proto)
//         // },
//         // isExtensible: existingTraps ? existingTraps.isExtensible : () => {
//         //     return Reflect.isExtensible(target)
//         // },
//         // preventExtensions: existingTraps ? existingTraps.preventExtensions : () => {
//         //     return Reflect.preventExtensions(target)
//         // },
//         // getOwnPropertyDescriptor: existingTraps ? existingTraps.getOwnPropertyDescriptor : (_: unknown, key: PropertyKey) => {
//         //     return Reflect.getOwnPropertyDescriptor(target, key)
//         // },
//         // defineProperty: existingTraps ? existingTraps.defineProperty : (_: unknown, key: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => {
//         //     return Reflect.defineProperty(target, key, attributes)
//         // }
//     }
// }
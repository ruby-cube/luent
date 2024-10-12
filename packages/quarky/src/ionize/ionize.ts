import { AnyObject } from "@rue/types";
import { isObject, ProxyTargetKey } from "@rue/utils";
import { timeTraveler } from "./TimeTraveler";
import { trigger, triggerIonicModel } from "../trigger";
import { useRenderCycle } from "../effects/RenderCycle";
import { META } from "../ReactiveEntity";
import { MetaIonicModel, IONIC_MODEL } from "./MetaIonicModel";
import { isInert } from "./inert";
import { isIonizable } from "./ionizable";
import { AnyIon, isAnyIon } from "../ion/AnyIon";
import { DerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { Ion } from "../ion/Ion";
import { getObservedProp, PropIon } from "./PropIon";
import { isProtectedProxy, isReadonlyProxy } from "./ProtectedIonicModel";
import { createCustomIonicModel, getStructureConfigs } from "./IonicModel";


// The current approach to reactivity depth is that all models are deeply reactive.
// However, reactivity is applied only to:
// - object literals that have NOT been marked inert
// - class instances whose DIRECT prototype has been registered as ionizable

/**
 * Deep and shallow reactives have been deprecated: Since there's a lot of difficulty typing method outputs of deeply reactive objects 
 * (eg. getQualities() should output a reactive object, but typing that requires a lot of boilerplate 
 * by the developer), we cannot mark reactive objects.
 * This means developers must not depend on typescript to know if an object is reactive or not.
 */

//INTERNAL
export type IonicModel<T extends AnyObject = AnyObject> = T & { readonly [IONIC_MODEL]?: true }


export type Readonly<T extends AnyObject = AnyObject> = {
    readonly [K in keyof T]: T[K]
}

type Ionizable = object | any[] | Set<unknown> | Map<any, any>


const ionicModels: WeakMap<AnyObject, IonicModel> = new WeakMap()

export function registerIonicModel(ionicModel: IonicModel, target: AnyObject) {
    ionicModels.set(target, ionicModel)
}

export function isIonicModel(value: any): value is IonicModel {
    if (!isObject(value)) return false;
    return value[META]?.type === IONIC_MODEL;
}

type Ionized<T extends AnyObject, M> = {
    [K in keyof T]: T[K] extends Ion<infer V> | DerivedIon<infer V> | WritableDerivedIon<infer V> ? V : T[K]
} & M



//API
export function ionize<T extends AnyObject, M extends AnyObject>(target: T, methods?: M): { [K in keyof Ionized<T, M>]: Ionized<T, M>[K] } {
    if (isIonicModel(target) || isAnyIon(target) || isInert(target) || !isIonizable(target)) {
        if (methods) throw new Error(`INVALID INPUT: Cannot add methods to an ion or non-ionizable target using ionize.`)
        return target as T & M;
    }
    if (!isObject(target)) throw new Error(`INVALID INPUT: ionize or ionize must receive a reference-type primitive (object)`)
    const existingIonicModel = ionicModels.get(target)
    if (existingIonicModel) return existingIonicModel as T & M;
    return createIonicModel(target, methods) as T & M
}



export function storeSnapshot(metaIonicModel: MetaIonicModel, clone?: AnyObject) {
    timeTraveler.takeSnapshot(toRaw(metaIonicModel), useRenderCycle().count, clone)
}

// export function recordOp(reactive: IonicModel, op: MutationRecord) {
//     useRenderCycle().recordOp(reactive, op)
// }


type AsRaw<T> = T extends MetaIonicModel<infer R> ? R : T extends IonicModel<infer R> ? R : T

export function toRaw<T>(target: T): AsRaw<T> {
    if (target instanceof MetaIonicModel) return target.rawTarget;
    if (isIonicModel(target)) return asMetaIonicModel(target).rawTarget as AsRaw<T>;
    return target as AsRaw<T>; // already raw target
}


// export function toRawIfNeeded(
//     newValue: any,
//     key?: ProxyTargetKey
// ) {
//     if (isIonicModel(newValue)) return toRaw(newValue);
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









// export function toWatchedProp(reactive: IonicModel, key: PropertyKey) {
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
//     reactive: IonicModel,
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

export function asMetaIonicModel<T extends AnyObject>(reactive: IonicModel<T>): MetaIonicModel<T> {
    return reactive[META];
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
import { AnyObject } from "@rue/types";
import { isObject, ProxyTargetKey } from "@rue/utils";
import { isTuple } from "./tuple";
import { getObservedProp } from "./ObservedProp";
import { timeTraveler } from "./TimeTraveler";
import { trigger, triggerIonicAtom, triggerIonicModel } from "../trigger";
import { useRenderCycle } from "../effects/RenderCycle";
import { MutationRecord } from "../effects/deepWatch";
import { isWatched } from "../effects/WatchTarget";
import { META } from "../ReactiveEntity";
import { createIonicArray, createIonicTuple } from "./IonicArray";
import { createIonicSet } from "./IonicSet";
import { createIonicMap } from "./IonicMap";
import { createIonicObject } from "./IonicObject";
import { Collection, MetaIonicCollection, MetaIonicModel, IONIC_MODEL } from "./MetaIonicModel";
import { isInert } from "./inert";
import { isIonizable } from "./ionizable";
import { AnyIon, isAnyIon } from "../ion/AnyIon";
import { DerivedIon, WritableDerivedIon } from "../derivations/DerivedIon";
import { ReactiveIon } from "../ion/ReactiveIon";
import { PropIon } from "./PropIon";


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
    [K in keyof T]: T[K] extends ReactiveIon<infer V> | DerivedIon<infer V> | WritableDerivedIon<infer V> ? V : T[K]
} & M



//TODO: should return T if not ionizable or is an ion
//QUESTION: Can methods be added to existing ions this way?

//API
export function ionize<T extends AnyObject, M extends AnyObject>(target: T, methods?: M): { [K in keyof Ionized<T, M>]: Ionized<T, M>[K] } {
    if (isAnyIon(target) || isInert(target) || !isIonizable(target)) return target as T;
    if (!isObject(target)) throw new Error(`INVALID INPUT: ionize or ionize must receive a reference-type primitive (object)`)
    const existingIonicModel = ionicModels.get(target)
    if (existingIonicModel) return existingIonicModel as T & M;
    return createReactiveModel(target, methods) as T & M
}



export function storeSnapshot(metaIonicModel: MetaIonicModel, clone?: AnyObject) {
    timeTraveler.takeSnapshot(toRaw(metaIonicModel), useRenderCycle().count, clone)
}

export function recordOp(reactive: IonicModel, op: MutationRecord) {
    useRenderCycle().recordOp(reactive, op)
}


type AsRaw<T> = T extends MetaIonicModel<infer R> ? R : T extends IonicModel<infer R> ? R : T

export function toRaw<T>(target: T): AsRaw<T> {
    if (target instanceof MetaIonicModel) return target.rawTarget;
    if (isIonicModel(target)) return asMetaIonicModel(target).rawTarget as AsRaw<T>;
    return target as AsRaw<T>; // already raw target
}


export function toRawIfNeeded(
    newValue: any,
    key?: ProxyTargetKey
) {
    if (isIonicModel(newValue)) return toRaw(newValue);
    return newValue;
}


export function createReactiveModel(
    target: object,
    methods: object | undefined
): object {
    return isTuple(target) ? createIonicTuple(target, methods)
        : target instanceof Array ? createIonicArray(target, methods)
            : target instanceof Set ? createIonicSet(target, methods)
                : target instanceof Map ? createIonicMap(target, methods)
                    : createIonicObject(target, methods)
}





export function isNonTrackable(key: PropertyKey, DataStructure: typeof Array | typeof Object | typeof Set | typeof Map) {
    if (typeof key !== "string") return false;
    if (DataStructure instanceof Array || DataStructure instanceof Set || DataStructure instanceof Map)
        return key in nonTrackableCollectionKeys || key in nonTrackableObjectKeys;
    return key in nonTrackableObjectKeys
}

//TODO: actually, there are many methods that should be trackable! like array.find ... etc
const nonTrackableObjectKeys = {
    constructor: true,
    __defineGetter__: true,
    __defineSetter__: true,
    hasOwnProperty: true,
    __lookupGetter__: true,
    __lookupSetter__: true,
    isPrototypeOf: true,
    propertyIsEnumerable: true,
    toString: true,
    valueOf: true,
    __proto__: true,
    toLocaleString: true
}

const nonTrackableCollectionKeys = {
    forEach: true
}

const trackableCollectionOps = {
    keys: true,  // newIterable = keys()
    entries: true, // newEntriesIterator = entries()
    values: true, // newIterable = values()
}

const trackableArrayOps = {
    // same as accessor
    at: true, // item = at(index) //NOTE: trackable ops

    // whole array, triggered by any change to array

    toReversed: true, // newArray = toReversed()
    flat: true, // newArray = flat(depth?)
    toSorted: true, // newArray = toSorted(compareFn?)
    flatMap: true, // newArray = flatMap(callbackFn, thisArg?)
    map: true, // newArray = map(callbackFn, thisArg?)
    reduce: true, // result = reduce(callbackFn, initialValue?)
    reduceRight: true, // result = reduceRight(callbackFn, initialValue?)

    join: true, // string = join(separator?)
    toLocaleString: true, // string = toLocaleString() 
    toString: true, // string = toString()


    // check if result changed
    lastIndexOf: true, // index = lastIndexOf(item, fromIndex)
    indexOf: true, // index = indexOf(item, fromIndex)
    includes: true, // boolean = includes(item, fromIndex?)

    // args
    find: true, // item = find(callbackFn, thisArg?)
    findLast: true, // item = findLast(callbackFn, thisArg?)

    findIndex: true, // index = findIndex(callbackFn, thisArg?)
    findLastIndex: true, // index = findLastIndex(callbackFn, thisArg?)

    filter: true, // newArray = filter(callbackFn, thisArg?)

    every: true, // boolean = every(callbackFn, thisArg?)
    some: true, // boolean = some(callbackFn, thisArg?)


    // copyWithin: true,
    // fill: true,
    // pop: true,
    // push: true,
    // reverse: true,
    // shift: true,
    // unshift: true,
    // sort: true,
    // splice: true,

    // keys: true,  // newIterable = keys()
    // entries: true, // newEntriesIterator = entries()
    // values: true, // newIterable = values()
    // forEach: true,


    slice: true, // newArray = slice(start?, end?)

    concat: true, // newArray = concat(arrayB, arrayC, ...)
    toSpliced: true, // newArray = toSpliced(start?, deleteCount?, item1, item2, /* …, */ itemN)

    with: true, // newArray = arrayInstance.with(index, value)
}

const trackableMapOps = {
    get: true, // value = get(key)  //NOTE: trackable ops
    has: true, // boolean = has(key) //NOTE: trackable ops
    // set: true,
    // delete: true,
    // clear: true,
    // forEach: true,
    // entries: true, // newEntriesIterator = entries()
    // keys: true, // newIterable = keys()
    // values: true, // newIterable = values()
    // size: true,
}

const trackableSetOps = {
    has: true, // boolean = has(item) //NOTE: trackable ops

    // add: true,
    // delete: true,
    // clear: true,
    // forEach: true,
    // size: true,
    // entries: true, // newEntriesIterator = entries()
    // keys: true, // newIterable = keys()
    // values: true, // newIterable = values()

    difference: true, // newSet = difference(otherSet) 
    union: true,
    intersection: true,
    symmetricDifference: true,

    isSubsetOf: true, // boolean = isSubsetOf(otherSet)
    isSupersetOf: true, // boolean = isSupersetOf(otherSet)
    isDisjointFrom: true, // boolean = isDisjointFrom(otherSet)
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
//     const watchTarget = asWatchTarget(prop)
//     watchTarget.onUnwatched(() => {
//         unobserve(prop, isIndex ? () => {
//             (<MetaIonicCollection>metaIonicModel).deleteObservedEntryKey(key)
//         } : undefined)
//     })
//     return prop;
// }


// function unobserve(prop: ObservedProp) {
//     const watchTarget = asWatchTarget(prop)
//     const atom = asIonicAtom(prop)
//     if (watchTarget.watchCount === 0 && atom.derivations.size === 0) {
//         prop.destroy()
//     }
// }




export function reactiveSetter(
    DataStructure: typeof Array | typeof Object | typeof Map | typeof Set, // and Tuple
    reactive: IonicModel,
    metaIonicModel: MetaIonicModel,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    if (metaIonicModel.isNewProperty(key)) metaIonicModel.registerNewProperty(key)
    const oldValue = Reflect.get(target, key, receiver);
    if (isAnyIon(oldValue) && !isAnyIon(newValue)) {
        return setAbsorbedIon(oldValue, newValue)
    }
    if (oldValue === newValue
        || isNonTrackable(key, DataStructure)
        || isNonSettable(<string>key, DataStructure)
        || !isWritable(target, key)) { //QUESTION: Are these conditions redundant?
        target[key] = newValue
        return true;
    }

    const _newValue = toRawIfNeeded(isAnyIon(newValue) ? newValue() : newValue, key)
    const _oldValue = isAnyIon(oldValue) ? oldValue() : oldValue

    target[key] = isAnyIon(newValue) ? newValue : _newValue

    storeSnapshot(metaIonicModel)

    const prop = getObservedProp(reactive, key);
    if (prop) {
        trigger(prop, _newValue, _oldValue)
    }

    triggerIonicModelWithSetOp(
        reactive,
        key,
        _newValue,
        _oldValue,
    )

    return true;
}

export function setAbsorbedIon(ion: AnyIon, value: any) {
    if ('set' in ion) {
        ion.set(value);
        return true;
    }
    if (__DEV__) throw new Error("Absorbed Ion is read only")
    return false;
}


function isWritable(target: Object, key: PropertyKey) {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (descriptor?.writable === true) return true;
    return false;
}

// Because insertion of values don't yield differing new and old values for size and length in the setter,
// we need to manually check old and new values at time of mutation
function isNonSettable(key: string, DataStructure: typeof Array | typeof Object | typeof Set | typeof Map) {
    if ((DataStructure === Set || DataStructure === Map) && key === 'size') return true;
    return false;
}





export function triggerIonicModelWithSetOp(
    reactive: IonicModel,
    key: string | symbol,
    newValue: any,
    oldValue: any,
) {
    if (isWatched(reactive)) {
        recordOp(reactive, {
            target: reactive,
            op: {
                type: '[[set]]',
                key,
                newValue: newValue,
                oldValue
            }
        })

        triggerIonicModel(reactive)
    }

    // if (isNestedWatched(reactive)) {
    //     const [rootWatchedModel, keyPath] = getRootWatchedModelAndKeyPath(reactive)
    //     recordOp(rootWatchedModel, {
    //         target: reactive,
    //         targetPath: keyPath,
    //         root: rootWatchedModel,
    //         op: {
    //             type: '[[set]]',
    //             key,
    //             newValue: newValue,
    //             oldValue
    //         }
    //     })

    //     triggerIonicModel(rootWatchedModel)
    // }
}

export function asMetaIonicModel<T extends AnyObject>(reactive: IonicModel<T>): T extends Collection ? MetaIonicCollection<T> : MetaIonicModel<T> {
    return reactive[META];
}


export type ReactiveTraps<T extends Ionizable = Ionizable> = ProxyHandler<T>


export function createReactiveTraps(
    target: AnyObject,
    get: (target: AnyObject, key: ProxyTargetKey, receiver: AnyObject) => any,
    set?: (target: AnyObject, key: ProxyTargetKey, value: any, receiver: AnyObject) => boolean,
    existingTraps?: ReactiveTraps,
) {
    return {
        get,
        set,
        // getPrototypeOf: existingTraps ? existingTraps.getPrototypeOf : () => {
        //     return Reflect.getPrototypeOf(target)
        // },
        // has: existingTraps ? existingTraps.has : (_: unknown, key: PropertyKey) => {
        //     return Reflect.has(target, key)
        // },
        // deleteProperty: existingTraps ? existingTraps.deleteProperty : (_: unknown, key: any) => {
        //     return Reflect.deleteProperty(target, key)
        // },
        // ownKeys: existingTraps ? existingTraps.ownKeys : () => {
        //     return Reflect.ownKeys(target)
        // },
        // setPrototypeOf: existingTraps ? existingTraps.setPrototypeOf : (_: unknown, proto: ReactiveModelContainer | null) => {
        //     return Reflect.setPrototypeOf(target, proto)
        // },
        // isExtensible: existingTraps ? existingTraps.isExtensible : () => {
        //     return Reflect.isExtensible(target)
        // },
        // preventExtensions: existingTraps ? existingTraps.preventExtensions : () => {
        //     return Reflect.preventExtensions(target)
        // },
        // getOwnPropertyDescriptor: existingTraps ? existingTraps.getOwnPropertyDescriptor : (_: unknown, key: PropertyKey) => {
        //     return Reflect.getOwnPropertyDescriptor(target, key)
        // },
        // defineProperty: existingTraps ? existingTraps.defineProperty : (_: unknown, key: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => {
        //     return Reflect.defineProperty(target, key, attributes)
        // }
    }
}
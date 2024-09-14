import { AnyObject } from "@rue/types";
import { emitSignal } from "../debug";
import { isPlainObject, isMutatingArrayMethod, isObject, ProxyTargetKey } from "@rue/utils";
import { isTuple } from "./tuple";
import { asObservedProp, getObservedProp, ObservedProp } from "./ObservedProp";
import { timeTraveler } from "./TimeTraveler";
import { asTrackedOp, TrackedOp } from "./TrackedOp";
import { getRootWatchedModelAndKeyPath, isNestedWatched } from "../effects/deepWatch";
import { trigger, triggerReactiveAtom, triggerReactiveModel } from "../trigger";
import { useUpdateCycle } from "../effects/UpdateCycle";
import { MutationRecord } from "../effects/deepWatch";
import { asWatchTarget, isWatched } from "../effects/WatchTarget";
// import { Collection, isCollection, MetaReactiveCollection } from "./ReactiveCollection";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { createReactiveArray, createReactiveTuple } from "./ReactiveArray";
import { createReactiveSet } from "./ReactiveSet";
import { createReactiveMap } from "./ReactiveMap";
import { createReactiveObject } from "./ReactiveObject";
import { Collection, isCollection, MetaReactiveCollection, MetaReactiveModel, REACTIVE_MODEL } from "./MetaReactiveModel";

export enum ModelReactivityDepth {
    NONE = 0, // not reactive
    SHALLOW = 1,
    DEEP = 2
}
export const DEEP = true;

export type ReactiveModel<T extends AnyObject = AnyObject> = T & { readonly [REACTIVE_MODEL]?: true }

export type DeepReactiveModel<T extends AnyObject = AnyObject> = { [K in keyof T]: T[K] extends Function ? (this: DeepReactiveModel<T>, ...args: Parameters<T[K]>) => ReturnType<T[K]> : T[K] extends AnyObject ? DeepReactiveModel<T[K]> : T[K] } & {
    readonly _$: ReactiveModel<T>,
    readonly [REACTIVE_MODEL]?: true
}

export type Readonly<T extends AnyObject = AnyObject> = {
    readonly [K in keyof T]: T[K]
}

type Reactivizable = object | any[] | Set<unknown> | Map<any, any>

export type ReactiveTraps<T extends Reactivizable = Reactivizable> = ProxyHandler<T>

const reactivesMap: WeakMap<AnyObject, MetaReactiveModel> = new WeakMap()

export function registerReactive(
    target: AnyObject,
    reactive: ReactiveModel,
    metaReactive: MetaReactiveModel,
    deep?: boolean
) {
    if (deep) metaReactive.initDeepReactive(reactive)
    else metaReactive.initShallowReactive(reactive)
    reactivesMap.set(target, metaReactive)
    return reactive;
}



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



export function isReactiveModel(value: any): value is ReactiveModel {
    if (!isObject(value)) return false;
    return value[META]?.type === REACTIVE_MODEL;
}

export function isDeepReactive(value: any): value is DeepReactiveModel {
    return isObject(value) && value[META]?.deepReactive === value
}

export function isShallowReactive<T>(value: T): value is T extends ReactiveModel ? T : never {
    return isObject(value) && value[META]?.shallowReactive === value
}

type AsDeepReactiveModel<T extends AnyObject> = T extends DeepReactiveModel ? T : DeepReactiveModel<T>;
type AsReactiveModel<T extends AnyObject> = T extends ReactiveModel ? T : ReactiveModel<T>;

//INTERNAL
export function asDeepReactive<T extends AnyObject>(target: T): AsDeepReactiveModel<T> {
    if (isDeepReactive(target)) return target as AsDeepReactiveModel<T>;
    const rawTarget = toRaw(target);
    const meta = reactivesMap.get(rawTarget)
    if (!meta) return _createReactiveModel(rawTarget, DEEP) as AsDeepReactiveModel<T>;
    const reactive = meta.deepReactive;
    if (reactive) return reactive as AsDeepReactiveModel<T>;
    return _createReactiveModel(rawTarget, DEEP, meta) as AsDeepReactiveModel<T>;
}

//INTERNAL
export function asShallowReactive<T extends AnyObject>(target: T): AsReactiveModel<T> {
    if (isShallowReactive(target)) return target as AsReactiveModel<T>;
    const rawTarget = toRaw(target);
    const meta = reactivesMap.get(rawTarget)
    if (!meta) return _createReactiveModel(rawTarget) as AsReactiveModel<T>;
    const reactive = meta.shallowReactive;
    if (reactive) return reactive as AsReactiveModel<T>;
    return _createReactiveModel(rawTarget, !DEEP, meta) as AsReactiveModel<T>;
}


export function maybeAsDeepReactive(value: any, deep: boolean | undefined) {
    return value instanceof Object ? deep ? asDeepReactive(value) : value : value
}


type MetaReactive<T extends AnyObject = AnyObject> = T extends Collection ? MetaReactiveCollection<T> : MetaReactiveModel<T>

// export class ReactiveModelContainer<T extends AnyObject = AnyObject> {
//     [META]: MetaReactive<T>

//     constructor(rawTarget: T, deep: boolean) {
//         this[META] = isCollection(rawTarget) ? new MetaReactiveCollection(rawTarget, deep) as MetaReactive<T> : new MetaReactiveModel(rawTarget, deep) as MetaReactive<T>
//     }
// }






function _createReactiveModel<T extends AnyObject>(
    target: T,
    deep?: boolean,
    existingMeta?: MetaReactiveModel
): ReactiveModel | T {
    if (!isObject(target)) throw new Error(`INVALID INPUT: o$ or o$$ must receive a reference-type primitive (object)`)
    return createReactive(target, deep, existingMeta)
}

//API
export function o$$<T extends AnyObject>(target: T): AsDeepReactiveModel<T> {
    return asDeepReactive(target)
}

//API
export function o$<T extends AnyObject>(target: T): AsReactiveModel<T> {
    return asShallowReactive(target)
}



export function storeSnapshot(metaReactive: MetaReactiveModel, clone?: AnyObject) {
    timeTraveler.takeSnapshot(toRaw(metaReactive), useUpdateCycle().count, clone)
}

export function recordOp(reactive: ReactiveModel, op: MutationRecord) {
    useUpdateCycle().recordOp(reactive, op)
}


type AsRaw<T> = T extends MetaReactiveModel<infer R> ? R : T extends ReactiveModel<infer R> ? R : T

export function toRaw<T>(target: T): AsRaw<T> {
    console.log("to Raw target", target)
    if (target instanceof MetaReactiveModel) return target.rawTarget;
    if (isReactiveModel(target)) return getMetaReactive(target).rawTarget as AsRaw<T>;
    return target as AsRaw<T>; // already raw target
}


export function maybeUnreactivize(
    newValue: any,
) {
    if (isReactiveModel(newValue)) return toRaw(newValue);
    return newValue;
    // const reactiveDepth = shouldUnreactivize(metaReactive, newValue);
    // return reactiveDepth === ModelReactivityDepth.DEEP ? createReactive(newValue, DEEP)
    //     : reactiveDepth === ModelReactivityDepth.SHALLOW ? createReactive(newValue)
    //         : newValue;
}

// export function shouldUnreactivize(
//     metaReactive: MetaReactiveModel,
//     newValue: any,
// ): ModelReactivityDepth | false {
//     if (!(newValue instanceof Object)) return false;
//     if (metaReactive.deep) return ModelReactivityDepth.DEEP;
//     if (isReactiveModel(prevValue)) return ModelReactivityDepth.SHALLOW;
//     return false;
// }

export function createReactive(
    value: AnyObject,
    deep?: boolean,
    existingMeta?: MetaReactiveModel
): ReactiveModel {
    return isTuple(value) ? createReactiveTuple(value, deep, <MetaReactiveCollection<any[]>>existingMeta)
        : value instanceof Array ? createReactiveArray(value, deep, <MetaReactiveCollection<any[]>>existingMeta)
            : value instanceof Set ? createReactiveSet(value, deep, <MetaReactiveCollection>existingMeta)
                : value instanceof Map ? createReactiveMap(value, deep, <MetaReactiveCollection>existingMeta)
                    : createReactiveObject(value, deep, existingMeta)
}

// function isReactiveCapsule(value: any): value is { $: AnyObject } {
//     if (!(value instanceof Object) || isPlainObject(value)) return false;
//     if (!('$' in value)) return false;
//     if (!(value.$ instanceof Object)) return false;
//     return true;
// }





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









// export function toWatchedProp(reactive: ReactiveModel, key: PropertyKey) {
//     const metaReactive = reactive[META]
//     const isIndex = toRaw(metaReactive) instanceof Array && isIntegerKey(key)
//     if (isIndex) {
//         (<MetaReactiveCollection>metaReactive).addObservedEntryKey(key)
//     }
//     // clean up
//     const prop = asObservedProp(reactive, key)
//     const watchTarget = asWatchTarget(prop)
//     watchTarget.onUnwatched(() => {
//         unobserve(prop, isIndex ? () => {
//             (<MetaReactiveCollection>metaReactive).deleteObservedEntryKey(key)
//         } : undefined)
//     })
//     return prop;
// }


// function unobserve(prop: ObservedProp) {
//     const watchTarget = asWatchTarget(prop)
//     const atom = asReactiveAtom(prop)
//     if (watchTarget.watchCount === 0 && atom.derivations.size === 0) {
//         prop.destroy()
//     }
// }




export function reactiveSetter(
    DataStructure: typeof Array | typeof Object | typeof Map, // and Tuple
    reactive: ReactiveModel,
    metaReactive: MetaReactiveModel,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    // if (!prop) {
    //     console.log("reactive setter")
    //     target[key] = newValue
    //     return true;
    // }

    const oldValue = Reflect.get(target, key, receiver);
    if (oldValue === newValue
        || isNonTrackable(key, DataStructure)
        || isNonSettable(<string>key, DataStructure)
        || !isWritable(target, key)) { //QUESTION: Are these conditions redundant?
        target[key] = newValue
        return true;
    }

    const _newValue = maybeUnreactivize(newValue)
    target[key] = _newValue

    storeSnapshot(metaReactive)
    const prop = getObservedProp(reactive, key);
    if (prop) {
        trigger(prop)
    }
    triggerReactiveWithSetOp(
        reactive,
        key,
        _newValue,
        oldValue,
    )

    return true;
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





export function triggerReactiveWithSetOp(
    reactive: ReactiveModel,
    key: string | symbol,
    newValue: any,
    oldValue: any,
) {
    if (isWatched(getMetaReactive(reactive))) {
        recordOp(reactive, {
            target: reactive,
            op: {
                type: '[[set]]',
                key,
                newValue: newValue,
                oldValue
            }
        })

        triggerReactiveModel(reactive)
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

    //     triggerReactiveModel(rootWatchedModel)
    // }
}

export function getMetaReactive<T extends AnyObject>(reactive: ReactiveModel<T>): T extends Collection ? MetaReactiveCollection<T> : MetaReactiveModel<T> {
    return reactive[META];
}
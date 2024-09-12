import { AnyObject } from "@rue/types";
import { emitSignal } from "../debug";
import { isPlainObject, isMutatingArrayMethod } from "@rue/utils";
import { isTuple } from "./tuple";
import { asObservedProp, ObservedProp } from "./ObservedProp";
import { SnapshotManager } from "./SnapshotManager";
import { asTrackedOp, TrackedOp } from "./TrackedOp";
import { getRootWatchedModelAndKeyPath, isNestedWatched } from "../effects/deepWatch";
import { trigger, triggerReactiveAtom, triggerReactiveModel } from "../trigger";
import { asReactiveAtom, isReactiveAtom } from "../derivations/ReactiveAtom";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { useUpdateCycle } from "../effects/UpdateCycle";
import { MutationRecord } from "../effects/deepWatch";
import { MetaReactiveModel, REACTIVE_MODEL } from "./ReactiveModel";
import { asWatchTarget, isWatched } from "../effects/WatchTarget";
import { Collection, isCollection, MetaReactiveCollection } from "./ReactiveCollection";
import { META } from "../ReactiveEntity";
import { createReactiveArray } from "./ReactiveArray";
import { createReactiveSet } from "./ReactiveSet";
import { createReactiveMap } from "./ReactiveMap";

export enum ReactiveModelDepth {
    SHALLOW = 1,
    DEEP = 2
}

export type ReactiveModel<T extends AnyObject = AnyObject> = T & { [META]: MetaReactive<T> }

export type Readonly<T extends AnyObject = AnyObject> = {
    readonly [K in keyof T]: T[K]
}

export const DEEP = true;

export function isDeepReactive(value: any): value is ReactiveModel {
    return value[META]?.type === REACTIVE_MODEL && value[META]?.deep
}

type MetaReactive<T extends AnyObject = AnyObject> = T extends Collection ? MetaReactiveCollection<T> : MetaReactiveModel<T>

export class ReactiveModelContainer<T extends AnyObject = AnyObject> {
    [META]: MetaReactive<T>

    constructor(rawTarget: T, deep: boolean) {
        this[META] = isCollection(rawTarget) ? new MetaReactiveCollection(rawTarget, deep) as MetaReactive<T> : new MetaReactiveModel(rawTarget, deep) as MetaReactive<T>
    }
}




function _createReactiveModel<T extends AnyObject>(target: T, deep?: boolean): ReactiveModel<T> | T {
    if (isReactiveModel(target)) return target; // prevents double wrapped reactive

    const reactive = createReactive(target, deep)
    if (reactive === null) {
        if (__DEV__) console.warn(`INVALID INPUT: Reactive$ must receive a reference-type primitive (object)`)
        return target as T;
    }
    return reactive as ReactiveModel<T>;
}

// return {
export function DeepReactive$<T extends AnyObject>(target: T): ReactiveModel<T> | T {
    return _createReactiveModel(target, DEEP);
}

export function Reactive$<T extends AnyObject>(target: T): ReactiveModel<T> | T {
    return _createReactiveModel(target);
}

// mu<T extends ReactiveModel, R>(mutation: () => R): R {
//     // if (!localReactives.has(target)) throw "`mu` can only mutate local reactives created with corresponding `o$` function";
//     register.mutationPermitted = true;
//     const output = mutation();
//     register.mutationPermitted = false;
//     return output;
// }
// }
// }

const timeTraveler = new SnapshotManager()

export function storeSnapshot(metaReactive: MetaReactiveModel, clone?: AnyObject) {
    timeTraveler.takeSnapshot(toRaw(metaReactive), useUpdateCycle().count, clone)
}

export function recordOp(reactive: ReactiveModel, op: MutationRecord) {
    useUpdateCycle().recordOp(reactive, op)
}

export function isReactiveModel(obj: AnyObject): obj is ReactiveModel {
    if (!obj) return false;
    return obj[META]?.type === REACTIVE_MODEL;
}

export function isReactiveObject(obj: AnyObject): obj is ReactiveModel {
    const raw = toRaw(obj);
    if (raw instanceof Map) return false;
    if (raw instanceof Array) return false;
    if (raw instanceof Set) return false;
    return obj[META]?.type === REACTIVE_MODEL;
}

export function toRaw<T extends AnyObject>(target: MetaReactiveModel<T> | ReactiveModel<T> | T): T {
    if (target instanceof MetaReactiveModel) return target.rawTarget;
    if (isReactiveModel(target)) return target[META].rawTarget as T;
    return target; // already raw target
}

function createReactiveObject(
    target: AnyObject,
    deep: boolean = false
) {
    const container = new ReactiveModelContainer(target, deep)
    const metaReactive = container[META];

    const reactive = new Proxy(container, {
        get(_, key) {
            if (__DEV__) emitSignal();
            if (key === META) return metaReactive;
            const value = Reflect.get(target, key);
            const tracker = getActiveTracker();
            if (!tracker
                || isNonTrackable(key, Object)
                || Reflect.getOwnPropertyDescriptor(target, key)?.writable === false
            ) {
                return value;
            }
            tracker.track(asObservedProp(reactive, key));
            return value;
        },
        set(_, key, value, receiver) {
            return reactiveSetter(
                Object,
                metaReactive,
                target,
                key,
                value,
                receiver
            )
        },
        // ...useForwardingHandlers(target)
     

    })
    metaReactive.initReactiveModel(reactive)


    if (deep) {
        for (const key in target) {
            const value = target[key];
            if (!(value instanceof Object)) continue;
            if (isReactiveModel(value)) continue; // prevents double wrapped reactive
            const value$ = createReactive(value, DEEP)
            if (value$ === null) continue;
            target[key] = value$;
        }
    }
    return reactive;
}

export function maybeReactivize(
    newValue: any,
    metaReactive: MetaReactiveModel,
    oldValue: any,
) {
    if (isReactiveModel(newValue)) return newValue;
    const reactiveDepth = shouldReactivize(metaReactive, oldValue, newValue);
    return reactiveDepth === ReactiveModelDepth.DEEP ? createReactive(newValue, DEEP)
        : reactiveDepth === ReactiveModelDepth.SHALLOW ? createReactive(newValue)
            : newValue;
}

export function createReactive(
    value: any,
    deep?: boolean
): ReactiveModel | null {
    if (isReactiveModel(value)) return value;
    const reactive = isPlainObject(value) ? createReactiveObject(value, deep)
        // : isReactiveCapsule(value) ? createReactive(value.$, register, deep)
        : isTuple(value) ? createReactive(value, deep)
            : value instanceof Array ? createReactiveArray(value, deep)
                : value instanceof Set ? createReactiveSet(value, deep)
                    : value instanceof Map ? createReactiveMap(value, deep)
                        : null;
    return reactive as ReactiveModel;
}

// function isReactiveCapsule(value: any): value is { $: AnyObject } {
//     if (!(value instanceof Object) || isPlainObject(value)) return false;
//     if (!('$' in value)) return false;
//     if (!(value.$ instanceof Object)) return false;
//     return true;
// }


export function shouldReactivize(
    metaReactive: MetaReactiveModel,
    prevValue: any,
    newValue: any,
): ReactiveModelDepth | false {
    if (!(newValue instanceof Object)) return false;
    if (metaReactive.deep) return ReactiveModelDepth.DEEP;
    if (isReactiveModel(prevValue)) return ReactiveModelDepth.SHALLOW;
    return false;
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
    metaReactive: MetaReactiveModel,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    const prop = asObservedProp(metaReactive.o, key);
    if (!prop) {
        if (__DEV__) console.warn(`I'm curious if this is even possible--Setting a prop that is not a reactive prop`)
        target[key] = newValue //QUESTION: Do I need to pass the newValue through 'maybeReactivize"?
        return true;
    }

    const oldValue = Reflect.get(target, key, receiver);
    if (oldValue === newValue
        || isNonTrackable(key, DataStructure)
        || isNonSettable(<string>key, DataStructure)
        || !isWritable(target, key)) { //QUESTION: Are these conditions redundant?
        target[key] = newValue
        return true;
    }

    const _newValue = maybeReactivize(newValue, metaReactive, oldValue)
    target[key] = _newValue

    storeSnapshot(metaReactive)

    if (prop) {
        trigger(prop)
    }
    triggerReactiveWithSetOp(
        metaReactive.o,
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

export function useForwardingHandlers<T extends AnyObject>(target: T) {
    return {
        getPrototypeOf() {
            return Reflect.getPrototypeOf(target)
        },
        has(_: unknown, key: PropertyKey) {
            return Reflect.has(target, key)
        },
        deleteProperty(_: unknown, key: any) {
            return Reflect.deleteProperty(target, key)
        },
        ownKeys() {
            return Reflect.ownKeys(target)
        },
        setPrototypeOf(_: unknown, proto: ReactiveModelContainer | null) {
            return Reflect.setPrototypeOf(target, proto)
        },
        isExtensible() {
            return Reflect.isExtensible(target)
        },
        preventExtensions() {
            return Reflect.preventExtensions(target)
        },
        getOwnPropertyDescriptor(_: unknown, key: PropertyKey) {
            return Reflect.getOwnPropertyDescriptor(target, key)
        },
        defineProperty(_: unknown, key: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
            return Reflect.defineProperty(target, key, attributes)
        }
    }
}
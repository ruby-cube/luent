import { PausableListener } from "@rue/flask";
import { ionize, isIonizedModel, toRaw } from "../ionized/ionize";
import { OnChangeHandler, watch, WatchOptions } from "../reactivity/watch";
import { isIntegerKey } from "../ionized/IonizedArray";
import { AnyObject } from "@rue/types";
import { shallowClone } from "../ionized/TimeTraveler";

type WatchersMap = Map<AnyObject | ReactiveGet, PausableListener>


export type KeyPath = PropertyKey[]


export const insertOps = {
    push: { from: 0 },
    unshift: { from: 0 },
    splice: { from: 2 },
    fill: { at: 0 },
    add: { at: 0 },
    set: { from: 0 }
}

export function watchItems<T extends ReactiveGet>(
    reactiveList: IonizedModel<T[]>,
    effect: T extends () => infer R ? OnChangeHandler<R> : never,
    options?: WatchOptions
): PausableListener
export function watchItems<T extends IonizedModel>(
    reactiveList: IonizedModel<T[]>,
    effect: MutationEffect<T>,
    options?: WatchOptions
): PausableListener
export function watchItems<T extends ReactiveGet | IonizedModel>(
    reactiveList: IonizedModel<T[]>,
    effect: T extends () => infer R ? OnChangeHandler<R> : MutationEffect<T>,
    options?: WatchOptions
) {
    const array = toRaw(reactiveList) as T[] | ReactiveGet<T>[]
    const watchers: WatchersMap = new Map()
    const _options = options || {}

    for (const item of array) {
        const target = maybeReactivize(item, reactiveList)
        const watcher = watch(<ReactiveGet>target, effect, _options)
        watchers.set(item, watcher) // typecasting one of the possibilities to quiet typescript. Typescript can't handle intersections that mixes overloads
    }

    // watch new items, unwatch deleted items
    const listWatcher = watch(reactiveList, ({mutations}) => {
        for (const mutation of mutations!) {
            const { args, op, output, preopData } = mutation
            switch (op) {
                case 'push':
                case 'unshift':
                case 'fill':
                    watchNewItems(args, effect, _options, watchers, reactiveList)
                    break;

                case 'pop':
                case 'shift':
                    unwatchItem(toRaw(output), watchers)
                    break;

                case 'splice':
                    unwatchItems(output, watchers)
                    watchNewItems(args.slice(insertOps.splice.from), effect, _options, watchers, reactiveList)
                    break;

                case '[[set]]':
                    const [key, newValue] = args;
                    const oldValue = preopData;
                    if (key === 'length' && newValue === 0) {
                        unwatchAll(watchers)
                    }
                    else if (isIntegerKey(key)) {
                        watchNewItem(newValue, effect, _options, watchers, reactiveList)
                        unwatchItem(oldValue, watchers)
                    }

                default:
                    break;
            }
        }
    })

    watchers.set(reactiveList, listWatcher)
    return {
        stop() {
            unwatchAll(watchers)
        }
    }
}

function watchNewItem(newItem: AnyObject | ReactiveGet, effect: OnChangeHandler | MutationEffect, options: WatchOptions, watchers: WatchersMap, reactiveList: IonizedModel) {
    const target = maybeReactivize(newItem, reactiveList)
    const watcher = watch(target, effect, options)
    watchers.set(newItem, watcher) // TODO: must inherit original flask
    return watchers;
}

function watchNewItems(newItems: AnyObject[], effect: OnChangeHandler | MutationEffect, options: WatchOptions, watchers: WatchersMap, reactiveList: IonizedModel) {
    for (const item of newItems) {
        watchNewItem(item, effect, options, watchers, reactiveList)
    }
    return watchers;
}

function unwatchItem(item: AnyObject | ReactiveGet, watchers: WatchersMap) {
    const watcher = watchers.get(item)
    if (!watcher) throw new Error("No watcher that corresponds with this item :( This should never happen")
    watcher.stop()
}

function unwatchItems(items: AnyObject[], watchers: WatchersMap) {
    for (const item of items) {
        unwatchItem(toRaw(item), watchers)
    }
}

function unwatchAll(watchers: WatchersMap) {
    for (const [_, watcher] of watchers) {
        watcher.stop()
    }
}

function maybeReactivize(item: ReactiveGet | AnyObject, reactiveList: IonizedModel) {
    return isIonizedModel(reactiveList) ? ionize(item) : item
}


// TODO: Write overloads
// export function watchCollectionValues<T extends AnyObject>(
//     reactiveCollection: DeepReactiveModel<Set<T>> | DeepReactiveModel<Map<any, T>> | IonizedModel<Set<IonizedModel<T>>> | IonizedModel<Set<ReactiveGet<T>>> | IonizedModel<Map<any, IonizedModel<T>>> | IonizedModel<Map<any, ReactiveGet<T>>>,
//     effect: OnChangeHandler | MutationEffect,
//     options?: WatchOptions
// ) {

export function watchCollectionValues<T extends ReactiveGet>(
    reactiveCollection: IonizedModel<Map<any, T>> | IonizedModel<Set<T>>,
    effect: T extends () => infer R ? OnChangeHandler<R> : never,
    options?: WatchOptions
): PausableListener
export function watchCollectionValues<T extends IonizedModel>(
    reactiveCollection: IonizedModel<Map<any, T>> | IonizedModel<Set<T>>,
    effect: MutationEffect<T>,
    options?: WatchOptions
): PausableListener
export function watchCollectionValues<T extends ReactiveGet | IonizedModel>(
    reactiveCollection: IonizedModel<Map<any, T>> | IonizedModel<Set<T>>,
    effect: T extends () => infer R ? OnChangeHandler<R> : MutationEffect<T>,
    options?: WatchOptions
) {
    const collection = toRaw(reactiveCollection) as Map<any, any> | Set<any>
    const watchers: WatchersMap = new Map()
    const _options = options || {}

    for (const entry of collection) {
        const value = maybeReactivize(collection instanceof Map ? entry[1] : entry, reactiveCollection)
        const watcher = watch(value, effect, _options)
        watchers.set(value, watcher)
    }

    const mapSnapshot = collection instanceof Map ? shallowClone(collection) : undefined

    // watch new items, unwatch deleted items
    const collectionWatcher = watch(reactiveCollection, ({mutations}) => {
        for (const mutation of mutations!) {
            const { args, op } = mutation
            switch (op) {
                case 'add':
                    if (collection instanceof Map) break;
                    watchNewItem(args[0], effect, _options, watchers, reactiveCollection)
                    break;

                case 'set':
                    if (collection instanceof Set) break;
                    watchNewItem(args[1], effect, _options, watchers, reactiveCollection)
                    break;

                case 'delete':
                    const value = collection instanceof Map ? mapSnapshot!.get(args[0]) : args[0]
                    mapSnapshot?.delete(args[0])
                    unwatchItem(value, watchers)
                    break;

                case 'clear':
                    unwatchAll(watchers)
                    break;

                default:
                    break;
            }
        }
    })

    watchers.set(collection, collectionWatcher)
    return {
        stop() {
            unwatchAll(watchers)
        }
    }
}




export function watchMapKeys<T extends ReactiveGet>(
    reactiveMap: IonizedModel<Map<T, any>>,
    effect: T extends () => infer R ? OnChangeHandler<R> : never,
    options?: WatchOptions
): PausableListener
export function watchMapKeys<T extends IonizedModel>(
    reactiveMap: IonizedModel<Map<T, any>>,
    effect: MutationEffect<T>,
    options?: WatchOptions
): PausableListener
export function watchMapKeys<T extends ReactiveGet | IonizedModel>(
    reactiveMap: IonizedModel<Map<T, any>>,
    effect: T extends () => infer R ? OnChangeHandler<R> : MutationEffect<T>,
    options?: WatchOptions
) {
    const map = toRaw(reactiveMap) as Map<any, any> | Set<any>
    const watchers: WatchersMap = new Map()
    const _options = options || {}

    for (const entry of map) {
        const key = maybeReactivize(entry[0], reactiveMap)
        const watcher = watch(key, effect, _options)
        watchers.set(key, watcher)
    }


    // watch new items, unwatch deleted items
    const mapWatcher = watch(reactiveMap, ({mutations}) => {
        for (const mutation of mutations!) {
            const { args, op } = mutation
            switch (op) {
                case 'set':
                    watchNewItem(args[0], effect, _options, watchers, reactiveMap)
                    break;

                case 'delete':
                    unwatchItem(args[0], watchers)
                    break;

                case 'clear':
                    unwatchAll(watchers)
                    break;

                default:
                    break;
            }
        }
    })

    watchers.set(map, mapWatcher)
    return {
        stop() {
            unwatchAll(watchers)
        }
    }
}
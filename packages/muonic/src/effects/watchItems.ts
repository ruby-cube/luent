import { ActiveListener } from "@rue/flask";
import { isAnySignal, AnySignal } from "../derivations/DerivedSignal";
import { DeepReactiveModel, isDeepReactive, isReactiveModel, isShallowReactive, o$, $Model, ReactiveModel, toRaw } from "../reactivemodel/ReactiveModel";
import { ChangeEffect, isMutationOp, MutationEffect, watch, WatchOptions } from "./watch";
import { insertOps } from "../reactivemodel/ReactiveCapsule";
import { isIntegerKey } from "../reactivemodel/ReactiveArray";
import { AnyObject } from "@rue/types";
import { shallowClone } from "../reactivemodel/TimeTraveler";

type WatchersMap = Map<AnyObject | AnySignal, ActiveListener>


export type KeyPath = PropertyKey[]




export function watchItems<T extends AnySignal>(
    reactiveList: ReactiveModel<T[]>,
    effect: T extends () => infer R ? ChangeEffect<R> : never,
    options?: WatchOptions
): ActiveListener
export function watchItems<T extends ReactiveModel>(
    reactiveList: ReactiveModel<T[]>,
    effect: MutationEffect<T>,
    options?: WatchOptions
): ActiveListener
export function watchItems<T extends AnySignal | ReactiveModel>(
    reactiveList: ReactiveModel<T[]>,
    effect: T extends () => infer R ? ChangeEffect<R> : MutationEffect<T>,
    options?: WatchOptions
) {
    const array = toRaw(reactiveList) as T[] | AnySignal<T>[]
    const watchers: WatchersMap = new Map()
    const _options = options || {}

    for (const item of array) {
        const target = maybeReactivize(item, reactiveList)
        const watcher = watch(<AnySignal>target, effect, _options)
        watchers.set(item, watcher) // typecasting one of the possibilities to quiet typescript. Typescript can't handle intersections that mixes overloads
    }

    // watch new items, unwatch deleted items
    const listWatcher = watch(reactiveList, (_, mutations) => {
        for (const mutation of mutations) {
            const op = mutation.op;
            if (isMutationOp(op)) {
                const { args, type, output } = op
                switch (type) {
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

                    default:
                        break;
                }
            }
            else {
                const { key, newValue, oldValue } = op
                if (key === 'length' && newValue === 0) {
                    unwatchAll(watchers)
                }
                else if (isIntegerKey(key)) {
                    watchNewItem(newValue, effect, _options, watchers, reactiveList)
                    unwatchItem(oldValue, watchers)
                }
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

function watchNewItem(newItem: AnyObject | AnySignal, effect: ChangeEffect | MutationEffect, options: WatchOptions, watchers: WatchersMap, reactiveList: DeepReactiveModel | ReactiveModel) {
    const target = maybeReactivize(newItem, reactiveList)
    const watcher = watch(target, effect, options)
    watchers.set(newItem, watcher) //TODO: must inherit original flask
    return watchers;
}

function watchNewItems(newItems: AnyObject[], effect: ChangeEffect | MutationEffect, options: WatchOptions, watchers: WatchersMap, reactiveList: DeepReactiveModel | ReactiveModel) {
    for (const item of newItems) {
        watchNewItem(item, effect, options, watchers, reactiveList)
    }
    return watchers;
}

function unwatchItem(item: AnyObject | AnySignal, watchers: WatchersMap) {
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

function maybeReactivize(item: AnySignal | AnyObject, reactiveList: DeepReactiveModel | ReactiveModel) {
    return isDeepReactive(reactiveList) ? $Model(item) : item
}


//TODO: Write overloads
// export function watchCollectionValues<T extends AnyObject>(
//     reactiveCollection: DeepReactiveModel<Set<T>> | DeepReactiveModel<Map<any, T>> | ReactiveModel<Set<ReactiveModel<T>>> | ReactiveModel<Set<AnySignal<T>>> | ReactiveModel<Map<any, ReactiveModel<T>>> | ReactiveModel<Map<any, AnySignal<T>>>,
//     effect: ChangeEffect | MutationEffect,
//     options?: WatchOptions
// ) {

    export function watchCollectionValues<T extends AnySignal>(
        reactiveCollection: ReactiveModel<Map<any, T>> | ReactiveModel<Set<T>>,
        effect: T extends () => infer R ? ChangeEffect<R> : never,
        options?: WatchOptions
    ): ActiveListener
    export function watchCollectionValues<T extends ReactiveModel>(
        reactiveCollection: ReactiveModel<Map<any, T>> | ReactiveModel<Set<T>>,
        effect: MutationEffect<T>,
        options?: WatchOptions
    ): ActiveListener
    export function watchCollectionValues<T extends AnySignal | ReactiveModel>(
        reactiveCollection: ReactiveModel<Map<any, T>> | ReactiveModel<Set<T>>,
        effect: T extends () => infer R ? ChangeEffect<R> : MutationEffect<T>,
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
    const collectionWatcher = watch(reactiveCollection, (_, mutations) => {
        for (const mutation of mutations) {
            const op = mutation.op;
            if (isMutationOp(op)) {
                const { args, type } = op
                switch (type) {
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
        }
    })

    watchers.set(collection, collectionWatcher)
    return {
        stop() {
            unwatchAll(watchers)
        }
    }
}




export function watchMapKeys<T extends AnySignal>(
    reactiveMap: ReactiveModel<Map<T, any>>,
    effect: T extends () => infer R ? ChangeEffect<R> : never,
    options?: WatchOptions
): ActiveListener
export function watchMapKeys<T extends ReactiveModel>(
    reactiveMap: ReactiveModel<Map<T, any>>,
    effect: MutationEffect<T>,
    options?: WatchOptions
): ActiveListener
export function watchMapKeys<T extends AnySignal | ReactiveModel>(
    reactiveMap: ReactiveModel<Map<T, any>>,
    effect: T extends () => infer R ? ChangeEffect<R> : MutationEffect<T>,
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
    const mapWatcher = watch(reactiveMap, (_, mutations) => {
        for (const mutation of mutations) {
            const op = mutation.op;
            if (isMutationOp(op)) {
                const { args, type } = op
                switch (type) {

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
        }
    })

    watchers.set(map, mapWatcher)
    return {
        stop() {
            unwatchAll(watchers)
        }
    }
}
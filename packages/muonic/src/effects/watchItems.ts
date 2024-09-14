import { ActiveListener } from "@rue/flask";
import { isAnySignal, ReactiveSignal } from "../derivations/DerivedSignal";
import { isReactiveModel, ReactiveModel, toRaw } from "../reactivemodel/ReactiveModel";
import { ChangeEffect, isMutationOp, MutationEffect, watch, WatchOptions } from "./watch";
import { insertOps } from "../reactivemodel/ReactiveCapsule";
import { isIntegerKey } from "../reactivemodel/ReactiveArray";
import { AnyObject } from "@rue/types";

type WatchersMap = Map<ReactiveModel | ReactiveSignal, ActiveListener>


export type KeyPath = PropertyKey[]



export function watchItems<T extends ReactiveModel | ReactiveSignal>(
    reactiveList: ReactiveModel<T[]>,
    effect: ChangeEffect<T> | MutationEffect<T>,
    options?: WatchOptions
) {
    const array = toRaw(reactiveList)
    const watchers: WatchersMap = new Map()
    const _options = options || {}

    for (const item of array) {
        watchers.set(item, watch(item, effect, _options))
    }

    // watch new items, unwatch deleted items
    watchers.set(reactiveList, watch(reactiveList, (_, mutations) => {
        for (const mutation of mutations) {
            const op = mutation.op;
            if (isMutationOp(op)) {
                const { args, type, output } = op
                switch (type) {
                    case 'push':
                    case 'unshift':
                    case 'fill':
                        watchNewItems(args, effect, _options, watchers)
                        break;

                    case 'pop':
                    case 'shift':
                        unwatchItem(output, watchers)
                        break;

                    case 'splice':
                        unwatchItems(output, watchers)
                        watchNewItems(args.slice(insertOps.splice.from), effect, _options, watchers)
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
                    watchNewItem(newValue, effect, _options, watchers)
                    unwatchItem(oldValue, watchers)
                }
            }
        }
    }))
    return {
        stop() {
            unwatchAll(watchers)
        }
    }
}

function watchNewItem(newItem: ReactiveModel | ReactiveSignal, effect: ChangeEffect | MutationEffect, options: WatchOptions, watchers: WatchersMap) {
    watchers.set(newItem, watch(newItem, effect, options)) //TODO: must inherit original flask
    return watchers;
}

function watchNewItems(newItems: (ReactiveModel | ReactiveSignal)[], effect: ChangeEffect | MutationEffect, options: WatchOptions, watchers: WatchersMap) {
    for (const item of newItems) {
        watchNewItem(item, effect, options, watchers)
    }
    return watchers;
}

function unwatchItem(item: ReactiveModel | ReactiveSignal, watchers: WatchersMap) {
    const watcher = watchers.get(item)
    if (!watcher) throw new Error("No watcher that corresponds with this item :( This should never happen")
    watcher.stop()
}

function unwatchItems(items: (ReactiveModel | ReactiveSignal)[], watchers: WatchersMap) {
    for (const item of items) {
        unwatchItem(item, watchers)
    }
}

function unwatchAll(watchers: WatchersMap) {
    for (const [_, watcher] of watchers) {
        watcher.stop()
    }
}



export function watchEntries<T extends ReactiveModel | ReactiveSignal, V>(
    reactive: ReactiveModel<Set<T>> | ReactiveModel<Map<T, V>>,
    effect: ChangeEffect | MutationEffect,
    options?: WatchOptions
) {
    const collection = toRaw(reactive) as Map<any, any> | Set<any>
    const watchers: WatchersMap = new Map()
    const _options = options || {}

    for (const entry of collection) {
        if (collection instanceof Map) {
            watchMapEntry(entry, effect, _options, watchers)
        }
        else {
            watchers.set(entry, watch(entry, effect, _options))
        }
    }

    // watch new items, unwatch deleted items
    watchers.set(reactive, watch(reactive, (_, mutations) => {
        for (const mutation of mutations) {
            const op = mutation.op;
            if (isMutationOp(op)) {
                const { args, type } = op
                switch (type) {
                    case 'add':
                        if (collection instanceof Map) break;
                        watchNewItems(args, effect, _options, watchers)
                        break;

                    case 'set':
                        if (collection instanceof Set) break;
                        watchMapEntry(args, effect, _options, watchers)
                        break;

                    case 'delete':
                        unwatchItems(args, watchers)
                        break;

                    case 'clear':
                        unwatchAll(watchers)
                        break;

                    default:
                        break;
                }
            }
        }
    }))
    return {
        stop() {
            unwatchAll(watchers)
        }
    }
}

function watchMapEntry(entry: any[], effect: ChangeEffect | MutationEffect, options: WatchOptions, watchers: WatchersMap) {
    const [key, value] = entry
    if (isReactiveModel(key) || isAnySignal(key)) {
        watchers.set(key, watch(key, effect, options))
    }
    else if (isReactiveModel(value) || isAnySignal(value)) {
        watchers.set(value, watch(value, effect, options))
    }
}
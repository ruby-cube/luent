import { ActiveListener } from "@rue/flask";
import { isAnySignal, AnySignal } from "../derivations/DerivedSignal";
import { DeepReactiveModel, isReactiveModel, o$$, ReactiveModel, toRaw } from "../reactivemodel/ReactiveModel";
import { ChangeEffect, isMutationOp, MutationEffect, watch, WatchOptions } from "./watch";
import { insertOps } from "../reactivemodel/ReactiveCapsule";
import { isIntegerKey } from "../reactivemodel/ReactiveArray";
import { AnyObject } from "@rue/types";

type WatchersMap = Map<AnyObject | AnySignal, ActiveListener>


export type KeyPath = PropertyKey[]



export function watchItems<T extends AnyObject>(
    reactiveList: ReactiveModel<AnySignal<T>[]>,
    effect: ChangeEffect<T>,
    options?: WatchOptions
): ActiveListener
export function watchItems<T extends AnyObject>(
    reactiveList: ReactiveModel<T[]>,
    effect: MutationEffect<T>,
    options?: WatchOptions
): ActiveListener
export function watchItems<T extends AnyObject>(
    reactiveList: DeepReactiveModel<T[]> | ReactiveModel<AnySignal<T>[]>,
    effect: ChangeEffect<T> | MutationEffect<T>,
    options?: WatchOptions
) {
    const array = toRaw(reactiveList) as T[] | AnySignal<T>[]
    const watchers: WatchersMap = new Map()
    const _options = options || {}

    for (const item of array) {
        const target = isAnySignal(item) ? item : o$$(item) as DeepReactiveModel<T>
        watchers.set(item, watch(<AnySignal>target, effect, _options)) // typecasting one of the possibilities to quiet typescript
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
                        unwatchItem(toRaw(output), watchers)
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

function watchNewItem(newItem: AnyObject | AnySignal, effect: ChangeEffect | MutationEffect, options: WatchOptions, watchers: WatchersMap) {
    const target = isAnySignal(newItem) ? newItem : o$$(newItem)
    watchers.set(newItem, watch(target, effect, options)) //TODO: must inherit original flask
    return watchers;
}

function watchNewItems(newItems: AnyObject[], effect: ChangeEffect | MutationEffect, options: WatchOptions, watchers: WatchersMap) {
    for (const item of newItems) {
        watchNewItem(item, effect, options, watchers)
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



export function watchEntries<T, V>(
    reactive: DeepReactiveModel<Set<T>> | DeepReactiveModel<Map<T, V>>,
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
    watchers.set(collection, watch(reactive, (_, mutations) => {
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
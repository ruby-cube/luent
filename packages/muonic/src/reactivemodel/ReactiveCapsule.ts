import { AnyObject } from "@rue/types";
import { Collection, MetaReactiveCollection } from "./ReactiveCollection";
import { MetaReactiveModel } from "./ReactiveModel";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { asTrackedOp } from "./TrackedOp";
import { maybeReactivize, ReactiveModel, recordOp, storeSnapshot } from "./Reactive$";
import { isWatched } from "../effects/WatchTarget";
import { trigger, triggerReactiveAtom, triggerReactiveModel } from "../trigger";
import { getRootWatchedModelAndKeyPath, isNestedWatched } from "../effects/deepWatch";
import { asObservedProp } from "./ObservedProp";



export const insertOps = {
    push: { from: 0 },
    unshift: { from: 0 },
    splice: { from: 2 },
    fill: { at: 0 },
    add: { at: 0 },
    set: { from: 0 }
}

// A 'get op' is a o(1) get-like operation like set.has() or array.at()
export function useGetOp(
    metaReactive: MetaReactiveCollection,
    target: AnyObject,
    op: string,
    fn: (key: any) => any,
) {
    return function getOp(arg: any) {
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        if (!tracker)
            return fn.call(target, arg);
        const reactive = metaReactive.o
        tracker.track(asTrackedOp(reactive, op, arg))
        return fn.call(target, arg)
    }
}


export function maybeReactivizeArgs(
    op: string,
    args: any[],
    metaReactive: MetaReactiveModel,
    sampleValue: any,
) {
    if (!(op in insertOps)) return args;

    const itemPosition = insertOps[<keyof typeof insertOps>op]
    const hasSingleItem = 'at' in itemPosition
    const newItems = hasSingleItem ? [args[itemPosition.at]] : args.slice(itemPosition.from);
    const _newItems: any[] = [];
    for (const newItem of newItems) {
        _newItems.push(maybeReactivize(newItem, metaReactive, sampleValue))
    }
    if (hasSingleItem) {
        args[itemPosition.at] = _newItems[0];
    }
    else {
        args.splice(itemPosition.from, _newItems.length, ..._newItems)
    }
    return args;
}










export function triggerReactiveWithMutationOp(
    reactive: ReactiveModel,
    key: string,
    args: any[],
    output: any
) {
    if (isWatched(reactive)) {

        triggerReactiveModel(reactive)
        recordOp(reactive, {
            target: reactive,
            op: {
                type: key,
                args,
                output
            }
        })
    }

    // if (isNestedWatched(reactive)) {
    //     const [rootWatchedModel, keyPath] = getRootWatchedModelAndKeyPath(reactive)

    //     recordOp(rootWatchedModel, {
    //         target: reactive,
    //         targetPath: keyPath,
    //         root: rootWatchedModel,
    //         op: {
    //             type: key,
    //             args
    //         }
    //     })
    //     triggerReactiveModel(rootWatchedModel)
    // }
}
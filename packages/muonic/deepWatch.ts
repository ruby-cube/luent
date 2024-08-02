import { KeyPath } from "@rue/utils";
import { isReactiveModel, isReactiveObject, ReactiveModel } from "./useReactiveModel";
import { getCurrentUpdateCycle } from "./UpdateCycle";
import { _watchEffect, watch, WatchOptions } from "./watch";
import { ActiveListener } from "@rue/flask";
import { AnyObject } from "@rue/types";

export type MutationOp = {
    keyPath?: KeyPath,
    op: string,
    args: any[]
}

export type SetOp = {
    keyPath: KeyPath,
    newValue: any,
    oldValue: any
}

export function isMutationOp(op: AnyObject): op is MutationOp {
    return "op" in op;
}

export function isSetOp(op: AnyObject): op is SetOp {
    return 'keyPath' in op;
}

// Watch API for mutations

// watch($(o=>frog$.position.x), (xValue, oldXValue, )=>{

// })

// watch(list$, (rawArray, snapshot, ops: MutationOp[]) => { // Shallow watch

// })


// watch(state$, (rawObject, snapshot, ops: (SetOp | MutationOp)[]) => { // deep watch   keyPath, newValue, oldValue

// })

// watch($signalState, (newState, oldState, ops: (SetOp | MutationOp)[]) => {

// }, { deep: true })

// const state$ = o$({
//     a: {
//         b: {
//             pet: "cat"
//         }
//     }
// })

// mu(state$, o => {
//     o.a.b.pet = "dog"
// })

// mu(state$, o => {
//     const b = o.a.b;
//     o.z = 0;
//     b.pet = "dog"
// })

// mu(state$.a.b, b => {
//     b.pet = "dog"
// })




function watchProps(target: ReactiveModel, keyPath: KeyPath, options: WatchOptions) {
    const watchers: ActiveListener[] = []
    for (const key in target) {
        const value = target[key]
        const _keyPath = [...keyPath, key];
        if (isReactiveObject(value)) { // excludes arrays, maps, and sets in deep watch
            const _watchers = deepWatch(value, _keyPath, options);
            watchers.push(..._watchers)
        }
    }
    return watchers;
}

export function deepWatch(target: ReactiveModel, keyPath: KeyPath, options: WatchOptions) {
    const watcher =
        _watchEffect((_, __, ops) => {
            if (ops && isSetOp(ops)) {
                if (__DEV__ && ops.keyPath[0] !== keyPath.at(-1)) throw new Error(`KeyPaths don't match! ${ops.keyPath} and ${keyPath}`)
                composeOps(target, {
                    ...ops,
                    //@ts-expect-error
                    keyPath
                })
            }
            else if (ops){
                composeOps(target, ops);
            }
        }, target, options)
    const watchers =
        watchProps(target, keyPath, options)

    watchers.push(watcher)
    return watchers;
}

function composeOps(target: ReactiveModel, ops: (SetOp | MutationOp)[] | undefined) {
    if (!ops) return;
    const updateCycle = getCurrentUpdateCycle();
    if (!updateCycle) throw new Error("No update cycle :(")
    updateCycle.composeOps(target, ops)
}


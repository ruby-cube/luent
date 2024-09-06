import { isReactiveModel, isReactiveObject, ReactiveModel } from "../reactivemodel/Reactive$";
import { getCurrentUpdateCycle } from "./UpdateCycle";
import { AnyObject } from "@rue/types";

type KeyPath = PropertyKey[]


export type MutationRecord = {
    target: ReactiveModel,
    targetPath?: KeyPath, // undefined means the target is the root watched model
    op: MutationOp | SetOp
}

export type MutationOp = {
    type: string,
    args: any[]
}

export type SetOp = {
    type: '[[set]]' | 'set' | 'add' | 'delete',
    key: string | symbol,
    newValue: any,
    oldValue: any
}

export function isMutationOp(op: AnyObject): op is MutationOp {
    return "op" in op;
}

export function isSetOp(op: AnyObject): op is SetOp {
    return 'key' in op;
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

type NestedModel = ReactiveModel;
type RootModel = ReactiveModel;

const deepWatchMap: WeakMap<NestedModel, [RootModel, KeyPath]> = new WeakMap()

export function isNestedWatched(reactive: ReactiveModel) {
    return deepWatchMap.has(reactive);
}

export function getRootWatchedModelAndKeyPath(reactive: ReactiveModel){
    if (!isNestedWatched(reactive)) throw new Error('INVALID INPUT: Must be nested watched model. Check with `isNestedWatched`')
    return deepWatchMap.get(reactive)!;
}

export function watchProps(target: ReactiveModel, rootTarget: ReactiveModel, keyPath: KeyPath) {
    for (const key in target) {
        const value = target[key]
        const _keyPath = [...keyPath, key];
        if (isReactiveObject(value)) { // excludes arrays, maps, and sets in deep watch
            deepWatchMap.set(value, [rootTarget, _keyPath])
            watchProps(value, rootTarget, keyPath)
        }
    }
}



// function deepWatch(target: ReactiveModel, keyPath: KeyPath, options: WatchOptions) {
//     const watcher =
//         watch(target, (_, __, ops) => {
//             if (ops && isSetOp(ops)) {
//                 if (__DEV__ && ops.keyPath[0] !== keyPath.at(-1)) throw new Error(`KeyPaths don't match! ${ops.keyPath} and ${keyPath}`)
//                 composeOps(target, {
//                     ...ops,
//                     //@ts-expect-error
//                     keyPath
//                 })
//             }
//             else if (ops) {
//                 composeOps(target, ops);
//             }
//         }, options)
//     const watchers =
//         watchProps(target, keyPath, options)

//     watchers.push(watcher)
//     return watchers;
// }

function composeOps(target: ReactiveModel, ops: MutationRecord[] | undefined) {
    if (!ops) return;
    const updateCycle = getCurrentUpdateCycle();
    if (!updateCycle) throw new Error("No update cycle :(")
    updateCycle.composeOps(target, ops)
}


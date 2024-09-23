import {  isIonicModel, IonicModel, toRaw } from "../ionize/IonicModel";
import { isReactiveObject } from "../ionize/IonicObject";
import { AnyObject } from "@rue/types";

export type KeyPath = PropertyKey[]


export type MutationRecord = {
    target: IonicModel,
    // root?: IonicModel,
    // targetPath?: KeyPath, // undefined means the target is the root watched model
    op: MutationOp | SetOp
}

export type MutationOp = {
    type: string,
    args: any[],
    output: any
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

// const state$ = ionize({
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


type NestedModel = IonicModel;
type RootModel = IonicModel;

const deepWatchMap: WeakMap<NestedModel, [RootModel, KeyPath]> = new WeakMap()

export function isNestedWatched(reactive: IonicModel) {
    return deepWatchMap.has(reactive);
}

export function getRootWatchedModelAndKeyPath(reactive: IonicModel) {
    if (!isNestedWatched(reactive)) throw new Error('INVALID INPUT: Must be nested watched model. Check with `isNestedWatched`')
    return deepWatchMap.get(reactive)!;
}

type NestedWatcher<T> = T extends NestedModel[] ? { unwatch: () => void } : void

export function watchProps<N extends NestedModel[] | undefined>(target: IonicModel, rootTarget: IonicModel, keyPath: KeyPath, nestedModels?: N): NestedWatcher<N> {
    const _nestedModels: NestedModel[] = nestedModels || [];
    const raw = toRaw(target)
    if (raw instanceof Array){
        for (let i = 0; i < raw.length; i++){
            const value = raw[i]
            const _keyPath = [...keyPath, i];
            if (isIonicModel(value)) { // excludes  maps, and sets in deep watch
                deepWatchMap.set(value, [rootTarget, _keyPath])
                watchProps(value, rootTarget, keyPath, _nestedModels)
            }
        }
    }
    else if (isReactiveObject(target)){
        for (const key in raw) {
            const value = raw[key]
            const _keyPath = [...keyPath, key];
            if (isIonicModel(value)) { // excludes  maps, and sets in deep watch
                deepWatchMap.set(value, [rootTarget, _keyPath])
                watchProps(value, rootTarget, keyPath, _nestedModels)
            }
        }
    }
    
    if (!nestedModels) {
        return {
            unwatch() {
                for (const model of _nestedModels) {
                    deepWatchMap.delete(model)
                }
            }
        } as NestedWatcher<N>
    }

    return undefined as NestedWatcher<N>
}




// function deepWatch(target: IonicModel, keyPath: KeyPath, options: WatchOptions) {
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

// function composeOps(target: IonicModel, ops: MutationRecord[] | undefined) {
//     if (!ops) return;
//     const renderCycle = getCurrentRenderCycle();
//     if (!renderCycle) throw new Error("No update cycle :(")
//     renderCycle.composeOps(target, ops)
// }


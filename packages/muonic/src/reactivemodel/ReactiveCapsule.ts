import { AnyObject } from "@rue/types";
import { getMetaReactive, maybeUnreactivize } from "./ReactiveModel";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { asTrackedOp } from "./TrackedOp";
import { ReactiveModel, recordOp, storeSnapshot } from "./ReactiveModel";
import { isWatched } from "../effects/WatchTarget";
import { trigger, triggerReactiveAtom, triggerReactiveModel } from "../trigger";
import { Collection, MetaReactiveCollection } from "./MetaReactiveModel";



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
    reactive: ReactiveModel<Collection>,
    target: AnyObject,
    op: string,
    fn: (key: any) => any,
) {
    return function getOp(arg: any) {
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        const _arg = maybeUnreactivize(arg)
        if (!tracker)
            return fn.call(target, _arg);
        tracker.track(asTrackedOp(reactive, op, _arg))
        return fn.call(target, _arg)
    }
}


export function maybeUnreactivizeArgs(
    op: string,
    args: any[],
) {
    if (!(op in insertOps)) return args;

    const itemPosition = insertOps[<keyof typeof insertOps>op]
    const hasSingleItem = 'at' in itemPosition
    const newItems = hasSingleItem ? [args[itemPosition.at]] : args.slice(itemPosition.from);
    const _newItems: any[] = [];
    for (const newItem of newItems) {
        _newItems.push(maybeUnreactivize(newItem))
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
    if (isWatched(getMetaReactive(reactive))) {

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



// type Qualities = {}

// class Frog {
//     qualities: Qualities = {}

//     setQualities(qualities: Qualities) {
//         this.qualities = qualities
//     }

//     getQualities() {
//         return this.qualities;
//     }

//     getFrog() {
//         return this.qualities
//     }
// }

// const frog = new Frog()

// const frog$$ = o$$([])

// type TransformMap = typeof transformMap
// type GetTransforms<T extends { returnTransforms: AnyObject }> = T['returnTransforms']
// type ArrayGetTransforms = GetTransforms<"Array">
// type ArrayGetMethodKeys = GetMethodKeys<"Array">
// type TranformedArg = ReturnType<GetTransforms<"Array">["splice"]>

// type ReactiveCapsuleWithOutputTransformers<T extends CapsuleWithOutputTransformers> = {
//     [K in keyof T]: K extends GetterMethodKeys<T> ?
//     ((...args: Parameters<T[K]>) => T extends { outputTransformers: infer O } ?
//         K extends keyof O ? O[K] extends (arg: any) => infer R ? R
//         : never
//         : never
//         : never)
//     : T[K] extends Function ? undefined
//     : T[K];
// }
// type CapsuleWithOutputTransformers<T extends AnyObject = AnyObject> = {
//     outputTransformers: Record<keyof T, Function>
// } & T

// type GetterMethodKeys<T extends { outputTransformers: Record<string, Function> }> = keyof T['outputTransformers']

// type MaybeDeepReactive<T> = T extends AnyObject ? DeepReactiveModel<T> : T

// type DeepReactiveArray<T> = T[] & {
//     at(index: number): MaybeDeepReactive<T> | undefined,
//     splice(start: number, deleteCount?: number): MaybeDeepReactive<T>[]
// }

// type DeepReactiveModel<T extends AnyObject> = (T extends CapsuleWithOutputTransformers<T> ? ReactiveCapsuleWithOutputTransformers<T> : T) & {
//     _$: ReactiveModel<T>
// }

// const ar: Brew[] = []

// // const hi = ar.

// class Brew {
//     something!: { a: "sad" }
//     getSomething() {
//         return this.something
//     }

//     outputTransforms = {
//         getSomething(output: Brew['something']) {
//             return [o$$(output)]
//         }
//     }
// }

// type ReactiveCapsule = { returnTransforms: AnyObject, [key: PropertyKey]: any }

// type Con = (typeof Brew)["prototype"]
// type FLo = (Brew)[""]
// // ['getTransforms']

// type BrewB = Brew & {}

// type TransformObject<T extends AnyObject> = {
//     [K in keyof T]: typeof T
// }

// type NewTYpe = TransformObject<Array<any>>
// const brew = null as unknown as Brew
// brew.getSomething()

// const brew$$ = null as unknown as DeepReactiveModelO<Brew>

// const huh = brew$$.getSomething() // [DeepReactiveModelO<{a: "sad"}>]

// // const transformMap = registerReactiveCapsules({
// //     Brew: {
// //         getSomething<T extends AnyObject>(arg: T) {
// //             return o$$(arg) as unknown as [DeepReactiveModelO<T>];
// //         }
// //     }
// // })


// // function registerReactiveCapsules<T>(ar: T) {
// //     return ar
// // }


// const qu = frog$$.getQualities()
// const qu2 = frog$$.getFrog()
// const qual = frog$$.qualities
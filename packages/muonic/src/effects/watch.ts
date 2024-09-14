import { AnyObject } from "@rue/types";
import { asWatchTarget, WatchTarget } from "./WatchTarget";
import { $listen, ActiveListener, ListenerOptions } from "@rue/flask";
import { ReactiveDerivation } from "../derivations/ReactiveDerivation";
import { getCurrentUpdateCycle, getFlushingUpdateCycle, Phase, useUpdateCycle } from "./UpdateCycle";
import { WatchDebugOptions } from "./debug";
import { $, isAnySignal, AnySignal } from "../derivations/DerivedSignal";
import { DeepReactiveModel, getMetaReactive, isReactiveModel, ReactiveModel, toRaw, } from "../reactivemodel/ReactiveModel";
import { areEqual } from "./areEqual";
import { createReactiveFunction, ReactiveFunction } from "../derivations/ReactiveFunction";
import { META } from "../ReactiveEntity";


type UpdateCycleOptions = {
    phase?: Phase;
}

export type WatchOptions = {
    // deep?: boolean;
    eager?: true;
    retrack?: boolean;
} & UpdateCycleOptions & ListenerOptions & WatchDebugOptions

export type EffectOptions = {
    retrack?: true;
} & UpdateCycleOptions & ListenerOptions & WatchDebugOptions



export type MutationRecord = {
    target: ReactiveModel,
    // root?: ReactiveModel,
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


export type MutationEffect<T extends ReactiveModel = ReactiveModel> = (newValue: T, mutations: MutationRecord[]) => void
export type ChangeEffect<T = any> = (newValue: T, oldValue: T) => void
export type ReactiveEffect = {
    (): void;
    [META]: ReactiveDerivation;
}
type Effect = () => void


// manages nested watch calls to prevent infinite loops
// let isRunningEffect = false;

// export function runEffect(effect: Effect) {
//     isRunningEffect = true;
//     effect()
//     isRunningEffect = false;
// }

// function shouldScheduleForNextCycle() {
//     return isRunningEffect;
// }


export type RawEffect = (a: any, b: any) => void

export function watch<T extends ReactiveModel>(target: T, effect: MutationEffect<T>, options?: WatchOptions): ActiveListener
export function watch<T extends () => any | AnySignal>(target: T, effect: T extends () => infer R ? ChangeEffect<R> : never, options?: WatchOptions): ActiveListener
export function watch<T extends () => any | AnySignal | ReactiveModel>(target: T, effect: T extends () => infer R ? ChangeEffect<R> : MutationEffect<T>, options?: WatchOptions): ActiveListener {
    if (isReactiveModel(target)) {
        return watchReactiveModel(target, effect, options || {})
    }
    const retrack = options?.retrack ?? false
    let isReactiveFunction = <any>target instanceof Function && !isAnySignal(target);

    const _target =
        isReactiveFunction ? createReactiveFunction(<() => any>target, retrack).initialize()
            : target as AnySignal;

    const eager = options?.eager
    const phase = options?.phase || 'pre'

    const watchTarget = asWatchTarget(_target);

    let oldValue = (<AnySignal | ReactiveFunction>target)()

    function changeEffect() {
        const newValue = _target() // This is when retracking happens
        if (areEqual(toRaw(newValue), toRaw(oldValue))) return;
        effect(newValue, oldValue)
        oldValue = newValue;
    }

    if (eager) {
        scheduleEffectEagerly(changeEffect, phase, _target)
    }

    return setUpWatcher(
        watchTarget,
        changeEffect,
        phase,
        options || {},
        isReactiveFunction ? (<ReactiveFunction>_target)[META] : undefined
    )
}

function watchReactiveModel<T extends ReactiveModel>(target: T, effect: MutationEffect<T>, options: WatchOptions) {
    const eager = options?.eager
    const phase = options?.phase || 'pre'
    // const deep = options?.deep

    const watchTarget = asWatchTarget(getMetaReactive(target));

    // const nestedWatcher = deep ? watchProps(target, target, []) : undefined;

    function mutationEffect() {
        const updateCycle = phase === 'sync' ? getCurrentUpdateCycle() : getFlushingUpdateCycle()
        const mutations = updateCycle?.getOps(target)
        if (!mutations) throw new Error("No mutations :(")
        effect(target, mutations)
    }

    if (eager) {
        scheduleEffectEagerly(mutationEffect, phase, target)
    }

    return $listen(mutationEffect, options || {}, {
        enroll(_effect) {
            watchTarget.watch(_effect, phase)
        },
        remove(_effect) {
            watchTarget.unwatch(_effect, phase)
            // if (nestedWatcher) nestedWatcher.unwatch()
        }
    });
}


function scheduleEffectEagerly(effect: Effect, phase: Phase, target?: any) {
    if (phase === 'sync') {
        // runEffect(effect)
        effect()
    }
    else useUpdateCycle().scheduleEffect(target || effect, effect, phase)
}

export function $initializeEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived signal and effect combined into one function
    const phase = options?.phase || 'pre';
    const retrack = options?.retrack || false;
    const reactiveEffect = createReactiveFunction(effect, retrack)
    const watchTarget = asWatchTarget(reactiveEffect);

    scheduleEffectEagerly(reactiveEffect.initialize, phase);

    return setUpWatcher(
        watchTarget,
        reactiveEffect,
        phase,
        options || {},
        reactiveEffect[META]
    )
}


function setUpWatcher(
    watchTarget: WatchTarget,
    effect: Effect,
    phase: Phase,
    options: ListenerOptions,
    metaReactiveFunction?: ReactiveDerivation
) {
    // const forNextCycle = phase === 'sync' ? false : shouldScheduleForNextCycle();

    return $listen(effect, options || {}, {
        enroll(_effect) {
            watchTarget.watch(_effect, phase)
        },
        remove(_effect) {
            watchTarget.unwatch(_effect, phase)
            if (metaReactiveFunction) {
                metaReactiveFunction.untrackAtoms()
            }
        }
    });
}


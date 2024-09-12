import { AnyObject } from "@rue/types";
import { MutationRecord, watchProps } from "./deepWatch";
import { asWatchTarget, WatchTarget } from "./WatchTarget";
import { $listen, ActiveListener, ListenerOptions } from "@rue/flask";
import { ReactiveDerivation } from "../derivations/ReactiveDerivation";
import { getCurrentUpdateCycle, getFlushingUpdateCycle, Phase, useUpdateCycle } from "./UpdateCycle";
import { WatchDebugOptions } from "./debug";
import { $, isSignal, ReactiveSignal } from "../derivations/DerivedSignal";
import { isReactiveModel, ReactiveModel, } from "../reactivemodel/Reactive$";
import { areEqual } from "./areEqual";
import { createReactiveFunction, ReactiveFunction } from "../derivations/ReactiveFunction";
import { META } from "../ReactiveEntity";
import { asObservedProp } from "../reactivemodel/ObservedProp";


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




export type MutationEffect<T extends AnyObject = AnyObject> = (newValue: ReactiveModel<T>, mutations: MutationRecord[]) => void
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

function toDerivedSignal(reactive: ReactiveModel, keys: (PropertyKey | number)[]) {
    return $(() => {
        const values = []
        for (const key of keys) {
            values.push(reactive[key])
        }
        return values;
    })
}

function getValue(target: Function | AnyObject, key?: PropertyKey) {
    return target instanceof Function ? target() : key ? target[key] : target
}

export type RawEffect = (a: any, b: any) => void

export type RawWatchTarget<T = any> = () => T | ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>
export type EffectOrKeys<T = any> = MutationEffect<T extends AnyObject ? T : never> | ChangeEffect<T> | keyof T | (keyof T)[]
export type OptionsOrEffect<T = any> = WatchOptions | MutationEffect<T extends AnyObject ? T : never> | ChangeEffect<T> | ChangeEffect<(T[keyof T])[]> | ChangeEffect<T[keyof T]>


export function watch<T extends AnyObject>(target: ReactiveModel<T>, keys: (keyof T)[], effect: ChangeEffect<(T[keyof T])[]>, options?: WatchOptions): ActiveListener
export function watch<T extends AnyObject>(target: ReactiveModel<T>, key: keyof T, effect: ChangeEffect<T[keyof T]>, options?: WatchOptions): ActiveListener
export function watch<T extends AnyObject>(target: ReactiveModel<T>, effect: MutationEffect<T>, options?: WatchOptions): ActiveListener
export function watch<T>(target: () => T | ReactiveSignal<T>, effect: ChangeEffect<T>, options?: WatchOptions): ActiveListener
export function watch<T>(target: RawWatchTarget<T>, effectOrKeys: EffectOrKeys<T>, optionsOrEffect?: OptionsOrEffect<T>, options?: WatchOptions) {
    const keys = effectOrKeys instanceof Function ? undefined : effectOrKeys instanceof Array ? effectOrKeys : undefined
    const key = typeof effectOrKeys === 'string' ? effectOrKeys as keyof T : undefined
    const effect = keys ? optionsOrEffect as RawEffect : effectOrKeys as RawEffect;
    const _options = keys ? options : optionsOrEffect as WatchOptions | undefined;
    const retrack = _options?.retrack ?? false
    let isReactiveFunction = target instanceof Function && !isSignal(target);

    const _target =
        isReactiveFunction ? createReactiveFunction(<() => any>target, retrack).initialize()
            : keys instanceof Array ? toDerivedSignal(<ReactiveModel><unknown>target, keys)
                : key ? asObservedProp(<ReactiveModel><unknown>target, <PropertyKey>key)
                    : target as ReactiveModel | ReactiveSignal;

    if (isReactiveModel(_target)) {
        return watchReactiveModel(_target, effect, _options || {})
    }

    const eager = _options?.eager
    const phase = _options?.phase || 'pre'

    const watchTarget = asWatchTarget(_target);

    let oldValue = getValue(_target, <PropertyKey>key) //TODO: Snapshot or MutationRecord for reactivemodels?

    function changeEffect() {
        const newValue = getValue(_target, <PropertyKey>key) // This is when retracking happens
        if (areEqual(newValue, oldValue)) return;
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
        _options || {},
        isReactiveFunction ? (<ReactiveFunction>_target)[META] : undefined
    )
}

function watchReactiveModel(target: ReactiveModel, effect: (target: ReactiveModel, mutations: MutationRecord[]) => void, options: WatchOptions) {
    const eager = options?.eager
    const phase = options?.phase || 'pre'
    // const deep = options?.deep

    const watchTarget = asWatchTarget(target);

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

    // const forNextCycle = phase === 'sync' ? false : shouldScheduleForNextCycle();

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


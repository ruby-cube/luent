import { AnyObject } from "@rue/types";
import { watchProps } from "./deepWatch";
import { asWatchTarget, WatchTarget } from "./WatchTarget";
import { $listen, ActiveListener, ListenerOptions } from "@rue/flask";
import { AS_DERIVATION, ReactiveDerivation } from "../derivations/ReactiveDerivation";
import { Phase, useUpdateCycle } from "./UpdateCycle";
import { WatchDebugOptions } from "./debug";
import { $, isSignal, ReactiveSignal } from "../derivations/DerivedSignal";
import {  isReactiveModel, toRaw, toWatchedProp } from "../reactivemodel/Reactive$";
import { areEqual } from "./areEqual";
import { createReactiveFunction, ReactiveFunction } from "../derivations/ReactiveFunction";
import { shallowClone } from "../reactivemodel/SnapshotManager";
import { ReactiveModel } from "../reactivemodel/ReactiveModel";


type UpdateCycleOptions = {
    phase?: Phase;
}

export type WatchOptions = {
    deep?: boolean;
    eager?: true;
    retrack?: boolean;
} & UpdateCycleOptions & ListenerOptions & WatchDebugOptions

export type EffectOptions = {
    retrack?: true;
} & UpdateCycleOptions & ListenerOptions & WatchDebugOptions




type MutationHandler<T extends AnyObject = AnyObject> = (newValue: T, oldValue: T, ops?: MutationRecord[]) => void
export type ChangeHandler<T = AnyObject> = (newValue: T, oldValue: T, ops?: MutationRecord[]) => void
export type ReactiveEffect = {
    (): void;
    [AS_DERIVATION]: ReactiveDerivation;
}
type Effect = ChangeHandler | ReactiveEffect


// manages nested watch calls to prevent infinite loops
let isRunningEffect = false;

export function runEffect(effect: () => void) {
    isRunningEffect = true;
    effect()
    isRunningEffect = false;
}

function shouldScheduleForNextCycle() {
    return isRunningEffect;
}

function toDerivedSignal(reactive: ReactiveModel, keys: PropertyKey[]) {
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




export function watch<T>(target: ReactiveModel<T extends AnyObject ? T : never>, keys: (keyof T)[], effect: ChangeHandler<T>, options?: WatchOptions): ActiveListener
export function watch<T>(target: ReactiveModel<T extends AnyObject ? T : never>, key: keyof T, effect: ChangeHandler<T>, options?: WatchOptions): ActiveListener
export function watch<T>(target: () => any | ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, effect: ChangeHandler<T>, options?: WatchOptions): ActiveListener
export function watch<T>(target: () => any | ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, effectOrKeys: ChangeHandler<T> | keyof T | (keyof T)[], optionsOrEffect?: WatchOptions | ChangeHandler<T>, options?: WatchOptions) {
    const keys = effectOrKeys instanceof Function ? undefined : effectOrKeys instanceof Array ? effectOrKeys : undefined
    const key = typeof effectOrKeys === 'string' ? effectOrKeys as keyof T : undefined
    const effect = keys ? optionsOrEffect as ChangeHandler<T> : effectOrKeys as ChangeHandler<T>;
    const _options = keys ? options : optionsOrEffect as WatchOptions | undefined;
    const noKeys = !(keys || key)
    const retrack = _options?.retrack ?? false
    let isReactiveFunction = target instanceof Function && !isSignal(target);

    const { deep, eager } = _options ?? {};
    const phase = _options?.phase || 'pre'

    const _target =
        isReactiveFunction ? createReactiveFunction(<() => any>target, retrack).initialize()
            : keys instanceof Array ? toDerivedSignal(target, keys)
                : key ? toWatchedProp(target, key)
                    : target;


    if (noKeys && deep && isReactiveModel(_target)) { //TODO: deep watch for $$ and $$$ signals?
        watchProps(_target, _target, []);
    }
    const watchTarget = asWatchTarget(_target);
    let oldValue = isReactiveModel(target)? shallowClone(target): getValue(_target, key) //TODO: Snapshot or MutationRecord for reactivemodels?

    function _effect() {
        const newValue = getValue(_target, key) // This is when retracking happens
        if (areEqual(newValue, oldValue)) return;
        effect(newValue, oldValue)
        oldValue = isReactiveModel(target)? shallowClone(newValue): newValue;
    }

    if (eager) {
        if (phase === 'sync') runEffect(_effect)
        else useUpdateCycle().scheduleEffect(_target, _effect, phase)
    }

    const forNextCycle = phase === 'sync' ? false : shouldScheduleForNextCycle();

    const watcher = $listen(_effect, _options || {}, {
        enroll(_effect) {
            watchTarget.watch(_effect, phase, forNextCycle)
        },
        remove(_effect) {
            watchTarget.unwatch(_effect, phase)
            if (isReactiveFunction) {
                (<ReactiveFunction>_target)[AS_DERIVATION].untrackDependencies()
            }
        }
    });

    return watcher
}



export function $initializeEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived signal and effect combined into one function
    const phase = options?.phase || 'pre';
    const retrack = options?.retrack || false;
    const reactiveEffect = createReactiveFunction(effect, retrack)
    const watchTarget = asWatchTarget(reactiveEffect);

    runEffect(reactiveEffect.initialize);

    const forNextCycle = phase === 'sync' ? false : shouldScheduleForNextCycle();

    const watcher = $listen(reactiveEffect, options || {}, {
        enroll(_effect) {
            watchTarget.watch(_effect, phase, forNextCycle)
        },
        remove(_effect) {
            watchTarget.unwatch(_effect, phase)
            reactiveEffect[AS_DERIVATION].untrackDependencies()
        }
    });

    return watcher
}




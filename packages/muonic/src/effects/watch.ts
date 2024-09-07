import { AnyObject } from "@rue/types";
import { watchProps } from "./deepWatch";
import { ReactiveGetter, WatchTarget } from "./WatchTarget";
import { $listen, ActiveListener, ListenerOptions } from "@rue/flask";
import { ReactiveDerivation } from "../derivations/ReactiveDerivation";
import { Phase, useUpdateCycle } from "./UpdateCycle";
import { WatchDebugOptions } from "./debug";
import { $, DERIVED_SIGNAL, isDerivedSignal, ReactiveSignal } from "../derivations/DerivedSignal";
import { isReactiveModel, ReactiveModel } from "../reactivemodel/Reactive$";
import { createReactiveEffect } from "../derivations/ReactiveEffect";
import { getWithoutTracking } from "../derivations/DependencyTracker";
import { asReactiveProp } from "../reactivemodel/ReactiveProp";
import { areEqual } from "./areEqual";


type UpdateCycleOptions = {
    phase?: Phase;
}

export type WatchOptions = {
    deep?: boolean;
    eager?: true;
} & UpdateCycleOptions & ListenerOptions & WatchDebugOptions

export type EffectOptions = {
    retrack?: true;
} & UpdateCycleOptions & ListenerOptions & WatchDebugOptions




type MutationHandler<T extends AnyObject = AnyObject> = (newValue: T, oldValue: T, ops?: MutationRecord[]) => void
export type ChangeHandler<T = AnyObject> = (newValue: T, oldValue: T, ops?: MutationRecord[]) => void
export type ReactiveEffect = () => void //TODO: onCleanup function?
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
export function watch<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, effect: ChangeHandler<T>, options?: WatchOptions): ActiveListener
export function watch<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, effectOrKeys: ChangeHandler<T> | keyof T | (keyof T)[], optionsOrEffect?: WatchOptions | ChangeHandler<T>, options?: WatchOptions) {
    const keys = effectOrKeys instanceof Function ? undefined : effectOrKeys instanceof Array ? effectOrKeys : undefined
    const key = typeof effectOrKeys === 'string' ? effectOrKeys as keyof T : undefined
    const effect = keys ? optionsOrEffect as ChangeHandler<T> : effectOrKeys as ChangeHandler<T>;
    const _options = keys ? options : optionsOrEffect as WatchOptions | undefined;
    const noKeys = !(keys || key)

    const { deep, eager } = _options ?? {};
    const phase = _options?.phase || 'pre'

    const _target = keys instanceof Array ? toDerivedSignal(target, keys) : key ? asReactiveProp(target, key) : target; //TODO: allow target to be map or set and keys to be keys or entries

    if (noKeys && deep && isReactiveModel(_target)) { //TODO: deep watch for $$ and $$$ signals?
        watchProps(_target, _target, []);
    }

    const watchTarget = asWatchTarget(_target);
    let oldValue = getValue(_target, key)

    function _effect() {
        const newValue = getValue(_target, key) //TODO: snapshot?
        if (areEqual(newValue, oldValue)) return;
        effect(newValue, oldValue)
        oldValue = newValue;
    }

    if (eager) {
        if (phase === 'sync') {
            runEffect(_effect)
        }
        else {
            const updateCycle = useUpdateCycle()
            updateCycle.scheduleEffect(_target, _effect, phase)
        }
    }

    const forNextCycle = phase === 'sync' ? false : shouldScheduleForNextCycle();

    const watcher = $listen(_effect, _options || {}, {
        enroll(_effect) {
            if (forNextCycle) {
                watchTarget.queueForNextCycle(_effect, phase)
            }
            else {
                watchTarget.queueEffect(_effect, phase)
            }
        },
        remove(_effect) {
            watchTarget.removeEffect(_effect, phase)
        }
    });

    return watcher
}



export function initializeReactiveEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived signal and effect combined into one function
    const phase = options?.phase || 'pre';
    const retrack = options?.retrack || false;
    const reactiveEffect = createReactiveEffect(effect, retrack)
    const watchTarget = asWatchTarget(reactiveEffect);

    runEffect(reactiveEffect);

    const forNextCycle = phase === 'sync' ? false : shouldScheduleForNextCycle();

    const watcher = $listen(reactiveEffect, options || {}, {
        enroll(_effect) {
            if (forNextCycle) {
                watchTarget.queueForNextCycle(_effect, phase)
            }
            else {
                watchTarget.queueEffect(_effect, phase)
            }
        },
        remove(_effect) {
            watchTarget.removeEffect(_effect, phase)
        }
    });

    return watcher
}





const watchTargetMap: WeakMap<ReactiveSignal | ReactiveGetter | ReactiveModel | ReactiveEffect, WatchTarget> = new WeakMap()

export function isWatched(target: ReactiveSignal | ReactiveGetter | ReactiveModel | ReactiveEffect | null | undefined) {
    if (!target) return false;
    return Boolean(watchTargetMap.get(target));
}

export function asWatchTarget(target: ReactiveSignal | ReactiveGetter | ReactiveModel | ReactiveEffect): WatchTarget {
    let watchTarget = watchTargetMap.get(target);
    if (!watchTarget) {
        watchTarget = new WatchTarget(target)
        watchTargetMap.set(target, watchTarget)
    }
    return watchTarget;
}
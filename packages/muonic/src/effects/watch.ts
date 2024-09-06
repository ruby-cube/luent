import { AnyObject } from "@rue/types";
import { watchProps } from "./deepWatch";
import { ReactiveGetter, WatchTarget } from "./WatchTarget";
import { $listen, ActiveListener, ListenerOptions } from "@rue/flask";
import { ReactiveDerivation } from "../derivations/ReactiveDerivation";
import { Phase } from "./UpdateCycle";
import { WatchDebugOptions } from "./debug";
import { DERIVED_SIGNAL, isDerivedSignal, ReactiveSignal } from "../derivations/DerivedSignal";
import { isReactiveModel, ReactiveModel } from "../reactivemodel/Reactive$";
import { createReactiveEffect } from "../derivations/ReactiveEffect";


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

function runEffect(effect: () => void) {
    isRunningEffect = true;
    effect()
    isRunningEffect = false;
}

function shouldScheduleForNextCycle() {
    return isRunningEffect;
}



export function watch<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, effect: ChangeHandler<T>, options?: WatchOptions) {
    const { deep, eager } = options ?? {};
    const phase = options?.phase || 'pre'

    if (deep && isReactiveModel(target)) { //TODO: deep watch for $$ and $$$ signals?
        watchProps(target, target, []);
    }

    const watchTarget = asWatchTarget(target);
    if (isDerivedSignal(target) && target[DERIVED_SIGNAL].dependencies.length === 0) {
        target() // tracks dependencies
    }

    if (eager && target) {
        const value = target instanceof Function ? target() : target
        //TODO: Schedule according to phase
        if (phase === 'sync') {
            runEffect(() => effect(value, value))
        }
        else if (phase === 'pre') {

        }
        else if (phase === 'render') {

        }
        else if (phase === 'post') {

        }
    }

    const forNextCycle = phase === 'sync' ? false : shouldScheduleForNextCycle();

    const watcher = $listen(effect, options || {}, {
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



export function initReactiveEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived signal and effect combined into one function
    const phase = options?.phase || 'pre';
    const retrack = options?.retrack || false;
    const reactiveEffect = createReactiveEffect(effect, retrack)
    const watchTarget = asWatchTarget(reactiveEffect);

    reactiveEffect();

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

export function isWatched(target: ReactiveSignal | ReactiveGetter | ReactiveModel | ReactiveEffect) {
    return watchTargetMap.get(target);
}

export function asWatchTarget(target: ReactiveSignal | ReactiveGetter | ReactiveModel | ReactiveEffect): WatchTarget {
    let watchTarget = watchTargetMap.get(target);
    if (!watchTarget) {
        watchTarget = new WatchTarget(target)
        watchTargetMap.set(target, watchTarget)
    }
    return watchTarget;
}
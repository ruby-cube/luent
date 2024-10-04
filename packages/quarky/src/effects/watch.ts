import { AnyObject } from "@rue/types";
import { asWatchTarget, WatchTarget } from "./WatchTarget";
import { $listen, ActiveListener, ListenerOptions } from "@rue/flask";
import { IonicDerivation } from "../derivations/IonicDerivation";
import { getCurrentRenderCycle, Phase, useRenderCycle } from "./RenderCycle";
import { WatchDebugOptions } from "./debug";
import { ReactiveGet, DerivedIon, isDerivedIon } from "../derivations/DerivedIon";
import { asMetaIonicModel, isIonicModel, IonicModel, toRaw, } from "../ionize/IonicModel";
import { areEqual } from "./areEqual";
import { createIonicEffect, IonicEffect } from "../derivations/IonicEffect";
import { META } from "../ReactiveEntity";
import { noop } from "@rue/utils";
import { __devCheckIfTracked } from "../derivations/DependencyTracker";
import { AnyIon, isAnyIon } from "../ion/AnyIon";
import { ReactiveIon, asMetaIon, isIon } from "../ion/Ion";
import { isObservedProp, ObservedProp } from "../ionize/ObservedProp";
import { asIonicAtom } from "../derivations/IonicAtom";
import { PropIon } from "../ionize/PropIon";


type RenderCycleOptions = {
    phase?: Phase;
    cycle?: 'current' | 'next'
}

export type WatchOptions = {
    // deep?: boolean;
    eager?: true;
    // retrack?: boolean;
} & RenderCycleOptions & ListenerOptions & WatchDebugOptions

export type EffectOptions = {
    retrack?: true;
} & RenderCycleOptions & ListenerOptions & WatchDebugOptions



export type MutationRecord = {
    target: IonicModel | ReactiveIon | PropIon,
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
    key?: string | symbol,
    newValue: any,
    oldValue: any
}

export function isMutationOp(op: AnyObject): op is MutationOp {
    return "op" in op;
}

export function isSetOp(op: AnyObject): op is SetOp {
    return 'key' in op;
}


export type MutationEffect<T extends IonicModel = IonicModel> = (newValue: T, mutations: MutationRecord[]) => void
export type ChangeEffect<T = any> = (newValue: T, oldValue: T) => void
export type ReactiveEffect = {
    (): void;
    [META]: IonicDerivation;
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


let currentWatchTarget: DerivedIon | ReactiveIon | IonicModel | undefined // prevents infinite loops for synchronous effects that set ions

export function isCurrentWatchTarget(atom: ReactiveIon | ObservedProp) {
    if (!currentWatchTarget) return false;
    if (currentWatchTarget === atom) return true;
    if (isDerivedIon(currentWatchTarget)) {
        return asMetaIon(currentWatchTarget).atoms.has(asIonicAtom(atom))
    }
    if (isIonicModel(currentWatchTarget)) {
        const meta = asMetaIonicModel(currentWatchTarget)
        if (isObservedProp(atom)){
            return atom.metaIonicModel === meta;
        }
        //TODO: what about absorbed ions?
    }

}

//TODO: What about Prop Ions?
export function watch<T extends AnyIon | ReactiveGet>(target: T, effect: T extends () => infer R ? ChangeEffect<R> : never, options?: WatchOptions): ActiveListener
export function watch<T extends IonicModel>(target: T, effect: MutationEffect<T>, options?: WatchOptions): ActiveListener
export function watch<T extends AnyIon | ReactiveGet | IonicModel>(target: T, effect: T extends () => infer R ? ChangeEffect<R> : MutationEffect<T>, options?: WatchOptions): ActiveListener {
    if (!isAnyIon(target) && !(target instanceof Function)) {
        return watchReactiveModel(target, effect, options || {})
    }
    // const retrack = options?.retrack ?? true
    const _target = !isAnyIon(target) ? DerivedIon(target) : target as DerivedIon | ReactiveIon;
    // createIonicEffect(<() => any>target, retrack).initialize()
    const eager = options?.eager
    const phase = options?.phase || Phase.BEFORE_RENDER

    const watchTarget = asWatchTarget(_target);

    let oldValue = _target() // This is when derived is initialized if not already

    function changeEffect() {
        const newValue = _target() // This is when retracking happens
        if (areEqual(toRaw(newValue), toRaw(oldValue))) return;
        let prevTarget = currentWatchTarget;
        currentWatchTarget = _target // prevents infinite loops for synchronous effects
        effect(newValue, oldValue)
        currentWatchTarget = prevTarget;
        oldValue = newValue;
    }

    if (eager) {
        scheduleEffectEagerly(changeEffect, phase)
    }

    return setUpWatcher(
        watchTarget,
        changeEffect,
        phase,
        options || {},
        !isAnyIon(target) ? (<DerivedIon>_target)[META] : undefined
    )
}

function watchReactiveModel<T extends IonicModel>(target: T, effect: MutationEffect<T>, options: WatchOptions) {
    if (!isIonicModel(target)) {
        console.warn(`Watching non-reactive object. Is this intentional?`)
        return { stop: noop };
    }
    const eager = options?.eager
    const phase = options?.phase || Phase.BEFORE_RENDER
    // const deep = options?.deep

    const watchTarget = asWatchTarget(target);

    asMetaIonicModel(target).trackAbsorbedIons()

    function mutationEffect() {
        const mutations = getCurrentRenderCycle()?.getOps(target)
        if (!mutations) throw new Error("No mutations :(")
        effect(target, mutations)
    }

    if (eager) {
        scheduleEffectEagerly(mutationEffect, phase)
    }

    const forNextCycle = options?.cycle === 'next';

    return $listen(mutationEffect, options || {}, {
        enroll(_effect) {
            watchTarget.watch(_effect, phase, forNextCycle)
        },
        remove(_effect) {
            watchTarget.unwatch(_effect, phase)
            // if (nestedWatcher) nestedWatcher.unwatch()
        }
    });
}


function scheduleEffectEagerly(effect: Effect, phase: Phase) {
    if (phase === Phase.SYNC) {
        // runEffect(effect)
        effect()
    }
    else useRenderCycle().scheduleTask(effect, phase)
}



export function initializeIonicEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived Ion and effect combined into one function
    const phase = options?.phase || Phase.BEFORE_RENDER;
    const retrack = options?.retrack || false;
    const reactiveEffect = createIonicEffect(effect, retrack)
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
    options: ListenerOptions & RenderCycleOptions,
    metaReactiveFunction?: IonicDerivation
) {
    const forNextCycle = options?.cycle === 'next' ? true : false;

    return $listen(effect, options || {}, {
        enroll(_effect) {
            watchTarget.watch(_effect, phase, forNextCycle)
        },
        remove(_effect) {
            watchTarget.unwatch(_effect, phase)
            if (metaReactiveFunction) {
                metaReactiveFunction.untrackAtoms()
            }
        }
    });
}


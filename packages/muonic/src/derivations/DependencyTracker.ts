import { asObservedProp, getObservedPropValue, isObservedProp, ObservedProp } from "../reactivemodel/ObservedProp";
import { asTrackedOp, getTrackableOpValue, isTrackedOp, TrackedOp } from "../reactivemodel/TrackedOp";
import { isAtomicSignal, AtomicSignal, SIGNAL_MARKER, SignalState } from "../$Signal";
import { UNDEFINED } from "@rue/utils";
import { ReactivePrimitive } from "../ReactivePrimitive";
import { MetaReactiveModel, ReactiveModel } from "../reactivemodel/ReactiveModel";

// export type ReactivePrimitive = AtomicSignal | ObservedProp | TrackedOp

// let activeDepTracker: DependencyTracker | null = null;
// let outerDepTracker: DependencyTracker | null = null;
const depTrackerStack: DependencyTracker[] = []

function pushDepTracker(tracker: DependencyTracker) {
    // outerDepTracker = activeDepTracker;
    // activeDepTracker = tracker;
    depTrackerStack.push(tracker)
}

function popDepTracker() {
    // activeDepTracker = outerDepTracker;
    // outerDepTracker = null;
    return depTrackerStack.pop()
}


export function getDependencyTracker() {
    // return activeDepTracker;
    return depTrackerStack.at(-1) || null
}


export class DependencyTracker {

    deps: Set<ReactivePrimitive> = new Set()

    addDep(dep: ReactivePrimitive) {
        this.deps.add(dep);
    }

    shouldTrack: boolean = false;
    prevTrackState = false;

    start() {
        this.shouldTrack = true;
    }

    stop() {
        this.prevTrackState = this.shouldTrack;
        this.shouldTrack = false;
    }

    restore() {
        this.shouldTrack = this.prevTrackState;
    }

    callToCollectDependencies(signalOrEffect: Function) {
        pushDepTracker(this);
        this.start();
        const value = signalOrEffect();
        this.stop();
        popDepTracker();
        if (__DEV__ && this.dependencies.length === 0) {
            throw new Error('Watch target or derived signal has no dependencies (and therefore no reactivity')
        }
        return [this.dependencies, value];
    }

    private _dependencies?: ReactivePrimitive[] = undefined

    get dependencies() {
        let deps = this._dependencies;
        if (deps === undefined) {
            deps = this._dependencies = Array.from(this.deps);
        }
        return deps
    }
}


export function getWithoutTracking(reactiveRef: (() => any) | ObservedProp | TrackedOp) {
    const tracker = getDependencyTracker();
    tracker?.stop();
    let value;
    if (reactiveRef instanceof Function)
        value = reactiveRef();
    else if (isObservedProp(reactiveRef))
        value = getObservedPropValue(reactiveRef);
    else if (isTrackedOp(reactiveRef))
        value = getTrackableOpValue(reactiveRef)
    tracker?.restore();
    return value;
}

export function track(target: SignalState): boolean
export function track(target: MetaReactiveModel, key: string | symbol): boolean
export function track(target: MetaReactiveModel, key: string | symbol, arg: any): boolean
export function track(target: SignalState | MetaReactiveModel, key: string | symbol = UNDEFINED, arg: any = UNDEFINED) {
    const tracker = getDependencyTracker();
    if (!tracker) return false;
    if (tracker.shouldTrack) {
        const _target = arg !== UNDEFINED ? asTrackedOp(<MetaReactiveModel>target, <string>key, arg)
            : key !== UNDEFINED ? asObservedProp(target, key)
                : <SignalState>target
        tracker.addDep(_target)
        return true;
    }
    return false;
}
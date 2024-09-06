import { asReactiveProp, getReactivePropValue, isReactiveProp, ReactiveProp } from "../reactivemodel/ReactiveProp";
import { getTrackableOpValue, isTrackableOp, TrackableOp } from "../reactivemodel/TrackableOp";
import { isSignal, Signal } from "../$Signal";

export type ReactivePrimitive = Signal | ReactiveProp | TrackableOp

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


export function getWithoutTracking(reactiveRef: (() => any) | ReactiveProp | TrackableOp) {
    const tracker = getDependencyTracker();
    tracker?.stop();
    let value;
    if (reactiveRef instanceof Function)
        value = reactiveRef();
    else if (isReactiveProp(reactiveRef))
        value = getReactivePropValue(reactiveRef);
    else if (isTrackableOp(reactiveRef))
        value = getTrackableOpValue(reactiveRef)
    tracker?.restore();
    return value;
}

export function track(target: ReactivePrimitive) {
    const tracker = getDependencyTracker();
    if (!tracker) return;
    if (tracker.shouldTrack) {
        tracker.addDep(target)
    }
}
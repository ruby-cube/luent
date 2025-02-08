import { isIon } from "../ion/Ion";
import { isTrackedOp, TrackedOp } from "../ionized/TrackedOp";
import { IonicAtom } from "./IonicAtom";


const depTrackerStack: DependencyTracker[] = []

function pushDepTracker(tracker: DependencyTracker) {
    depTrackerStack.push(tracker)
}

function popDepTracker() {
    return depTrackerStack.pop()
}


export function getDependencyTracker() {
    return depTrackerStack.at(-1) || null
}

// export function getActiveTracker() {
//     const tracker = getDependencyTracker()
//     if (!tracker || !tracker.shouldTrack) return null;
//     return tracker
// }

export function isTrackedContext() {
    return Boolean(getActiveTracker())
}


export class DependencyTracker {
    constructor(
    ) {

    }

    deps: Set<IonicAtom> = new Set()

    addDep(dep: IonicAtom) {
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

    callToCollectDependencies(ionOrEffect: Function) {
        pushDepTracker(this);
        this.start();
        const value = ionOrEffect();
        this.stop();
        popDepTracker();
        if (__DEV__ && this.deps.size === 0) {
            throw new Error('Watch target or derived AtomicIon has no dependencies (and therefore no reactivity', {cause: 'no dependencies'})
        }
        return [this.deps, value];
    }

    track(target: ReactivePrimitive) {
        const atom = asAtom(target)
        this.addDep(atom)
        return atom;
    }
}


export function untrackedCall(reactiveRef: (() => any) | TrackedOp) {
    const tracker = getDependencyTracker();
    tracker?.stop();
    let value;
    if (isIon(reactiveRef))
        value = reactiveRef();
    else if (isTrackedOp(reactiveRef))
        value = reactiveRef.getOutput()
    tracker?.restore();
    return value;
}




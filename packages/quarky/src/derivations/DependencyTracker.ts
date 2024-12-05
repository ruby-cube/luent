import { isIon } from "../ion/Ion";
import { isTrackedOp, TrackedOp } from "../ionize/TrackedOp";
import { asIonicAtom, IonicAtom, ReactivePrimitive } from "./IonicAtom";


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

export function getActiveTracker() {
    const tracker = getDependencyTracker()
    if (!tracker || !tracker.shouldTrack) return null;
    return tracker
}

export function tracked() {
    return Boolean(getActiveTracker())
}


export class DependencyTracker {
    constructor(
        public selective: boolean = false
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
            throw new Error('Watch target or derived AtomicIon has no dependencies (and therefore no reactivity')
        }
        return [this.deps, value];
    }

    // private _dependencies?: ReactivePrimitive[] = undefined

    // get dependencies() {
    //     let deps = this._dependencies;
    //     if (deps === undefined) {
    //         deps = this._dependencies = Array.from(this.deps);
    //     }
    //     return deps
    // }

    track(target: ReactivePrimitive) {
        const atom = asIonicAtom(target)
        this.addDep(atom)
        return atom;
    }
}


export function getWithoutTracking(reactiveRef: (() => any) | TrackedOp) {
    const tracker = getDependencyTracker();
    tracker?.stop();
    let value;
    if (isIon(reactiveRef) || reactiveRef instanceof Function)
        value = reactiveRef();
    else if (isTrackedOp(reactiveRef))
        value = reactiveRef.getOutput()
    tracker?.restore();
    return value;
}



export function __devCheckIfTracked() {
    if (tracked()) console.warn(`RESEARCH: This is currently a tracked context. May need to use getWithoutTracking`)
}
export function __devCheckIfNotTracked() {
    if (!tracked()) console.warn(`RESEARCH: This is currently not a tracked context. getWithoutTracking may be extraneous`)
}
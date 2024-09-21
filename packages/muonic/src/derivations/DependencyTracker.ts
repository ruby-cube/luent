import { isObservedProp, ObservedProp } from "../ionic/ObservedProp";
import { isTrackedOp, TrackedOp } from "../ionic/TrackedOp";
import { asReactiveAtom, ReactiveAtom, ReactivePrimitive } from "./ReactiveAtom";


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

export function tracked(){
    return Boolean(getActiveTracker())
}


export class DependencyTracker {

    deps: Set<ReactiveAtom> = new Set()

    addDep(dep: ReactiveAtom) {
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
            throw new Error('Watch target or derived ion has no dependencies (and therefore no reactivity')
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
        const atom = asReactiveAtom(target)
        this.addDep(atom)
        return atom;
    }
}


export function getWithoutTracking(reactiveRef: (() => any) | ObservedProp | TrackedOp) {
    const tracker = getDependencyTracker();
    tracker?.stop();
    let value;
    if (reactiveRef instanceof Function)
        value = reactiveRef();
    else if (isObservedProp(reactiveRef))
        value = reactiveRef.getValue();
    else if (isTrackedOp(reactiveRef))
        value = reactiveRef.getOutput()
    tracker?.restore();
    return value;
}

// export function track(target: AtomicIon): boolean
// export function track(target: ReactiveModel, key: string | symbol): boolean
// export function track(target: ReactiveModel, key: string | symbol, arg: any): boolean
// export function track(target: AtomicIon | ReactiveModel, key: string | symbol = UNDEFINED, arg: any = UNDEFINED) {
//     const _target = arg !== UNDEFINED ? asTrackedOp(<ReactiveModel>target, <string>key, arg)
//         : key !== UNDEFINED ? asObservedProp(<ReactiveModel>target, key)
//             : <AtomicIon>target
//     this.addDep(_target)
//     return true;

//     return false;
// }
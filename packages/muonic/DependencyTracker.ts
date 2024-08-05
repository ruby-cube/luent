import { asReactiveProp, ReactiveProp } from "./ReactiveProp";
import { isReactiveObject, ReactiveModel } from "./useReactiveModels";
import { Signal } from "./useSignals";


let activeDepTracker: DependencyTracker | null = null;
let outerDepTracker: DependencyTracker | null = null;

function pushDepTracker(tracker: DependencyTracker) {
    outerDepTracker = activeDepTracker;
    activeDepTracker = tracker;
}

function popDepTracker() {
    activeDepTracker = outerDepTracker;
    outerDepTracker = null;
}


export function getDependencyTracker() {
    return activeDepTracker;
}


export class DependencyTracker {

    trackedSignals: Set<Signal> = new Set();
    trackedProps: Set<ReactiveProp> = new Set();

    addSignal(signal: Signal) {
        this.trackedSignals.add(signal);
    }

    addProp(prop: ReactiveProp) {
        this.trackedProps.add(prop)
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

    private _dependencies: (Signal | ReactiveProp)[] | undefined;

    get dependencies() {
        let deps = this._dependencies;
        if (deps === undefined) {
            deps = [];
            const signals = this.trackedSignals
            for (const signal of signals) {
                deps.push(signal)
            }
            const reactiveProps = this.trackedProps
            for (const prop of reactiveProps) {
                deps.push(prop);
            }
            this._dependencies = deps;
        }
        return deps
    }
}


export function getWithoutTracking(getter: (() => any) | ReactiveProp) {
    const tracker = getDependencyTracker();
    tracker?.stop();
    let value;
    if (getter instanceof Function) value = getter();
    else value = getter[0][getter[1]]; // ie. reactive[key]
    tracker?.restore();
    return value;
}
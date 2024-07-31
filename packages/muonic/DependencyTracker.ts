import { ReactiveObject } from "./useReactiveObjects";
import { Signal } from "./useSignals";

export type ReactiveProp = [ReactiveObject, string | symbol]

let activeDepTracker: DependencyTracker | null = null;


export function getDependencyTracker() {
    return activeDepTracker;
}


export class DependencyTracker {

    trackedSignals: Set<Signal> = new Set();
    trackedProps: Map<ReactiveObject, Set<string | symbol>> = new Map();

    addSignal(signal: Signal) {
        this.trackedSignals.add(signal);
    }

    addProp(target: ReactiveObject, key: string | symbol) {
        let reactiveMap = this.trackedProps
        let trackedProps = reactiveMap.get(target)
        if (!trackedProps) {
            trackedProps = new Set();
            reactiveMap.set(target, trackedProps);
        }
        trackedProps.add(key);
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
        activeDepTracker = this;
        this.start();
        const value = signalOrEffect();
        this.stop();
        activeDepTracker = null;
        if (__DEV__ && this.dependencies.length === 0) throw new Error('Watch target or derived signal has no dependencies (and therefore no reactivity')
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
            const reactiveMap = this.trackedProps
            for (const [reactive, props] of reactiveMap) {
                for (const key of props) {
                    deps.push([reactive, key]);
                }
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